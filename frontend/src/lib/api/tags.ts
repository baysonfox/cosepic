/**
 * Tag API functions.
 */

import type {
  PaginatedResponse,
  TagCreate,
  TagOut,
  TagUpdate,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listTags(
  params: { q?: string; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<TagOut>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/tags${qs ? `?${qs}` : ""}`);
}

export async function getTag(
  id: number,
  fetcher: Fetcher,
): Promise<TagOut> {
  return fetcher(`/api/v1/tags/${id}`);
}

export async function createTag(
  data: TagCreate,
  fetcher: Fetcher,
): Promise<TagOut> {
  return fetcher("/api/v1/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateTag(
  id: number,
  data: TagUpdate,
  fetcher: Fetcher,
): Promise<TagOut> {
  return fetcher(`/api/v1/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteTag(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/tags/${id}`, { method: "DELETE" });
}
