import { expect, test } from "@playwright/test";

test("packs filters update URL and results", async ({ page }) => {
  await page.goto("/packs");

  await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();
  await expect(page.getByRole("link", { name: /阿米娅 导入测试包/i }).first()).toBeVisible();

  const searchInput = page.getByPlaceholder("Search packs...").first();
  await searchInput.fill("Amiya Spring Pack");
  await expect(page).toHaveURL(/\/packs\?q=Amiya(\+|%20)Spring(\+|%20)Pack$/);
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();
  await expect(page.getByRole("link", { name: /阿米娅 导入测试包/i })).toHaveCount(0);

  await page.goto("/packs?coser_ids=1");
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();
  await expect(page.getByRole("link", { name: /阿米娅 导入测试包/i })).toHaveCount(0);
  await expect(page.getByText("Moe")).toBeVisible();

  await page.goto("/packs?work_ids=3");
  await expect(page.getByRole("link", { name: /阿米娅 导入测试包/i }).first()).toBeVisible();
  await expect(page.getByText("Amiya Spring Pack")).not.toBeVisible();
  await expect(page.getByText("明日方舟 · 阿米娅").first()).toBeVisible();

  await page.goto("/packs?character_ids=1");
  await expect(page.getByText("Amiya Spring Pack")).toBeVisible();
  await expect(page.getByRole("link", { name: /阿米娅 导入测试包/i })).toHaveCount(0);
  await expect(page.getByText("Arknights · Amiya").first()).toBeVisible();
});
