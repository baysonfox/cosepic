"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import type { EntityFieldDef } from "@/components/admin/entity-form-dialog";
import { clientFetch } from "@/lib/api/client";
import {
  createOutfit,
  deleteOutfit,
  listOutfits,
  updateOutfit,
} from "@/lib/api/outfits";
import { listCharacters } from "@/lib/api/characters";
import type {
  CharacterOut,
  OutfitCreate,
  OutfitOut,
  OutfitUpdate,
} from "@/lib/api/types";
import {
  formatCharacterDisplayName,
  formatCharacterMeta,
  formatOutfitCharacterName,
} from "@/lib/utils";

const columns: DataTableColumn<OutfitOut>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.name,
  },
  {
    key: "character",
    header: "Character",
    render: (item) => formatOutfitCharacterName(item.character_name) ?? "—",
  },
  {
    key: "packs",
    header: "Packs",
    className: "w-24",
    render: (item) => item.pack_count,
  },
];

export default function AdminOutfitsPage() {
  const [characters, setCharacters] = useState<CharacterOut[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCharacters() {
      const data = await listCharacters({ page: 1, page_size: 200 }, clientFetch);
      if (!cancelled) {
        setCharacters(data.items);
      }
    }

    void loadCharacters();

    return () => {
      cancelled = true;
    };
  }, []);

  const fields: EntityFieldDef[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "Enter outfit name",
      },
      {
        name: "character_id",
        label: "Character",
        type: "select",
        required: true,
        placeholder: "Select character",
        options: characters.map((character) => {
          const displayName = formatCharacterDisplayName(
            character.name,
            character.work_name,
          );
          const displayMeta = formatCharacterMeta(
            character.name,
            character.work_name,
          );
          return {
            label: displayMeta
              ? `${displayName} · ${displayMeta}`
              : displayName,
            value: String(character.id),
          };
        }),
      },
    ],
    [characters],
  );

  return (
    <EntityManager<OutfitOut, OutfitCreate, OutfitUpdate>
      title="Outfits"
      description="Manage outfits and their owning characters."
      searchPlaceholder="Search outfits..."
      columns={columns}
      fields={fields}
      listItems={(params) => listOutfits(params, clientFetch)}
      createItem={(payload) => createOutfit(payload, clientFetch)}
      updateItem={(id, payload) => updateOutfit(id, payload, clientFetch)}
      deleteItem={(id) => deleteOutfit(id, clientFetch)}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={(item) => ({
        name: item?.name ?? "",
        character_id: item?.character_id ? String(item.character_id) : "",
      })}
      toCreatePayload={(values) => ({
        name: values.name.trim(),
        character_id: Number(values.character_id),
      })}
      toUpdatePayload={(values) => ({
        name: values.name.trim(),
        character_id: Number(values.character_id),
      })}
    />
  );
}
