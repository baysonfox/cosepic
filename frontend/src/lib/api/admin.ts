import { apiPost, apiPut, apiDelete, apiClient } from "./client";
import type {
  BatchCreateCosplaysResponse,
  Coser,
  Parody,
  CosplayItem,
  CoserCreate,
  ParodyCreate,
  CosplayCreate,
  CosplayUpdate,
  ScrapePreviewResponse,
  ThumbnailResponse,
  RescanResponse,
} from "./types";

// ========== Coser Admin ==========

export async function adminCreateCoser(data: CoserCreate): Promise<Coser> {
  return apiPost("/admin/cosers", data);
}

export async function adminUpdateCoser(
  coserId: number,
  data: CoserCreate
): Promise<Coser> {
  return apiPut(`/admin/cosers/${coserId}`, data);
}

export async function adminDeleteCoser(coserId: number): Promise<void> {
  await apiDelete(`/admin/cosers/${coserId}`);
}

// ========== Parody Admin ==========

export async function adminCreateParody(data: ParodyCreate): Promise<Parody> {
  return apiPost("/admin/parodies", data);
}

export async function adminUpdateParody(
  parodyId: number,
  data: ParodyCreate
): Promise<Parody> {
  return apiPut(`/admin/parodies/${parodyId}`, data);
}

export async function adminDeleteParody(parodyId: number): Promise<void> {
  await apiDelete(`/admin/parodies/${parodyId}`);
}

// ========== Cosplay Admin ==========

export async function adminCreateCosplay(
  data: CosplayCreate
): Promise<CosplayItem> {
  return apiPost("/admin/cosplays", data);
}

export async function adminUpdateCosplay(
  cosplayId: number,
  data: CosplayUpdate
): Promise<CosplayItem> {
  return apiPut(`/admin/cosplays/${cosplayId}`, data);
}

export async function adminDeleteCosplay(cosplayId: number): Promise<void> {
  await apiDelete(`/admin/cosplays/${cosplayId}`);
}

export async function adminRescanCosplay(
  cosplayId: number
): Promise<RescanResponse> {
  return apiClient<RescanResponse>(`/admin/cosplays/${cosplayId}/rescan`, {
    method: "POST",
  });
}

export async function adminGenerateThumbnails(
  cosplayId: number
): Promise<ThumbnailResponse> {
  return apiClient<ThumbnailResponse>(
    `/admin/cosplays/${cosplayId}/generate-thumbnails`,
    { method: "POST" }
  );
}

export async function adminScrapeCosplayPreview(
  rootDir: string
): Promise<ScrapePreviewResponse> {
  return apiPost("/admin/cosplays/scrape-preview", { root_dir: rootDir });
}

export async function adminBatchCreateCosplays(
  items: CosplayCreate[]
): Promise<BatchCreateCosplaysResponse> {
  return apiPost("/admin/cosplays/batch-create", { items });
}
