"use client";

import { coserAvatarUrl } from "@/lib/api";

export default function CoserAvatar({
  coserId,
  coserName,
}: {
  coserId: number;
  coserName: string;
}) {
  return (
    <div className="h-20 w-20 overflow-hidden rounded-full bg-[var(--border)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coserAvatarUrl(coserId)}
        alt={coserName}
        className="h-full w-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
        loading="lazy"
      />
    </div>
  );
}
