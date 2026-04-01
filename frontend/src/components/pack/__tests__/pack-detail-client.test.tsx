import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PackDetailClient } from "@/components/pack/pack-detail-client";
import type { AssetOut, PackOut } from "@/lib/api/types";

const refresh = vi.fn();
const updatePackMock = vi.fn();
const listCosersMock = vi.fn();
const listCharactersMock = vi.fn();
const listOutfitsMock = vi.fn();
const listTagsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/api/packs", () => ({
  updatePack: (...args: unknown[]) => updatePackMock(...args),
}));

vi.mock("@/lib/api/cosers", () => ({
  listCosers: (...args: unknown[]) => listCosersMock(...args),
}));

vi.mock("@/lib/api/characters", () => ({
  listCharacters: (...args: unknown[]) => listCharactersMock(...args),
}));

vi.mock("@/lib/api/outfits", () => ({
  listOutfits: (...args: unknown[]) => listOutfitsMock(...args),
}));

vi.mock("@/lib/api/tags", () => ({
  listTags: (...args: unknown[]) => listTagsMock(...args),
}));

vi.mock("@/components/media/lazy-image", () => ({
  LazyImage: ({ alt }: { alt: string }) => <div>{alt}</div>,
}));

vi.mock("@/components/media/lightbox-wrapper", () => ({
  LightboxWrapper: () => null,
}));

const pack: PackOut = {
  id: 12,
  title: "Amiya Winter Pack",
  status: "active",
  cover_asset_id: 7,
  photo_count: 120,
  video_count: 2,
  total_size_bytes: 1000,
  created_at: "2026-04-01T00:00:00Z",
  description: "Original description",
  dir_path: "/packs/amiya_winter",
  original_folder_name: "amiya_winter",
  updated_at: "2026-04-01T00:00:00Z",
  last_scanned_at: null,
  cosers: [{ id: 1, name: "Moe", is_primary: true }],
  characters: [
    { id: 2, name: "Amiya", work_name: "Arknights", is_primary: true },
  ],
  outfits: [{ id: 3, name: "Winter", character_name: "Amiya" }],
  tags: [{ id: 4, name: "Cute", tag_type: "style" }],
};

const assets: AssetOut[] = [
  {
    id: 7,
    asset_type: "image",
    file_name: "cover.png",
    relative_path: "cover.png",
    size_bytes: 100,
    width: 100,
    height: 100,
    blurhash: null,
    thumbnail_status: "generated",
    sort_index: 0,
  },
  {
    id: 8,
    asset_type: "image",
    file_name: "other.png",
    relative_path: "other.png",
    size_bytes: 100,
    width: 100,
    height: 100,
    blurhash: null,
    thumbnail_status: "generated",
    sort_index: 1,
  },
];

describe("PackDetailClient", () => {
  beforeEach(() => {
    refresh.mockReset();
    updatePackMock.mockReset();
    listCosersMock.mockResolvedValue({ items: [] });
    listCharactersMock.mockResolvedValue({ items: [] });
    listOutfitsMock.mockResolvedValue({ items: [] });
    listTagsMock.mockResolvedValue({ items: [] });
  });

  it("restores original values when canceling edit mode", () => {
    render(<PackDetailClient pack={pack} assets={assets} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const titleInput = screen.getByLabelText("Pack title");
    fireEvent.change(titleInput, { target: { value: "Changed title" } });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Amiya Winter Pack")).toBeInTheDocument();
  });

  it("saves edited metadata and selected cover", async () => {
    updatePackMock.mockResolvedValue({
      ...pack,
      title: "Edited Pack",
      description: "Updated description",
      cover_asset_id: 8,
    });

    render(<PackDetailClient pack={pack} assets={assets} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Pack title"), {
      target: { value: "Edited Pack" },
    });
    fireEvent.change(screen.getByLabelText("Pack description"), {
      target: { value: "Updated description" },
    });

    fireEvent.click(screen.getByRole("button", { name: "other.png" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updatePackMock).toHaveBeenCalledWith(
        12,
        {
          title: "Edited Pack",
          description: "Updated description",
          cover_asset_id: 8,
          coser_ids: [1],
          character_ids: [2],
          outfit_ids: [3],
          tag_ids: [4],
        },
        expect.any(Function),
      );
    });

    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText("Edited Pack")).toBeInTheDocument();
  });
});
