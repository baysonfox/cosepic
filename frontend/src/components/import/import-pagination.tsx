"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ImportPagination({ total, page, pageSize, onPageChange }: ImportPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) {
    return (
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {total}
      </div>
    );
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2),
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {total}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Page ${pageNumber}`}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
