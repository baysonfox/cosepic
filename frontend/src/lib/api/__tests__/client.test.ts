import { afterEach, describe, expect, it, vi } from "vitest";
import { clientFetch } from "@/lib/api/client";

describe("clientFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps /api/v1 paths through the Next proxy", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await clientFetch("/api/v1/packs/12");

    expect(fetchMock).toHaveBeenCalledWith("/api/packs/12", undefined);
  });

  it("keeps already proxied paths intact", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await clientFetch("/api/cosers?q=moe");

    expect(fetchMock).toHaveBeenCalledWith("/api/cosers?q=moe", undefined);
  });
});
