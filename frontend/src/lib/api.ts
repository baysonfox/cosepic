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

export interface CoserCreate {
  name: string;
  avatar_path?: string | null;
}

export interface ParodyCreate {
  name: string;
}

export interface CosplayCreate {
  title: string;
  coser_id: number;
  parody_id?: number | null;
  dir_path: string;
}

export interface CosplayUpdate {
  title?: string | null;
  coser_id?: number | null;
  parody_id?: number | null;
}

export async function adminCreateCoser(data: CoserCreate): Promise<Coser> {
  const res = await fetch(`${API_BASE}/admin/cosers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create coser");
  }
  return res.json();
}

export async function adminUpdateCoser(
  coserId: number,
  data: CoserCreate
): Promise<Coser> {
  const res = await fetch(`${API_BASE}/admin/cosers/${coserId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update coser");
  }
  return res.json();
}

export async function adminDeleteCoser(coserId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/cosers/${coserId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete coser");
  }
}

export async function adminCreateParody(data: ParodyCreate): Promise<Parody> {
  const res = await fetch(`${API_BASE}/admin/parodies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create parody");
  }
  return res.json();
}

export async function adminUpdateParody(
  parodyId: number,
  data: ParodyCreate
): Promise<Parody> {
  const res = await fetch(`${API_BASE}/admin/parodies/${parodyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update parody");
  }
  return res.json();
}

export async function adminDeleteParody(parodyId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/parodies/${parodyId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete parody");
  }
}

export async function adminCreateCosplay(
  data: CosplayCreate
): Promise<CosplayItem> {
  const res = await fetch(`${API_BASE}/admin/cosplays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create cosplay");
  }
  return res.json();
}

export async function adminUpdateCosplay(
  cosplayId: number,
  data: CosplayUpdate
): Promise<CosplayItem> {
  const res = await fetch(`${API_BASE}/admin/cosplays/${cosplayId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update cosplay");
  }
  return res.json();
}

export async function adminDeleteCosplay(cosplayId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/cosplays/${cosplayId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete cosplay");
  }
}

export async function adminRescanCosplay(
  cosplayId: number
): Promise<{ photo_count: number; video_count: number }> {
  const res = await fetch(`${API_BASE}/admin/cosplays/${cosplayId}/rescan`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to rescan cosplay");
  }
  return res.json();
}

export async function adminGenerateThumbnails(cosplayId: number): Promise<{
  thumbnails_generated: number;
  hashes_computed: number;
}> {
  const res = await fetch(
    `${API_BASE}/admin/cosplays/${cosplayId}/generate-thumbnails`,
    { method: "POST" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate thumbnails");
  }
  return res.json();
}

export interface DedupImage {
  id: number;
  cosplay_id: number;
  cosplay_title: string | null;
  filename: string;
}

export interface DedupResult {
  type: string;
  phash?: string;
  distance?: number;
  phash1?: string;
  phash2?: string;
  images: DedupImage[];
}

export interface DedupResponse {
  exact_duplicates: DedupResult[];
  similar_pairs: DedupResult[];
  exact_count: number;
  similar_count: number;
}

export async function findDuplicates(
  threshold: number = 10
): Promise<DedupResponse> {
  const res = await fetch(
    `${API_BASE}/admin/dedup/find?threshold=${threshold}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to find duplicates");
  }
  return res.json();
}
