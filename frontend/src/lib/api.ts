const API_BASE = "/api";

export interface Coser {
  id: number;
  name: string;
  avatar_path: string | null;
  created_at: string;
  cosplay_count: number;
}

export interface Parody {
  id: number;
  name: string;
  created_at: string;
  cosplay_count: number;
}

export interface CosplayItem {
  id: number;
  title: string;
  coser_id: number;
  parody_id: number | null;
  dir_path: string;
  cover_path: string | null;
  photo_count: number;
  video_count: number;
  total_size: number;
  created_at: string;
  coser: Coser | null;
  parody: Parody | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

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
  const res = await fetch(`${API_BASE}/cosplays/?${params}`);
  return res.json();
}

export async function fetchCosplay(id: number): Promise<CosplayItem> {
  const res = await fetch(`${API_BASE}/cosplays/${id}`);
  return res.json();
}

export async function fetchCosplayImages(id: number): Promise<string[]> {
  const res = await fetch(`${API_BASE}/cosplays/${id}/images`);
  return res.json();
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
  const res = await fetch(`${API_BASE}/cosers/?${params}`);
  return res.json();
}

export async function fetchParodies(
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResponse<Parody>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(`${API_BASE}/parodies/?${params}`);
  return res.json();
}

export function coverUrl(cosplayId: number): string {
  return `${API_BASE}/files/cover/${cosplayId}`;
}

export function thumbnailUrl(cosplayId: number, filename: string): string {
  return `${API_BASE}/files/thumbnail/${cosplayId}/${encodeURIComponent(filename)}`;
}

export function imageUrl(cosplayId: number, filename: string): string {
  return `${API_BASE}/files/image/${cosplayId}/${encodeURIComponent(filename)}`;
}

export function coserAvatarUrl(coserId: number): string {
  return `${API_BASE}/files/coser-avatar/${coserId}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}
