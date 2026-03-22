/**
 * API 类型定义
 */

/** Coser 信息 */
export interface Coser {
  id: number;
  name: string;
  avatar_path: string | null;
  created_at: string;
  cosplay_count: number;
}

/** Parody (作品) 信息 */
export interface Parody {
  id: number;
  name: string;
  created_at: string;
  cosplay_count: number;
}

/** Cosplay 图集信息 */
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

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 图片信息（含 BlurHash） */
export interface ImageWithBlurhash {
  filename: string;
  blurhash: string | null;
}

/** 创建 Coser 请求 */
export interface CoserCreate {
  name: string;
  avatar_path?: string | null;
}

/** 创建 Parody 请求 */
export interface ParodyCreate {
  name: string;
}

/** 创建 Cosplay 请求 */
export interface CosplayCreate {
  title?: string;
  coser_id?: number;
  parody_id?: number | null;
  dir_path: string;
}

/** 更新 Cosplay 请求 */
export interface CosplayUpdate {
  title?: string | null;
  coser_id?: number | null;
  parody_id?: number | null;
  dir_path?: string | null;
}

export interface ScrapedCosplayCandidate {
  dir_path: string;
  folder_name: string;
  title: string;
  coser_name: string;
  parody_name: string | null;
  coser_id: number | null;
  parody_id: number | null;
  photo_count: number;
  video_count: number;
  total_size: number;
  cover_path: string | null;
}

export interface ScrapePreviewResponse {
  root_dir: string;
  items: ScrapedCosplayCandidate[];
}

export interface BatchCreateCosplaysResponse {
  created: CosplayItem[];
}

/** 缩略图生成响应 */
export interface ThumbnailResponse {
  thumbnails_generated: number;
  hashes_computed: number;
}

/** 重新扫描响应 */
export interface RescanResponse {
  photo_count: number;
  video_count: number;
}
