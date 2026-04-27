import { expect, test } from "@playwright/test";

test("home page shows pack cards and pack detail opens", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recent Packs" })).toBeVisible();
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();

  await page.getByRole("link", { name: /Amiya Spring Pack/i }).first().click();
  await expect(page).toHaveURL(/\/packs\/1$/);
  await expect(page.getByRole("heading", { name: "Amiya Spring Pack" })).toBeVisible();
  await expect(page.getByText("Updated from Playwright")).toBeVisible();
});

test("packs page filter UI renders and current pack is listed", async ({ page }) => {
  await page.goto("/packs");

  await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search packs..." }).first()).toBeVisible();
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();
});

test("entity pages show current records", async ({ page }) => {
  await page.goto("/cosers");
  await expect(page.getByText("Moe")).toBeVisible();

  await page.goto("/works");
  await expect(page.getByText("Arknights")).toBeVisible();

  await page.goto("/characters");
  await expect(page.getByText(/Amiya/)).toBeVisible();
});

test("pack detail edit mode saves title and description", async ({ page }) => {
  await page.goto("/packs/1");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Pack title").fill("Amiya Spring Pack");
  await page.getByLabel("Pack description").fill("Updated from Playwright");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByRole("heading", { name: "Amiya Spring Pack" }),
  ).toBeVisible();
  await expect(page.getByText("Updated from Playwright")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Amiya Spring Pack" }),
  ).toBeVisible();
  await expect(page.getByText("Updated from Playwright")).toBeVisible();
});
