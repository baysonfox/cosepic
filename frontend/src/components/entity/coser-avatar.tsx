import { cn } from "@/lib/utils";

interface CoserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function CoserAvatar({
  avatarUrl,
  name,
  size = "sm",
  className,
}: CoserAvatarProps) {
  const sizeClass = SIZES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground",
        sizeClass,
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
