import { clientFetch, serverFetch } from "./client";
import type {
  DuplicateCheckResult,
  EmbeddingStatus,
  EmbeddingStats,
} from "./types";

export async function checkDuplicate(
  packId: number,
  isServer: boolean = false
): Promise<DuplicateCheckResult> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/api/v1/embeddings/check-duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pack_id: packId }),
  });
}

export async function getEmbeddingStatus(
  isServer: boolean = false
): Promise<EmbeddingStatus> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/api/v1/embeddings/status");
}

export async function getEmbeddingStats(
  isServer: boolean = false
): Promise<EmbeddingStats> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/api/v1/embeddings/stats");
}
