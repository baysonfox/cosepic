"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/filters/search-input";
import { ChipSelector, type ChipSelectorItem } from "@/components/entity/chip-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientFetch } from "@/lib/api/client";
import { listCharacters } from "@/lib/api/characters";
import { listCosers } from "@/lib/api/cosers";
import { listOutfits } from "@/lib/api/outfits";
import { listTags } from "@/lib/api/tags";
import { listWorks } from "@/lib/api/works";
import {
  buildPackFilterSearchParams,
  parsePackFilterParams,
} from "@/lib/url-params";
import {
  formatCharacterDisplayName,
  formatCharacterMeta,
  formatOutfitCharacterName,
} from "@/lib/utils";

function FilterBarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterParams = useMemo(
    () =>
      parsePackFilterParams(
        Object.fromEntries(searchParams.entries()) as Record<string, string>,
      ),
    [searchParams],
  );

  const [selectedCosers, setSelectedCosers] = useState<ChipSelectorItem[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<ChipSelectorItem[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<ChipSelectorItem[]>([]);
  const [selectedOutfits, setSelectedOutfits] = useState<ChipSelectorItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<ChipSelectorItem[]>([]);

  function updateFilters(updates: Partial<typeof filterParams>) {
    const next = {
      ...filterParams,
      ...updates,
      page: 1,
    };
    const qs = buildPackFilterSearchParams(next).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setParam(key: "has_video" | "sort" | "order", value: string | null) {
    if (key === "has_video") {
      updateFilters({
        has_video:
          value === null || value === "all"
            ? undefined
            : value === "true",
      });
      return;
    }

    updateFilters({
      [key]: value === null || value === "all" ? undefined : value,
    });
  }

  async function loadSelectedItems<T extends ChipSelectorItem>(
    ids: number[] | undefined,
    loader: () => Promise<T[]>,
    setter: (items: T[]) => void,
  ) {
    if (!ids?.length) {
      setter([]);
      return;
    }

    try {
      const items = await loader();
      const idSet = new Set(ids);
      setter(items.filter((item) => idSet.has(item.id)));
    } catch {
      setter([]);
    }
  }

  useEffect(() => {
    void loadSelectedItems(
      filterParams.coser_ids,
      async () => {
        const data = await listCosers({ page: 1, page_size: 200 }, clientFetch);
        return data.items.map((item) => ({ id: item.id, name: item.name }));
      },
      setSelectedCosers,
    );
  }, [filterParams.coser_ids]);

  useEffect(() => {
    void loadSelectedItems(
      filterParams.work_ids,
      async () => {
        const data = await listWorks({ page: 1, page_size: 200 }, clientFetch);
        return data.items.map((item) => ({ id: item.id, name: item.name }));
      },
      setSelectedWorks,
    );
  }, [filterParams.work_ids]);

  useEffect(() => {
    void loadSelectedItems(
      filterParams.character_ids,
      async () => {
        const data = await listCharacters({ page: 1, page_size: 200 }, clientFetch);
        return data.items.map((item) => ({
          id: item.id,
          name: formatCharacterDisplayName(item.name, item.work_name),
          meta: formatCharacterMeta(item.name, item.work_name),
        }));
      },
      setSelectedCharacters,
    );
  }, [filterParams.character_ids]);

  useEffect(() => {
    void loadSelectedItems(
      filterParams.outfit_ids,
      async () => {
        const data = await listOutfits({ page: 1, page_size: 200 }, clientFetch);
        return data.items.map((item) => ({
          id: item.id,
          name: item.name,
          meta: formatOutfitCharacterName(item.character_name),
        }));
      },
      setSelectedOutfits,
    );
  }, [filterParams.outfit_ids]);

  useEffect(() => {
    void loadSelectedItems(
      filterParams.tag_ids,
      async () => {
        const data = await listTags({ page: 1, page_size: 200 }, clientFetch);
        return data.items.map((item) => ({
          id: item.id,
          name: item.name,
          meta: item.tag_type,
        }));
      },
      setSelectedTags,
    );
  }, [filterParams.tag_ids]);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput placeholder="Search packs..." />

        <Select
          value={searchParams.get("has_video") ?? "all"}
          onValueChange={(value) => setParam("has_video", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Has video" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All media</SelectItem>
            <SelectItem value="true">With video</SelectItem>
            <SelectItem value="false">Photos only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") ?? "created_at"}
          onValueChange={(value) => setParam("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="photo_count">Photo count</SelectItem>
            <SelectItem value="total_size_bytes">File size</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("order") ?? "desc"}
          onValueChange={(value) => setParam("order", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChipSelector
          label="Cosers"
          selectedItems={selectedCosers}
          onAdd={(item) =>
            updateFilters({
              coser_ids: [...(filterParams.coser_ids ?? []), item.id],
            })
          }
          onRemove={(id) =>
            updateFilters({
              coser_ids: (filterParams.coser_ids ?? []).filter((item) => item !== id),
            })
          }
          searchFn={async (query) => {
            const data = await listCosers(
              { q: query || undefined, page: 1, page_size: 20 },
              clientFetch,
            );
            return data.items.map((item) => ({ id: item.id, name: item.name }));
          }}
        />

        <ChipSelector
          label="Works"
          selectedItems={selectedWorks}
          onAdd={(item) =>
            updateFilters({
              work_ids: [...(filterParams.work_ids ?? []), item.id],
            })
          }
          onRemove={(id) =>
            updateFilters({
              work_ids: (filterParams.work_ids ?? []).filter((item) => item !== id),
            })
          }
          searchFn={async (query) => {
            const data = await listWorks(
              { q: query || undefined, page: 1, page_size: 20 },
              clientFetch,
            );
            return data.items.map((item) => ({ id: item.id, name: item.name }));
          }}
        />

        <ChipSelector
          label="Characters"
          selectedItems={selectedCharacters}
          onAdd={(item) =>
            updateFilters({
              character_ids: [...(filterParams.character_ids ?? []), item.id],
            })
          }
          onRemove={(id) =>
            updateFilters({
              character_ids: (filterParams.character_ids ?? []).filter(
                (item) => item !== id,
              ),
            })
          }
          searchFn={async (query) => {
            const data = await listCharacters(
              { q: query || undefined, page: 1, page_size: 20 },
              clientFetch,
            );
            return data.items.map((item) => ({
              id: item.id,
              name: formatCharacterDisplayName(item.name, item.work_name),
              meta: formatCharacterMeta(item.name, item.work_name),
            }));
          }}
        />

        <ChipSelector
          label="Outfits"
          selectedItems={selectedOutfits}
          onAdd={(item) =>
            updateFilters({
              outfit_ids: [...(filterParams.outfit_ids ?? []), item.id],
            })
          }
          onRemove={(id) =>
            updateFilters({
              outfit_ids: (filterParams.outfit_ids ?? []).filter((item) => item !== id),
            })
          }
          searchFn={async (query) => {
            const data = await listOutfits(
              { q: query || undefined, page: 1, page_size: 20 },
              clientFetch,
            );
            return data.items.map((item) => ({
              id: item.id,
              name: item.name,
              meta: formatOutfitCharacterName(item.character_name),
            }));
          }}
        />

        <ChipSelector
          label="Tags"
          selectedItems={selectedTags}
          onAdd={(item) =>
            updateFilters({
              tag_ids: [...(filterParams.tag_ids ?? []), item.id],
            })
          }
          onRemove={(id) =>
            updateFilters({
              tag_ids: (filterParams.tag_ids ?? []).filter((item) => item !== id),
            })
          }
          searchFn={async (query) => {
            const data = await listTags(
              { q: query || undefined, page: 1, page_size: 20 },
              clientFetch,
            );
            return data.items.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.tag_type,
            }));
          }}
        />
      </div>
    </div>
  );
}

function FilterBarFallback() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
      Loading filters...
    </div>
  );
}

export function FilterBar() {
  return (
    <Suspense fallback={<FilterBarFallback />}>
      <FilterBarContent />
    </Suspense>
  );
}
