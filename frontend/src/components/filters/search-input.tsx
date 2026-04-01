"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchInputProps {
  paramName?: string;
  placeholder?: string;
}

export function SearchInput({
  paramName = "q",
  placeholder = "Search...",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (debounced) {
      next.set(paramName, debounced);
    } else {
      next.delete(paramName);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }, [debounced, paramName, pathname, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
