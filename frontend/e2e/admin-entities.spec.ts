import { expect, test } from "@playwright/test";

async function createSimpleEntity(page: Parameters<typeof test>[0]["page"], path: string, heading: string, name: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(name) })).toBeVisible();
}

async function editSimpleEntity(page: Parameters<typeof test>[0]["page"], name: string, nextName: string) {
  const row = page.getByRole("row", { name: new RegExp(name) });
  await row.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(nextName);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(nextName) })).toBeVisible();
}

async function deleteSimpleEntity(page: Parameters<typeof test>[0]["page"], name: string) {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("row", { name: new RegExp(name) }).getByRole("button", {
    name: "Delete",
  }).click();
  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(name) })).not.toBeVisible();
}

test("admin works page supports create edit and delete", async ({ page }) => {
  const workName = `Playwright Work ${Date.now()}`;
  const updatedName = `${workName} Updated`;

  await createSimpleEntity(page, "/admin/works", "Works", workName);
  await editSimpleEntity(page, workName, updatedName);
  await deleteSimpleEntity(page, updatedName);
});

test("admin cosers page supports create edit and delete", async ({ page }) => {
  const coserName = `Playwright Coser ${Date.now()}`;
  const updatedName = `${coserName} Updated`;

  await createSimpleEntity(page, "/admin/cosers", "Cosers", coserName);
  await editSimpleEntity(page, coserName, updatedName);
  await deleteSimpleEntity(page, updatedName);
});

test("admin tags page supports create edit and delete", async ({ page }) => {
  const tagName = `Playwright Tag ${Date.now()}`;
  const updatedName = `${tagName} Updated`;

  await page.goto("/admin/tags");
  await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(tagName);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Genre" }).click();
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(tagName) })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(tagName) }).getByRole("button", {
    name: "Edit",
  }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(updatedName);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Style" }).click();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(updatedName) })).toBeVisible();

  await deleteSimpleEntity(page, updatedName);
});

test("admin characters page supports create edit and delete", async ({ page }) => {
  const workName = `Character Work ${Date.now()}`;
  const characterName = `Playwright Character ${Date.now()}`;
  const updatedName = `${characterName} Updated`;

  await createSimpleEntity(page, "/admin/works", "Works", workName);

  await page.goto("/admin/characters");
  await expect(page.getByRole("heading", { name: "Characters" })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(characterName);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: workName }).click();
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(characterName) })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(characterName) }).getByRole("button", {
    name: "Edit",
  }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(updatedName);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(updatedName) })).toBeVisible();

  await deleteSimpleEntity(page, updatedName);
});

test("admin outfits page supports create edit and delete", async ({ page }) => {
  const workName = `Outfit Work ${Date.now()}`;
  const characterName = `Outfit Character ${Date.now()}`;
  const outfitName = `Playwright Outfit ${Date.now()}`;
  const updatedName = `${outfitName} Updated`;

  await createSimpleEntity(page, "/admin/works", "Works", workName);

  await page.goto("/admin/characters");
  await page.getByRole("button", { name: "Create" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(characterName);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: workName }).click();
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).not.toBeVisible();

  await page.goto("/admin/outfits");
  await expect(page.getByRole("heading", { name: "Outfits" })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(outfitName);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: new RegExp(characterName) }).click();
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(outfitName) })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(outfitName) }).getByRole("button", {
    name: "Edit",
  }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(updatedName);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(updatedName) })).toBeVisible();

  await deleteSimpleEntity(page, updatedName);
});
