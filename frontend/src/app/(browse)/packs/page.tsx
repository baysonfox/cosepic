import { FilterBar } from "@/components/filters/filter-bar";
import { Pagination } from "@/components/filters/pagination";
import { PackGrid } from "@/components/gallery/pack-grid";
import { serverFetch } from "@/lib/api/client";
import { listPacks } from "@/lib/api/packs";
import { parsePackFilterParams } from "@/lib/url-params";

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parsePackFilterParams(await searchParams);
  const data = await listPacks(params, serverFetch);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Packs</h1>
        <p className="text-sm text-muted-foreground">
          Browse your cosplay pack library.
        </p>
      </div>

      <FilterBar />
      <PackGrid items={data.items} />
      <Pagination
        total={data.total}
        page={params.page ?? 1}
        pageSize={params.page_size ?? 20}
      />
    </div>
  );
}
