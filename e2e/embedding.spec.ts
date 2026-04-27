import { expect, test } from "@playwright/test";

test("semantic search tab is visible", async ({ page }) => {
  await page.goto("/packs");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();

  // 验证语义搜索 tab 存在
  await expect(page.getByRole("tab", { name: "语义搜索" })).toBeVisible();

  // 切换到语义搜索模式
  await page.getByRole("tab", { name: "语义搜索" }).click();

  // 验证 URL 更新
  await expect(page).toHaveURL(/searchMode=semantic/);
});

test("embedding status shows after import", async ({ page }) => {
  await page.goto("/admin/imports");
  await page.waitForLoadState("networkidle");

  // 使用 playwright 测试数据目录
  await page.getByLabel("Root path").fill("/Users/baysonfox/cosepic/backend/playwright_data/imports");
  await page.getByRole("button", { name: "Scan" }).click();

  // 等待扫描完成
  await expect(page.getByText("Batch summary")).toBeVisible({ timeout: 15000 });

  // 验证候选项存在
  const candidates = page.locator('[data-slot="card"]');
  await expect(candidates.first()).toBeVisible();
});
