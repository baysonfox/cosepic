"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ImportCandidateOut,
  ImportCandidateUpdate,
} from "@/lib/api/types";
import {
  ORIGINAL_CHARACTER_NAME,
  ORIGINAL_WORK_NAME,
  formatImportCharacterNames,
} from "@/lib/utils";

interface ImportCandidateEditorProps {
  candidate: ImportCandidateOut;
  saving: boolean;
  onSave: (update: ImportCandidateUpdate) => Promise<void> | void;
}

export function ImportCandidateEditor({
  candidate,
  saving,
  onSave,
}: ImportCandidateEditorProps) {
  const [title, setTitle] = useState(candidate.detected_title ?? "");
  const [cosers, setCosers] = useState(candidate.detected_coser_names ?? "");
  const [work, setWork] = useState(candidate.detected_work_name ?? "");
  const [characters, setCharacters] = useState(
    formatImportCharacterNames(
      candidate.detected_work_name,
      candidate.detected_character_names,
    ) ?? "",
  );
  const [status, setStatus] = useState(candidate.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(candidate.detected_title ?? "");
    setCosers(candidate.detected_coser_names ?? "");
    setWork(candidate.detected_work_name ?? "");
    setCharacters(
      formatImportCharacterNames(
        candidate.detected_work_name,
        candidate.detected_character_names,
      ) ?? "",
    );
    setStatus(candidate.status);
    setError(null);
  }, [candidate]);

  const hasChanges = useMemo(
    () =>
      title !== (candidate.detected_title ?? "") ||
      cosers !== (candidate.detected_coser_names ?? "") ||
      work !== (candidate.detected_work_name ?? "") ||
      characters !==
        (formatImportCharacterNames(
          candidate.detected_work_name,
          candidate.detected_character_names,
        ) ?? "") ||
      status !== candidate.status,
    [candidate, characters, cosers, status, title, work],
  );

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setError(null);
    await onSave({
      detected_title: trimmedTitle,
      detected_coser_names: cosers.trim() || null,
      detected_work_name: work.trim() || null,
      detected_character_names:
        work.trim() === ORIGINAL_WORK_NAME
          ? ORIGINAL_CHARACTER_NAME
          : characters.trim() || null,
      status,
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Title</span>
          <Input
            aria-label="Candidate title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pack title"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <Select
            value={status}
            onValueChange={(value) => setStatus(String(value ?? "pending"))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="selected">selected</SelectItem>
              <SelectItem value="imported">imported</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium">Coser names</span>
        <Input
          aria-label="Candidate coser names"
          value={cosers}
          onChange={(event) => setCosers(event.target.value)}
          placeholder="Comma-separated coser names"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium">Work name</span>
        <Input
          aria-label="Candidate work name"
          value={work}
          onChange={(event) => setWork(event.target.value)}
          placeholder="Work name"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium">Character names</span>
        <Textarea
          aria-label="Candidate character names"
          value={characters}
          onChange={(event) => setCharacters(event.target.value)}
          placeholder="Comma-separated character or character outfit names"
          rows={3}
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? "Unsaved changes" : "No local changes"}
        </div>
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Saving..." : "Apply"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
