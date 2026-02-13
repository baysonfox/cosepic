"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchCosplay,
  fetchCosplayImages,
  thumbnailUrl,
  imageUrl,
  formatSize,
  type CosplayItem,
} from "@/lib/api";

export default function CosplayDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [cosplay, setCosplay] = useState<CosplayItem | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;
    const id = parseInt(params.id);
    fetchCosplay(id).then(setCosplay);
    fetchCosplayImages(id).then(setImages);
  }, [params]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight" && lightboxIdx < images.length - 1)
        setLightboxIdx(lightboxIdx + 1);
      if (e.key === "ArrowLeft" && lightboxIdx > 0)
        setLightboxIdx(lightboxIdx - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, images.length]);

  if (!cosplay || !params) {
    return <div className="py-20 text-center text-[var(--muted)]">加载中...</div>;
  }

  const cosplayId = parseInt(params.id);

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--foreground)]">
          首页
        </Link>
        <span>›</span>
        {cosplay.coser && (
          <>
            <Link
              href={`/coser/${cosplay.coser.id}/1`}
              className="hover:text-[var(--foreground)]"
            >
              {cosplay.coser.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-[var(--foreground)]">{cosplay.title}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{cosplay.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          {cosplay.coser && (
            <Link
              href={`/coser/${cosplay.coser.id}/1`}
              className="text-[var(--accent)] hover:underline"
            >
              {cosplay.coser.name}
            </Link>
          )}
          {cosplay.parody && (
            <Link
              href={`/parody/${cosplay.parody.id}/1`}
              className="hover:text-[var(--foreground)]"
            >
              {cosplay.parody.name}
            </Link>
          )}
          <span>
            {cosplay.photo_count}P
            {cosplay.video_count > 0 && ` / ${cosplay.video_count}V`}
          </span>
          <span>{formatSize(cosplay.total_size)}</span>
          <span>{new Date(cosplay.created_at).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.slice(0, visibleCount).map((filename, idx) => (
          <button
            key={filename}
            onClick={() => setLightboxIdx(idx)}
            className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded bg-[var(--card-bg)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl(cosplayId, filename)}
              alt={filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {visibleCount < images.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 20)}
            className="rounded-lg bg-[var(--card-bg)] px-6 py-2 text-sm transition-colors hover:bg-[var(--card-hover)]"
          >
            加载更多 ({images.length - visibleCount} 张)
          </button>
        </div>
      )}

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white"
            onClick={() => setLightboxIdx(null)}
          >
            ✕
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 text-3xl text-white/60 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button
              className="absolute right-4 text-3xl text-white/60 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
            >
              ›
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(cosplayId, images[lightboxIdx])}
            alt={images[lightboxIdx]}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-sm text-white/60">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
