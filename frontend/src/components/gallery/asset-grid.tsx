"use client";

import type { AssetOut } from "@/lib/api/types";
import { thumbnailUrl } from "@/lib/api/assets";
import { LazyImage } from "@/components/media/lazy-image";
import { cn } from "@/lib/utils";

interface AssetGridProps {
  assets: AssetOut[];
  onAssetClick: (index: number) => void;
  coverAssetId?: number | null;
  editing?: boolean;
  onCoverSelect?: (assetId: number) => void;
}

export function AssetGrid({
  assets,
  onAssetClick,
  coverAssetId,
  editing = false,
  onCoverSelect,
}: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No assets found.
      </div>
    );
  }

  function handleClick(index: number, assetId: number) {
    if (editing && onCoverSelect) {
      onCoverSelect(assetId);
      return;
    }
    onAssetClick(index);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {assets.map((asset, index) => {
        const isCover = coverAssetId === asset.id;

        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => handleClick(index, asset.id)}
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-accent",
              isCover && "border-primary ring-2 ring-primary/50",
            )}
          >
            <LazyImage
              src={thumbnailUrl(asset.id)}
              blurhash={asset.blurhash}
              alt={asset.file_name}
              className="w-full"
              aspectRatio="1 / 1"
            />
            {isCover && (
              <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                Cover
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
