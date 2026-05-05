/**
 * System API functions.
 */

import type { SystemStats } from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getHealth(
  fetcher: Fetcher,
): Promise<{ status: string }> {
  return fetcher("/api/v1/system/health");
}

export async function getStats(
  fetcher: Fetcher,
): Promise<SystemStats> {
  return fetcher("/api/v1/system/stats");
}
