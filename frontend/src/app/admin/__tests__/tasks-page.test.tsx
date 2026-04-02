import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import AdminTasksPage from "@/app/admin/tasks/page";

const pushMock = vi.fn();
const usePathnameMock = vi.fn();
const useSearchParamsMock = vi.fn();
const listTasksMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/lib/api/tasks", () => ({
  listTasks: (...args: unknown[]) => listTasksMock(...args),
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const SelectContext = React.createContext<{
    value: string;
    onValueChange?: (value: string | null) => void;
  } | null>(null);

  return {
    Select: ({ value, onValueChange, children }: {
      value: string;
      onValueChange?: (value: string | null) => void;
      children: ReactNode;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, className, ...props }: {
      children: ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => (
      <button type="button" className={className} {...props}>
        {children}
      </button>
    ),
    SelectValue: () => {
      const context = React.useContext(SelectContext);
      return <span>{context?.value}</span>;
    },
    SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: ReactNode }) => {
      const context = React.useContext(SelectContext);
      return (
        <button
          type="button"
          role="option"
          onClick={() => context?.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
  };
});

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

describe("AdminTasksPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    listTasksMock.mockReset();
    usePathnameMock.mockReturnValue("/admin/tasks");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("renders fetched tasks and failed error details", async () => {
    listTasksMock.mockResolvedValue({
      items: [
        {
          id: 11,
          task_type: "thumbnail_regen",
          target_type: "pack",
          target_id: 7,
          status: "failed",
          error_message: "thumbnail generation failed",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    });

    render(<AdminTasksPage />);

    expect(await screen.findByText("thumbnail_regen")).toBeInTheDocument();
    expect(screen.getByText("pack #7")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show error" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(await screen.findByText("Error details")).toBeInTheDocument();
    expect(screen.getByText("thumbnail generation failed")).toBeInTheDocument();
  });

  it("requests filtered tasks when URL contains status", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("status=running&page=2"));
    listTasksMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      page_size: 20,
    });

    render(<AdminTasksPage />);

    await waitFor(() => {
      expect(listTasksMock).toHaveBeenCalledWith(
        {
          status: "running",
          page: 2,
          page_size: 20,
        },
        expect.any(Function),
      );
    });
  });

  it("updates URL when status filter changes", async () => {
    listTasksMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
    });

    render(<AdminTasksPage />);

    await waitFor(() => {
      expect(listTasksMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText("Task status filter"));
    fireEvent.click(await screen.findByRole("option", { name: "failed" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/tasks?status=failed");
  });

  it("shows API errors", async () => {
    listTasksMock.mockRejectedValue(new ApiError(500, "Task endpoint failed"));

    render(<AdminTasksPage />);

    expect(await screen.findByText("Task endpoint failed")).toBeInTheDocument();
  });
});
