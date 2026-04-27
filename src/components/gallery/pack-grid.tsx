import type { PackListItem } from "@/lib/api/types";
import { PackCard } from "./pack-card";

interface PackGridProps {
  items: PackListItem[];
}

export function PackGrid({ items }: PackGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No packs found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((pack) => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}
