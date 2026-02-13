import Link from "next/link";
import Pagination from "@/components/Pagination";
import CoserAvatar from "@/components/CoserAvatar";
import { type Coser, type PaginatedResponse } from "@/lib/api";
import SearchBar from "@/components/SearchBar";

async function getCosers(
  page: number,
  search?: string
): Promise<PaginatedResponse<Coser>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: "20",
  });
  if (search) params.set("search", search);
  const res = await fetch(`http://127.0.0.1:7900/api/cosers/?${params}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function CosersPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { page: pageStr } = await params;
  const { search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const data = await getCosers(page, search);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coser</h1>
        <SearchBar
          placeholder="搜索 Coser..."
          basePath={`/cosers/${page}`}
          defaultValue={search}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {data.items.map((coser) => (
          <Link
            key={coser.id}
            href={`/coser/${coser.id}/1`}
            className="group flex flex-col items-center gap-2 rounded-lg bg-[var(--card-bg)] p-4 transition-colors hover:bg-[var(--card-hover)]"
          >
            <CoserAvatar coserId={coser.id} coserName={coser.name} />
            <h3 className="truncate text-center text-sm font-medium">
              {coser.name}
            </h3>
            <span className="text-xs text-[var(--muted)]">
              {coser.cosplay_count} 套
            </span>
          </Link>
        ))}
      </div>
      {data.items.length === 0 && (
        <p className="py-20 text-center text-[var(--muted)]">
          {search ? `没有找到 "${search}" 相关的 Coser` : "还没有 Coser"}
        </p>
      )}
      <Pagination
        currentPage={page}
        totalPages={data.total_pages}
        buildHref={(p) =>
          `/cosers/${p}${search ? `?search=${encodeURIComponent(search)}` : ""}`
        }
      />
    </div>
  );
}
