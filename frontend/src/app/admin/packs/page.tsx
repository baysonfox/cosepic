"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput } from "@/components/filters/search-input";
import { buttonVariants, Button } from "@/components/ui/button";
import { ApiError, clientFetch } from "@/lib/api/client";
import { deletePack, listPacks, regeneratePack } from "@/lib/api/packs";
import type { PackListItem } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

const columns: DataTableColumn<PackListItem>[] = [
  {
    key: "title",
    header: "Title",
    render: (item) => item.title,
  },
  {
    key: "cosers",
    header: "Cosers",
    render: (item) => item.cosers.map((coser) => coser.name).join(", ") || "—",
  },
  {
    key: "media",
    header: "Media",
    render: (item) => `${item.photo_count}P ${item.video_count}V`,
  },
  {
    key: "status",
    header: "Status",
    render: (item) => item.status,
  },
  {
    key: "created_at",
    header: "Created",
    render: (item) => formatDate(item.created_at),
  },
];

function AdminPacksPageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Packs</h1>
        <p className="text-sm text-muted-foreground">
          Review packs, regenerate thumbnails, or delete entries.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">Loading packs...</p>
    </div>
  );
}

function AdminPacksPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const [items, setItems] = useState<PackListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listPacks(
          {
            q,
            page,
            page_size: pageSize,
            sort: "created_at",
            order: "desc",
          },
          clientFetch,
        );
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.detail : "Failed to load packs.",
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
  }, [page, q, reloadKey]);

  async function handleDelete(pack: PackListItem) {
    if (!window.confirm(`Delete ${pack.title}?`)) {
      return;
    }

    try {
      await deletePack(pack.id, clientFetch);
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
      setInfoMessage(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to delete pack.",
      );
    }
  }

  async function handleRegenerate(pack: PackListItem) {
    try {
      const result = await regeneratePack(pack.id, clientFetch);
      setInfoMessage(
        `${pack.title}: regenerated ${result.thumbnails_generated} thumbnails.`,
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to regenerate pack.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Packs</h1>
        <p className="text-sm text-muted-foreground">
          Review packs, regenerate thumbnails, or delete entries.
        </p>
      </div>

      <SearchInput placeholder="Search packs..." />

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {infoMessage && <p className="text-sm text-muted-foreground">{infoMessage}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowKey={(item) => item.id}
        emptyMessage="No packs found."
        actions={(item) => (
          <>
            <Link
              href={`/packs/${item.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRegenerate(item)}
            >
              Regenerate
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
    </div>
  );
}

export default function AdminPacksPage() {
  return (
    <Suspense fallback={<AdminPacksPageFallback />}>
      <AdminPacksPageContent />
    </Suspense>
  );
}
