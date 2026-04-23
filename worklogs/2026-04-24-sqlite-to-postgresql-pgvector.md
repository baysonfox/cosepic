# SQLite → PostgreSQL 18 + pgvector 迁移方案

## 背景

Cosepic 后端当前使用 SQLite（SQLModel + SQLAlchemy 同步），需要迁移到 PostgreSQL 18 + pgvector 为后续 Embedding 功能铺路。

**有利条件**：
- 本地无历史 SQLite 数据需要迁移（`backend/data/` 目录不存在）
- 所有查询已经是纯 ORM，无 SQLite 专用语法
- `.env` 已配置 PostgreSQL 连接串

**本次范围**：只做驱动切换 + 基础设施铺设，**不加 embedding 列**。

## 技术决策

| 项目 | 决策 |
|------|------|
| 迁移工具 | 引入 Alembic 做版本化迁移 |
| 测试数据库 | 全量迁到 PostgreSQL 容器（放弃 SQLite 内存） |
| 容器化范围 | 只容器化 PG + pgvector；后端/前端保持本地启动 |
| 镜像 | `pgvector/pgvector:pg18` |
| DB 驱动 | `psycopg[binary,pool]` v3 |
| 同步/异步 | 保持同步，不做异步化改造 |

## 提交计划

1. `chore: add pgvector docker compose for local dev` — 新建 docker-compose.yml
2. `feat(backend): add .env.example and default db_url to postgres` — 配置默认值
3. `feat(backend): switch engine to postgresql+psycopg` — 移除 SQLite 参数，加 psycopg/pgvector 依赖
4. `feat(backend): add alembic with pgvector extension + initial schema` — 引入 Alembic，手写 pgvector 扩展迁移 + autogenerate 初始 schema
5. `test(backend): migrate fixtures to postgres with savepoint rollback` — 重写 conftest，测试用 PG 临时库 + savepoint rollback
6. `feat(backend): update seed script for postgres + truncate-reset` — 重写 seed 脚本，改 truncate；更新 playwright.config.ts

## 风险与注意点

1. **Alembic 与 `create_all` 的 schema 漂移**
   - 从 lifespan 摘除 `create_db_and_tables()` 后，新增字段必须走 `alembic revision --autogenerate`
   - 后续可加 `alembic check` 做 CI 守护

2. **autogenerate 审阅**
   - 审阅点：桥表复合 PK、UniqueConstraint、datetime → TIMESTAMP WITHOUT TIME ZONE
   - TZ 问题留给后续 PR（改为 TIMESTAMPTZ）

3. **端口 5432 占用**
   - 主机若已有本地 PG 会端口冲突
   - 临时方案：停掉本地 PG 或手动改 docker-compose.yml 端口映射

4. **保留函数 `create_db_and_tables`**
   - 测试 fixture 和 seed 兜底在用，不能删
   - 加注释说明只做 dev/test 兜底，生产用 Alembic

5. **pgvector Python 端暂不挂 event listener**
   - 没有 `Vector()` 列就不需要 `register_vector(conn)`
   - 将来加 embedding 列时在 `database.py` 里注册 `event.listens_for(engine, "connect")`

6. **USTC mirror 镜像可用性**
   - `pyproject.toml` 锁定 USTC pip 镜像
   - 若 `psycopg[binary]` / `pgvector` 新版本同步未到位，临时用 `--index-url https://pypi.org/simple`

## 关键文件

| 文件 | 动作 |
|------|------|
| `docker-compose.yml` | 新建（仓库根） |
| `backend/.env.example` | 新建 |
| `backend/app/config.py` | 改默认 database_url |
| `backend/app/database.py` | 去 SQLite 参数、加 pool_pre_ping |
| `backend/app/main.py` | lifespan 移除 create_db_and_tables() |
| `backend/pyproject.toml` | 加 psycopg、pgvector、alembic |
| `backend/alembic.ini` | 新建 |
| `backend/alembic/env.py` | 新建 |
| `backend/alembic/versions/0001_enable_pgvector.py` | 新建（手写） |
| `backend/alembic/versions/<hash>_initial_schema.py` | 新建（autogenerate） |
| `backend/tests/conftest.py` | 重写 fixture |
| `backend/tests/unit/test_seed_playwright_data.py` | 重写 |
| `backend/scripts/seed_playwright_data.py` | 重写为 PG + TRUNCATE |
| `frontend/playwright.config.ts` | 更新 webServer 命令 |

## 状态

**已完成并验证**（2026-04-24）

### 验证结果

- PostgreSQL 容器启动成功（healthy）
- pgvector 扩展已注册
- Alembic 迁移执行成功
- 111 个测试全部通过（耗时 7.77s）
- API 正常响应（`/api/v1/system/health` → `{"status":"ok"}`）
