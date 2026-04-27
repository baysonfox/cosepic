/**
 * Outfit API functions.
 */

import type {
  OutfitCreate,
  OutfitOut,
  OutfitUpdate,
  PaginatedResponse,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listOutfits(
  params: { q?: string; character_id?: number; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<OutfitOut>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.character_id) sp.set("character_id", String(params.character_id));
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/outfits${qs ? `?${qs}` : ""}`);
}

export async function getOutfit(
  id: number,
  fetcher: Fetcher,
): Promise<OutfitOut> {
  return fetcher(`/api/v1/outfits/${id}`);
}

export async function createOutfit(
  data: OutfitCreate,
  fetcher: Fetcher,
): Promise<OutfitOut> {
  return fetcher("/api/v1/outfits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateOutfit(
  id: number,
  data: OutfitUpdate,
  fetcher: Fetcher,
): Promise<OutfitOut> {
  return fetcher(`/api/v1/outfits/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteOutfit(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/outfits/${id}`, { method: "DELETE" });
}
