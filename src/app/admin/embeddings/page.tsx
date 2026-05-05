"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, XCircle, Sparkles } from "lucide-react";
import { getEmbeddingStats, getPackEmbeddingStatus, triggerEmbedding } from "@/lib/api/embeddings";
import { ApiError } from "@/lib/api/client";
import type { EmbeddingStats } from "@/lib/api/types";

interface PackProgress {
  processed_images: number;
  total_images: number;
  progress: number;
}

export default function EmbeddingsPage() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPacks, setProcessingPacks] = useState<Map<number, PackProgress>>(
    new Map()
  );
  const [batchProcessing, setBatchProcessing] = useState(false);
  const processingRef = useRef<Set<number>>(new Set());

  const loadStats = useCallback(async () => {
    try {
      const data = await getEmbeddingStats(false);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    loadStats().then(() => setLoading(false));
  }, [loadStats]);

  const pollProgress = useCallback((packId: number) => {
    const interval = setInterval(async () => {
      try {
        const status = await getPackEmbeddingStatus(packId);
        if (status.progress >= 1) {
          clearInterval(interval);
          processingRef.current.delete(packId);
          setProcessingPacks((prev) => {
            const next = new Map(prev);
            next.delete(packId);
            return next;
          });
          void loadStats();
        } else {
          setProcessingPacks((prev) => {
            const next = new Map(prev);
            next.set(packId, {
              processed_images: status.processed_images,
              total_images: status.total_images,
              progress: status.progress,
            });
            return next;
          });
        }
      } catch {
        clearInterval(interval);
        processingRef.current.delete(packId);
        setProcessingPacks((prev) => {
          const next = new Map(prev);
          next.delete(packId);
          return next;
        });
      }
    }, 2000);
    return interval;
  }, [loadStats]);

  const handleTriggerEmbedding = useCallback(async (packId: number) => {
    if (processingRef.current.has(packId)) return;
    processingRef.current.add(packId);
    try {
      await triggerEmbedding(packId);
      pollProgress(packId);
    } catch {
      processingRef.current.delete(packId);
    }
  }, [pollProgress]);

  const handleTriggerAll = useCallback(async () => {
    if (!stats) return;
    const allPending = [
      ...stats.incomplete_packs.map((p) => p.pack_id),
      ...stats.no_embedding_packs.map((p) => p.pack_id),
    ].filter((id) => !processingRef.current.has(id));

    if (allPending.length === 0) return;

    setBatchProcessing(true);
    await Promise.all(
      allPending.map(async (packId) => {
        processingRef.current.add(packId);
        try {
          await triggerEmbedding(packId);
          pollProgress(packId);
        } catch {
          processingRef.current.delete(packId);
        }
      })
    );
    setBatchProcessing(false);
  }, [stats, pollProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!stats) return null;

  const packCompletionRate = stats.total_packs > 0
    ? Math.round((stats.completed_packs / stats.total_packs) * 100)
    : 0;

  const assetCoverageRate = stats.total_assets > 0
    ? Math.round((stats.embeddings_count / stats.total_assets) * 100)
    : 0;

  function renderEmbeddingButton(packId: number) {
    const progress = processingPacks.get(packId);
    if (progress) {
      return (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {Math.round(progress.progress * 100)}%
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleTriggerEmbedding(packId)}
      >
        <Sparkles className="mr-1 h-3 w-3" />
        向量化
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Embeddings</h1>
          <p className="text-sm text-muted-foreground">
            向量化覆盖情况和处理进度
          </p>
        </div>
        {stats.incomplete_packs.length + stats.no_embedding_packs.length > 0 && (
          <Button
            onClick={() => handleTriggerAll()}
            disabled={batchProcessing}
          >
            {batchProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                全量向量化中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                一键向量化 ({stats.incomplete_packs.length + stats.no_embedding_packs.length})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总图包数</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_packs}</div>
            <p className="text-xs text-muted-foreground">
              已完成 {packCompletionRate}%（{stats.completed_packs} 个）
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总图片数</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_assets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已向量化</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.embeddings_count}</div>
            <p className="text-xs text-muted-foreground">
              覆盖率 {assetCoverageRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.incomplete_packs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              处理中的图包 ({stats.incomplete_packs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.incomplete_packs.map((pack) => {
              const liveProgress = processingPacks.get(pack.pack_id);
              const processed = liveProgress?.processed_images ?? pack.processed_images;
              const total = liveProgress?.total_images ?? pack.total_images;
              return (
                <div key={pack.pack_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <Link
                      href={`/packs/${pack.pack_id}`}
                      className="font-medium hover:underline"
                    >
                      {pack.pack_title}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">
                      {processed}/{total} 张图片
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!liveProgress && (
                      <Badge variant="secondary">
                        {Math.round(pack.progress * 100)}%
                      </Badge>
                    )}
                    {renderEmbeddingButton(pack.pack_id)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {stats.no_embedding_packs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              未处理的图包 ({stats.no_embedding_packs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.no_embedding_packs.map((pack) => {
              const liveProgress = processingPacks.get(pack.pack_id);
              return (
                <div key={pack.pack_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <Link
                      href={`/packs/${pack.pack_id}`}
                      className="font-medium hover:underline"
                    >
                      {pack.pack_title}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">
                      {liveProgress
                        ? `${liveProgress.processed_images}/${liveProgress.total_images} 张图片`
                        : `0/${pack.total_images} 张图片`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!liveProgress && (
                      <Badge variant="outline">未开始</Badge>
                    )}
                    {renderEmbeddingButton(pack.pack_id)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
