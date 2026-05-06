import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EntityManager } from "@/components/admin/entity-manager";
import type { DataTableColumn } from "@/components/admin/data-table";
import type { PaginatedResponse } from "@/lib/api/types";

interface Row {
  id: number;
  name: string;
}

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/tags",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (item) => item.name },
];

function renderManager(deleteOrphansItem?: () => Promise<{ deleted: number }>) {
  const listItems = vi.fn(async () => {
    const res: PaginatedResponse<Row> = {
      items: [{ id: 1, name: "Alpha" }],
      total: 1,
      page: 1,
      page_size: 20,
    };
    return res;
  });
  const createItem = vi.fn(async () => ({}));
  const updateItem = vi.fn(async () => ({}));
  const deleteItem = vi.fn(async () => undefined);

  const utils = render(
    <EntityManager<Row>
      title="Tags"
      description="Manage reusable pack tags."
      searchPlaceholder="Search tags..."
      columns={columns}
      fields={[]}
      listItems={listItems}
      createItem={createItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
      deleteOrphansItem={deleteOrphansItem}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
      toFormValues={() => ({})}
      toCreatePayload={() => ({})}
      toUpdatePayload={() => ({})}
    />,
  );
  return { ...utils, listItems, createItem, updateItem, deleteItem };
}

describe("EntityManager — Delete orphans button", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render the button when deleteOrphansItem is omitted", async () => {
    renderManager();
    await waitFor(() =>
      expect(screen.getByRole("row", { name: /Alpha/ })).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /Delete orphans/i }),
    ).toBeNull();
  });

  it("calls deleteOrphansItem after confirm and shows the deleted count", async () => {
    const deleteOrphansItem = vi.fn(async () => ({ deleted: 3 }));
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderManager(deleteOrphansItem);
    const button = await screen.findByRole("button", { name: /Delete orphans/i });
    fireEvent.click(button);

    await waitFor(() => expect(deleteOrphansItem).toHaveBeenCalledTimes(1));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/Deleted 3 orphan records?\./),
    ).toBeInTheDocument();
  });

  it("does not call deleteOrphansItem when the confirm dialog is cancelled", async () => {
    const deleteOrphansItem = vi.fn(async () => ({ deleted: 5 }));
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderManager(deleteOrphansItem);
    const button = await screen.findByRole("button", { name: /Delete orphans/i });
    fireEvent.click(button);

    expect(deleteOrphansItem).not.toHaveBeenCalled();
  });

  it("reports a friendly message when no orphans were deleted", async () => {
    const deleteOrphansItem = vi.fn(async () => ({ deleted: 0 }));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderManager(deleteOrphansItem);
    const button = await screen.findByRole("button", { name: /Delete orphans/i });
    fireEvent.click(button);

    expect(
      await screen.findByText(/No orphan records to delete/),
    ).toBeInTheDocument();
  });

  it("renders the singular form when exactly one orphan was deleted", async () => {
    const deleteOrphansItem = vi.fn(async () => ({ deleted: 1 }));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { container } = renderManager(deleteOrphansItem);
    const button = await screen.findByRole("button", { name: /Delete orphans/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        within(container).getByText(/Deleted 1 orphan record\./),
      ).toBeInTheDocument(),
    );
  });
});
