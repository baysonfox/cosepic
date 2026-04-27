import { expect, test } from "@playwright/test";

test("browse sidebar and breadcrumbs render on major pages", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("complementary");
  const main = page.locator("main");

  await expect(page.getByRole("heading", { name: "Recent Packs" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Packs" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Works" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Characters" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Admin" })).toBeVisible();

  await page.goto("/works/1");
  await expect(page).toHaveURL(/\/works\/1$/);
  await expect(page.getByRole("heading", { name: "Arknights", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Works" })).toBeVisible();

  await main.getByRole("link", { name: "Works" }).click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(page.getByRole("heading", { name: "Works", exact: true })).toBeVisible();

  await page.goto("/characters/1");
  await expect(page).toHaveURL(/\/characters\/1$/);
  await expect(page.getByRole("heading", { name: "Amiya", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Characters" })).toBeVisible();

  await main.getByRole("link", { name: "Characters" }).click();
  await expect(page).toHaveURL(/\/characters$/);
  await expect(page.getByRole("heading", { name: "Characters", exact: true })).toBeVisible();
});
