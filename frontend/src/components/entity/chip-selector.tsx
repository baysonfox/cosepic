"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

export interface ChipSelectorItem {
  id: number;
  name: string;
  meta?: string | null;
}

interface ChipSelectorProps {
  label: string;
  selectedItems: ChipSelectorItem[];
  onAdd: (item: ChipSelectorItem) => void;
  onRemove: (id: number) => void;
  searchFn: (query: string) => Promise<ChipSelectorItem[]>;
}

export function ChipSelector({
  label,
  selectedItems,
  onAdd,
  onRemove,
  searchFn,
}: ChipSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChipSelectorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((item) => item.id)),
    [selectedItems],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      try {
        const items = await searchFn(debouncedQuery.trim());
        if (!cancelled) {
          setResults(items.filter((item) => !selectedIds.has(item.id)));
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, searchFn, selectedIds]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  }

  function handleSelect(item: ChipSelectorItem) {
    onAdd(item);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selectedItems.length > 0 ? (
          selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="outline"
              className="h-auto gap-1 rounded-md px-2 py-1"
            >
              <span>{item.name}</span>
              {item.meta && (
                <span className="text-[10px] text-muted-foreground">
                  {item.meta}
                </span>
              )}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No {label.toLowerCase()}.</div>
        )}

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger render={<Button variant="outline" size="sm" />}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command shouldFilter={false}>
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={`Search ${label.toLowerCase()}...`}
              />
              <CommandList>
                {loading ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup>
                      {results.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.id}-${item.name}`}
                          onSelect={() => handleSelect(item)}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{item.name}</span>
                            {item.meta && (
                              <span className="text-xs text-muted-foreground">
                                {item.meta}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
