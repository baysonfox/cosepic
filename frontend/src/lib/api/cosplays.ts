import { apiClient } from "./client";
import type { CosplayItem, PaginatedResponse, ImageWithBlurhash } from "./types";

export async function fetchCosplays(
  page: number = 1,
  pageSize: number = 20,
  coserId?: number,
  parodyId?: number
): Promise<PaginatedResponse<CosplayItem>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (coserId) params.set("coser_id", String(coserId));
  if (parodyId) params.set("parody_id", String(parodyId));
  return apiClient(`/cosplays/?${params}`);
}

export async function fetchCosplay(id: number): Promise<CosplayItem> {
  return apiClient(`/cosplays/${id}`);
}

export async function fetchCosplayImages(
  id: number
): Promise<ImageWithBlurhash[]> {
  return apiClient(`/cosplays/${id}/images`);
}
