import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ImportWizardClient } from "@/components/import/import-wizard-client";
import type { ImportBatchOut } from "@/lib/api/types";

const usePathnameMock = vi.fn();
const scanImportMock = vi.fn();
const updateCandidateMock = vi.fn();
const commitBatchMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/imports", () => ({
  scanImport: (...args: unknown[]) => scanImportMock(...args),
  updateCandidate: (...args: unknown[]) => updateCandidateMock(...args),
  commitBatch: (...args: unknown[]) => commitBatchMock(...args),
}));

const batch: ImportBatchOut = {
  id: 55,
  root_path: "/imports/test",
  status: "ready",
  total_candidates: 2,
  imported_count: 0,
  created_at: "2026-04-02T00:00:00Z",
  finished_at: null,
  candidates: [
    {
      id: 101,
      batch_id: 55,
      folder_path: "/imports/test/鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
      folder_name: "鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
      detected_title: "阿米娅 10p",
      detected_coser_names: "鳗鱼霏儿",
      detected_work_name: "明日方舟",
      detected_character_names: "阿米娅",
      photo_count: 10,
      video_count: 0,
      total_size_bytes: 1024,
      existing_pack_id: null,
      status: "pending",
      created_at: "2026-04-02T00:00:00Z",
    },
    {
      id: 102,
      batch_id: 55,
      folder_path: "/imports/test/铃木美咲 - 原神 - 刻晴 花嫁 31p 1v",
      folder_name: "铃木美咲 - 原神 - 刻晴 花嫁 31p 1v",
      detected_title: "刻晴 花嫁 31p 1v",
      detected_coser_names: "铃木美咲",
      detected_work_name: "原神",
      detected_character_names: "刻晴 花嫁",
      photo_count: 31,
      video_count: 1,
      total_size_bytes: 2048,
      existing_pack_id: 9,
      status: "selected",
      created_at: "2026-04-02T00:00:00Z",
    },
  ],
};

describe("AdminSidebar", () => {
  it("renders imports entry", () => {
    usePathnameMock.mockReturnValue("/admin/imports");

    render(<AdminSidebar />);

    const importsLink = screen.getByRole("link", { name: /Imports/i });
    expect(importsLink).toHaveAttribute("href", "/admin/imports");
    expect(importsLink).toHaveClass("bg-accent");
  });
});

describe("ImportWizardClient", () => {
  beforeEach(() => {
    scanImportMock.mockReset();
    updateCandidateMock.mockReset();
    commitBatchMock.mockReset();
  });

  it("scans a root path and renders batch summary with candidates", async () => {
    scanImportMock.mockResolvedValue(batch);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: " /imports/test " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await waitFor(() => {
      expect(scanImportMock).toHaveBeenCalledWith("/imports/test", expect.any(Function));
    });

    expect(await screen.findByText("Batch summary")).toBeInTheDocument();
    expect(screen.getByText("Candidates")).toBeInTheDocument();
    expect(screen.getByText(/Existing pack #9/i)).toBeInTheDocument();
    expect(screen.getByText("Selected 1 of 2")).toBeInTheDocument();
  });

  it("saves edited candidate fields with string payloads", async () => {
    scanImportMock.mockResolvedValue(batch);
    updateCandidateMock.mockResolvedValue({
      ...batch.candidates[0],
      detected_title: "阿米娅新标题",
      detected_coser_names: "鳗鱼霏儿,测试Coser",
      detected_character_names: "阿米娅 近卫",
      status: "pending",
    });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByDisplayValue("阿米娅 10p");

    fireEvent.change(screen.getByLabelText("Candidate title"), {
      target: { value: " 阿米娅新标题 " },
    });
    fireEvent.change(screen.getByLabelText("Candidate coser names"), {
      target: { value: " 鳗鱼霏儿,测试Coser " },
    });
    fireEvent.change(screen.getByLabelText("Candidate character names"), {
      target: { value: " 阿米娅 近卫 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(updateCandidateMock).toHaveBeenCalledWith(
        55,
        101,
        {
          detected_title: "阿米娅新标题",
          detected_coser_names: "鳗鱼霏儿,测试Coser",
          detected_work_name: "明日方舟",
          detected_character_names: "阿米娅 近卫",
          status: "pending",
        },
        expect.any(Function),
      );
    });
  });

  it("shows original work character placeholder naturally", async () => {
    scanImportMock.mockResolvedValue({
      ...batch,
      candidates: [
        {
          ...batch.candidates[0],
          folder_name: "兔总裁 - 原创 - 白兔女仆 12p",
          detected_title: "白兔女仆",
          detected_work_name: "原创",
          detected_character_names: "OriginalCharacter",
        },
      ],
      total_candidates: 1,
    });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    expect(await screen.findByText("白兔女仆")).toBeInTheDocument();
    expect(screen.getAllByText(/^原创$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("OriginalCharacter")).not.toBeInTheDocument();
  });

  it("updates selection count from checkbox and clear action", async () => {
    scanImportMock.mockResolvedValue(batch);
    updateCandidateMock
      .mockResolvedValueOnce({
        ...batch.candidates[0],
        status: "selected",
      })
      .mockResolvedValueOnce({
        ...batch.candidates[0],
        status: "pending",
      })
      .mockResolvedValueOnce({
        ...batch.candidates[1],
        status: "pending",
      });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    const firstCheckbox = await screen.findByLabelText(
      "Select 鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
    );
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(updateCandidateMock).toHaveBeenCalledWith(
        55,
        101,
        { status: "selected" },
        expect.any(Function),
      );
    });

    expect(await screen.findByText("Selected 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear Selection" }));

    await waitFor(() => {
      expect(updateCandidateMock).toHaveBeenLastCalledWith(
        55,
        102,
        { status: "pending" },
        expect.any(Function),
      );
    });

    expect(await screen.findByText("Selected 0 of 2")).toBeInTheDocument();
  });

  it("commits selected candidates and shows import result", async () => {
    scanImportMock.mockResolvedValue(batch);
    commitBatchMock.mockResolvedValue({
      imported_count: 1,
      pack_ids: [3001],
    });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Selected 1 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Import Selected (1)" }));

    await waitFor(() => {
      expect(commitBatchMock).toHaveBeenCalledWith(55, expect.any(Function));
    });

    expect(await screen.findByText("Imported 1 packs.")).toBeInTheDocument();
    expect(screen.getByText("Pack IDs: 3001")).toBeInTheDocument();
    expect(screen.getByText("done")).toBeInTheDocument();
  });

  it("shows API errors from scanning", async () => {
    scanImportMock.mockRejectedValue(new ApiError(400, "Root path not found"));

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/missing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    expect(await screen.findByText("Root path not found")).toBeInTheDocument();
  });

  it("collapses already-imported candidates by default after scan", async () => {
    const batchWithImported: ImportBatchOut = {
      ...batch,
      candidates: [
        batch.candidates[0],
        { ...batch.candidates[1], status: "imported" },
      ],
    };
    scanImportMock.mockResolvedValue(batchWithImported);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Batch summary");

    expect(screen.getAllByText(batch.candidates[0].folder_name).length).toBe(2);
    expect(screen.getByLabelText(`Select ${batch.candidates[0].folder_name}`)).toBeInTheDocument();

    expect(screen.getAllByText(batch.candidates[1].folder_name).length).toBe(1);
    expect(
      screen.queryByLabelText(`Select ${batch.candidates[1].folder_name}`),
    ).not.toBeInTheDocument();
  });

  it("expands a collapsed candidate on click", async () => {
    const batchWithImported: ImportBatchOut = {
      ...batch,
      candidates: [
        { ...batch.candidates[0], status: "imported" },
      ],
      total_candidates: 1,
    };
    scanImportMock.mockResolvedValue(batchWithImported);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Batch summary");

    expect(
      screen.queryByLabelText(`Select ${batch.candidates[0].folder_name}`),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(`Expand ${batch.candidates[0].folder_name}`),
    );

    expect(
      screen.getByLabelText(`Select ${batch.candidates[0].folder_name}`),
    ).toBeInTheDocument();
  });

  it("collapses newly-imported candidates after commit", async () => {
    scanImportMock.mockResolvedValue(batch);
    commitBatchMock.mockResolvedValue({
      imported_count: 1,
      pack_ids: [3001],
    });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Selected 1 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Import Selected (1)" }));

    await screen.findByText("Imported 1 packs.");

    expect(
      screen.queryByLabelText(`Select ${batch.candidates[1].folder_name}`),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(`Expand ${batch.candidates[1].folder_name}`),
    ).toBeInTheDocument();
  });

  it("paginates candidates when exceeding page size", async () => {
    const largeBatch: ImportBatchOut = {
      ...batch,
      total_candidates: 25,
      candidates: Array.from({ length: 25 }, (_, i) => ({
        id: 200 + i,
        batch_id: 55,
        folder_path: `/imports/test/pack-${i}`,
        folder_name: `pack-${i}`,
        detected_title: `Title ${i}`,
        detected_coser_names: null,
        detected_work_name: null,
        detected_character_names: null,
        photo_count: 5,
        video_count: 0,
        total_size_bytes: 512,
        existing_pack_id: null,
        status: "pending" as const,
        created_at: "2026-04-02T00:00:00Z",
      })),
    };
    scanImportMock.mockResolvedValue(largeBatch);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Batch summary");

    expect(screen.getAllByText(/Showing 1-20 of 25/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Select pack-0")).toBeInTheDocument();
    expect(screen.getByLabelText("Select pack-19")).toBeInTheDocument();
    expect(screen.queryByLabelText("Select pack-20")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Page 2")[0]);

    expect(screen.getAllByText(/Showing 21-25 of 25/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Select pack-20")).toBeInTheDocument();
    expect(screen.getByLabelText("Select pack-24")).toBeInTheDocument();
    expect(screen.queryByLabelText("Select pack-0")).not.toBeInTheDocument();
  });

  it("select all operates across all pages", async () => {
    const largeBatch: ImportBatchOut = {
      ...batch,
      total_candidates: 25,
      candidates: Array.from({ length: 25 }, (_, i) => ({
        id: 200 + i,
        batch_id: 55,
        folder_path: `/imports/test/pack-${i}`,
        folder_name: `pack-${i}`,
        detected_title: `Title ${i}`,
        detected_coser_names: null,
        detected_work_name: null,
        detected_character_names: null,
        photo_count: 5,
        video_count: 0,
        total_size_bytes: 512,
        existing_pack_id: null,
        status: "pending" as const,
        created_at: "2026-04-02T00:00:00Z",
      })),
    };
    scanImportMock.mockResolvedValue(largeBatch);

    for (let i = 0; i < 25; i++) {
      updateCandidateMock.mockResolvedValueOnce({
        ...largeBatch.candidates[i],
        status: "selected",
      });
    }

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Batch summary");

    fireEvent.click(screen.getByRole("button", { name: "Select All (25)" }));

    await waitFor(() => {
      expect(updateCandidateMock).toHaveBeenCalledTimes(25);
    });

    expect(await screen.findByText("Selected 25 of 25")).toBeInTheDocument();
  });
});
