"use client";

import { useMemo } from "react";
import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import type { EntityFieldDef } from "@/components/admin/entity-form-dialog";
import { clientFetch } from "@/lib/api/client";
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from "@/lib/api/tags";
import type { TagCreate, TagOut, TagUpdate } from "@/lib/api/types";

const columns: DataTableColumn<TagOut>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.name,
  },
  {
    key: "type",
    header: "Type",
    render: (item) => item.tag_type,
  },
  {
    key: "packs",
    header: "Packs",
    className: "w-24",
    render: (item) => item.pack_count,
  },
];

const TAG_TYPE_OPTIONS = [
  { label: "Other", value: "other" },
  { label: "Style", value: "style" },
  { label: "Genre", value: "genre" },
];

export default function AdminTagsPage() {
  const fields: EntityFieldDef[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "Enter tag name",
      },
      {
        name: "tag_type",
        label: "Type",
        type: "select",
        required: true,
        options: TAG_TYPE_OPTIONS,
      },
    ],
    [],
  );

  return (
    <EntityManager<TagOut, TagCreate, TagUpdate>
      title="Tags"
      description="Manage reusable pack tags."
      searchPlaceholder="Search tags..."
      columns={columns}
      fields={fields}
      listItems={(params) => listTags(params, clientFetch)}
      createItem={(payload) => createTag(payload, clientFetch)}
      updateItem={(id, payload) => updateTag(id, payload, clientFetch)}
      deleteItem={(id) => deleteTag(id, clientFetch)}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={(item) => ({
        name: item?.name ?? "",
        tag_type: item?.tag_type ?? "other",
      })}
      toCreatePayload={(values) => ({
        name: values.name.trim(),
        tag_type: values.tag_type || "other",
      })}
      toUpdatePayload={(values) => ({
        name: values.name.trim(),
        tag_type: values.tag_type || "other",
      })}
    />
  );
}
