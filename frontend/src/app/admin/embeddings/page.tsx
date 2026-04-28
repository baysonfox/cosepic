"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { getEmbeddingStats } from "@/lib/api/embeddings";
import { clientFetch, ApiError } from "@/lib/api/client";
import type { EmbeddingStats } from "@/lib/api/types";

export default function EmbeddingsPage() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getEmbeddingStats(false);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Embeddings</h1>
        <p className="text-sm text-muted-foreground">
          向量化覆盖情况和处理进度
        </p>
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
            {stats.incomplete_packs.map((pack) => (
              <div key={pack.pack_id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <Link
                    href={`/packs/${pack.pack_id}`}
                    className="font-medium hover:underline"
                  >
                    {pack.pack_title}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">
                    {pack.processed_images}/{pack.total_images} 张图片
                  </div>
                </div>
                <Badge variant="secondary">
                  {Math.round(pack.progress * 100)}%
                </Badge>
              </div>
            ))}
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
            {stats.no_embedding_packs.map((pack) => (
              <div key={pack.pack_id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <Link
                    href={`/packs/${pack.pack_id}`}
                    className="font-medium hover:underline"
                  >
                    {pack.pack_title}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">
                    {pack.total_images} 张图片
                  </div>
                </div>
                <Badge variant="outline">未开始</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
