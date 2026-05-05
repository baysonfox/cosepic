"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface BulkAction {
  /**
   * Stable identifier used as the React key.
   */
  key: string;
  /**
   * Button label, e.g. "Delete" or "Regenerate".
   */
  label: string;
  /**
   * Visual variant. Use "destructive" for irreversible actions.
   */
  variant?: "default" | "destructive" | "outline";
  /**
   * When true the button shows a spinner and is disabled. Used while the
   * action is in flight.
   */
  loading?: boolean;
  /**
   * Disabled outside of loading (e.g. while another action is running).
   */
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
  /**
   * Optional extra content rendered after the count and before the
   * action buttons (e.g. a status message about the previous action).
   */
  hint?: ReactNode;
}

/**
 * Floating-style toolbar that appears above an admin DataTable when one
 * or more rows are selected. The parent owns the selection set and the
 * action callbacks; this component is presentational.
 */
export function BulkActionBar({
  selectedCount,
  onClear,
  actions,
  hint,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2">
      <span className="text-sm font-medium">已选 {selectedCount} 项</span>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        清除选择
      </Button>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            type="button"
            size="sm"
            variant={action.variant ?? "outline"}
            disabled={action.loading || action.disabled}
            onClick={() => void action.onClick()}
          >
            {action.loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
