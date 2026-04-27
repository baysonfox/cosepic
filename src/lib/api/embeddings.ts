import { clientFetch, serverFetch } from "./client";
import type {
  DuplicateCheckResult,
  EmbeddingStatus,
  SemanticSearchResult,
} from "./types";

export async function semanticSearch(
  queryText: string,
  topK: number = 5,
  isServer: boolean = false
): Promise<SemanticSearchResult> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/embeddings/search", {
    method: "POST",
    body: JSON.stringify({ query_text: queryText, top_k: topK }),
  });
}

export async function checkDuplicate(
  packId: number,
  isServer: boolean = false
): Promise<DuplicateCheckResult> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/embeddings/check-duplicate", {
    method: "POST",
    body: JSON.stringify({ pack_id: packId }),
  });
}

export async function getEmbeddingStatus(
  isServer: boolean = false
): Promise<EmbeddingStatus> {
  const fetch = isServer ? serverFetch : clientFetch;
  return fetch("/embeddings/status");
}
