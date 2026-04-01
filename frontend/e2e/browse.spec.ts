import { expect, test } from "@playwright/test";

test("home page shows seeded pack and pack detail opens", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recent Packs" })).toBeVisible();
  await expect(page.getByText("Amiya Winter Pack")).toBeVisible();

  await page.getByRole("link", { name: /Amiya Winter Pack/i }).click();
  await expect(page).toHaveURL(/\/packs\/1$/);
  await expect(page.getByRole("heading", { name: "Amiya Winter Pack" })).toBeVisible();
  await expect(page.getByText("Seed pack for browser tests")).toBeVisible();
});

test("packs page filter UI renders and seeded pack is listed", async ({ page }) => {
  await page.goto("/packs");

  await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();
  await expect(page.getByPlaceholder("Search packs...")).toBeVisible();
  await expect(page.getByText("Amiya Winter Pack")).toBeVisible();
});

test("entity pages show seeded records", async ({ page }) => {
  await page.goto("/cosers");
  await expect(page.getByText("Moe")).toBeVisible();

  await page.goto("/works");
  await expect(page.getByText("Arknights")).toBeVisible();

  await page.goto("/characters");
  await expect(page.getByText(/Amiya/)).toBeVisible();
});
