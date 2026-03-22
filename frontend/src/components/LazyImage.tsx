"use client";

import { useEffect, useMemo, useState } from "react";
import { decode } from "blurhash";

interface LazyImageProps {
  blurhash: string | null;
  thumbnailSrc: string;
  fullSrc?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function LazyImage({
  blurhash,
  thumbnailSrc,
  alt,
  className = "",
  onClick,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const blurDataUrl = useMemo(() => {
    if (!blurhash) {
      return null;
    }

    try {
      const pixels = decode(blurhash, 32, 32);
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return null;
      }

      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL();
    } catch {
      return null;
    }
  }, [blurhash]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: "#1a1a1a" }}
      onClick={onClick}
    >
      {blurDataUrl && !loaded && (
        <img
          src={blurDataUrl}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover blur-xl scale-110"
        />
      )}
      <img
        src={thumbnailSrc}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  );
}

export function useLightboxImage(fullSrc: string | null) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!fullSrc) return;
    const img = new Image();
    img.src = fullSrc;
    img.onload = () => setLoaded(true);
  }, [fullSrc]);

  return { loaded };
}
