"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  EntityFormDialog,
  type EntityFieldDef,
} from "@/components/admin/entity-form-dialog";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput } from "@/components/filters/search-input";
import { ApiError } from "@/lib/api/client";
import type { PaginatedResponse } from "@/lib/api/types";

interface EntityManagerProps<
  T,
  TCreatePayload = Record<string, unknown>,
  TUpdatePayload = TCreatePayload,
> {
  title: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage?: string;
  columns: DataTableColumn<T>[];
  fields: EntityFieldDef[];
  listItems: (params: {
    q?: string;
    page: number;
    page_size: number;
  }) => Promise<PaginatedResponse<T>>;
  createItem: (payload: TCreatePayload) => Promise<unknown>;
  updateItem: (id: number, payload: TUpdatePayload) => Promise<unknown>;
  deleteItem: (id: number) => Promise<void>;
  getItemId: (item: T) => number;
  getItemName: (item: T) => string;
  toFormValues: (item: T | null) => Record<string, string>;
  toCreatePayload: (values: Record<string, string>) => TCreatePayload;
  toUpdatePayload: (
    values: Record<string, string>,
    item: T,
  ) => TUpdatePayload;
}

interface EntityManagerFallbackProps {
  title: string;
  description: string;
}

function EntityManagerFallback({
  title,
  description,
}: EntityManagerFallbackProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button type="button" disabled>
          Create
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Loading records...</p>
    </div>
  );
}

function EntityManagerContent<
  T,
  TCreatePayload = Record<string, unknown>,
  TUpdatePayload = TCreatePayload,
>({
  title,
  description,
  searchPlaceholder,
  emptyMessage,
  columns,
  fields,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  getItemId,
  getItemName,
  toFormValues,
  toCreatePayload,
  toUpdatePayload,
}: EntityManagerProps<T, TCreatePayload, TUpdatePayload>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSeed, setDialogSeed] = useState(0);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listItems({ q, page, page_size: pageSize });
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.detail : "Failed to load records.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [listItems, page, q, reloadKey]);

  const dialogTitle = useMemo(
    () => (editingItem ? `Edit ${title}` : `Create ${title}`),
    [editingItem, title],
  );

  function openCreate() {
    setEditingItem(null);
    setFormValues(toFormValues(null));
    setDialogError(null);
    setDialogSeed((value) => value + 1);
    setDialogOpen(true);
  }

  function openEdit(item: T) {
    setEditingItem(item);
    setFormValues(toFormValues(item));
    setDialogError(null);
    setDialogSeed((value) => value + 1);
    setDialogOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setDialogError(null);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateItem(
          getItemId(editingItem),
          toUpdatePayload(formValues, editingItem),
        );
      } else {
        await createItem(toCreatePayload(formValues));
      }
      setDialogOpen(false);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setDialogError(
        error instanceof ApiError ? error.detail : "Failed to save record.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: T) {
    const name = getItemName(item);
    if (!window.confirm(`Delete ${name}?`)) {
      return;
    }

    try {
      await deleteItem(getItemId(item));
      if (items.length === 1 && page > 1) {
        const next = new URLSearchParams(searchParams.toString());
        if (page - 1 <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(page - 1));
        }
        router.push(`${pathname}?${next.toString()}`);
      } else {
        setReloadKey((value) => value + 1);
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to delete record.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button type="button" onClick={openCreate}>
          Create
        </Button>
      </div>

      <SearchInput placeholder={searchPlaceholder} />

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowKey={(item) => getItemId(item)}
        emptyMessage={emptyMessage}
        actions={(item) => (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEdit(item)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleDelete(item)}
            >
              Delete
            </Button>
          </>
        )}
      />

      <Pagination total={total} page={page} pageSize={pageSize} />

      <EntityFormDialog
        key={`${editingItem ? `edit-${getItemId(editingItem)}` : "create"}-${dialogSeed}`}
        open={dialogOpen}
        title={dialogTitle}
        description={editingItem
          ? `Update ${title.toLowerCase()} details.`
          : `Create a new ${title.toLowerCase()}.`}
        fields={fields}
        values={formValues}
        errorMessage={dialogError}
        submitting={submitting}
        submitLabel={editingItem ? "Save changes" : "Create"}
        onOpenChange={handleOpenChange}
        onValueChange={(name, value) =>
          setFormValues((prev) => ({ ...prev, [name]: value }))
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function EntityManager<
  T,
  TCreatePayload = Record<string, unknown>,
  TUpdatePayload = TCreatePayload,
>(props: EntityManagerProps<T, TCreatePayload, TUpdatePayload>) {
  return (
    <Suspense
      fallback={
        <EntityManagerFallback
          title={props.title}
          description={props.description}
        />
      }
    >
      <EntityManagerContent {...props} />
    </Suspense>
  );
}
