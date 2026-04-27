import { FilterBar } from "@/components/filters/filter-bar";
import { Pagination } from "@/components/filters/pagination";
import { PackGrid } from "@/components/gallery/pack-grid";
import { serverFetch } from "@/lib/api/client";
import { semanticSearch } from "@/lib/api/embeddings";
import { listPacks } from "@/lib/api/packs";
import { parsePackFilterParams } from "@/lib/url-params";
import type { PackListItem } from "@/lib/api/types";

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const searchMode = rawParams.searchMode as string | undefined;

  let items: PackListItem[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;

  if (searchMode === "semantic") {
    const queryText = rawParams.q as string | undefined;
    const topK = parseInt((rawParams.topK as string) || "5", 10);

    if (queryText) {
      const result = await semanticSearch(queryText, topK, true);
      const packIds = [...new Set(result.results.map((r) => r.pack_id))];

      if (packIds.length > 0) {
        const packsData = await listPacks(
          { page: 1, page_size: packIds.length },
          serverFetch
        );
        const packMap = new Map(packsData.items.map((p) => [p.id, p]));
        items = packIds.map((id) => packMap.get(id)).filter(Boolean) as PackListItem[];
      }

      total = items.length;
    }
  } else {
    const params = parsePackFilterParams(rawParams);
    const data = await listPacks(params, serverFetch);
    items = data.items;
    total = data.total;
    page = params.page ?? 1;
    pageSize = params.page_size ?? 20;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Packs</h1>
        <p className="text-sm text-muted-foreground">
          Browse your cosplay pack library.
        </p>
      </div>

      <FilterBar />
      <PackGrid items={items} />
      {searchMode !== "semantic" && (
        <Pagination total={total} page={page} pageSize={pageSize} />
      )}
    </div>
  );
}
