"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function SemanticSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queryText, setQueryText] = useState(searchParams.get("q") || "");
  const [topK, setTopK] = useState(searchParams.get("topK") || "5");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("searchMode", "semantic");
    params.set("q", queryText);
    params.set("topK", topK);
    router.push(`/packs?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="描述你想找的图片..."
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
      />
      <Select value={topK} onValueChange={setTopK}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">Top 5</SelectItem>
          <SelectItem value="10">Top 10</SelectItem>
          <SelectItem value="20">Top 20</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSearch} disabled={isLoading || !queryText.trim()}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
