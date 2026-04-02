import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("AdminSidebar", () => {
  it("highlights the active admin section", () => {
    usePathnameMock.mockReturnValue("/admin/characters/12");

    render(<AdminSidebar />);

    const activeLink = screen.getByRole("link", { name: /Characters/i });
    const inactiveLink = screen.getByRole("link", { name: /Works/i });

    expect(activeLink).toHaveClass("bg-accent");
    expect(activeLink).toHaveClass("text-accent-foreground");
    expect(inactiveLink).toHaveClass("text-muted-foreground");
  });

  it("renders tasks link", () => {
    usePathnameMock.mockReturnValue("/admin/tasks");

    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /Tasks/i })).toHaveAttribute(
      "href",
      "/admin/tasks",
    );
  });
});
