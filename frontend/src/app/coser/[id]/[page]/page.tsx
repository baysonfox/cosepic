import GalleryCard from "@/components/GalleryCard";
import Pagination from "@/components/Pagination";
import { type CosplayItem, type Coser, type PaginatedResponse } from "@/lib/api";

async function getCoser(id: number): Promise<Coser> {
  const res = await fetch(`http://127.0.0.1:8000/api/cosers/${id}`, {
    cache: "no-store",
  });
  return res.json();
}

async function getCoserCosplays(
  coserId: number,
  page: number
): Promise<PaginatedResponse<CosplayItem>> {
  const res = await fetch(
    `http://127.0.0.1:8000/api/cosplays/?coser_id=${coserId}&page=${page}&page_size=20`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function CoserDetailPage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id: idStr, page: pageStr } = await params;
  const coserId = parseInt(idStr);
  const page = Math.max(1, parseInt(pageStr) || 1);
  const [coser, data] = await Promise.all([
    getCoser(coserId),
    getCoserCosplays(coserId, page),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{coser.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          共 {coser.cosplay_count} 套图集
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.items.map((item) => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        totalPages={data.total_pages}
        buildHref={(p) => `/coser/${coserId}/${p}`}
      />
    </div>
  );
}
