/**
 * URL search param helpers for pack filters.
 */

import type { PackFilterParams } from "@/lib/api/types";

function parseNumberList(value: string | string[] | undefined): number[] | undefined {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const ids = values
    .flatMap((item) => item.split(","))
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  return ids.length > 0 ? ids : undefined;
}

function parseBoolean(value: string | string[] | undefined): boolean | undefined {
  if (value === undefined || Array.isArray(value)) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (value === undefined || Array.isArray(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parsePackFilterParams(
  searchParams: Record<string, string | string[] | undefined>,
): PackFilterParams {
  return {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    coser_ids: parseNumberList(searchParams.coser_ids),
    work_ids: parseNumberList(searchParams.work_ids),
    character_ids: parseNumberList(searchParams.character_ids),
    outfit_ids: parseNumberList(searchParams.outfit_ids),
    tag_ids: parseNumberList(searchParams.tag_ids),
    has_video: parseBoolean(searchParams.has_video),
    status: typeof searchParams.status === "string"
      ? searchParams.status
      : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    order: typeof searchParams.order === "string"
      ? searchParams.order
      : undefined,
    page: parseNumber(searchParams.page) ?? 1,
    page_size: parseNumber(searchParams.page_size) ?? 20,
  };
}

export function buildPackFilterSearchParams(
  params: PackFilterParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.coser_ids?.length) sp.set("coser_ids", params.coser_ids.join(","));
  if (params.work_ids?.length) sp.set("work_ids", params.work_ids.join(","));
  if (params.character_ids?.length) {
    sp.set("character_ids", params.character_ids.join(","));
  }
  if (params.outfit_ids?.length) {
    sp.set("outfit_ids", params.outfit_ids.join(","));
  }
  if (params.tag_ids?.length) sp.set("tag_ids", params.tag_ids.join(","));
  if (params.has_video !== undefined) {
    sp.set("has_video", String(params.has_video));
  }
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  if (params.page && params.page !== 1) sp.set("page", String(params.page));
  if (params.page_size && params.page_size !== 20) {
    sp.set("page_size", String(params.page_size));
  }
  return sp;
}
