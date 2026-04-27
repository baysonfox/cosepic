"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { DuplicateItem } from "@/lib/api/types";

interface DuplicateComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: DuplicateItem | null;
  currentPackTitle: string;
}

export function DuplicateComparisonDialog({
  open,
  onOpenChange,
  duplicate,
  currentPackTitle,
}: DuplicateComparisonDialogProps) {
  if (!duplicate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            匹配图片对比
            <Badge variant={
              duplicate.max_similarity >= 0.9 ? "destructive" :
              duplicate.max_similarity >= 0.8 ? "default" : "secondary"
            }>
              相似度: {(duplicate.max_similarity * 100).toFixed(1)}%
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">当前导入</div>
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={`/api/assets/${duplicate.matched_asset_id}/file`}
                alt="Current"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-sm font-medium">{currentPackTitle}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">已存在</div>
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={`/api/assets/${duplicate.duplicate_asset_id}/file`}
                alt="Existing"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-sm font-medium">{duplicate.duplicate_pack_title}</div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => window.open(`/packs/${duplicate.duplicate_pack_id}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              查看完整 Pack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
