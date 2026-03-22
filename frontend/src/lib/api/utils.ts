import { getApiBase } from "./client";

export function coverUrl(cosplayId: number): string {
  return `${getApiBase()}/files/cover/${cosplayId}`;
}

export function thumbnailUrl(cosplayId: number, filename: string): string {
  return `${getApiBase()}/files/thumbnail/${cosplayId}/${encodeURIComponent(filename)}`;
}

export function imageUrl(cosplayId: number, filename: string): string {
  return `${getApiBase()}/files/image/${cosplayId}/${encodeURIComponent(filename)}`;
}

export function coserAvatarUrl(coserId: number): string {
  return `${getApiBase()}/files/coser-avatar/${coserId}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}
