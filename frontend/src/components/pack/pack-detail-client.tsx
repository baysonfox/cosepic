"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChipSelectorItem } from "@/components/entity/chip-selector";
import { AssetGrid } from "@/components/gallery/asset-grid";
import { LightboxWrapper } from "@/components/media/lightbox-wrapper";
import { PackEditControls } from "@/components/pack/pack-edit-controls";
import { PackHeader } from "@/components/pack/pack-header";
import { PackMetadata } from "@/components/pack/pack-metadata";
import { listCharacters } from "@/lib/api/characters";
import { clientFetch, ApiError } from "@/lib/api/client";
import { listCosers } from "@/lib/api/cosers";
import { listOutfits } from "@/lib/api/outfits";
import { updatePack } from "@/lib/api/packs";
import { listTags } from "@/lib/api/tags";
import type { AssetOut, PackOut, TagOut } from "@/lib/api/types";
import {
  formatCharacterDisplayName,
  formatCharacterMeta,
  formatOutfitCharacterName,
} from "@/lib/utils";

interface PackDetailClientProps {
  pack: PackOut;
  assets: AssetOut[];
}

interface PackDraft {
  title: string;
  description: string;
  cover_asset_id: number | null;
  cosers: ChipSelectorItem[];
  characters: ChipSelectorItem[];
  outfits: ChipSelectorItem[];
  tags: ChipSelectorItem[];
}

function mapPackToDraft(pack: PackOut): PackDraft {
  return {
    title: pack.title,
    description: pack.description ?? "",
    cover_asset_id: pack.cover_asset_id,
    cosers: pack.cosers.map((item) => ({
      id: item.id,
      name: item.name,
      meta: item.is_primary ? "primary" : null,
    })),
    characters: pack.characters.map((item) => ({
      id: item.id,
      name: formatCharacterDisplayName(item.name, item.work_name),
      meta: formatCharacterMeta(item.name, item.work_name),
    })),
    outfits: pack.outfits.map((item) => ({
      id: item.id,
      name: item.name,
      meta: formatOutfitCharacterName(item.character_name),
    })),
    tags: pack.tags.map((item) => ({
      id: item.id,
      name: item.name,
      meta: item.tag_type,
    })),
  };
}

function upsertItem(
  items: ChipSelectorItem[],
  nextItem: ChipSelectorItem,
): ChipSelectorItem[] {
  if (items.some((item) => item.id === nextItem.id)) {
    return items;
  }
  return [...items, nextItem];
}

function removeItem(items: ChipSelectorItem[], id: number): ChipSelectorItem[] {
  return items.filter((item) => item.id !== id);
}

function mapTag(item: TagOut): ChipSelectorItem {
  return {
    id: item.id,
    name: item.name,
    meta: item.tag_type,
  };
}

export function PackDetailClient({
  pack,
  assets,
}: PackDetailClientProps) {
  const router = useRouter();
  const [currentPack, setCurrentPack] = useState(pack);
  const [draft, setDraft] = useState(() => mapPackToDraft(pack));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setCurrentPack(pack);
    setDraft(mapPackToDraft(pack));
  }, [pack]);

  const searchCosers = useCallback(async (query: string) => {
    const data = await listCosers({ q: query || undefined, page_size: 20 }, clientFetch);
    return data.items.map((item) => ({ id: item.id, name: item.name }));
  }, []);

  const searchCharacters = useCallback(async (query: string) => {
    const data = await listCharacters(
      { q: query || undefined, page_size: 20 },
      clientFetch,
    );
    return data.items.map((item) => ({
      id: item.id,
      name: formatCharacterDisplayName(item.name, item.work_name),
      meta: formatCharacterMeta(item.name, item.work_name),
    }));
  }, []);

  const searchOutfits = useCallback(async (query: string) => {
    const data = await listOutfits({ q: query || undefined, page_size: 20 }, clientFetch);
    return data.items.map((item) => ({
      id: item.id,
      name: item.name,
      meta: formatOutfitCharacterName(item.character_name),
    }));
  }, []);

  const searchTags = useCallback(async (query: string) => {
    const data = await listTags({ q: query || undefined, page_size: 20 }, clientFetch);
    return data.items.map(mapTag);
  }, []);

  function handleAssetClick(index: number) {
    if (editing) {
      return;
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function handleEdit() {
    setDraft(mapPackToDraft(currentPack));
    setSaveError(null);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(mapPackToDraft(currentPack));
    setSaveError(null);
    setEditing(false);
  }

  async function handleSave() {
    const title = draft.title.trim();
    if (!title) {
      setSaveError("Title is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePack(
        currentPack.id,
        {
          title,
          description: draft.description.trim() || null,
          cover_asset_id: draft.cover_asset_id,
          coser_ids: draft.cosers.map((item) => item.id),
          character_ids: draft.characters.map((item) => item.id),
          outfit_ids: draft.outfits.map((item) => item.id),
          tag_ids: draft.tags.map((item) => item.id),
        },
        clientFetch,
      );
      setCurrentPack(updated);
      setDraft(mapPackToDraft(updated));
      setEditing(false);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.detail);
      } else {
        setSaveError("Failed to save changes.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PackHeader
        pack={currentPack}
        editing={editing}
        title={draft.title}
        description={draft.description}
        onTitleChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
        onDescriptionChange={(value) =>
          setDraft((prev) => ({ ...prev, description: value }))
        }
        actions={
          <PackEditControls
            editing={editing}
            saving={saving}
            onEdit={handleEdit}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
          />
        }
        errorMessage={saveError}
      />

      <PackMetadata
        pack={currentPack}
        editing={editing}
        cosers={draft.cosers}
        characters={draft.characters}
        outfits={draft.outfits}
        tags={draft.tags}
        onAddCoser={(item) =>
          setDraft((prev) => ({
            ...prev,
            cosers: upsertItem(prev.cosers, item),
          }))
        }
        onRemoveCoser={(id) =>
          setDraft((prev) => ({
            ...prev,
            cosers: removeItem(prev.cosers, id),
          }))
        }
        onAddCharacter={(item) =>
          setDraft((prev) => ({
            ...prev,
            characters: upsertItem(prev.characters, item),
          }))
        }
        onRemoveCharacter={(id) =>
          setDraft((prev) => ({
            ...prev,
            characters: removeItem(prev.characters, id),
          }))
        }
        onAddOutfit={(item) =>
          setDraft((prev) => ({
            ...prev,
            outfits: upsertItem(prev.outfits, item),
          }))
        }
        onRemoveOutfit={(id) =>
          setDraft((prev) => ({
            ...prev,
            outfits: removeItem(prev.outfits, id),
          }))
        }
        onAddTag={(item) =>
          setDraft((prev) => ({
            ...prev,
            tags: upsertItem(prev.tags, item),
          }))
        }
        onRemoveTag={(id) =>
          setDraft((prev) => ({
            ...prev,
            tags: removeItem(prev.tags, id),
          }))
        }
        searchCosers={searchCosers}
        searchCharacters={searchCharacters}
        searchOutfits={searchOutfits}
        searchTags={searchTags}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Assets</h2>
          {editing && (
            <p className="text-sm text-muted-foreground">
              Click an asset to set it as the cover.
            </p>
          )}
        </div>
        <AssetGrid
          assets={assets}
          onAssetClick={handleAssetClick}
          editing={editing}
          coverAssetId={draft.cover_asset_id}
          onCoverSelect={(assetId) =>
            setDraft((prev) => ({ ...prev, cover_asset_id: assetId }))
          }
        />
      </section>

      <LightboxWrapper
        assets={assets}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
