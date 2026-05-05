"use client";

import type { ReactNode } from "react";
import { MinusIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
}

type RowKey = string | number;

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading: boolean;
  getRowKey: (item: T) => RowKey;
  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
  /**
   * When true, a checkbox column is rendered as the first column with
   * tri-state header (all / some / none) and per-row toggles. The parent
   * owns the selection state via {@link selectedIds} and
   * {@link onSelectionChange}; this component only emits change events.
   */
  selectable?: boolean;
  selectedIds?: Set<RowKey>;
  onSelectionChange?: (next: Set<RowKey>) => void;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  getRowKey,
  actions,
  emptyMessage = "No records found.",
  selectable = false,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const selection = selectedIds ?? new Set<RowKey>();
  const selectionExtras = (selectable ? 1 : 0) + (actions ? 1 : 0);
  const columnCount = columns.length + selectionExtras;

  const visibleKeys = data.map(getRowKey);
  const selectedOnPage = visibleKeys.filter((key) => selection.has(key));
  const allChecked = visibleKeys.length > 0 && selectedOnPage.length === visibleKeys.length;
  const someChecked = selectedOnPage.length > 0 && !allChecked;

  function emit(next: Set<RowKey>) {
    onSelectionChange?.(next);
  }

  function toggleRow(key: RowKey, checked: boolean) {
    const next = new Set(selection);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    emit(next);
  }

  function toggleAllOnPage(checked: boolean) {
    const next = new Set(selection);
    if (checked) {
      for (const key of visibleKeys) next.add(key);
    } else {
      for (const key of visibleKeys) next.delete(key);
    }
    emit(next);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={allChecked}
                  indeterminate={someChecked}
                  disabled={loading || data.length === 0}
                  indicator={someChecked ? <MinusIcon /> : undefined}
                  onCheckedChange={(checked) => toggleAllOnPage(Boolean(checked))}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead className="w-40 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-6 text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-6 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const key = getRowKey(item);
              const isSelected = selection.has(key);
              return (
                <TableRow key={key} data-state={selectable && isSelected ? "selected" : undefined}>
                  {selectable && (
                    <TableCell className="w-10">
                      <Checkbox
                        aria-label={`Select row ${key}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleRow(key, Boolean(checked))}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <div className="flex justify-end gap-2">{actions(item)}</div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
