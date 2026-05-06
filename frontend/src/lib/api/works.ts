/**
 * Work API functions.
 */

import type {
  DeleteOrphansResult,
  PaginatedResponse,
  WorkCreate,
  WorkOut,
  WorkUpdate,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listWorks(
  params: { q?: string; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<WorkOut>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/works${qs ? `?${qs}` : ""}`);
}

export async function getWork(
  id: number,
  fetcher: Fetcher,
): Promise<WorkOut> {
  return fetcher(`/api/v1/works/${id}`);
}

export async function createWork(
  data: WorkCreate,
  fetcher: Fetcher,
): Promise<WorkOut> {
  return fetcher("/api/v1/works", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateWork(
  id: number,
  data: WorkUpdate,
  fetcher: Fetcher,
): Promise<WorkOut> {
  return fetcher(`/api/v1/works/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteWork(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/works/${id}`, { method: "DELETE" });
}

export async function deleteOrphanWorks(
  fetcher: Fetcher,
): Promise<DeleteOrphansResult> {
  return fetcher(`/api/v1/works/delete-orphans`, { method: "POST" });
}
