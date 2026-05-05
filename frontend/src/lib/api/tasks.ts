/**
 * Task API functions.
 */

import type { PaginatedResponse, TaskOut } from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function listTasks(
  params: { status?: string; task_type?: string; page?: number; page_size?: number },
  fetcher: Fetcher,
): Promise<PaginatedResponse<TaskOut>> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.task_type) sp.set("task_type", params.task_type);
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const qs = sp.toString();
  return fetcher(`/api/v1/tasks${qs ? `?${qs}` : ""}`);
}

export async function getTask(
  id: number,
  fetcher: Fetcher,
): Promise<TaskOut> {
  return fetcher(`/api/v1/tasks/${id}`);
}
