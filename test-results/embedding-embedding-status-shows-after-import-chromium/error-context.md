# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: embedding.spec.ts >> embedding status shows after import
- Location: e2e/embedding.spec.ts:19:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Batch summary')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Batch summary')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - link "Back to browse" [ref=e5] [cursor=pointer]:
        - /url: /
        - img [ref=e6]
        - text: Back to browse
      - generic [ref=e8]:
        - img [ref=e9]
        - text: Admin
    - navigation [ref=e11]:
      - link "Dashboard" [ref=e12] [cursor=pointer]:
        - /url: /admin
        - img [ref=e13]
        - text: Dashboard
      - link "Imports" [ref=e18] [cursor=pointer]:
        - /url: /admin/imports
        - img [ref=e19]
        - text: Imports
      - link "Tasks" [ref=e22] [cursor=pointer]:
        - /url: /admin/tasks
        - img [ref=e23]
        - text: Tasks
      - link "Packs" [ref=e26] [cursor=pointer]:
        - /url: /admin/packs
        - img [ref=e27]
        - text: Packs
      - link "Cosers" [ref=e31] [cursor=pointer]:
        - /url: /admin/cosers
        - img [ref=e32]
        - text: Cosers
      - link "Works" [ref=e37] [cursor=pointer]:
        - /url: /admin/works
        - img [ref=e38]
        - text: Works
      - link "Characters" [ref=e40] [cursor=pointer]:
        - /url: /admin/characters
        - img [ref=e41]
        - text: Characters
      - link "Outfits" [ref=e44] [cursor=pointer]:
        - /url: /admin/outfits
        - img [ref=e45]
        - text: Outfits
      - link "Tags" [ref=e47] [cursor=pointer]:
        - /url: /admin/tags
        - img [ref=e48]
        - text: Tags
  - main [ref=e52]:
    - generic [ref=e53]:
      - generic [ref=e54]:
        - heading "Imports" [level=1] [ref=e55]
        - paragraph [ref=e56]: Scan a directory, review detected metadata, then import selected packs.
      - generic [ref=e57]:
        - generic [ref=e59]: Scan directory
        - generic [ref=e60]:
          - generic [ref=e61]:
            - text: Root path
            - textbox "Root path" [ref=e62]:
              - /placeholder: /Volumes/media/cosplay/imports
              - text: /Users/baysonfox/cosepic/backend/playwright_data/imports
          - button "Scan" [active] [ref=e63]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("semantic search tab is visible", async ({ page }) => {
  4  |   await page.goto("/packs");
  5  |   await page.waitForLoadState("networkidle");
  6  | 
  7  |   await expect(page.getByRole("heading", { name: "Packs" })).toBeVisible();
  8  | 
  9  |   // 验证语义搜索 tab 存在
  10 |   await expect(page.getByRole("tab", { name: "语义搜索" })).toBeVisible();
  11 | 
  12 |   // 切换到语义搜索模式
  13 |   await page.getByRole("tab", { name: "语义搜索" }).click();
  14 | 
  15 |   // 验证 URL 更新
  16 |   await expect(page).toHaveURL(/searchMode=semantic/);
  17 | });
  18 | 
  19 | test("embedding status shows after import", async ({ page }) => {
  20 |   await page.goto("/admin/imports");
  21 |   await page.waitForLoadState("networkidle");
  22 | 
  23 |   // 使用 playwright 测试数据目录
  24 |   await page.getByLabel("Root path").fill("/Users/baysonfox/cosepic/backend/playwright_data/imports");
  25 |   await page.getByRole("button", { name: "Scan" }).click();
  26 | 
  27 |   // 等待扫描完成
> 28 |   await expect(page.getByText("Batch summary")).toBeVisible({ timeout: 15000 });
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  29 | 
  30 |   // 验证候选项存在
  31 |   const candidates = page.locator('[data-slot="card"]');
  32 |   await expect(candidates.first()).toBeVisible();
  33 | });
  34 | 
```