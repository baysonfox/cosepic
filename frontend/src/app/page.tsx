import GalleryCard from "@/components/GalleryCard";
import Pagination from "@/components/Pagination";
import { type CosplayItem, type PaginatedResponse } from "@/lib/api";

async function getLatestCosplays(): Promise<PaginatedResponse<CosplayItem>> {
  const res = await fetch(
    "http://127.0.0.1:8000/api/cosplays/?page=1&page_size=20",
    { cache: "no-store" }
  );
  return res.json();
}

export default async function HomePage() {
  const data = await getLatestCosplays();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">最新图集</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.items.map((item) => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>
      {data.items.length === 0 && (
        <p className="py-20 text-center text-[var(--muted)]">
          还没有图集，去后台添加一些吧
        </p>
      )}
      <Pagination
        currentPage={1}
        totalPages={data.total_pages}
        buildHref={(page) => `/cosplays/${page}`}
      />
    </div>
  );
}
