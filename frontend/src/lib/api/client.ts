/**
 * Base fetch wrappers for server and client components.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
  }
}

async function handleResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return null;
}

/**
 * Fetch for Server Components — hits backend directly.
 */
export async function serverFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, { cache: "no-store", ...init });
  return handleResponse(res) as Promise<T>;
}

/**
 * Fetch for Client Components — goes through Next.js API proxy.
 */
export async function clientFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  return handleResponse(res) as Promise<T>;
}
