"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  commitImport,
  scanImport,
} from "@/lib/api/imports";
import type {
  ImportCommitCandidate,
  ImportCommitResult,
  DuplicateItem,
  ScanCandidate,
  ScanResult,
} from "@/lib/api/types";
import {
  formatBytes,
  formatImportCharacterNames,
} from "@/lib/utils";

function CandidateStatusBadge({ selected }: { selected: boolean }) {
  if (selected) {
    return <Badge>selected</Badge>;
  }
  return <Badge variant="outline">pending</Badge>;
}

function CandidatePreview({ candidate }: { candidate: ScanCandidate }) {
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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editedMetadata, setEditedMetadata] = useState<Map<string, Partial<ScanCandidate>>>(new Map());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [committedTitles, setCommittedTitles] = useState<Map<number, string>>(new Map());
  const [page, setPage] = useState(1);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateItem | null>(null);
  const [currentPackTitle, setCurrentPackTitle] = useState("");
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  const [cancellingPackIds, setCancellingPackIds] = useState<Set<number>>(new Set());
  const [confirmingPackIds, setConfirmingPackIds] = useState<Set<number>>(new Set());

  const effectiveCandidates = useMemo(() => {
    if (!scanResult) return [];
    return scanResult.candidates.map((c) => {
      const edits = editedMetadata.get(c.folder_path);
      return edits ? { ...c, ...edits } : c;
    });
  }, [scanResult, editedMetadata]);

  const { newCandidates, existingCandidates } = useMemo(() => {
    const newOnes = effectiveCandidates.filter(
      (c) => !c.existing_pack_id,
    );
    const existing = effectiveCandidates.filter(
      (c) => c.existing_pack_id,
    );
    return { newCandidates: newOnes, existingCandidates: existing };
  }, [effectiveCandidates]);

  const selectedCount = useMemo(
    () => newCandidates.filter((c) => selectedKeys.has(c.folder_path)).length,
    [newCandidates, selectedKeys],
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
    setSelectedKeys(new Set());
    setEditedMetadata(new Map());
    try {
      const data = await scanImport(trimmedRootPath, clientFetch);
      setScanResult(data);
      setExpandedKey(data.candidates[0]?.folder_path ?? null);
      setPage(1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to scan import directory.",
      );
    } finally {
      setScanning(false);
    }
  }

  function handleToggleSelected(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedKeys(new Set(newCandidates.map((c) => c.folder_path)));
  }

  function handleSelectPage() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const c of visibleCandidates) {
        next.add(c.folder_path);
      }
      return next;
    });
  }

  function handleClearSelection() {
    setSelectedKeys(new Set());
  }

  const handleApplyMetadata = useCallback(
    (key: string, updates: Partial<ScanCandidate>) => {
      setEditedMetadata((prev) => {
        const existing = prev.get(key) ?? {};
        const next = new Map(prev);
        next.set(key, { ...existing, ...updates });
        return next;
      });
    },
    [],
  );

  async function handleCommit() {
    if (!scanResult) return;

    const payload: ImportCommitCandidate[] = effectiveCandidates
      .filter((c) => selectedKeys.has(c.folder_path))
      .map(({ existing_pack_id: _, ...rest }) => rest);

    if (payload.length === 0) return;

    setCommitting(true);
    setErrorMessage(null);
    try {
      const titleMap = new Map<number, string>();
      const nextResult = await commitImport(payload, skipDuplicateCheck, clientFetch);
      nextResult.pack_ids.forEach((id, idx) => {
        const candidate = payload[idx];
        if (candidate) {
          titleMap.set(id, candidate.detected_title || candidate.folder_name);
        }
      });
      setResult(nextResult);
      setCommittedTitles(titleMap);
      setSelectedKeys(new Set());
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.detail : "Failed to commit import.",
      );
    } finally {
      setCommitting(false);
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

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Scan summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Candidates</div>
              <div>{scanResult.total_candidates}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Selected</div>
              <div>{selectedCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Root</div>
              <div className="truncate">{scanResult.root_path}</div>
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
              const packTitle = committedTitles.get(pack_id) ?? `Pack #${pack_id}`;
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
                        与 &quot;{dup.duplicate_pack_title}&quot; 相似
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

      {scanResult && newCandidates.length > 0 && (
        <div className="space-y-4">
          <ImportPagination
            total={newCandidates.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          {visibleCandidates.map((candidate) => {
            const key = candidate.folder_path;
            const expanded = expandedKey === key;
            const selected = selectedKeys.has(key);

            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => handleToggleSelected(key)}
                        aria-label={`Select ${candidate.folder_name}`}
                      />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>{candidate.folder_name}</CardTitle>
                          <CandidateStatusBadge selected={selected} />
                        </div>
                        <CandidatePreview candidate={candidate} />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExpandedKey(expanded ? null : key)}
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
                      onApply={(updates) => handleApplyMetadata(key, updates)}
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
                    <div key={candidate.folder_path} className="rounded-lg border p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{candidate.folder_name}</span>
                        {candidate.existing_pack_id && (
                          <Badge variant="destructive" className="gap-1">
                            <TriangleAlert className="h-3 w-3" />
                            Existing pack #{candidate.existing_pack_id}
                          </Badge>
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
            skipDuplicateCheck={skipDuplicateCheck}
            onSkipDuplicateCheckChange={setSkipDuplicateCheck}
            onSelectAll={handleSelectAll}
            onSelectPage={handleSelectPage}
            onClear={handleClearSelection}
            onCommit={() => void handleCommit()}
          />
        </div>
      )}
    </div>
  );
}
