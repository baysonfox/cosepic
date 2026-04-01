import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { PackGrid } from "@/components/gallery/pack-grid";
import { serverFetch } from "@/lib/api/client";
import { getCharacter } from "@/lib/api/characters";
import { listOutfits } from "@/lib/api/outfits";
import { listPacks } from "@/lib/api/packs";

export default async function CharacterDetailPage(
  props: PageProps<"/characters/[id]">,
) {
  const { id } = await props.params;
  const characterId = Number(id);
  const [character, outfits, packs] = await Promise.all([
    getCharacter(characterId, serverFetch),
    listOutfits({ character_id: characterId, page_size: 100 }, serverFetch),
    listPacks({ character_ids: [characterId], page_size: 100 }, serverFetch),
  ]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Characters", href: "/characters" },
          { label: character.name },
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-2xl font-bold">{character.name}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {character.work_name ?? "No work"} · {character.pack_count} packs
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Outfits</h2>
        <div className="flex flex-wrap gap-2">
          {outfits.items.length > 0 ? (
            outfits.items.map((outfit) => (
              <span
                key={outfit.id}
                className="rounded-md bg-muted px-3 py-1.5 text-sm"
              >
                {outfit.name}
              </span>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No outfits</div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Packs</h2>
        <PackGrid items={packs.items} />
      </section>
    </div>
  );
}
