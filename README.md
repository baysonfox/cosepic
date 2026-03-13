# Cosepic - Cosplay 图集浏览站

本地部署的 Cosplay 图集浏览网站，类似 galleryepic.xyz 的本地版本。

## 功能特性

- **图集管理** - 浏览、查看 Cosplay 图集详情
- **Coser 列表** - 按 Coser 查看作品
- **作品分类** - 按 Parody（作品/角色）分类
- **缩略图生成** - 自动生成 AVIF 格式缩略图
- **BlurHash 加载** - 图片加载时显示模糊占位图，流畅过渡到缩略图
- **pHash 去重** - 跨图集图片去重检测
- **后台管理** - 管理界面和去重管理页面

## 技术栈

- **后端**: FastAPI + SQLite + SQLAlchemy
- **前端**: Next.js 14 + React + Tailwind CSS + shadcn/ui
- **图片处理**: Pillow (AVIF 支持)
- **图片哈希**: imagehash (pHash) + blurhash

## 目录结构

```
cosepic/
├── backend/                 # FastAPI 后端
│   ├── main.py             # 应用入口
│   ├── models.py           # SQLAlchemy 模型
│   ├── schemas.py          # Pydantic schemas
│   ├── routers/            # API 路由
│   │   ├── cosplays.py     # 图集 API
│   │   ├── cosers.py       # Coser API
│   │   ├── parodies.py     # 作品 API
│   │   ├── files.py        # 文件服务
│   │   └── admin.py        # 管理 API
│   ├── services/           # 业务逻辑
│   │   └── thumbnail.py    # 缩略图生成
│   └── requirements.txt    # Python 依赖
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React 组件
│   │   └── lib/           # 工具函数
│   ├── package.json       # Node 依赖
│   └── README.md          # 前端文档
├── data/                   # 数据目录
│   ├── db. SQLite          # SQLite 数据库
│   ├── cosplays/           # 原始图片
│   └── thumbnails/         # 缩略图
└── README.md               # 本文档
```

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- SQLite3

### 安装依赖

**后端：**
```bash
cd backend
pip install -r requirements.txt
```

**前端：**
```bash
cd frontend
npm install
```

### 启动服务

**后端（端口 7900）：**
```bash
cd backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 79 --reload
# 或
python -m uvicorn backend.main:app --host 127.0.0.1 --port 79
```

**前端（端口 3000）：**
```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 查看。

### 添加图集

使用后台管理界面上传图集，或通过 API：

```bash
curl -X POST "http://localhost:79/api/admin/cosplays" \
  -F "title=图集标题" \
  -F "coser_id=1" \
  -F "parody_id=1" \
  -F "dir_path=/path/to/images"
```

## API 文档

### 图集

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cosplays | 图集列表 |
| GET | /api/cosplays/{id} | 图集详情 |
| GET | /api/cosplays/{id}/images | 图集图片列表 |

### Coser

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cosers | Coser 列表 |
| GET | /api/cosers/{id} | Coser 详情 |

### 作品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/parodies | 作品列表 |
| GET | /api/parodies/{id} | 作品详情 |

### 文件

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/files/image/{cosplay_id}/{filename} | 原图 |
| GET | /api/files/thumbnail/{cosplay_id}/{filename} | 缩略图 |
| GET | /api/files/cover/{cosplay_id} | 封面图 |

### 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/cosplays | 创建图集 |
| POST | /api/admin/cosers | 创建 Coser |
| POST | /api/admin/parodies | 创建作品 |
| GET | /api/admin/dedup/find | 查找重复图片 |

## 部署

### 生产环境

**后端：**
```bash
cd backend
# 使用 Gunicorn
pip install gunicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:79
```

**前端：**
```bash
cd frontend
npm run build
npm start
```

### 使用 Systemd（Linux）

创建 `/etc/systemd/system/cosepic-backend.service`：
```ini
[Unit]
Description=Cosepic Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/cosepic/backend
ExecStart=/usr/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 79
Restart=always

[Install]
WantedBy=multi-user.target
```

### 使用 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:79;
    }
}
```

## 图片格式支持

支持以下图片格式：
- AVIF（推荐）
- JPEG
- PNG
- WebP
- GIF

缩略图统一转换为 AVIF 格式。

## 常见问题

### Q: 如何修改端口？
- 后端：修改 `--port` 参数
- 前端：修改 `frontend/next.config.ts` 中的端口

### Q: 如何备份数据？
```bash
# 复制数据库
cp data/db. sqlite data/db. backup.sqlite

# 复制图片目录
cp -r data/cosplays data/cosplays.backup
```

### Q: 去重功能怎么用？
访问 `/admin/dedup` 页面，可查看：
- 完全相同（相同 pHash）
- 相似图片（汉明距离 < 10）

## 许可证

MIT License