/**
 * Import API functions.
 */

import type {
  ImportBatchOut,
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
): Promise<unknown> {
  return fetcher(`/api/v1/imports/${batchId}/candidates/${candidateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function commitBatch(
  batchId: number,
  fetcher: Fetcher,
): Promise<ImportCommitResult> {
  return fetcher(`/api/v1/imports/${batchId}/commit`, {
    method: "POST",
  });
}
