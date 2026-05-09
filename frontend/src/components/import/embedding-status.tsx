"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getEmbeddingStatus } from "@/lib/api/embeddings";

const GRACE_PERIOD_MS = 10_000;

interface EmbeddingStatusProps {
  packIds: number[];
  onComplete?: () => void;
}

export function EmbeddingStatus({ packIds, onComplete }: EmbeddingStatusProps) {
  const [processing, setProcessing] = useState<Array<{
    pack_id: number;
    pack_title: string;
    total_images: number;
    processed_images: number;
    progress: number;
  }>>([]);
  const seenActiveRef = useRef(false);
  const graceDoneRef = useRef(false);

  useEffect(() => {
    if (packIds.length === 0) return;

    const graceTimer = setTimeout(() => {
      graceDoneRef.current = true;
    }, GRACE_PERIOD_MS);

    const interval = setInterval(async () => {
      try {
        const status = await getEmbeddingStatus(false);
        const relevantPacks = status.processing_packs.filter(p =>
          packIds.includes(p.pack_id)
        );
        setProcessing(relevantPacks);

        if (relevantPacks.length > 0) {
          seenActiveRef.current = true;
        } else if (seenActiveRef.current || graceDoneRef.current) {
          onComplete?.();
        }
      } catch (error) {
        console.error("Failed to fetch embedding status:", error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(graceTimer);
    };
  }, [packIds, onComplete]);

  if (processing.length === 0) return null;

  return (
    <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="py-3 space-y-2">
        {processing.map((pack) => (
          <div key={pack.pack_id} className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
            <div className="text-sm flex-1">
              <span className="font-medium">{pack.pack_title}</span>
              <span className="text-muted-foreground ml-2">
                {pack.processed_images}/{pack.total_images} ({Math.round(pack.progress * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
