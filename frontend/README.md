# Cosepic 前端

Next.14 前端应用， 提供 Cosplay 图集浏览界面。

## 环境要求

- Node.js 18+
- npm / yarn / pnpm / bun

## 安装

```bash
npm install
```

## 启动

开发模式：
```bash
npm run dev
```

访问 http://localhost:3

## 端口配置

修改 `next.config.ts` 中的端口：
```ts
devUrl: 'http://localhost:3',
```

## 页面结构

| 路径 | 说明 |
|------|------|
| / | 首页（最新图集） |
| /cosplays/{page} | 图集列表 |
| /cosplay/{id} | 图集详情 |
| /cosers/{page} | Coser 列表 |
| /coser/{id}/{page} | Coser 作品 |
| /parodies | 作品列表 |
| /parody/{id}/{page} | 作品详情 |
| /admin | 管理页面 |
| /admin/dedup | 去重管理 |

## 功能特性

### 图片加载
- 使用 BlurHash 作为占位图
- 模糊效果显示 → 缩略图加载完成 → 淡入显示
- 支持懒加载

### Lightbox
- 点击图片打开全屏查看
- 键盘导航（← → 切换，Esc 关闭）
- 直接使用原图（非缩略图）

### 响应式布局
- 移动端：2 列
- 平板：3-4 列
- 桌面：5 列

## 组件

- `SidebarNav.tsx` - 侧边栏导航
- `GalleryCard.tsx` - 图集卡片
- `LazyImage.tsx` - 懒加载图片（支持 blurhash）
- shadcn/ui 组件

## API 配置

在 `src/lib/api.ts` 中配置：
```typescript
const API_BASE = 'http://127.0.0.1:79/api';
```

## 构建生产版本

```bash
npm run build
npm start
```

或使用 Docker：
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 样式

使用 Tailwind CSS，深色主题通过 `<html class="dark">` 启用。
配色方案定义在 CSS 变量中，支持亮色/暗色切换。shadcn/ui 组件配置在 `components.json` 中。
