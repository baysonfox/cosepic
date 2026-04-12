"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  blurhash?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

function decodeBlurhash(hash: string, width = 32, height = 32): string | null {
  try {
    // Dynamic import at module level won't work for SSR,
    // so we use a synchronous require-style approach via the canvas API.
    // The blurhash decode is done client-side.
    const { decode } = require("blurhash");
    const pixels = decode(hash, width, height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  } catch {
    return null;
  }
}

export function LazyImage({
  src,
  blurhash,
  alt,
  className,
  aspectRatio = "3/4",
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  useEffect(() => {
    if (blurhash) {
      const url = decodeBlurhash(blurhash);
      setPlaceholderUrl(url);
      return;
    }
    setPlaceholderUrl(null);
  }, [blurhash]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio }}
    >
      {placeholderUrl && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}

      {!error && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
          No image
        </div>
      )}
    </div>
  );
}
