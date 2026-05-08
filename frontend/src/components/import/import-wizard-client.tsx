"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, TriangleAlert } from "lucide-react";
import { ImportCandidateEditor } from "@/components/import/import-candidate-editor";
import { ImportCommitBar } from "@/components/import/import-commit-bar";
import { ImportPagination } from "@/components/import/import-pagination";
import { DuplicateComparisonDialog } from "@/components/import/duplicate-comparison-dialog";
import { EmbeddingStatus } from "@/components/import/embedding-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ApiError, clientFetch } from "@/lib/api/client";
import { triggerEmbedding } from "@/lib/api/embeddings";
import {
  cancelImport,
  commitBatch,
  scanImport,
  updateCandidate,
} from "@/lib/api/imports";
import type {
  ImportBatchOut,
  ImportCandidateOut,
  ImportCandidateUpdate,
  ImportCommitResult,
  DuplicateItem,
} from "@/lib/api/types";
import {
  formatBytes,
  formatImportCharacterNames,
} from "@/lib/utils";

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
        <span className="font-medium">Characters:</span>{" "}
        {formatImportCharacterNames(
          candidate.detected_work_name,
          candidate.detected_character_names,
        ) ?? "—"}
      </div>
      <div className="text-muted-foreground">
        {candidate.photo_count}P {candidate.video_count}V · {formatBytes(candidate.total_size_bytes)}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export function ImportWizardClient() {
  const [rootPath, setRootPath] = useState("");
  const [batch, setBatch] = useState<ImportBatchOut | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [page, setPage] = useState(1);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateItem | null>(null);
  const [currentPackTitle, setCurrentPackTitle] = useState("");
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  const [cancellingPackIds, setCancellingPackIds] = useState<Set<number>>(new Set());
  const [confirmingPackIds, setConfirmingPackIds] = useState<Set<number>>(new Set());

  const { newCandidates, existingCandidates } = useMemo(() => {
    if (!batch) return { newCandidates: [], existingCandidates: [] };
    const newOnes = batch.candidates.filter(
      c => !c.existing_pack_id && c.status !== "imported",
    );
    const existing = batch.candidates.filter(
      c => c.existing_pack_id || c.status === "imported",
    );
    return { newCandidates: newOnes, existingCandidates: existing };
  }, [batch]);

  const selectedCount = useMemo(
    () => newCandidates.filter((candidate) => candidate.status === "selected").length,
    [newCandidates],
  );

  const totalPages = Math.max(1, Math.ceil(newCandidates.length / PAGE_SIZE));

  const visibleCandidates = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return newCandidates.slice(start, start + PAGE_SIZE);
  }, [newCandidates, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openComparisonDialog(dup: DuplicateItem, packTitle: string) {
    setSelectedDuplicate(dup);
    setCurrentPackTitle(packTitle);
    setComparisonDialogOpen(true);
  }

  async function handleCancelImport(packId: number) {
    setCancellingPackIds((prev) => new Set(prev).add(packId));
    try {
      await cancelImport(packId, clientFetch);
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          imported_count: prev.imported_count - 1,
          pack_ids: prev.pack_ids.filter((id) => id !== packId),
          duplicate_checks: prev.duplicate_checks.filter(
            (dc) => dc.pack_id !== packId,
          ),
        };
      });
    } catch {
      setErrorMessage("取消导入失败，请重试");
    } finally {
      setCancellingPackIds((prev) => {
        const next = new Set(prev);
        next.delete(packId);
        return next;
      });
    }
  }

  async function handleConfirmImport(packId: number) {
    setConfirmingPackIds((prev) => new Set(prev).add(packId));
    try {
      await triggerEmbedding(packId);
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          duplicate_checks: prev.duplicate_checks.filter(
            (dc) => dc.pack_id !== packId,
          ),
        };
      });
    } catch {
      setErrorMessage("触发 embedding 处理失败，请重试");
    } finally {
      setConfirmingPackIds((prev) => {
        const next = new Set(prev);
        next.delete(packId);
        return next;
      });
    }
  }

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
      setPage(1);
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
      const nextResult = await commitBatch(batch.id, clientFetch, skipDuplicateCheck);
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

    for (const candidate of newCandidates) {
      if (candidate.status !== "selected") {
        await patchCandidate(candidate.id, { status: "selected" });
      }
    }
  }

  async function handleSelectPage() {
    for (const candidate of visibleCandidates) {
      if (candidate.status !== "selected") {
        await patchCandidate(candidate.id, { status: "selected" });
      }
    }
  }

  async function handleClearSelection() {
    if (!batch) {
      return;
    }

    for (const candidate of newCandidates) {
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

      {result && result.imported_count > 0 && (
        <EmbeddingStatus
          packIds={result.pack_ids}
          onComplete={() => setResult(null)}
        />
      )}

      {result && result.duplicate_checks && result.duplicate_checks.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              检测到可能重复的图包
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.duplicate_checks.map(({ pack_id, duplicates }) => {
              const selectedCandidates = batch?.candidates.filter(
                c => c.status === "selected",
              ) ?? [];
              const packIndex = result.pack_ids.indexOf(pack_id);
              const packTitle = packIndex >= 0 && selectedCandidates[packIndex]
                ? selectedCandidates[packIndex].detected_title || selectedCandidates[packIndex].folder_name
                : `Pack #${pack_id}`;

              const isCancelling = cancellingPackIds.has(pack_id);
              const isConfirming = confirmingPackIds.has(pack_id);

              return (
                <div key={pack_id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{packTitle}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isConfirming}
                        onClick={() => void handleConfirmImport(pack_id)}
                      >
                        {isConfirming ? "处理中..." : "确认导入"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isCancelling}
                        onClick={() => handleCancelImport(pack_id)}
                      >
                      {isCancelling ? "取消中..." : "取消导入"}
                      </Button>
                    </div>
                  </div>
                  {duplicates.map((dup, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        与 "{dup.duplicate_pack_title}" 相似
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          dup.max_similarity >= 0.9 ? "destructive" :
                          dup.max_similarity >= 0.8 ? "default" : "secondary"
                        }>
                          {(dup.max_similarity * 100).toFixed(1)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openComparisonDialog(dup, packTitle)}
                        >
                          查看对比
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <DuplicateComparisonDialog
        open={comparisonDialogOpen}
        onOpenChange={setComparisonDialogOpen}
        duplicate={selectedDuplicate}
        currentPackTitle={currentPackTitle}
      />

      {batch && newCandidates.length > 0 && (
        <div className="space-y-4">
          <ImportPagination
            total={newCandidates.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          {visibleCandidates.map((candidate) => {
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

          <ImportPagination
            total={newCandidates.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          {existingCandidates.length > 0 && (
            <Card className="border-muted">
              <CardHeader>
                <button
                  type="button"
                  onClick={() => setShowExisting(!showExisting)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    已存在的图包 ({existingCandidates.length})
                  </CardTitle>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showExisting ? "rotate-90" : ""}`} />
                </button>
              </CardHeader>
              {showExisting && (
                <CardContent className="space-y-3">
                  {existingCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-lg border p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{candidate.folder_name}</span>
                        {candidate.existing_pack_id ? (
                          <Badge variant="destructive" className="gap-1">
                            <TriangleAlert className="h-3 w-3" />
                            Existing pack #{candidate.existing_pack_id}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">已导入</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          <ImportCommitBar
            totalCount={newCandidates.length}
            selectedCount={selectedCount}
            committing={committing}
            disabled={savingCandidateId !== null}
            skipDuplicateCheck={skipDuplicateCheck}
            onSkipDuplicateCheckChange={setSkipDuplicateCheck}
            onSelectAll={() => void handleSelectAll()}
            onSelectPage={() => void handleSelectPage()}
            onClear={() => void handleClearSelection()}
            onCommit={() => void handleCommit()}
          />
        </div>
      )}
    </div>
  );
}
