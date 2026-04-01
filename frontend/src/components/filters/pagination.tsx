"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
}

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  if (totalPages <= 1 && total <= pageSize) {
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
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
