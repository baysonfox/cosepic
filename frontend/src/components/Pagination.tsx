import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--card-bg)]"
        >
          ‹
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-[var(--muted)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              p === currentPage
                ? "bg-[var(--accent)] text-white font-medium"
                : "text-[var(--muted)] hover:bg-[var(--card-bg)]"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--card-bg)]"
        >
          ›
        </Link>
      )}
    </nav>
  );
}
