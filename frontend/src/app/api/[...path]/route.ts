import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE = "http://127.0.0.1:7900/api";

function buildTargetUrl(
  pathSegments: string[],
  searchParams: URLSearchParams
): string {
  const path = pathSegments.join("/");
  const search = searchParams.toString();

  if (!search) {
    return `${BACKEND_API_BASE}/${path}`;
  }

  return `${BACKEND_API_BASE}/${path}?${search}`;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams);
  const requestBody = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();
  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: requestBody,
    redirect: "follow",
  });
  const responseHeaders = new Headers(upstreamResponse.headers);

  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}
