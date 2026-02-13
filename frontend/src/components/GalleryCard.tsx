import Link from "next/link";
import { coverUrl, formatSize, type CosplayItem } from "@/lib/api";

export default function GalleryCard({ item }: { item: CosplayItem }) {
  const stats = [
    item.photo_count > 0 ? `${item.photo_count}P` : null,
    item.video_count > 0 ? `${item.video_count}V` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Link
      href={`/cosplay/${item.id}`}
      className="group block overflow-hidden rounded-lg bg-[var(--card-bg)] transition-colors hover:bg-[var(--card-hover)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl(item.id)}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8">
          <span className="text-xs text-white/80">{stats}</span>
          {item.total_size > 0 && (
            <span className="ml-2 text-xs text-white/60">
              {formatSize(item.total_size)}
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white">{item.title}</h3>
        {item.parody && (
          <p className="mt-0.5 text-xs text-gray-400">
            {item.parody.name}
          </p>
        )}
        {item.coser && (
          <p className="mt-1 text-sm text-white font-medium">
            {item.coser.name}
          </p>
        )}
      </div>
    </Link>
  );
}
