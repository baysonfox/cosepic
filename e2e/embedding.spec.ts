import { expect, test } from "@playwright/test";

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
