import Link from "next/link";
import {
  ChipSelector,
  type ChipSelectorItem,
} from "@/components/entity/chip-selector";
import { Badge } from "@/components/ui/badge";
import type { PackOut } from "@/lib/api/types";

interface PackMetadataProps {
  pack: PackOut;
  editing?: boolean;
  cosers?: ChipSelectorItem[];
  characters?: ChipSelectorItem[];
  outfits?: ChipSelectorItem[];
  tags?: ChipSelectorItem[];
  onAddCoser?: (item: ChipSelectorItem) => void;
  onRemoveCoser?: (id: number) => void;
  onAddCharacter?: (item: ChipSelectorItem) => void;
  onRemoveCharacter?: (id: number) => void;
  onAddOutfit?: (item: ChipSelectorItem) => void;
  onRemoveOutfit?: (id: number) => void;
  onAddTag?: (item: ChipSelectorItem) => void;
  onRemoveTag?: (id: number) => void;
  searchCosers?: (query: string) => Promise<ChipSelectorItem[]>;
  searchCharacters?: (query: string) => Promise<ChipSelectorItem[]>;
  searchOutfits?: (query: string) => Promise<ChipSelectorItem[]>;
  searchTags?: (query: string) => Promise<ChipSelectorItem[]>;
}

interface MetadataDisplayItem {
  id: number;
  name: string;
  href?: string;
  extra?: string | null;
}

function MetadataRow({
  label,
  items,
}: {
  label: string;
  items: MetadataDisplayItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const badge = (
            <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1">
              <span>{item.name}</span>
              {item.extra && (
                <span className="text-[10px] text-muted-foreground">
                  {item.extra}
                </span>
              )}
            </Badge>
          );

          if (!item.href) {
            return <div key={item.id}>{badge}</div>;
          }

          return (
            <Link key={item.id} href={item.href}>
              {badge}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MetadataEditRow({
  label,
  selectedItems,
  onAdd,
  onRemove,
  searchFn,
}: {
  label: string;
  selectedItems: ChipSelectorItem[];
  onAdd: (item: ChipSelectorItem) => void;
  onRemove: (id: number) => void;
  searchFn: (query: string) => Promise<ChipSelectorItem[]>;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <ChipSelector
        label={label}
        selectedItems={selectedItems}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    </div>
  );
}

function mapCosers(pack: PackOut): ChipSelectorItem[] {
  return pack.cosers.map((item) => ({
    id: item.id,
    name: item.name,
    meta: item.is_primary ? "primary" : null,
  }));
}

function mapCharacters(pack: PackOut): ChipSelectorItem[] {
  return pack.characters.map((item) => ({
    id: item.id,
    name: item.name,
    meta: item.work_name,
  }));
}

function mapOutfits(pack: PackOut): ChipSelectorItem[] {
  return pack.outfits.map((item) => ({
    id: item.id,
    name: item.name,
    meta: item.character_name,
  }));
}

function mapTags(pack: PackOut): ChipSelectorItem[] {
  return pack.tags.map((item) => ({
    id: item.id,
    name: item.name,
    meta: item.tag_type,
  }));
}

export function PackMetadata({
  pack,
  editing = false,
  cosers,
  characters,
  outfits,
  tags,
  onAddCoser,
  onRemoveCoser,
  onAddCharacter,
  onRemoveCharacter,
  onAddOutfit,
  onRemoveOutfit,
  onAddTag,
  onRemoveTag,
  searchCosers,
  searchCharacters,
  searchOutfits,
  searchTags,
}: PackMetadataProps) {
  if (editing) {
    return (
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <MetadataEditRow
          label="Cosers"
          selectedItems={cosers ?? mapCosers(pack)}
          onAdd={onAddCoser ?? (() => undefined)}
          onRemove={onRemoveCoser ?? (() => undefined)}
          searchFn={searchCosers ?? (async () => [])}
        />

        <MetadataEditRow
          label="Characters"
          selectedItems={characters ?? mapCharacters(pack)}
          onAdd={onAddCharacter ?? (() => undefined)}
          onRemove={onRemoveCharacter ?? (() => undefined)}
          searchFn={searchCharacters ?? (async () => [])}
        />

        <MetadataEditRow
          label="Outfits"
          selectedItems={outfits ?? mapOutfits(pack)}
          onAdd={onAddOutfit ?? (() => undefined)}
          onRemove={onRemoveOutfit ?? (() => undefined)}
          searchFn={searchOutfits ?? (async () => [])}
        />

        <MetadataEditRow
          label="Tags"
          selectedItems={tags ?? mapTags(pack)}
          onAdd={onAddTag ?? (() => undefined)}
          onRemove={onRemoveTag ?? (() => undefined)}
          searchFn={searchTags ?? (async () => [])}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <MetadataRow
        label="Cosers"
        items={pack.cosers.map((item) => ({
          id: item.id,
          name: item.name,
          href: `/cosers/${item.id}`,
          extra: item.is_primary ? "primary" : null,
        }))}
      />

      <MetadataRow
        label="Characters"
        items={pack.characters.map((item) => ({
          id: item.id,
          name: item.name,
          href: `/characters/${item.id}`,
          extra: item.work_name,
        }))}
      />

      <MetadataRow
        label="Outfits"
        items={pack.outfits.map((item) => ({
          id: item.id,
          name: item.name,
          extra: item.character_name,
        }))}
      />

      <MetadataRow
        label="Tags"
        items={pack.tags.map((item) => ({
          id: item.id,
          name: item.name,
          extra: item.tag_type,
        }))}
      />
    </section>
  );
}
