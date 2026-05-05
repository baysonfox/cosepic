/**
 * API proxy: forwards client-side requests to the backend.
 *
 * Client Components call /api/... which maps here.  The catch-all
 * [...path] captures everything after /api/ and forwards it to the
 * backend at http://127.0.0.1:8000/api/v1/{path}.
 */

import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const target = `${BACKEND_URL}/api/v1/${path.join("/")}`;
  const url = new URL(target);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET/HEAD
  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  const backendRes = await fetch(url.toString(), init);

  // Stream the response back
  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: {
      "content-type": backendRes.headers.get("content-type") ?? "application/octet-stream",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
