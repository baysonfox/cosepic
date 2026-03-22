import GalleryCard from "@/components/GalleryCard";
import Pagination from "@/components/Pagination";
import { fetchCosplays } from "@/lib/api";

export default async function CosplaysPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageStr } = await params;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const data = await fetchCosplays(page, 20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">全部图集</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.items.map((item) => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        totalPages={data.total_pages}
        buildHref={(p) => `/cosplays/${p}`}
      />
    </div>
  );
}
