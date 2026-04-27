"use client";

import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import { clientFetch } from "@/lib/api/client";
import {
  createCoser,
  deleteCoser,
  listCosers,
  updateCoser,
} from "@/lib/api/cosers";
import type { CoserCreate, CoserOut, CoserUpdate } from "@/lib/api/types";

const columns: DataTableColumn<CoserOut>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.name,
  },
  {
    key: "aliases",
    header: "Aliases",
    render: (item) => item.aliases.join(", ") || "—",
  },
  {
    key: "packs",
    header: "Packs",
    className: "w-24",
    render: (item) => item.pack_count,
  },
];

export default function AdminCosersPage() {
  return (
    <EntityManager<CoserOut, CoserCreate, CoserUpdate>
      title="Cosers"
      description="Create, update, and remove coser records."
      searchPlaceholder="Search cosers..."
      columns={columns}
      fields={[
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Enter coser name",
        },
      ]}
      listItems={(params) => listCosers(params, clientFetch)}
      createItem={(payload) => createCoser(payload, clientFetch)}
      updateItem={(id, payload) => updateCoser(id, payload, clientFetch)}
      deleteItem={(id) => deleteCoser(id, clientFetch)}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={(item) => ({ name: item?.name ?? "" })}
      toCreatePayload={(values) => ({ name: values.name.trim() })}
      toUpdatePayload={(values) => ({ name: values.name.trim() })}
    />
  );
}
