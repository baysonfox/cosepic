"use client";

import { useEffect, useState } from "react";
import { Images, Package, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientFetch, ApiError } from "@/lib/api/client";
import { getStats } from "@/lib/api/system";
import type { SystemStats } from "@/lib/api/types";
import { formatBytes } from "@/lib/utils";

const CARDS = [
  { key: "packs", label: "Packs", icon: Package },
  { key: "assets", label: "Assets", icon: Images },
  { key: "cosers", label: "Cosers", icon: Users },
  { key: "works", label: "Works", icon: BookOpen },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await getStats(clientFetch);
        if (!cancelled) {
          setStats(next);
          setError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof ApiError ? error.detail : "Failed to load stats.",
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of the local Cosepic library.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats ? stats[card.key] : "—";
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? formatBytes(stats.total_size_bytes) : "—"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
