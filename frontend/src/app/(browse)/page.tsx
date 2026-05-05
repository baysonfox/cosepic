import Link from "next/link";
import { serverFetch } from "@/lib/api/client";
import { listPacks } from "@/lib/api/packs";
import { PackGrid } from "@/components/gallery/pack-grid";

export default async function HomePage() {
  let data;
  try {
    data = await listPacks(
      { sort: "created_at", order: "desc", page_size: 20 },
      serverFetch,
    );
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Recent Packs</h1>
        <p className="text-muted-foreground">
          Unable to connect to backend. Make sure the server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent Packs</h1>
        <Link
          href="/packs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all &rarr;
        </Link>
      </div>

      <PackGrid items={data.items} />
    </div>
  );
}
