"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  placeholder: string;
  basePath: string;
  defaultValue?: string;
}

export default function SearchBar({
  placeholder,
  basePath,
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-48 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        搜索
      </button>
    </form>
  );
}
