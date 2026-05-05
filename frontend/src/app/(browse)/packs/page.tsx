import { FilterBar } from "@/components/filters/filter-bar";
import { Pagination } from "@/components/filters/pagination";
import { PackGrid } from "@/components/gallery/pack-grid";
import { serverFetch } from "@/lib/api/client";
import { listPacks } from "@/lib/api/packs";
import { parsePackFilterParams } from "@/lib/url-params";
import type { PackListItem } from "@/lib/api/types";

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;

  let items: PackListItem[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;

  const params = parsePackFilterParams(rawParams);
  const data = await listPacks(params, serverFetch);
  items = data.items;
  total = data.total;
  page = params.page ?? 1;
  pageSize = params.page_size ?? 20;

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
      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
