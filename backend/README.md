# Cosepic 后端

FastAPI 后端服务，提供图集管理、Coser 管理、作品管理、图片服务等 API。
端口默认 79（用户本地 8000 端口被占用）。
## 环境要求

- Python 3.10+
- SQLite3
- 支持 AVIF 格式的图片处理库

## 安装

```bash
pip install -r requirements..txt
```

## 依赖

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pillow>=10.0.0
pillow-avif-plugin>=1.5.0
imagehash>=4.3.0
blurhash>=1.1.0
python-multipart>=0.0.9
aiofiles>=24.0.0
```

## 启动

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 79
```

开发模式（热重载）：
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 79 --reload
```

## API 端点

### 图集管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cosplays | 图集列表（分页） |
| GET | /api/cosplays/{id} | 图集详情 |
| GET | /api/cosplays/{id}/images | 获取图集图片列表（含 blurhash） |
| POST | /api/admin/cosplays | 创建图集（自动生成缩略图和 pHash） |
| DELETE | /api/admin/cosplays/{id} | 删除图集 |

### Coser 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cosers | Coser 列表（分页） |
| GET | /api/cosers/{id} | Coser 详情 |
| POST | /api/admin/cosers | 创建 Coser |
| DELETE | /api/admin/cosers/{id} | 删除 Coser |

### Parody 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/parodies | 作品列表（分页） |
| GET | /api/parodies/{id} | 作品详情 |
| POST | /api/admin/parodies | 创建作品 |
| DELETE | /api/admin/parodies/{id} | 删除作品 |

### 文件服务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/files/image/{cosplay_id}/{filename} | 获取原图 |
| GET | /api/files/thumbnail/{cosplay_id}/{filename} | 获取缩略图 |
| GET | /api/files/cover/{cosplay_id} | 获取封面图 |

### 去重管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/dedup/find | 查找重复/相似图片 |

## 创建图集

通过 API 创建图集时，系统会自动：

1. 扫描目录中的图片文件
2. 生成 AVIF 格式缩略图
3. 计算图片 pHash（用于去重）
4. 计算图片 blurhash（用于前端加载占位）
5. 提取封面图

### 示例：创建图集

```bash
curl -X POST "http://localhost:79/api/admin/cosplays" \
  -F "title=卡芙卡 Kafka" \
  -F "coser_id=1" \
  -F "parody_id=1" \
  -F "dir_path=/Users/baysonfox/cosepic/data/cosplays/kafka"
```

### 示例：创建 Coser

```bash
curl -X POST "http://localhost:79/api/admin/cosers" \
  -F "name=Hokunaimeko"
```

### 示例：创建 Parody

```bash
curl -X POST "http://localhost:79/api/admin/parodies" \
  -F "name=崩坏：星穹铁道"
```

## 图片处理

### 缩略图生成

- 尺寸：宽度 400px，高度自适应
- 格式：AVIF
- 存储位置：`data/thumbnails/{cosplay_id}/`

### pHash 去重

- 创建图集时自动计算每张图片的 pHash
- 存储在 `image_hashes` 表中
- 可通过 `/api/admin/dedup/find` 查找：
  - **完全相同**：pHash 完全相同
  - **相似图片**：汉明距离 < 10

### BlurHash

- 创建图集时自动计算 blurhash
- 用于前端图片加载时显示模糊占位图
- 编码参数：4x3 components

## 数据库

- 位置：`../data/db. sqlite`
- ORM：SQLAlchemy
- 迁移：暂不支持自动迁移，手动修改 `models.py`

### 数据表

- `cosplays` - 图集
- `cosers` - Coser
- `parodies` - 作品/角色
- `image_hashes` - 图片哈希（pHash + blurhash）

## 目录结构

```
backend/
├── main.              # FastAPI 应用入口
├── models.            # SQLAlchemy 模型定义
├── schemas.           # Pydantic schemas
├── database.          # 数据库配置
├── routers/           # API 路由
│   ├── cosplays.      # 图集 API
│   ├── cosers.        # Coser API
│   ├── parodies.      # 作品 API
│   ├── files.         # 文件服务
│   └── admin.         # 管理 API
└── services/          # 业务逻辑
    └── thumbnail.     # 缩略图生成服务
```

## 生产部署

使用 Gunicorn：
```bash
pip install gunicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:79
```

使用 Docker：
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements. .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 79

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "79"]
```