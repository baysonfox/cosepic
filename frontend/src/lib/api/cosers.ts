/**
 * Coser API functions.
 */

import type {
  CoserCreate,
  CoserOut,
  CoserUpdate,
  DeleteOrphansResult,
  PaginatedResponse,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listCosers(
  params: { q?: string; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<CoserOut>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/cosers${qs ? `?${qs}` : ""}`);
}

export async function getCoser(
  id: number,
  fetcher: Fetcher,
): Promise<CoserOut> {
  return fetcher(`/api/v1/cosers/${id}`);
}

export async function createCoser(
  data: CoserCreate,
  fetcher: Fetcher,
): Promise<CoserOut> {
  return fetcher("/api/v1/cosers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCoser(
  id: number,
  data: CoserUpdate,
  fetcher: Fetcher,
): Promise<CoserOut> {
  return fetcher(`/api/v1/cosers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCoser(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/cosers/${id}`, { method: "DELETE" });
}

export async function deleteOrphanCosers(
  fetcher: Fetcher,
): Promise<DeleteOrphansResult> {
  return fetcher(`/api/v1/cosers/delete-orphans`, { method: "POST" });
}

export async function addAlias(
  coserId: number,
  alias: string,
  fetcher: Fetcher,
): Promise<unknown> {
  return fetcher(`/api/v1/cosers/${coserId}/aliases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alias }),
  });
}

export async function removeAlias(
  coserId: number,
  aliasId: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/cosers/${coserId}/aliases/${aliasId}`, {
    method: "DELETE",
  });
}
