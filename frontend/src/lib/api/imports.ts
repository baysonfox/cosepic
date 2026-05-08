/**
 * Import API functions.
 */

import type {
  CancelImportResult,
  ImportCommitCandidate,
  ImportCommitResult,
  ScanResult,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function scanImport(
  rootPath: string,
  fetcher: Fetcher,
): Promise<ScanResult> {
  return fetcher("/api/v1/imports/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ root_path: rootPath }),
  });
}

export async function commitImport(
  candidates: ImportCommitCandidate[],
  skipDuplicateCheck: boolean,
  fetcher: Fetcher,
): Promise<ImportCommitResult> {
  return fetcher("/api/v1/imports/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidates,
      skip_duplicate_check: skipDuplicateCheck,
    }),
  });
}

export async function cancelImport(
  packId: number,
  fetcher: Fetcher,
): Promise<CancelImportResult> {
  return fetcher(`/api/v1/imports/packs/${packId}/cancel`, {
    method: "DELETE",
  });
}
