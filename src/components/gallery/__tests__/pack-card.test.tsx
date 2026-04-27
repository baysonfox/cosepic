import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PackCard } from "@/components/gallery/pack-card";
import type { PackListItem } from "@/lib/api/types";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/components/media/lazy-image", () => ({
  LazyImage: () => <div data-testid="lazy-image" />,
}));

const pack: PackListItem = {
  id: 12,
  title: "Amiya Winter Pack",
  status: "active",
  cover_asset_id: 7,
  photo_count: 120,
  video_count: 2,
  total_size_bytes: 1000,
  created_at: "2026-04-01T00:00:00Z",
  cosers: [{ id: 1, name: "Moe", is_primary: true }],
  characters: [{
    id: 2,
    name: "Amiya",
    work_name: "Arknights",
    is_primary: true,
  }],
};

describe("PackCard", () => {
  it("renders pack metadata", () => {
    render(<PackCard pack={pack} />);

    expect(screen.getByText("Amiya Winter Pack")).toBeInTheDocument();
    expect(screen.getByText("Arknights")).toBeInTheDocument();
    expect(screen.getByText("Moe")).toBeInTheDocument();
    expect(screen.getByText("120P 2V")).toBeInTheDocument();
  });

  it("renders original work placeholder naturally", () => {
    render(
      <PackCard
        pack={{
          ...pack,
          title: "白兔女仆",
          characters: [{
            id: 9,
            name: "OriginalCharacter",
            work_name: "原创",
            is_primary: true,
          }],
        }}
      />,
    );

    expect(screen.getAllByText("原创")).toHaveLength(1);
    expect(screen.queryByText("OriginalCharacter")).not.toBeInTheDocument();
  });

  it("links to the pack detail page", () => {
    render(<PackCard pack={pack} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/packs/12");
  });
});
