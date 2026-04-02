"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, TriangleAlert } from "lucide-react";
import { ImportCandidateEditor } from "@/components/import/import-candidate-editor";
import { ImportCommitBar } from "@/components/import/import-commit-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ApiError, clientFetch } from "@/lib/api/client";
import {
  commitBatch,
  scanImport,
  updateCandidate,
} from "@/lib/api/imports";
import type {
  ImportBatchOut,
  ImportCandidateOut,
  ImportCandidateUpdate,
  ImportCommitResult,
} from "@/lib/api/types";
import { formatBytes } from "@/lib/utils";

function CandidateStatusBadge({ status }: { status: string }) {
  if (status === "selected") {
    return <Badge>selected</Badge>;
  }
  if (status === "imported") {
    return <Badge variant="secondary">imported</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function CandidatePreview({ candidate }: { candidate: ImportCandidateOut }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Folder:</span> {candidate.folder_name}
      </div>
      <div>
        <span className="font-medium">Title:</span> {candidate.detected_title ?? "—"}
      </div>
      <div>
        <span className="font-medium">Cosers:</span> {candidate.detected_coser_names ?? "—"}
      </div>
      <div>
        <span className="font-medium">Work:</span> {candidate.detected_work_name ?? "—"}
      </div>
      <div>
        <span className="font-medium">Characters:</span> {candidate.detected_character_names ?? "—"}
      </div>
      <div className="text-muted-foreground">
        {candidate.photo_count}P {candidate.video_count}V · {formatBytes(candidate.total_size_bytes)}
      </div>
    </div>
  );
}

export function ImportWizardClient() {
  const [rootPath, setRootPath] = useState("");
  const [batch, setBatch] = useState<ImportBatchOut | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  const selectedCount = useMemo(
    () => batch?.candidates.filter((candidate) => candidate.status === "selected").length ?? 0,
    [batch],
  );

  async function handleScan() {
    const trimmedRootPath = rootPath.trim();
    if (!trimmedRootPath) {
      setErrorMessage("Root path is required.");
      return;
    }

    setScanning(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const nextBatch = await scanImport(trimmedRootPath, clientFetch);
      setBatch(nextBatch);
      setExpandedId(nextBatch.candidates[0]?.id ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to scan import directory.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function patchCandidate(
    candidateId: number,
    payload: ImportCandidateUpdate,
  ) {
    if (!batch) {
      return;
    }

    setSavingCandidateId(candidateId);
    setErrorMessage(null);
    try {
      const updated = await updateCandidate(batch.id, candidateId, payload, clientFetch);
      setBatch((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          candidates: prev.candidates.map((candidate) =>
            candidate.id === candidateId ? updated : candidate,
          ),
        };
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to update candidate.",
      );
    } finally {
      setSavingCandidateId(null);
    }
  }

  async function handleToggleSelected(candidate: ImportCandidateOut, checked: boolean) {
    await patchCandidate(candidate.id, {
      status: checked ? "selected" : "pending",
    });
  }

  async function handleCommit() {
    if (!batch) {
      return;
    }

    setCommitting(true);
    setErrorMessage(null);
    try {
      const nextResult = await commitBatch(batch.id, clientFetch);
      setResult(nextResult);
      setBatch((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          status: "done",
          imported_count: nextResult.imported_count,
          candidates: prev.candidates.map((candidate) =>
            candidate.status === "selected"
              ? { ...candidate, status: "imported" }
              : candidate,
          ),
        };
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to commit import batch.",
      );
    } finally {
      setCommitting(false);
    }
  }

  async function handleSelectAll() {
    if (!batch) {
      return;
    }

    for (const candidate of batch.candidates) {
      if (candidate.status !== "selected") {
        await patchCandidate(candidate.id, { status: "selected" });
      }
    }
  }

  async function handleClearSelection() {
    if (!batch) {
      return;
    }

    for (const candidate of batch.candidates) {
      if (candidate.status === "selected") {
        await patchCandidate(candidate.id, { status: "pending" });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Imports</h1>
        <p className="text-sm text-muted-foreground">
          Scan a directory, review detected metadata, then import selected packs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Root path</span>
            <Input
              aria-label="Root path"
              value={rootPath}
              onChange={(event) => setRootPath(event.target.value)}
              placeholder="/Volumes/media/cosplay/imports"
            />
          </label>
          <Button type="button" onClick={() => void handleScan()} disabled={scanning}>
            {scanning ? "Scanning..." : "Scan"}
          </Button>
        </CardContent>
      </Card>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      {batch && (
        <Card>
          <CardHeader>
            <CardTitle>Batch summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Status</div>
              <div>{batch.status}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Candidates</div>
              <div>{batch.total_candidates}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Selected</div>
              <div>{selectedCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Imported</div>
              <div>{batch.imported_count}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Imported {result.imported_count} packs.</p>
            <p className="text-muted-foreground">
              Pack IDs: {result.pack_ids.length > 0 ? result.pack_ids.join(", ") : "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {batch && batch.candidates.length > 0 && (
        <div className="space-y-4">
          {batch.candidates.map((candidate) => {
            const expanded = expandedId === candidate.id;
            const selected = candidate.status === "selected";
            const saving = savingCandidateId === candidate.id;

            return (
              <Card key={candidate.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          void handleToggleSelected(candidate, Boolean(checked))
                        }
                        aria-label={`Select ${candidate.folder_name}`}
                      />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>{candidate.folder_name}</CardTitle>
                          <CandidateStatusBadge status={candidate.status} />
                          {candidate.existing_pack_id && (
                            <Badge variant="destructive" className="gap-1">
                              <TriangleAlert className="h-3 w-3" />
                              Existing pack #{candidate.existing_pack_id}
                            </Badge>
                          )}
                        </div>
                        <CandidatePreview candidate={candidate} />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExpandedId(expanded ? null : candidate.id)}
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent>
                    <ImportCandidateEditor
                      candidate={candidate}
                      saving={saving}
                      onSave={(payload) => patchCandidate(candidate.id, payload)}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}

          <ImportCommitBar
            totalCount={batch.candidates.length}
            selectedCount={selectedCount}
            committing={committing}
            disabled={savingCandidateId !== null}
            onSelectAll={() => void handleSelectAll()}
            onClear={() => void handleClearSelection()}
            onCommit={() => void handleCommit()}
          />
        </div>
      )}
    </div>
  );
}
