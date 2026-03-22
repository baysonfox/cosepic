import { apiClient } from "./client";
import type { Parody, PaginatedResponse } from "./types";

export async function fetchParody(id: number): Promise<Parody> {
  return apiClient(`/parodies/${id}`);
}

export async function fetchParodies(
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResponse<Parody>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return apiClient(`/parodies/?${params}`);
}
