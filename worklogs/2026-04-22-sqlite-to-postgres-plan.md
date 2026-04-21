# 2026-04-22 SQLite → PostgreSQL 18 + pgvector 迁移方案制定

## 背景

博士计划后续实现 Embedding 相关功能，SQLite 原生不支持向量存储与相似度检索，需要迁移到 PostgreSQL 18 + pgvector。本次任务只做基础迁移 + pgvector 就位，**不新增 embedding 列**，Embedding 功能留给后续 PR。

## 今日进展

### 1. 完成代码库勘察
- 后端当前：SQLModel 0.0.37 + SQLAlchemy 2.0.48（同步）、16 张表、零原生 SQL、零 SQLite 专用语法
- `.env` 已配置 PG 连接串 `postgresql+psycopg://cosepic:cosepic@127.0.0.1:5432/cosepic`（psycopg3 driver），但代码和 `config.py` 默认仍指向 SQLite
- `backend/data/` 目录不存在——**无历史 SQLite 数据需要迁移**，纯粹是驱动切换 + 基础设施搭建
- 测试 fixture（`conftest.py`）走 `sqlite://` 内存库 + `StaticPool`
- Playwright E2E 的 `webServer` 临时覆盖 `DATABASE_URL=sqlite:///playwright.sqlite` 跑
- `seed_playwright_data.py` 直接 `create_engine` 到 SQLite 文件 + `DB_PATH.unlink()` 重置

### 2. 确认技术决策
跟博士确认了三个关键选型：
| 项目 | 决策 |
|------|------|
| 迁移工具 | 引入 **Alembic** 做版本化迁移 |
| 测试数据库 | 全量迁到 PostgreSQL 容器（放弃 SQLite 内存） |
| 容器化范围 | 只容器化 PG + pgvector；后端 `uv run`、前端 `npm run dev` 保持本地启动 |

其他默认选型：镜像用 `pgvector/pgvector:pg18`（PG18 + 扩展一体）、驱动 `psycopg[binary,pool]` v3、保持同步不异步化、`pgvector` Python 包现在就装做准备。

### 3. 方案落地到 plan 文件
完整方案写在 `/Users/baysonfox/.claude/plans/sqlite-postgresql-18-pgvector-hazy-donut.md`，博士已 LGTM。拆成 6 个 commit（README 按博士意愿不重建）：

1. `chore: add pgvector docker compose for local dev`
2. `feat(backend): add .env.example and default db_url to postgres`
3. `feat(backend): switch engine to postgresql+psycopg`
4. `feat(backend): add alembic with pgvector extension + initial schema`
5. `test(backend): migrate fixtures to postgres with savepoint rollback`
6. `feat(backend): update seed script for postgres + truncate-reset`

## 风险与注意点

### 1. Alembic 与 `create_all` 的 schema 漂移
Commit 4 从 `app/main.py` 的 lifespan 摘除 `create_db_and_tables()` 后，开发新增字段时**必须**走 `alembic revision --autogenerate`；否则启动不报错但生产 schema 偏移。后续可加 `alembic check` 做 CI 守护（本次不做）。保留 `database.py` 里的 `create_db_and_tables` 函数作为测试 fixture 和 seed 脚本的首跑兜底。

### 2. Autogenerate 输出需要审阅
SQLModel → SQLAlchemy 转换存在几个易错点，生成的 `initial_schema` 迁移**必须 diff 审阅**：
- 4 张桥表（`pack_coser / pack_character / pack_outfit / pack_tag`）的**复合主键**
- `Coser.name` / `CoserAlias.alias` / `Work.name` / `Tag.name` 的 `UniqueConstraint`
- `Character` 的 `uq_character_name_work`、`Outfit` 的 `uq_outfit_name_character`
- `datetime` 默认生成 `TIMESTAMP WITHOUT TIME ZONE`，`datetime.now(timezone.utc)` 存进去会丢 TZ 信息。本次不改（SQLite 也没有真 TZ，不算回归），留后续 PR 统一迁 `TIMESTAMPTZ`

### 3. 端口 5432 占用
主机若已有本地 PG 会端口冲突。本次**不做**端口环境变量化（`COSEPIC_PG_PORT` 之类）；冲突处理：临时停本地 PG，或手动改 `docker-compose.yml` 的端口映射。

### 4. 测试 fixture 的 savepoint 隔离边界
采用 session 级临时 DB + 每测试外层事务 + `join_transaction_mode="create_savepoint"` 方案，工厂函数 `make_coser` 等里的 `session.commit()` 会变成 `RELEASE SAVEPOINT`，测试结束 `trans.rollback()` 整体回滚。
- **连接池陷阱**：TestClient 请求和 fixture session **共享单一 connection**，如果有测试启动 `ThreadPoolExecutor` 另开 session，新 session 的数据对主 savepoint 不可见。当前 `app/services` 没有 background tasks，暂时无风险——将来加异步任务时要重新评估。
- **速度成本**：测试单个 5–20ms（vs SQLite in-memory ~1ms），冷启动 1–2s，全套预期慢 2–3 倍。可接受。

### 5. pgvector Python 端暂不挂 event listener
本次没有任何 `Vector()` 列，所以不需要 `register_vector(conn)`。将来加 embedding 列时，要在 `database.py` 里注册：
```python
from sqlalchemy import event
from pgvector.psycopg import register_vector

@event.listens_for(engine, "connect")
def _register(dbapi_conn, _):
    register_vector(dbapi_conn)
```

### 6. USTC mirror 可用性
`backend/pyproject.toml` 锁了 USTC pip 镜像。若 `psycopg[binary]` / `pgvector` 新版本同步没到位，临时 `uv add --index-url https://pypi.org/simple ...` 绕过。

### 7. Alembic 自动生成的文件名
默认 Alembic 用 hex hash 命名迁移文件。计划里在 `alembic.ini` 设 `file_template = %%(rev)s_%%(slug)s` 得到 `<hash>_initial_schema.py` 这种可读文件名；手写的 `0001_enable_pgvector.py` 也是按这个 template。

### 8. 保留 `check_same_thread=False` 的代码点
已验证只有 4 处引用 SQLite 专用参数，全部在变更清单内：
- `backend/app/database.py`
- `backend/tests/conftest.py`
- `backend/scripts/seed_playwright_data.py`
- `backend/tests/unit/test_seed_playwright_data.py`

## 下一步

按 plan 文件的 6 个 commit 顺序实施，每 commit 独立可测试（commit 3 之后 app 启动会暂时报错，这是预期，commit 4 `alembic upgrade head` 后恢复）。
