import { expect, test } from "@playwright/test";

test("admin imports flow scans edits selects and commits a pack", async ({ page }) => {
  await page.goto("/admin/imports");

  await expect(
    page.getByRole("heading", { name: "Imports" }),
  ).toBeVisible();

  await page
    .getByLabel("Root path")
    .fill("/Users/baysonfox/cosepic/backend/playwright_data/imports");
  await page.getByRole("button", { name: "Scan" }).click();

  await expect(page.getByText("Batch summary")).toBeVisible();
  await expect(
    page.getByLabel("Select 鳗鱼霏儿 - 明日方舟 - 阿米娅 2p"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Select 铃木美咲 - 原神 - 刻晴 花嫁 2p 1v"),
  ).toBeVisible();

  const amiyaCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "鳗鱼霏儿 - 明日方舟 - 阿米娅 2p" })
    .first();

  await amiyaCard.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Candidate title").fill("阿米娅 导入测试包");
  await page.getByLabel("Candidate coser names").fill("鳗鱼霏儿,测试别名");
  await page.getByRole("button", { name: "Apply" }).click();

  await expect(page.getByText("Selected 0 of 2")).toBeVisible();

  await page
    .getByLabel("Select 鳗鱼霏儿 - 明日方舟 - 阿米娅 2p")
    .click();
  await expect(page.getByText("Selected 1 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Import Selected (1)" }).click();

  await expect(page.getByText("Import result")).toBeVisible();
  await expect(page.getByText("Imported 1 packs.")).toBeVisible();
  await expect(page.getByText(/Pack IDs:/)).toBeVisible();

  await page.goto("/packs");
  await expect(page.getByText("阿米娅 导入测试包")).toBeVisible();
});
