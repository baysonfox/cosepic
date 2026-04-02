This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Phase 8：admin 导入向导实现记录

本阶段已完成 `/admin/imports` 的前端 MVP，对照 `plans_backup/frontend.md`
中的 Phase 8 目标，打通了“扫描目录 -> 审核候选 -> 编辑元数据 ->
提交导入”的完整管理区流程。

### 本阶段改动

- 新增 `src/app/admin/imports/page.tsx`，接入导入向导页面入口。
- 新增 `src/components/import/import-wizard-client.tsx`，集中管理扫描、候选
  列表、编辑、勾选与提交状态。
- 新增 `src/components/import/import-candidate-editor.tsx`，提供行内展开的候
  选元数据编辑表单。
- 新增 `src/components/import/import-commit-bar.tsx`，实现底部 sticky 批量
  操作栏。
- 更新 `src/components/layout/admin-sidebar.tsx`，加入 Admin Imports 导航
  入口。
- 更新 `src/lib/api/types.ts`，把 `detected_coser_names` 与
  `detected_character_names` 修正为和后端一致的 `string | null` 契约。
- 更新 `src/lib/api/imports.ts`，让 `updateCandidate()` 返回
  `ImportCandidateOut`，便于前端局部回写 candidate。
- 更新 `src/components/import/import-candidate-editor.tsx`，在保存回写后同步
  本地表单状态，避免编辑器继续显示旧值。

### 关键实现决策

导入页采用单页客户端向导，而不是多路由步骤流。这样可以直接贴合后端
现有的 `scan -> patch candidate -> commit` API 形态，减少状态同步复杂
度。

候选审核区采用卡片列表 + 行内展开编辑，而不是跳页或弹窗。当前每个候
选会展示目录名、解析出的标题/Coser/作品/角色、图片与视频数量、总大
小，以及 `existing_pack_id` 冲突提示。

候选编辑严格遵循后端字符串契约。`detected_coser_names`、
`detected_work_name`、`detected_character_names` 都以文本形式编辑并直
接提交，不使用 ID-based selector。

选择语义与后端保持一致。勾选操作本质上就是把 candidate 的 `status`
改为 `selected`，清除选择则改回 `pending`。提交时只有
`status === "selected"` 的候选会被真正导入。

提交导入仍然保持同步调用，不接任务中心，也不做轮询。提交成功后前端
直接展示导入数量与返回的 pack ID 列表，并把当前 batch 视图更新为已完
成状态。

### 测试补充

- 新增 `src/components/import/__tests__/import-wizard-client.test.tsx`
  - 覆盖 Admin Sidebar 中 Imports 入口渲染。
  - 覆盖扫描成功后批次摘要与候选展示。
  - 覆盖编辑 candidate 时发送的字符串 payload。
  - 覆盖勾选与清空选择后底部操作栏计数更新。
  - 覆盖提交成功结果展示与扫描错误提示。
- 新增 `e2e/admin-import.spec.ts`
  - 覆盖真实浏览器下的 scan -> edit -> select -> commit 流程。
- 更新 `backend/scripts/seed_playwright_data.py`
  - 为 Playwright 提供稳定的导入测试目录 `backend/playwright_data/imports`。
  - 预置两个可扫描目录，其中一个带视频文件，便于覆盖图片/视频统计和
    多候选场景。

### 当前结果

完成后，管理区已经具备可工作的导入入口，博士可以直接在浏览器中输入
待扫描目录、审核解析结果、修正元数据并提交导入。这个实现也为后续继
续扩展任务中心、导入冲突处理和更细的回归测试提供了稳定基础。

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
