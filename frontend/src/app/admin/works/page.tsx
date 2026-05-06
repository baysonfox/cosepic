"use client";

import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import { clientFetch } from "@/lib/api/client";
import {
  createWork,
  deleteOrphanWorks,
  deleteWork,
  listWorks,
  updateWork,
} from "@/lib/api/works";
import type { WorkCreate, WorkOut, WorkUpdate } from "@/lib/api/types";

const columns: DataTableColumn<WorkOut>[] = [
  {
    key: "name",
    header: "Name",
    render: (item) => item.name,
  },
  {
    key: "characters",
    header: "Characters",
    className: "w-28",
    render: (item) => item.character_count,
  },
  {
    key: "packs",
    header: "Packs",
    className: "w-24",
    render: (item) => item.pack_count,
  },
];

export default function AdminWorksPage() {
  return (
    <EntityManager<WorkOut, WorkCreate, WorkUpdate>
      title="Works"
      description="Manage source works and series."
      searchPlaceholder="Search works..."
      columns={columns}
      fields={[
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Enter work name",
        },
      ]}
      listItems={(params) => listWorks(params, clientFetch)}
      createItem={(payload) => createWork(payload, clientFetch)}
      updateItem={(id, payload) => updateWork(id, payload, clientFetch)}
      deleteItem={(id) => deleteWork(id, clientFetch)}
      deleteOrphansItem={() => deleteOrphanWorks(clientFetch)}
      deleteOrphansConfirmMessage="Delete every work whose characters have no pack?"
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={(item) => ({ name: item?.name ?? "" })}
      toCreatePayload={(values) => ({ name: values.name.trim() })}
      toUpdatePayload={(values) => ({ name: values.name.trim() })}
    />
  );
}
