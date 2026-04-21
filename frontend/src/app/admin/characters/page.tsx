"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import type { EntityFieldDef } from "@/components/admin/entity-form-dialog";
import { clientFetch } from "@/lib/api/client";
import {
  createCharacter,
  deleteCharacter,
  listCharacters,
  updateCharacter,
} from "@/lib/api/characters";
import { listWorks } from "@/lib/api/works";
import type {
  CharacterCreate,
  CharacterOut,
  CharacterUpdate,
  WorkOut,
} from "@/lib/api/types";
import {
  formatCharacterDisplayName,
  formatCharacterMeta,
} from "@/lib/utils";

const columns: DataTableColumn<CharacterOut>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => formatCharacterDisplayName(item.name, item.work_name),
  },
  {
    key: "work",
    header: "Work",
    render: (item) => formatCharacterMeta(item.name, item.work_name) ?? "—",
  },
  {
    key: "packs",
    header: "Packs",
    className: "w-24",
    render: (item) => item.pack_count,
  },
];

export default function AdminCharactersPage() {
  const [works, setWorks] = useState<WorkOut[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorks() {
      const data = await listWorks({ page: 1, page_size: 200 }, clientFetch);
      if (!cancelled) {
        setWorks(data.items);
      }
    }

    void loadWorks();

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
        placeholder: "Enter character name",
      },
      {
        name: "work_id",
        label: "Work",
        type: "select",
        placeholder: "No work",
        options: [
          { label: "No work", value: "" },
          ...works.map((work) => ({ label: work.name, value: String(work.id) })),
        ],
      },
    ],
    [works],
  );

  return (
    <EntityManager<CharacterOut, CharacterCreate, CharacterUpdate>
      title="Characters"
      description="Manage character records and their work links."
      searchPlaceholder="Search characters..."
      columns={columns}
      fields={fields}
      listItems={(params) => listCharacters(params, clientFetch)}
      createItem={(payload) => createCharacter(payload, clientFetch)}
      updateItem={(id, payload) => updateCharacter(id, payload, clientFetch)}
      deleteItem={(id) => deleteCharacter(id, clientFetch)}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={(item) => ({
        name: item?.name ?? "",
        work_id: item?.work_id ? String(item.work_id) : "",
      })}
      toCreatePayload={(values) => {
        const name = values.name.trim();
        if (values.work_id === "") {
          return { name };
        }
        return {
          name,
          work_id: Number(values.work_id),
        };
      }}
      toUpdatePayload={(values) => ({
        name: values.name.trim(),
        work_id:
          values.work_id === "" ? null : Number(values.work_id),
      })}
    />
  );
}
