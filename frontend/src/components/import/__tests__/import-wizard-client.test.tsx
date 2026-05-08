import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ImportWizardClient } from "@/components/import/import-wizard-client";
import type { ScanResult } from "@/lib/api/types";

const usePathnameMock = vi.fn();
const scanImportMock = vi.fn();
const commitImportMock = vi.fn();

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
  commitImport: (...args: unknown[]) => commitImportMock(...args),
  cancelImport: vi.fn(),
}));

const scanResult: ScanResult = {
  root_path: "/imports/test",
  total_candidates: 2,
  candidates: [
    {
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
    },
    {
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
    commitImportMock.mockReset();
  });

  it("scans a root path and renders scan summary with candidates", async () => {
    scanImportMock.mockResolvedValue(scanResult);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: " /imports/test " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await waitFor(() => {
      expect(scanImportMock).toHaveBeenCalledWith(
        "/imports/test",
        expect.any(Function),
      );
    });

    expect(await screen.findByText("Scan summary")).toBeInTheDocument();
    expect(screen.getByText("Candidates")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/已存在的图包/));
    expect(screen.getByText(/Existing pack #9/i)).toBeInTheDocument();
    expect(screen.getByText("Selected 0 of 1")).toBeInTheDocument();
  });

  it("applies edited candidate fields locally without API call", async () => {
    scanImportMock.mockResolvedValue(scanResult);

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

    // Title should update locally
    expect(await screen.findByText("阿米娅新标题")).toBeInTheDocument();
    // No API call should have been made
    expect(commitImportMock).not.toHaveBeenCalled();
  });

  it("shows original work character placeholder naturally", async () => {
    scanImportMock.mockResolvedValue({
      ...scanResult,
      total_candidates: 1,
      candidates: [
        {
          ...scanResult.candidates[0],
          folder_name: "兔总裁 - 原创 - 白兔女仆 12p",
          detected_title: "白兔女仆",
          detected_work_name: "原创",
          detected_character_names: "OriginalCharacter",
        },
      ],
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
    scanImportMock.mockResolvedValue(scanResult);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    const firstCheckbox = await screen.findByLabelText(
      "Select 鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
    );
    fireEvent.click(firstCheckbox);

    expect(
      await screen.findByText("Selected 1 of 1"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear Selection" }));

    expect(
      await screen.findByText("Selected 0 of 1"),
    ).toBeInTheDocument();
  });

  it("commits selected candidates and shows import result", async () => {
    scanImportMock.mockResolvedValue({
      ...scanResult,
      candidates: [
        { ...scanResult.candidates[0] },
      ],
      total_candidates: 1,
    });
    commitImportMock.mockResolvedValue({
      imported_count: 1,
      pack_ids: [3001],
      duplicate_checks: [],
    });

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    // The single new candidate is auto-selectable; select it
    const checkbox = await screen.findByLabelText(
      "Select 鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
    );
    fireEvent.click(checkbox);

    await screen.findByText("Selected 1 of 1");
    fireEvent.click(
      screen.getByRole("button", { name: "Import Selected (1)" }),
    );

    await waitFor(() => {
      expect(commitImportMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            folder_name: "鳗鱼霏儿 - 明日方舟 - 阿米娅 10p",
          }),
        ]),
        false,
        expect.any(Function),
      );
    });

    expect(
      await screen.findByText("Imported 1 packs."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pack IDs: 3001")).toBeInTheDocument();
  });

  it("shows API errors from scanning", async () => {
    scanImportMock.mockRejectedValue(
      new ApiError(400, "Root path not found"),
    );

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/missing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    expect(
      await screen.findByText("Root path not found"),
    ).toBeInTheDocument();
  });

  it("moves existing-pack candidates to existing section after scan", async () => {
    scanImportMock.mockResolvedValue(scanResult);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Scan summary");

    expect(
      screen.getByLabelText(
        `Select ${scanResult.candidates[0].folder_name}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        `Select ${scanResult.candidates[1].folder_name}`,
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/已存在的图包/));
    expect(
      screen.getByText(scanResult.candidates[1].folder_name),
    ).toBeInTheDocument();
  });

  it("paginates candidates when exceeding page size", async () => {
    const largeScan: ScanResult = {
      root_path: "/imports/test",
      total_candidates: 25,
      candidates: Array.from({ length: 25 }, (_, i) => ({
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
      })),
    };
    scanImportMock.mockResolvedValue(largeScan);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Scan summary");

    expect(
      screen.getAllByText(/Showing 1-20 of 25/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Select pack-0")).toBeInTheDocument();
    expect(screen.getByLabelText("Select pack-19")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Select pack-20"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Page 2")[0]);

    expect(
      screen.getAllByText(/Showing 21-25 of 25/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Select pack-20")).toBeInTheDocument();
    expect(screen.getByLabelText("Select pack-24")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Select pack-0"),
    ).not.toBeInTheDocument();
  });

  it("select all operates across all pages synchronously", async () => {
    const largeScan: ScanResult = {
      root_path: "/imports/test",
      total_candidates: 25,
      candidates: Array.from({ length: 25 }, (_, i) => ({
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
      })),
    };
    scanImportMock.mockResolvedValue(largeScan);

    render(<ImportWizardClient />);

    fireEvent.change(screen.getByLabelText("Root path"), {
      target: { value: "/imports/test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));

    await screen.findByText("Scan summary");

    fireEvent.click(screen.getByRole("button", { name: "Select All (25)" }));

    // Selection is synchronous — no API calls needed
    expect(
      await screen.findByText("Selected 25 of 25"),
    ).toBeInTheDocument();
    expect(commitImportMock).not.toHaveBeenCalled();
  });
});
