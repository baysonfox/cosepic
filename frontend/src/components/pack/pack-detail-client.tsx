"use client";

import { useState } from "react";
import { AssetGrid } from "@/components/gallery/asset-grid";
import { LightboxWrapper } from "@/components/media/lightbox-wrapper";
import { PackHeader } from "@/components/pack/pack-header";
import { PackMetadata } from "@/components/pack/pack-metadata";
import type { AssetOut, PackOut } from "@/lib/api/types";

interface PackDetailClientProps {
  pack: PackOut;
  assets: AssetOut[];
}

export function PackDetailClient({
  pack,
  assets,
}: PackDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function handleAssetClick(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <div className="space-y-6">
      <PackHeader pack={pack} />
      <PackMetadata pack={pack} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Assets</h2>
        <AssetGrid assets={assets} onAssetClick={handleAssetClick} />
      </section>

      <LightboxWrapper
        assets={assets}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
