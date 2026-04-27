"use client";

import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { fileUrl } from "@/lib/api/assets";
import type { AssetOut } from "@/lib/api/types";

interface LightboxWrapperProps {
  assets: AssetOut[];
  open: boolean;
  index: number;
  onClose: () => void;
}

export function LightboxWrapper({
  assets,
  open,
  index,
  onClose,
}: LightboxWrapperProps) {
  const slides = assets.map((asset) => ({
    src: fileUrl(asset.id),
    alt: asset.file_name,
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Counter, Thumbnails, Zoom]}
      carousel={{ finite: false }}
      thumbnails={{ position: "bottom", width: 96, height: 96 }}
      zoom={{ maxZoomPixelRatio: 3 }}
    />
  );
}
