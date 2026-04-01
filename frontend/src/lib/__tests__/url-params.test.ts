import { describe, expect, it } from "vitest";
import {
  buildPackFilterSearchParams,
  parsePackFilterParams,
} from "@/lib/url-params";

describe("parsePackFilterParams", () => {
  it("parses mixed filter params", () => {
    const result = parsePackFilterParams({
      q: "amiya",
      coser_ids: ["1,2", "3"],
      character_ids: "5,8",
      has_video: "true",
      sort: "title",
      order: "asc",
      page: "4",
      page_size: "50",
    });

    expect(result).toEqual({
      q: "amiya",
      coser_ids: [1, 2, 3],
      work_ids: undefined,
      character_ids: [5, 8],
      outfit_ids: undefined,
      tag_ids: undefined,
      has_video: true,
      status: undefined,
      sort: "title",
      order: "asc",
      page: 4,
      page_size: 50,
    });
  });

  it("falls back to defaults", () => {
    const result = parsePackFilterParams({});

    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.has_video).toBeUndefined();
  });
});

describe("buildPackFilterSearchParams", () => {
  it("serializes non-default params", () => {
    const params = buildPackFilterSearchParams({
      q: "texas",
      coser_ids: [1, 2],
      has_video: false,
      sort: "photo_count",
      order: "desc",
      page: 3,
      page_size: 40,
    });

    expect(params.toString()).toContain("q=texas");
    expect(params.get("coser_ids")).toBe("1,2");
    expect(params.get("has_video")).toBe("false");
    expect(params.get("page")).toBe("3");
    expect(params.get("page_size")).toBe("40");
  });

  it("omits default page and page size", () => {
    const params = buildPackFilterSearchParams({
      q: "amiya",
      page: 1,
      page_size: 20,
    });

    expect(params.get("page")).toBeNull();
    expect(params.get("page_size")).toBeNull();
  });
});
