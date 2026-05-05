import { expect, test } from "@playwright/test";

test("admin pages load with the expected sidebar and page content", async ({
  page,
}) => {
  async function visit(path: string, heading: string) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}$`));
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("aside nav")).toBeVisible();
  }

  await visit("/admin", "Dashboard");
  await expect(page.getByText("Overview of the local Cosepic library.")).toBeVisible();
  await expect(page.getByText("Total size")).toBeVisible();

  await visit("/admin/packs", "Packs");
  await expect(page.getByPlaceholder("Search packs...")).toBeVisible();

  await visit("/admin/cosers", "Cosers");
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();

  await visit("/admin/works", "Works");
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();

  await visit("/admin/characters", "Characters");
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();

  await visit("/admin/tasks", "Tasks");
  await expect(page.getByLabel("Task status filter")).toBeVisible();

  await visit("/admin/imports", "Imports");
  await expect(page.getByLabel("Root path")).toBeVisible();
});
