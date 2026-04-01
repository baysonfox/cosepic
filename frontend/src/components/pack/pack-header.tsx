import { Camera, Clapperboard, Folder, HardDrive } from "lucide-react";
import type { PackOut } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface PackHeaderProps {
  pack: PackOut;
}

export function PackHeader({ pack }: PackHeaderProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{pack.title}</h1>
        {pack.description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {pack.description}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Photos</div>
            <div className="text-sm font-medium">{pack.photo_count}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
          <Clapperboard className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Videos</div>
            <div className="text-sm font-medium">{pack.video_count}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Size</div>
            <div className="text-sm font-medium">
              {formatBytes(pack.total_size_bytes)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Added</div>
            <div className="text-sm font-medium">{formatDate(pack.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground break-all">
        {pack.dir_path}
      </div>
    </section>
  );
}
