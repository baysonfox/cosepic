"use client";

import type { AssetOut } from "@/lib/api/types";
import { thumbnailUrl } from "@/lib/api/assets";
import { LazyImage } from "@/components/media/lazy-image";

interface AssetGridProps {
  assets: AssetOut[];
  onAssetClick: (index: number) => void;
}

export function AssetGrid({ assets, onAssetClick }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No assets found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {assets.map((asset, index) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onAssetClick(index)}
          className="overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-accent"
        >
          <LazyImage
            src={thumbnailUrl(asset.id)}
            blurhash={asset.blurhash}
            alt={asset.file_name}
            className="w-full"
            aspectRatio="1 / 1"
          />
        </button>
      ))}
    </div>
  );
}
