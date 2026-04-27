import Link from "next/link";
import type { PackListItem } from "@/lib/api/types";
import { serverThumbnailUrl } from "@/lib/api/assets";
import { CoserAvatar } from "@/components/entity/coser-avatar";
import { LazyImage } from "@/components/media/lazy-image";
import {
  formatCharacterDisplayName,
  formatCharacterMeta,
} from "@/lib/utils";

interface PackCardProps {
  pack: PackListItem;
}

export function PackCard({ pack }: PackCardProps) {
  const primaryCoser = pack.cosers.find((c) => c.is_primary) ?? pack.cosers[0];
  const primaryChar = pack.characters.find((c) => c.is_primary) ?? pack.characters[0];
  const primaryCharName = primaryChar
    ? formatCharacterDisplayName(primaryChar.name, primaryChar.work_name)
    : null;
  const primaryCharMeta = primaryChar
    ? formatCharacterMeta(primaryChar.name, primaryChar.work_name)
    : null;

  const coverSrc = pack.cover_asset_id
    ? serverThumbnailUrl(pack.cover_asset_id)
    : undefined;

  return (
    <Link href={`/packs/${pack.id}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-accent">
        {/* Cover image */}
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={pack.title}
            className="w-full"
            aspectRatio="3/4"
          />
        ) : (
          <div
            className="w-full bg-muted flex items-center justify-center text-muted-foreground text-sm"
            style={{ aspectRatio: "3/4" }}
          >
            No cover
          </div>
        )}

        {/* Card body */}
        <div className="p-3 space-y-1.5">
          {/* Title */}
          <h3 className="font-medium text-sm leading-tight truncate">
            {pack.title}
          </h3>

          {/* Work / Character info */}
          {primaryChar && (
            <p className="text-xs text-muted-foreground truncate">
              {primaryCharMeta && (
                <span className="text-primary/80">{primaryCharMeta}</span>
              )}
              {primaryCharMeta && " · "}
              {primaryCharName}
            </p>
          )}

          {/* Bottom row: coser + photo count */}
          <div className="flex items-center justify-between pt-1">
            {primaryCoser ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <CoserAvatar name={primaryCoser.name} size="sm" />
                <span className="text-xs text-muted-foreground truncate">
                  {primaryCoser.name}
                </span>
              </div>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              {pack.photo_count}P
              {pack.video_count > 0 && ` ${pack.video_count}V`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
