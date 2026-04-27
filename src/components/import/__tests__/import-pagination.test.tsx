import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImportPagination } from "@/components/import/import-pagination";

describe("ImportPagination", () => {
  it("shows only text when total fits in one page", () => {
    render(
      <ImportPagination total={10} page={1} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Showing 1-10 of 10")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders page buttons when total exceeds page size", () => {
    render(
      <ImportPagination total={50} page={1} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Showing 1-20 of 50")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument();
  });

  it("calls onPageChange when next page button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <ImportPagination total={50} page={1} pageSize={20} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when previous page button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <ImportPagination total={50} page={2} pageSize={20} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables previous button on first page", () => {
    render(
      <ImportPagination total={50} page={1} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <ImportPagination total={50} page={3} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange with specific page number", () => {
    const onPageChange = vi.fn();
    render(
      <ImportPagination total={50} page={1} pageSize={20} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByLabelText("Page 3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("shows correct range for middle page", () => {
    render(
      <ImportPagination total={50} page={2} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Showing 21-40 of 50")).toBeInTheDocument();
  });

  it("shows correct range for last partial page", () => {
    render(
      <ImportPagination total={25} page={2} pageSize={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Showing 21-25 of 25")).toBeInTheDocument();
  });
});
