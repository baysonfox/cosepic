import { expect, test } from "@playwright/test";

test("packs filters update URL and results", async ({ page }) => {
  await page.goto("/packs");

  await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();
  await expect(page.getByText("Amiya Winter Pack")).toBeVisible();

  const searchInput = page.getByPlaceholder("Search packs...");
  await searchInput.fill("Amiya Winter Pack");
  await expect(page).toHaveURL(/\/packs\?q=Amiya(\+|%20)Winter(\+|%20)Pack$/);
  await expect(page.getByText("Amiya Winter Pack")).toBeVisible();

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "With video" }).click();
  await expect(page).toHaveURL(/has_video=true/);
  await expect(page.getByText("No packs found")).toBeVisible();

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Photos only" }).click();
  await expect(page).toHaveURL(/has_video=false/);
  await expect(page.getByText("Amiya Winter Pack")).toBeVisible();
});
