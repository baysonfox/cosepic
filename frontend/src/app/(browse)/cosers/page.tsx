import Link from "next/link";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput } from "@/components/filters/search-input";
import { CoserAvatar } from "@/components/entity/coser-avatar";
import { serverFetch } from "@/lib/api/client";
import { listCosers } from "@/lib/api/cosers";

export default async function CosersPage({
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

  const data = await listCosers(
    { q, page, page_size: pageSize },
    serverFetch,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Cosers</h1>
        <p className="text-sm text-muted-foreground">
          Browse cosplay performers in your library.
        </p>
      </div>

      <SearchInput placeholder="Search cosers..." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.items.map((coser) => (
          <Link
            key={coser.id}
            href={`/cosers/${coser.id}`}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-center transition-colors hover:border-accent"
          >
            <CoserAvatar name={coser.name} size="lg" />
            <div className="space-y-1">
              <div className="font-medium">{coser.name}</div>
              <div className="text-xs text-muted-foreground">
                {coser.pack_count} packs
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination total={data.total} page={page} pageSize={pageSize} />
    </div>
  );
}
