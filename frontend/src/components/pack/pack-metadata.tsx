import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PackOut } from "@/lib/api/types";

interface PackMetadataProps {
  pack: PackOut;
}

function MetadataRow({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: number; name: string; href: string; extra?: string | null }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1">
              <span>{item.name}</span>
              {item.extra && (
                <span className="text-[10px] text-muted-foreground">
                  {item.extra}
                </span>
              )}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PackMetadata({ pack }: PackMetadataProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <MetadataRow
        label="Cosers"
        items={pack.cosers.map((item) => ({
          id: item.id,
          name: item.name,
          href: `/cosers/${item.id}`,
          extra: item.is_primary ? "primary" : null,
        }))}
      />

      <MetadataRow
        label="Characters"
        items={pack.characters.map((item) => ({
          id: item.id,
          name: item.name,
          href: `/characters/${item.id}`,
          extra: item.work_name,
        }))}
      />

      <MetadataRow
        label="Outfits"
        items={pack.outfits.map((item) => ({
          id: item.id,
          name: item.name,
          href: "#",
          extra: item.character_name,
        }))}
      />

      <MetadataRow
        label="Tags"
        items={pack.tags.map((item) => ({
          id: item.id,
          name: item.name,
          href: "#",
          extra: item.tag_type,
        }))}
      />
    </section>
  );
}
