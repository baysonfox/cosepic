import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/filters/pagination";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/packs",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("q=amiya&page=3"),
}));

describe("Pagination", () => {
  it("renders current range", () => {
    render(<Pagination total={95} page={3} pageSize={20} />);
    expect(screen.getByText("Showing 41-60 of 95")).toBeInTheDocument();
  });

  it("navigates to the selected page", () => {
    render(<Pagination total={95} page={3} pageSize={20} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(push).toHaveBeenCalledWith("/packs?q=amiya&page=2");
  });

  it("removes page param when navigating to page 1", () => {
    render(<Pagination total={95} page={3} pageSize={20} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(push).toHaveBeenCalledWith("/packs?q=amiya&page=2");
  });
});
