/**
 * TypeScript types matching backend Pydantic schemas.
 */

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export interface CoserBrief {
  id: number;
  name: string;
  is_primary: boolean;
}

export interface CharacterBrief {
  id: number;
  name: string;
  work_name: string | null;
  is_primary: boolean;
}

export interface OutfitBrief {
  id: number;
  name: string;
  character_name: string | null;
}

export interface TagBrief {
  id: number;
  name: string;
  tag_type: string;
}

export interface PackListItem {
  id: number;
  title: string;
  status: string;
  cover_asset_id: number | null;
  photo_count: number;
  video_count: number;
  total_size_bytes: number;
  created_at: string;
  cosers: CoserBrief[];
  characters: CharacterBrief[];
}

export interface PackOut extends PackListItem {
  description: string | null;
  dir_path: string;
  original_folder_name: string;
  updated_at: string;
  last_scanned_at: string | null;
  outfits: OutfitBrief[];
  tags: TagBrief[];
}

export interface PackCreate {
  title: string;
  dir_path: string;
  original_folder_name?: string;
  description?: string;
}

export interface PackUpdate {
  title?: string;
  description?: string;
  dir_path?: string;
  status?: string;
  cover_asset_id?: number;
  coser_ids?: number[];
  character_ids?: number[];
  outfit_ids?: number[];
  tag_ids?: number[];
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

export interface AssetOut {
  id: number;
  asset_type: string;
  file_name: string;
  relative_path: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  thumbnail_status: string;
  sort_index: number;
}

// ---------------------------------------------------------------------------
// Coser
// ---------------------------------------------------------------------------

export interface CoserOut {
  id: number;
  name: string;
  avatar_asset_id: number | null;
  created_at: string;
  updated_at: string;
  pack_count: number;
  aliases: string[];
}

export interface CoserCreate {
  name: string;
}

export interface CoserUpdate {
  name?: string;
}

// ---------------------------------------------------------------------------
// Work
// ---------------------------------------------------------------------------

export interface WorkOut {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  character_count: number;
  pack_count: number;
}

export interface WorkCreate {
  name: string;
}

export interface WorkUpdate {
  name?: string;
}

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------

export interface CharacterOut {
  id: number;
  name: string;
  work_id: number | null;
  work_name: string | null;
  created_at: string;
  updated_at: string;
  pack_count: number;
}

export interface CharacterCreate {
  name: string;
  work_id?: number;
}

export interface CharacterUpdate {
  name?: string;
  work_id?: number;
}

// ---------------------------------------------------------------------------
// Outfit
// ---------------------------------------------------------------------------

export interface OutfitOut {
  id: number;
  name: string;
  character_id: number;
  character_name: string | null;
  created_at: string;
  updated_at: string;
  pack_count: number;
}

export interface OutfitCreate {
  name: string;
  character_id: number;
}

export interface OutfitUpdate {
  name?: string;
  character_id?: number;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

export interface TagOut {
  id: number;
  name: string;
  tag_type: string;
  created_at: string;
  pack_count: number;
}

export interface TagCreate {
  name: string;
  tag_type?: string;
}

export interface TagUpdate {
  name?: string;
  tag_type?: string;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export interface ImportCandidateOut {
  id: number;
  batch_id: number;
  folder_path: string;
  folder_name: string;
  detected_title: string | null;
  detected_coser_names: string[] | null;
  detected_work_name: string | null;
  detected_character_names: string[] | null;
  photo_count: number;
  video_count: number;
  total_size_bytes: number;
  existing_pack_id: number | null;
  status: string;
  created_at: string;
}

export interface ImportCandidateUpdate {
  detected_title?: string;
  detected_coser_names?: string[];
  detected_work_name?: string;
  detected_character_names?: string[];
  status?: string;
}

export interface ImportBatchOut {
  id: number;
  root_path: string;
  status: string;
  total_candidates: number;
  imported_count: number;
  created_at: string;
  finished_at: string | null;
  candidates: ImportCandidateOut[];
}

export interface ImportCommitResult {
  imported_count: number;
  pack_ids: number[];
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export interface TaskOut {
  id: number;
  task_type: string;
  target_type: string | null;
  target_id: number | null;
  status: string;
  error_message: string | null;
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export interface SystemStats {
  packs: number;
  assets: number;
  cosers: number;
  works: number;
  total_size_bytes: number;
}

// ---------------------------------------------------------------------------
// Pack filter params
// ---------------------------------------------------------------------------

export interface PackFilterParams {
  q?: string;
  coser_ids?: number[];
  work_ids?: number[];
  character_ids?: number[];
  outfit_ids?: number[];
  tag_ids?: number[];
  has_video?: boolean;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  page_size?: number;
}
