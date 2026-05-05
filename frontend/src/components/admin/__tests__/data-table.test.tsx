import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

interface Row {
  id: number;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (item) => item.name },
];

const rows: Row[] = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Bravo" },
  { id: 3, name: "Charlie" },
];

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <DataTable
      columns={columns}
      data={rows}
      loading={false}
      getRowKey={(item) => item.id}
      {...props}
    />,
  );
}

describe("DataTable selectable mode", () => {
  it("renders no checkbox column by default (backwards compatible)", () => {
    renderTable();
    expect(screen.queryByLabelText(/Select all rows/i)).toBeNull();
    expect(screen.queryByLabelText(/Select row 1/i)).toBeNull();
  });

  it("renders header + per-row checkboxes when selectable", () => {
    renderTable({
      selectable: true,
      selectedIds: new Set(),
      onSelectionChange: vi.fn(),
    });
    expect(screen.getByLabelText(/Select all rows/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Select row 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Select row 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Select row 3")).toBeInTheDocument();
  });

  it("emits a Set adding the row id when a row checkbox is clicked", () => {
    const handle = vi.fn();
    renderTable({
      selectable: true,
      selectedIds: new Set<number>(),
      onSelectionChange: handle,
    });
    fireEvent.click(screen.getByLabelText("Select row 2"));
    expect(handle).toHaveBeenCalledTimes(1);
    const next = handle.mock.calls[0][0] as Set<number>;
    expect(Array.from(next)).toEqual([2]);
  });

  it("emits a Set removing the row id when an already-selected row is clicked", () => {
    const handle = vi.fn();
    renderTable({
      selectable: true,
      selectedIds: new Set<number>([1, 2]),
      onSelectionChange: handle,
    });
    fireEvent.click(screen.getByLabelText("Select row 1"));
    const next = handle.mock.calls[0][0] as Set<number>;
    expect(Array.from(next).sort()).toEqual([2]);
  });

  it("header checkbox selects all visible rows when none are selected", () => {
    const handle = vi.fn();
    renderTable({
      selectable: true,
      selectedIds: new Set<number>(),
      onSelectionChange: handle,
    });
    fireEvent.click(screen.getByLabelText(/Select all rows/i));
    const next = handle.mock.calls[0][0] as Set<number>;
    expect(Array.from(next).sort()).toEqual([1, 2, 3]);
  });

  it("header checkbox clears all visible rows when all are selected", () => {
    const handle = vi.fn();
    renderTable({
      selectable: true,
      selectedIds: new Set<number>([1, 2, 3]),
      onSelectionChange: handle,
    });
    fireEvent.click(screen.getByLabelText(/Select all rows/i));
    const next = handle.mock.calls[0][0] as Set<number>;
    expect(next.size).toBe(0);
  });

  it("disables the header checkbox when there is no data", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        loading={false}
        getRowKey={(item) => item.id}
        selectable
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />,
    );
    // Base UI's Checkbox renders a <span role="checkbox"> with
    // aria-disabled rather than an <input disabled>, so we assert the
    // accessibility attribute directly.
    const headerCb = screen.getByLabelText(/Select all rows/i);
    expect(headerCb).toHaveAttribute("aria-disabled", "true");
  });
});
