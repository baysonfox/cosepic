import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { PackGrid } from "@/components/gallery/pack-grid";
import { serverFetch } from "@/lib/api/client";
import { listCharacters } from "@/lib/api/characters";
import { listPacks } from "@/lib/api/packs";
import { getWork } from "@/lib/api/works";

export default async function WorkDetailPage(
  props: PageProps<"/works/[id]">,
) {
  const { id } = await props.params;
  const workId = Number(id);
  const [work, characters, packs] = await Promise.all([
    getWork(workId, serverFetch),
    listCharacters({ work_id: workId, page_size: 100 }, serverFetch),
    listPacks({ work_ids: [workId], page_size: 100 }, serverFetch),
  ]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Works", href: "/works" },
          { label: work.name },
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-2xl font-bold">{work.name}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {work.character_count} characters · {work.pack_count} packs
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Characters</h2>
        <div className="flex flex-wrap gap-2">
          {characters.items.map((character) => (
            <span
              key={character.id}
              className="rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              {character.name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Packs</h2>
        <PackGrid items={packs.items} />
      </section>
    </div>
  );
}
