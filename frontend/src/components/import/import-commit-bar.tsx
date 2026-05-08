"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ImportCommitBarProps {
  totalCount: number;
  selectedCount: number;
  committing: boolean;
  disabled?: boolean;
  skipDuplicateCheck: boolean;
  onSkipDuplicateCheckChange: (checked: boolean) => void;
  onSelectAll: () => void;
  onSelectPage: () => void;
  onClear: () => void;
  onCommit: () => Promise<void> | void;
}

export function ImportCommitBar({
  totalCount,
  selectedCount,
  committing,
  disabled = false,
  skipDuplicateCheck,
  onSkipDuplicateCheckChange,
  onSelectAll,
  onSelectPage,
  onClear,
  onCommit,
}: ImportCommitBarProps) {
  return (
    <div className="sticky bottom-0 z-10 rounded-xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onSelectAll} disabled={disabled}>
            Select All ({totalCount})
          </Button>
          <Button type="button" variant="outline" onClick={onSelectPage} disabled={disabled}>
            Select Page
          </Button>
          <Button type="button" variant="outline" onClick={onClear} disabled={disabled}>
            Clear Selection
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={skipDuplicateCheck}
              onCheckedChange={onSkipDuplicateCheckChange}
              disabled={disabled || committing}
            />
            <span>跳过重复检查</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Selected {selectedCount} of {totalCount}
          </span>
          <Button
            type="button"
            onClick={() => void onCommit()}
            disabled={disabled || committing || selectedCount === 0}
          >
            {committing ? "Importing..." : `Import Selected (${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
