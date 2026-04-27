import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { PackGrid } from "@/components/gallery/pack-grid";
import { CoserAvatar } from "@/components/entity/coser-avatar";
import { serverFetch } from "@/lib/api/client";
import { getCoser } from "@/lib/api/cosers";
import { listPacks } from "@/lib/api/packs";

export default async function CoserDetailPage(
  props: PageProps<"/cosers/[id]">,
) {
  const { id } = await props.params;
  const coserId = Number(id);
  const [coser, packs] = await Promise.all([
    getCoser(coserId, serverFetch),
    listPacks({ coser_ids: [coserId], page_size: 100 }, serverFetch),
  ]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Cosers", href: "/cosers" },
          { label: coser.name },
        ]}
      />

      <section className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <CoserAvatar name={coser.name} size="lg" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{coser.name}</h1>
          <div className="text-sm text-muted-foreground">
            {coser.pack_count} packs
          </div>
          {coser.aliases.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Aliases: {coser.aliases.join(", ")}
            </div>
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
