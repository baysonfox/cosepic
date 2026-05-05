/**
 * Asset API functions and URL helpers.
 */

import type { AssetOut } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listAssets(
  packId: number,
  fetcher: Fetcher,
): Promise<AssetOut[]> {
  return fetcher<AssetOut[]>(`/api/v1/packs/${packId}/assets`);
}

export async function setCover(
  packId: number,
  assetId: number,
  fetcher: Fetcher,
): Promise<unknown> {
  return fetcher(`/api/v1/packs/${packId}/cover`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId }),
  });
}

/** Thumbnail URL for Server Components (direct backend). */
export function serverThumbnailUrl(assetId: number): string {
  return `${BACKEND_URL}/api/v1/assets/${assetId}/thumbnail`;
}

/** Original file URL for Server Components (direct backend). */
export function serverFileUrl(assetId: number): string {
  return `${BACKEND_URL}/api/v1/assets/${assetId}/file`;
}

/** Thumbnail URL for Client Components (via proxy). */
export function thumbnailUrl(assetId: number): string {
  return `/api/assets/${assetId}/thumbnail`;
}

/** Original file URL for Client Components (via proxy). */
export function fileUrl(assetId: number): string {
  return `/api/assets/${assetId}/file`;
}
