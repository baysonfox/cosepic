import GalleryCard from "@/components/GalleryCard";
import Pagination from "@/components/Pagination";
import { fetchParody, fetchCosplays } from "@/lib/api";

export default async function ParodyDetailPage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id: idStr, page: pageStr } = await params;
  const parodyId = parseInt(idStr);
  const page = Math.max(1, parseInt(pageStr) || 1);
  const [parody, data] = await Promise.all([
    fetchParody(parodyId),
    fetchCosplays(page, 20, undefined, parodyId),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{parody.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          共 {parody.cosplay_count} 套图集
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
        buildHref={(p) => `/parody/${parodyId}/${p}`}
      />
    </div>
  );
}
