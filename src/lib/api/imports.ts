/**
 * Import API functions.
 */

import type {
  CancelImportResult,
  ImportBatchOut,
  ImportCandidateOut,
  ImportCandidateUpdate,
  ImportCommitResult,
} from "./types";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function scanImport(
  rootPath: string,
  fetcher: Fetcher,
): Promise<ImportBatchOut> {
  return fetcher("/api/v1/imports/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ root_path: rootPath }),
  });
}

export async function getBatch(
  batchId: number,
  fetcher: Fetcher,
): Promise<ImportBatchOut> {
  return fetcher(`/api/v1/imports/${batchId}`);
}

export async function updateCandidate(
  batchId: number,
  candidateId: number,
  data: ImportCandidateUpdate,
  fetcher: Fetcher,
): Promise<ImportCandidateOut> {
  return fetcher(`/api/v1/imports/${batchId}/candidates/${candidateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function commitBatch(
  batchId: number,
  fetcher: Fetcher,
  skipDuplicateCheck?: boolean,
): Promise<ImportCommitResult> {
  const params = new URLSearchParams();
  if (skipDuplicateCheck) {
    params.set("skip_duplicate_check", "true");
  }
  const url = `/api/v1/imports/${batchId}/commit${params.toString() ? `?${params.toString()}` : ""}`;
  return fetcher(url, {
    method: "POST",
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
