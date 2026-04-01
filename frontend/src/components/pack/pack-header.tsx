import type { ReactNode } from "react";
import { Camera, Clapperboard, Folder, HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PackOut } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface PackHeaderProps {
  pack: PackOut;
  editing?: boolean;
  title?: string;
  description?: string;
  onTitleChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  actions?: ReactNode;
  errorMessage?: string | null;
}

export function PackHeader({
  pack,
  editing = false,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  actions,
  errorMessage,
}: PackHeaderProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={title ?? pack.title}
                onChange={(event) => onTitleChange?.(event.target.value)}
                placeholder="Pack title"
                aria-label="Pack title"
              />
              <Textarea
                value={description ?? pack.description ?? ""}
                onChange={(event) => onDescriptionChange?.(event.target.value)}
                placeholder="Description"
                aria-label="Pack description"
                rows={4}
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">{pack.title}</h1>
              {pack.description && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {pack.description}
                </p>
              )}
            </>
          )}
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

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

      <div className="text-xs break-all text-muted-foreground">{pack.dir_path}</div>
    </section>
  );
}
