"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EmbeddingStatusProps {
  packCount: number;
}

export function EmbeddingStatus({ packCount }: EmbeddingStatusProps) {
  if (packCount === 0) return null;

  return (
    <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="flex items-center gap-3 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <div className="text-sm">
          <span className="font-medium">Embedding 处理中</span>
          <span className="text-muted-foreground ml-2">
            正在为 {packCount} 个图包生成向量...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
