"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/filters/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput placeholder="Search packs..." />

      <Select
        value={searchParams.get("has_video") ?? "all"}
        onValueChange={(value) => setParam("has_video", value)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Has video" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All media</SelectItem>
          <SelectItem value="true">With video</SelectItem>
          <SelectItem value="false">Photos only</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") ?? "created_at"}
        onValueChange={(value) => setParam("sort", value)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Newest</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="photo_count">Photo count</SelectItem>
          <SelectItem value="total_size_bytes">File size</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("order") ?? "desc"}
        onValueChange={(value) => setParam("order", value)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Descending</SelectItem>
          <SelectItem value="asc">Ascending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
