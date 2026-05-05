/**
 * Character API functions.
 */

import type {
  CharacterCreate,
  CharacterOut,
  CharacterUpdate,
  PaginatedResponse,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listCharacters(
  params: { q?: string; work_id?: number; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<CharacterOut>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.work_id) sp.set("work_id", String(params.work_id));
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/characters${qs ? `?${qs}` : ""}`);
}

export async function getCharacter(
  id: number,
  fetcher: Fetcher,
): Promise<CharacterOut> {
  return fetcher(`/api/v1/characters/${id}`);
}

export async function createCharacter(
  data: CharacterCreate,
  fetcher: Fetcher,
): Promise<CharacterOut> {
  return fetcher("/api/v1/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCharacter(
  id: number,
  data: CharacterUpdate,
  fetcher: Fetcher,
): Promise<CharacterOut> {
  return fetcher(`/api/v1/characters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCharacter(
  id: number,
  fetcher: Fetcher,
): Promise<void> {
  await fetcher(`/api/v1/characters/${id}`, { method: "DELETE" });
}
