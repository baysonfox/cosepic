import Link from "next/link";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput } from "@/components/filters/search-input";
import { serverFetch } from "@/lib/api/client";
import { listCharacters } from "@/lib/api/characters";

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.page_size === "string"
    ? Number(params.page_size) || 20
    : 20;

  const data = await listCharacters(
    { q, page, page_size: pageSize },
    serverFetch,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Characters</h1>
        <p className="text-sm text-muted-foreground">
          Browse characters linked to your packs.
        </p>
      </div>

      <SearchInput placeholder="Search characters..." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((character) => (
          <Link
            key={character.id}
            href={`/characters/${character.id}`}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent"
          >
            <div className="font-medium">{character.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {character.work_name ?? "No work"} · {character.pack_count} packs
            </div>
          </Link>
        ))}
      </div>

      <Pagination total={data.total} page={page} pageSize={pageSize} />
    </div>
  );
}
