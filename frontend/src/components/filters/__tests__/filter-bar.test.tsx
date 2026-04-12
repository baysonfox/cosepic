import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "@/components/filters/filter-bar";

const push = vi.fn();
const searchParamsState = new URLSearchParams(
  "page=3&sort=title&coser_ids=1,2&work_ids=7",
);
const listCosersMock = vi.fn();
const listWorksMock = vi.fn();
const listCharactersMock = vi.fn();
const listOutfitsMock = vi.fn();
const listTagsMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/packs",
  useRouter: () => ({ push }),
  useSearchParams: () => searchParamsState,
}));

vi.mock("@/lib/api/cosers", () => ({
  listCosers: (...args: unknown[]) => listCosersMock(...args),
}));

vi.mock("@/lib/api/works", () => ({
  listWorks: (...args: unknown[]) => listWorksMock(...args),
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

describe("FilterBar", () => {
  beforeEach(() => {
    push.mockReset();
    listCosersMock.mockResolvedValue({
      items: [
        { id: 1, name: "Moe" },
        { id: 2, name: "鳗鱼霏儿" },
        { id: 3, name: "星之迟迟" },
      ],
    });
    listWorksMock.mockResolvedValue({
      items: [
        { id: 7, name: "Arknights" },
        { id: 8, name: "Genshin" },
      ],
    });
    listCharactersMock.mockResolvedValue({ items: [] });
    listOutfitsMock.mockResolvedValue({ items: [] });
    listTagsMock.mockResolvedValue({ items: [] });
  });

  it("hydrates selected chips from URL params", async () => {
    render(<FilterBar />);

    expect(await screen.findByText("Moe")).toBeInTheDocument();
    expect(screen.getByText("鳗鱼霏儿")).toBeInTheDocument();
    expect(screen.getByText("Arknights")).toBeInTheDocument();
  });

  it("removes page param when removing a selected entity chip", async () => {
    render(<FilterBar />);

    fireEvent.click(await screen.findByLabelText("Remove Moe"));

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
      const lastCall = push.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("/packs?");
      expect(lastCall).toContain("sort=title");
      expect(lastCall).toContain("coser_ids=2");
      expect(lastCall).toContain("work_ids=7");
      expect(lastCall).not.toContain("page=");
    });
  });

  it("keeps other filters when removing a selected work chip", async () => {
    render(<FilterBar />);

    fireEvent.click(await screen.findByLabelText("Remove Arknights"));

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
      const lastCall = push.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("/packs?");
      expect(lastCall).toContain("sort=title");
      expect(lastCall).toContain("coser_ids=1%2C2");
      expect(lastCall).not.toContain("work_ids=");
      expect(lastCall).not.toContain("page=");
    });
  });

  it("formats original placeholder chips naturally", async () => {
    listCharactersMock.mockResolvedValue({
      items: [{
        id: 11,
        name: "OriginalCharacter",
        work_name: "原创",
        pack_count: 1,
      }],
    });
    listOutfitsMock.mockResolvedValue({
      items: [{
        id: 21,
        name: "女仆",
        character_name: "OriginalCharacter",
        pack_count: 1,
      }],
    });

    searchParamsState.set("character_ids", "11");
    searchParamsState.set("outfit_ids", "21");

    render(<FilterBar />);

    expect((await screen.findAllByText("原创")).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("OriginalCharacter")).not.toBeInTheDocument();

    searchParamsState.delete("character_ids");
    searchParamsState.delete("outfit_ids");
  });
});
