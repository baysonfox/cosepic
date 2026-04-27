import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const ORIGINAL_WORK_NAME = "原创"
export const ORIGINAL_CHARACTER_NAME = "OriginalCharacter"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCharacterDisplayName(
  name: string,
  workName?: string | null,
): string {
  if (
    name === ORIGINAL_CHARACTER_NAME &&
    workName === ORIGINAL_WORK_NAME
  ) {
    return ORIGINAL_WORK_NAME
  }
  return name
}

export function formatCharacterMeta(
  name: string,
  workName?: string | null,
): string | null {
  if (
    name === ORIGINAL_CHARACTER_NAME &&
    workName === ORIGINAL_WORK_NAME
  ) {
    return null
  }
  return workName ?? null
}

export function formatOutfitCharacterName(
  characterName?: string | null,
): string | null {
  if (characterName === ORIGINAL_CHARACTER_NAME) {
    return ORIGINAL_WORK_NAME
  }
  return characterName ?? null
}

export function formatImportCharacterNames(
  workName?: string | null,
  characterNames?: string | null,
): string | null {
  if (
    workName === ORIGINAL_WORK_NAME &&
    characterNames === ORIGINAL_CHARACTER_NAME
  ) {
    return ORIGINAL_WORK_NAME
  }
  return characterNames ?? null
}

/** Format bytes to a human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Format an ISO date string to a short display format. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
