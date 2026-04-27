import Link from "next/link";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput } from "@/components/filters/search-input";
import { serverFetch } from "@/lib/api/client";
import { listWorks } from "@/lib/api/works";

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.page_size === "string"
    ? Number(params.page_size) || 20
    : 20;

  const data = await listWorks(
    { q, page, page_size: pageSize },
    serverFetch,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Works</h1>
        <p className="text-sm text-muted-foreground">
          Browse works and source series.
        </p>
      </div>

      <SearchInput placeholder="Search works..." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((work) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent"
          >
            <div className="font-medium">{work.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {work.character_count} characters · {work.pack_count} packs
            </div>
          </Link>
        ))}
      </div>

      <Pagination total={data.total} page={page} pageSize={pageSize} />
    </div>
  );
}
