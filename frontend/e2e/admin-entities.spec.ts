import { expect, test } from "@playwright/test";

test("admin works page supports create edit and delete", async ({ page }) => {
  const workName = `Playwright Work ${Date.now()}`;
  const updatedName = `${workName} Updated`;

  await page.goto("/admin/works");
  await expect(page.getByRole("heading", { name: "Works" })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByLabel("Name").fill(workName);
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(workName) })).toBeVisible();

  const row = page.getByRole("row", { name: new RegExp(workName) });
  await row.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Name").fill(updatedName);
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(updatedName) })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("row", { name: new RegExp(updatedName) }).getByRole("button", {
    name: "Delete",
  }).click();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(updatedName) })).not.toBeVisible();
});
