import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SearchInput } from "@/components/filters/search-input";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/packs",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("page=4&sort=title"),
}));

describe("SearchInput", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("does not push on initial render", () => {
    render(<SearchInput placeholder="Search packs..." />);

    expect(push).not.toHaveBeenCalled();
  });

  it("updates URL after debounce and resets page", async () => {
    render(<SearchInput placeholder="Search packs..." />);

    fireEvent.change(screen.getByPlaceholderText("Search packs..."), {
      target: { value: "amiya" },
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/packs?sort=title&q=amiya");
    });
  });
});
