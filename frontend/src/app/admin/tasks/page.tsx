"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Pagination } from "@/components/filters/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, clientFetch } from "@/lib/api/client";
import { listTasks } from "@/lib/api/tasks";
import { cn } from "@/lib/utils";
import type { TaskOut } from "@/lib/api/types";

const PAGE_SIZE = 20;
const ACTIVE_STATUSES = new Set(["pending", "running"]);
const STATUS_OPTIONS = ["all", "pending", "running", "done", "failed"] as const;

function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "pending" && "border-amber-500/40 text-amber-600",
        status === "running" && "border-sky-500/40 text-sky-600",
        status === "done" && "border-emerald-500/40 text-emerald-600",
        status === "failed" && "border-destructive/40 text-destructive",
      )}
    >
      {status}
    </Badge>
  );
}

function AdminTasksPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TaskOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const statusFilter = searchParams.get("status") || "all";

  const hasActiveTasks = useMemo(
    () => tasks.some((task) => ACTIVE_STATUSES.has(task.status)),
    [tasks],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await listTasks(
          {
            status: statusFilter === "all" ? undefined : statusFilter,
            page,
            page_size: PAGE_SIZE,
          },
          clientFetch,
        );
        if (!cancelled) {
          setTasks(response.items);
          setTotal(response.total);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.detail : "Failed to load tasks.",
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
  }, [page, statusFilter]);

  useEffect(() => {
    if (!hasActiveTasks) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        const response = await listTasks(
          {
            status: statusFilter === "all" ? undefined : statusFilter,
            page,
            page_size: PAGE_SIZE,
          },
          clientFetch,
        );
        setTasks(response.items);
        setTotal(response.total);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof ApiError ? error.detail : "Failed to refresh tasks.",
        );
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [hasActiveTasks, page, statusFilter]);

  useEffect(() => {
    if (expandedId !== null && !tasks.some((task) => task.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, tasks]);

  function updateFilters(nextStatus: string | null) {
    if (!nextStatus) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") {
      next.delete("status");
    } else {
      next.set("status", nextStatus);
    }
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const columns: DataTableColumn<TaskOut>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-20",
      render: (task) => task.id,
    },
    {
      key: "task_type",
      header: "Task",
      render: (task) => task.task_type,
    },
    {
      key: "target",
      header: "Target",
      render: (task) =>
        task.target_type && task.target_id !== null
          ? `${task.target_type} #${task.target_id}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (task) => <TaskStatusBadge status={task.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Monitor background work and inspect failures from the admin area.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end md:justify-between">
        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <Select value={statusFilter} onValueChange={updateFilters}>
            <SelectTrigger className="w-48" aria-label="Task status filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="text-sm text-muted-foreground">
          {hasActiveTasks ? "Auto-refreshing every 5s" : "Auto-refresh paused"}
        </div>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        getRowKey={(task) => task.id}
        emptyMessage="No tasks found."
        actions={(task) =>
          task.error_message ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() =>
                setExpandedId((current) => (current === task.id ? null : task.id))
              }
            >
              <AlertCircle className="h-4 w-4" />
              {expandedId === task.id ? "Hide error" : "Show error"}
            </button>
          ) : null
        }
      />

      {expandedId !== null && tasks.some((task) => task.id === expandedId) && (
        <Card>
          <CardHeader>
            <CardTitle>Error details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tasks
              .filter((task) => task.id === expandedId)
              .map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="text-muted-foreground">
                    Task #{task.id} · {task.task_type}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-xs">
                    {task.error_message}
                  </pre>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}

function AdminTasksPageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Monitor background work and inspect failures from the admin area.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">Loading tasks...</p>
    </div>
  );
}

export default function AdminTasksPage() {
  return (
    <Suspense fallback={<AdminTasksPageFallback />}>
      <AdminTasksPageContent />
    </Suspense>
  );
}
