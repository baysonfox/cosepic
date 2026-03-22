function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000/api";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiErrorResponse {
  detail?: string;
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch((): ApiErrorResponse => ({}));
    throw new ApiError(err.detail || "Request failed", res.status);
  }

  return res.json();
}

export async function apiPost<T, B = unknown>(
  path: string,
  body?: B
): Promise<T> {
  return apiClient<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T, B = unknown>(
  path: string,
  body?: B
): Promise<T> {
  return apiClient<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(path: string): Promise<void> {
  await apiClient(path, { method: "DELETE" });
}

export { getApiBase };
