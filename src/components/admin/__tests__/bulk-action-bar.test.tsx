import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";

describe("BulkActionBar", () => {
  it("renders nothing when selectedCount is zero", () => {
    const { container } = render(
      <BulkActionBar selectedCount={0} onClear={vi.fn()} actions={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the count and action buttons when selection is non-empty", () => {
    const onDelete = vi.fn();
    render(
      <BulkActionBar
        selectedCount={3}
        onClear={vi.fn()}
        actions={[
          { key: "delete", label: "Delete", variant: "destructive", onClick: onDelete },
        ]}
      />,
    );
    expect(screen.getByText("已选 3 项")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onClear when the clear button is clicked", () => {
    const onClear = vi.fn();
    render(
      <BulkActionBar selectedCount={2} onClear={onClear} actions={[]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "清除选择" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("invokes the action callback when its button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onClear={vi.fn()}
        actions={[
          { key: "delete", label: "Delete", onClick: onDelete },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables an action while it is loading", () => {
    render(
      <BulkActionBar
        selectedCount={1}
        onClear={vi.fn()}
        actions={[
          { key: "delete", label: "Delete", loading: true, onClick: vi.fn() },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /Delete/ })).toBeDisabled();
  });

  it("disables an action when explicitly disabled", () => {
    render(
      <BulkActionBar
        selectedCount={1}
        onClear={vi.fn()}
        actions={[
          { key: "delete", label: "Delete", disabled: true, onClick: vi.fn() },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
