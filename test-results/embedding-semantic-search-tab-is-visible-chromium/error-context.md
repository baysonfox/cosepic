# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: embedding.spec.ts >> semantic search tab is visible
- Location: e2e/embedding.spec.ts:3:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /searchMode=semantic/
Received string:  "http://127.0.0.1:3000/packs"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://127.0.0.1:3000/packs"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - link "Cosepic" [ref=e5] [cursor=pointer]:
      - /url: /
    - navigation [ref=e6]:
      - link "Home" [ref=e7] [cursor=pointer]:
        - /url: /
        - img [ref=e8]
        - text: Home
      - link "Packs" [ref=e11] [cursor=pointer]:
        - /url: /packs
        - img [ref=e12]
        - text: Packs
      - link "Cosers" [ref=e14] [cursor=pointer]:
        - /url: /cosers
        - img [ref=e15]
        - text: Cosers
      - link "Works" [ref=e20] [cursor=pointer]:
        - /url: /works
        - img [ref=e21]
        - text: Works
      - link "Characters" [ref=e23] [cursor=pointer]:
        - /url: /characters
        - img [ref=e24]
        - text: Characters
      - separator [ref=e27]
      - link "Admin" [ref=e28] [cursor=pointer]:
        - /url: /admin
        - img [ref=e29]
        - text: Admin
  - main [ref=e32]:
    - generic [ref=e33]:
      - generic [ref=e34]:
        - heading "Packs" [level=1] [ref=e35]
        - paragraph [ref=e36]: Browse your cosplay pack library.
      - generic [ref=e37]:
        - generic [ref=e38]:
          - tablist [ref=e40]:
            - tab "文本搜索" [selected] [ref=e41]
            - tab "语义搜索" [active] [ref=e42]
          - generic [ref=e43]:
            - img [ref=e44]
            - textbox "Search packs..." [ref=e47]
        - generic [ref=e48]:
          - combobox [ref=e49]:
            - generic [ref=e50]: all
            - img: ▼
          - textbox [ref=e51]: all
          - combobox [ref=e52]:
            - generic [ref=e53]: created_at
            - img: ▼
          - textbox [ref=e54]: created_at
          - combobox [ref=e55]:
            - generic [ref=e56]: desc
            - img: ▼
          - textbox [ref=e57]: desc
        - generic [ref=e58]:
          - generic [ref=e60]:
            - generic [ref=e61]: No cosers.
            - button "Add" [ref=e62]:
              - img
              - text: Add
          - generic [ref=e64]:
            - generic [ref=e65]: No works.
            - button "Add" [ref=e66]:
              - img
              - text: Add
          - generic [ref=e68]:
            - generic [ref=e69]: No characters.
            - button "Add" [ref=e70]:
              - img
              - text: Add
          - generic [ref=e72]:
            - generic [ref=e73]: No outfits.
            - button "Add" [ref=e74]:
              - img
              - text: Add
          - generic [ref=e76]:
            - generic [ref=e77]: No tags.
            - button "Add" [ref=e78]:
              - img
              - text: Add
      - generic [ref=e79]:
        - link "艾雅法拉 Duplicate 艾雅法拉 Duplicate 明日方舟 · 艾雅法拉 二 二佐Nisa 34P" [ref=e80] [cursor=pointer]:
          - /url: /packs/6
          - generic [ref=e81]:
            - img "艾雅法拉 Duplicate" [ref=e83]
            - generic [ref=e84]:
              - heading "艾雅法拉 Duplicate" [level=3] [ref=e85]
              - paragraph [ref=e86]: 明日方舟 · 艾雅法拉
              - generic [ref=e87]:
                - generic [ref=e88]:
                  - generic [ref=e89]: 二
                  - generic [ref=e90]: 二佐Nisa
                - generic [ref=e91]: 34P
        - link "艾雅法拉 Duplicate 艾雅法拉 Duplicate 明日方舟 · 艾雅法拉 二 二佐Nisa 34P" [ref=e92] [cursor=pointer]:
          - /url: /packs/5
          - generic [ref=e93]:
            - img "艾雅法拉 Duplicate" [ref=e95]
            - generic [ref=e96]:
              - heading "艾雅法拉 Duplicate" [level=3] [ref=e97]
              - paragraph [ref=e98]: 明日方舟 · 艾雅法拉
              - generic [ref=e99]:
                - generic [ref=e100]:
                  - generic [ref=e101]: 二
                  - generic [ref=e102]: 二佐Nisa
                - generic [ref=e103]: 34P
        - link "艾雅法拉 艾雅法拉 明日方舟 · 艾雅法拉 二 二佐Nisa 34P" [ref=e104] [cursor=pointer]:
          - /url: /packs/4
          - generic [ref=e105]:
            - img "艾雅法拉" [ref=e107]
            - generic [ref=e108]:
              - heading "艾雅法拉" [level=3] [ref=e109]
              - paragraph [ref=e110]: 明日方舟 · 艾雅法拉
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - generic [ref=e113]: 二
                  - generic [ref=e114]: 二佐Nisa
                - generic [ref=e115]: 34P
        - link "艾雅法拉 艾雅法拉 明日方舟 · 艾雅法拉 二 二佐Nisa 34P" [ref=e116] [cursor=pointer]:
          - /url: /packs/3
          - generic [ref=e117]:
            - img "艾雅法拉" [ref=e119]
            - generic [ref=e120]:
              - heading "艾雅法拉" [level=3] [ref=e121]
              - paragraph [ref=e122]: 明日方舟 · 艾雅法拉
              - generic [ref=e123]:
                - generic [ref=e124]:
                  - generic [ref=e125]: 二
                  - generic [ref=e126]: 二佐Nisa
                - generic [ref=e127]: 34P
        - link "阿米娅 导入测试包 阿米娅 导入测试包 明日方舟 · 阿米娅 鳗 鳗鱼霏儿 2P" [ref=e128] [cursor=pointer]:
          - /url: /packs/2
          - generic [ref=e129]:
            - img "阿米娅 导入测试包" [ref=e131]
            - generic [ref=e132]:
              - heading "阿米娅 导入测试包" [level=3] [ref=e133]
              - paragraph [ref=e134]: 明日方舟 · 阿米娅
              - generic [ref=e135]:
                - generic [ref=e136]:
                  - generic [ref=e137]: 鳗
                  - generic [ref=e138]: 鳗鱼霏儿
                - generic [ref=e139]: 2P
        - link "Amiya Spring Pack Amiya Spring Pack Arknights · Amiya M Moe 1P" [ref=e140] [cursor=pointer]:
          - /url: /packs/1
          - generic [ref=e141]:
            - img "Amiya Spring Pack" [ref=e143]
            - generic [ref=e144]:
              - heading "Amiya Spring Pack" [level=3] [ref=e145]
              - paragraph [ref=e146]: Arknights · Amiya
              - generic [ref=e147]:
                - generic [ref=e148]:
                  - generic [ref=e149]: M
                  - generic [ref=e150]: Moe
                - generic [ref=e151]: 1P
      - generic [ref=e152]: Showing 1-6 of 6
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
> 16 |   await expect(page).toHaveURL(/searchMode=semantic/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
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
  28 |   await expect(page.getByText("Batch summary")).toBeVisible({ timeout: 15000 });
  29 | 
  30 |   // 验证候选项存在
  31 |   const candidates = page.locator('[data-slot="card"]');
  32 |   await expect(candidates.first()).toBeVisible();
  33 | });
  34 | 
```