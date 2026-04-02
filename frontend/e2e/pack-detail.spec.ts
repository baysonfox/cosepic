import { expect, test } from "@playwright/test";

test("pack detail shows breadcrumb metadata and lightbox controls", async ({
  page,
}) => {
  await page.goto("/packs/1");

  const main = page.locator("main");

  await expect(page).toHaveURL(/\/packs\/1$/);
  await expect(main.getByRole("heading", { name: "Amiya Winter Pack" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Packs" })).toBeVisible();
  await expect(main.getByText("Seed pack for browser tests")).toBeVisible();
  await expect(main.getByRole("link", { name: "Moe primary" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Amiya Arknights" })).toBeVisible();
  await expect(
    main.getByText("/Users/baysonfox/cosepic/backend/playwright_data/packs/amiya_winter"),
  ).toBeVisible();
  await expect(main.getByRole("heading", { name: "Assets" })).toBeVisible();

  await main.getByRole("button", { name: /cover\.png/i }).click();
  await expect(page.getByRole("button", { name: /Close/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Close/i })).not.toBeVisible();
});
