import { describe, expect, it, vi } from "vitest";

import { deleteOrphanCharacters } from "@/lib/api/characters";
import { deleteOrphanCosers } from "@/lib/api/cosers";
import { deleteOrphanOutfits } from "@/lib/api/outfits";
import { deleteOrphanTags } from "@/lib/api/tags";
import { deleteOrphanWorks } from "@/lib/api/works";

describe("deleteOrphan* API helpers", () => {
  it.each([
    ["cosers", deleteOrphanCosers, "/api/v1/cosers/delete-orphans"],
    ["works", deleteOrphanWorks, "/api/v1/works/delete-orphans"],
    ["characters", deleteOrphanCharacters, "/api/v1/characters/delete-orphans"],
    ["outfits", deleteOrphanOutfits, "/api/v1/outfits/delete-orphans"],
    ["tags", deleteOrphanTags, "/api/v1/tags/delete-orphans"],
  ] as const)("%s posts to the orphan endpoint", async (_label, fn, path) => {
    const fetcher = vi.fn(async () => ({ deleted: 7 }));
    const result = await fn(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(path, { method: "POST" });
    expect(result).toEqual({ deleted: 7 });
  });
});
