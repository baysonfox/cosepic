/**
 * Pack API functions.
 */

import type {
  PackBulkDeleteResult,
  PackBulkRegenerateResult,
  PackCreate,
  PackFilterParams,
  PackListItem,
  PackOut,
  PackUpdate,
  PaginatedResponse,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

function buildQuery(params: PackFilterParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.coser_ids?.length) {
    for (const id of params.coser_ids) sp.append("coser_ids", String(id));
  }
  if (params.work_ids?.length) {
    for (const id of params.work_ids) sp.append("work_ids", String(id));
  }
  if (params.character_ids?.length) {
    for (const id of params.character_ids) sp.append("character_ids", String(id));
  }
  if (params.outfit_ids?.length) {
    for (const id of params.outfit_ids) sp.append("outfit_ids", String(id));
  }
  if (params.tag_ids?.length) {
    for (const id of params.tag_ids) sp.append("tag_ids", String(id));
  }
  if (params.has_video !== undefined) sp.set("has_video", String(params.has_video));
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function listPacks(
  params: PackFilterParams,
  fetcher: Fetcher,
): Promise<PaginatedResponse<PackListItem>> {
  return fetcher(`/api/v1/packs${buildQuery(params)}`);
}

export async function getPack(
  id: number,
  fetcher: Fetcher,
): Promise<PackOut> {
  return fetcher(`/api/v1/packs/${id}`);
}

export async function createPack(
  data: PackCreate,
  fetcher: Fetcher,
): Promise<PackOut> {
  return fetcher("/api/v1/packs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePack(
  id: number,
  data: PackUpdate,
  fetcher: Fetcher,
): Promise<PackOut> {
  return fetcher(`/api/v1/packs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePack(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/packs/${id}`, { method: "DELETE" });
}

export async function regeneratePack(
  id: number,
  fetcher: Fetcher,
): Promise<{ thumbnails_generated: number; hashes_computed: number }> {
  return fetcher(`/api/v1/packs/${id}/regenerate`, { method: "POST" });
}

export async function bulkDeletePacks(
  ids: number[],
  fetcher: Fetcher,
): Promise<PackBulkDeleteResult> {
  return fetcher("/api/v1/packs/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export async function bulkRegeneratePacks(
  ids: number[],
  fetcher: Fetcher,
): Promise<PackBulkRegenerateResult> {
  return fetcher("/api/v1/packs/bulk-regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}
