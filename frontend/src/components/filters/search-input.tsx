"use client";

import { Search } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  paramName?: string;
  placeholder?: string;
}

function SearchInputContent({
  paramName = "q",
  placeholder = "Search...",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(currentValue);
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  useEffect(() => {
    if (debounced === currentValue) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    if (debounced) {
      next.set(paramName, debounced);
    } else {
      next.delete(paramName);
    }
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [currentValue, debounced, paramName, pathname, router, searchParams]);

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

function SearchInputFallback({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder={placeholder} className="pl-9" disabled />
    </div>
  );
}

export function SearchInput({
  paramName = "q",
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <Suspense fallback={<SearchInputFallback placeholder={placeholder} />}>
      <SearchInputContent
        paramName={paramName}
        placeholder={placeholder}
      />
    </Suspense>
  );
}
