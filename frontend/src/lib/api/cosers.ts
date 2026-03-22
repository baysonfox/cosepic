import { apiClient } from "./client";
import type { Coser, PaginatedResponse } from "./types";

export async function fetchCoser(id: number): Promise<Coser> {
  return apiClient(`/cosers/${id}`);
}

export async function fetchCosers(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<PaginatedResponse<Coser>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.set("search", search);
  return apiClient(`/cosers/?${params}`);
}
