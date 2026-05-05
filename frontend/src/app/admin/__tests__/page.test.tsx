import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "@/app/admin/page";

const getStatsMock = vi.fn();

vi.mock("@/lib/api/system", () => ({
  getStats: (...args: unknown[]) => getStatsMock(...args),
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    getStatsMock.mockReset();
  });

  it("renders fetched system stats", async () => {
    getStatsMock.mockResolvedValue({
      packs: 12,
      assets: 345,
      cosers: 7,
      works: 4,
      total_size_bytes: 1024,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("345")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("1.0 KB")).toBeInTheDocument();
    });
  });
});
