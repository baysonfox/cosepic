import Link from "next/link";
import { fetchParodies } from "@/lib/api";

export default async function ParodiesPage() {
  const data = await fetchParodies(1, 500);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">作品出处</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.items.map((parody) => (
          <Link
            key={parody.id}
            href={`/parody/${parody.id}/1`}
            className="flex items-center justify-between rounded-lg bg-[var(--card-bg)] px-4 py-3 transition-colors hover:bg-[var(--card-hover)]"
          >
            <span className="truncate text-sm">{parody.name}</span>
            <span className="ml-2 shrink-0 text-xs text-[var(--muted)]">
              {parody.cosplay_count}
            </span>
          </Link>
        ))}
      </div>
      {data.items.length === 0 && (
        <p className="py-20 text-center text-[var(--muted)]">
          还没有作品出处分类
        </p>
      )}
    </div>
  );
}
