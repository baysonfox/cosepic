"""Embedding service — 图片向量化和去重检测."""

import asyncio
import base64
import io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
import numpy as np
from PIL import Image
from sqlmodel import Session, col, func, select, text

from app.config import settings
from app.models.asset import Asset
from app.models.duplicate_check import PackDuplicateCheck
from app.models.pack import Pack


def _encode_image(image_path: str | Path) -> str | None:
    """将单张图片编码为 data URI.

    Args:
        image_path: 图片文件路径

    Returns:
        data URI 字符串，失败返回 None
    """
    try:
        with Image.open(image_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")

            max_size = settings.embedding_image_max_size
            if img.width > max_size or img.height > max_size:
                if img.width > img.height:
                    new_width = max_size
                    new_height = int(img.height * max_size / img.width)
                else:
                    new_height = max_size
                    new_width = int(img.width * max_size / img.height)
                img = img.resize((new_width, new_height), Image.Resampling.BOX)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            img_bytes = buffer.getvalue()

        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"
    except Exception as e:
        print(f"Error encoding image {image_path}: {e}")
        return None


def _parse_embedding(data: dict) -> list[list[float]]:
    """从 API 响应中提取 embedding 列表，截取并归一化.

    Returns:
        每个元素是一个 embedding 向量（list[float]），按 index 排序
    """
    items = sorted(data["data"], key=lambda x: x.get("index", 0))
    results = []
    for item in items:
        emb_4096 = np.array(item["embedding"], dtype=np.float32)
        emb = emb_4096[: settings.embedding_dimension]
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        results.append(emb.tolist())
    return results


async def _vllm_single_image(
    client: httpx.AsyncClient,
    uri: str,
    sem: asyncio.Semaphore,
) -> list[float] | None:
    """单张图片发给 vLLM 获取 embedding，返回向量或 None."""
    async with sem:
        try:
            response = await client.post(
                settings.embedding_vllm_url,
                headers={"Content-Type": "application/json"},
                json={
                    "model": settings.embedding_model,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": uri}},
                            ],
                        },
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()
            embeddings = _parse_embedding(data)
            return embeddings[0] if embeddings else None
        except Exception:
            return None


async def _siliconflow_batch(
    client: httpx.AsyncClient,
    uris: list[str],
) -> list[list[float] | None]:
    """批量图片发给 SiliconFlow 获取 embedding."""
    response = await client.post(
        settings.embedding_api_url,
        headers={
            "Authorization": f"Bearer {settings.embedding_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.embedding_model,
            "input": [{"image": uri} for uri in uris],
        },
    )
    response.raise_for_status()
    return _parse_embedding(response.json())


async def generate_image_embedding(image_path: str | Path) -> list[float] | None:
    """为单张图片生成 embedding 向量（兼容接口，内部使用批量方法）."""
    embeddings = await generate_image_embeddings([image_path])
    return embeddings[0] if embeddings else None


async def generate_image_embeddings(
    image_paths: list[str | Path],
) -> list[list[float] | None]:
    """为多张图片批量生成 embedding 向量.

    采用流水线架构：编码和 API 请求重叠执行，编码产出一张就立即送入
    vLLM 推理队列，不需要等全部编码完成。失败的图片用 SiliconFlow
    batch 补救。

    Args:
        image_paths: 图片文件路径列表

    Returns:
        与输入一一对应的 embedding 列表，编码失败或 API 错误的项为 None
    """
    if not image_paths:
        return []

    n = len(image_paths)
    results: list[list[float] | None] = [None] * n
    data_uris: list[str | None] = [None] * n
    failed_uris: list[str] = []
    failed_indices: list[int] = []
    concurrency = settings.embedding_vllm_concurrency

    # (index, uri | None) — None 是哨兵，表示生产者结束
    queue: asyncio.Queue[tuple[int, str | None] | None] = asyncio.Queue(
        maxsize=concurrency * 2,
    )

    async def _encode_producer(pool: ThreadPoolExecutor) -> None:
        """在线程池中编码图片，完成一张就推入队列."""
        loop = asyncio.get_running_loop()
        for idx, path in enumerate(image_paths):
            uri = await loop.run_in_executor(pool, _encode_image, path)
            await queue.put((idx, uri))
        # 通知所有消费者退出
        for _ in range(concurrency):
            await queue.put(None)

    async def _vllm_consumer(
        client: httpx.AsyncClient,
        sem: asyncio.Semaphore,
    ) -> None:
        """从队列取已编码的图片，发给 vLLM."""
        while True:
            item = await queue.get()
            if item is None:
                break
            idx, uri = item
            if uri is None:
                continue
            data_uris[idx] = uri
            emb = await _vllm_single_image(client, uri, sem)
            if emb is not None:
                results[idx] = emb
            else:
                failed_uris.append(uri)
                failed_indices.append(idx)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            sem = asyncio.Semaphore(concurrency)
            with ThreadPoolExecutor() as pool:
                await asyncio.gather(
                    _encode_producer(pool),
                    *[_vllm_consumer(client, sem) for _ in range(concurrency)],
                )

            # SiliconFlow batch 补救
            if failed_uris:
                print(
                    f"vLLM {len(failed_uris)}/{n} failed, "
                    f"falling back to SiliconFlow"
                )
                sf_embeddings = await _siliconflow_batch(client, failed_uris)
                for idx, emb in zip(failed_indices, sf_embeddings):
                    if emb is not None:
                        results[idx] = emb

    except Exception as e:
        print(f"Error generating batch embeddings: {e}")

    return results


async def process_asset_embedding(db: Session, asset_id: int, pack_dir: str) -> bool:
    """为单个 Asset 生成并保存 embedding.

    Args:
        db: 数据库会话
        asset_id: Asset ID
        pack_dir: Pack 目录路径

    Returns:
        成功返回 True，失败返回 False
    """
    asset = db.get(Asset, asset_id)
    if not asset or asset.asset_type != "image":
        return False

    image_path = Path(pack_dir) / asset.relative_path
    if not image_path.exists():
        return False

    embedding = await generate_image_embedding(image_path)
    if embedding is None:
        return False

    asset.embedding = embedding
    db.add(asset)
    db.commit()

    return True


def select_sample_assets(db: Session, pack_id: int, count: int = 5) -> list[Asset]:
    """从 Pack 中等间隔抽取图片样本.

    Args:
        db: 数据库会话
        pack_id: Pack ID
        count: 抽样数量

    Returns:
        Asset 列表
    """
    assets = db.exec(
        select(Asset)
        .where(Asset.pack_id == pack_id, Asset.asset_type == "image")
        .order_by(Asset.sort_index),
    ).all()

    if not assets:
        return []

    if len(assets) <= count:
        return list(assets)

    step = len(assets) / count
    indices = [int(i * step) for i in range(count)]
    return [assets[i] for i in indices]


async def check_pack_duplicates(db: Session, pack_id: int) -> list[dict]:
    """检测新导入的 Pack 是否与现有 Pack 重复.

    采用批量 API 调用，一次请求为所有样本图片生成 embedding.

    Args:
        db: 数据库会话
        pack_id: 新导入的 Pack ID

    Returns:
        重复检测结果列表
    """
    pack = db.get(Pack, pack_id)
    if not pack:
        return []

    sample_assets = select_sample_assets(db, pack_id, settings.duplicate_sample_count)
    if not sample_assets:
        return []

    # 收集已有 embedding，仅为缺失的样本调用推理
    sample_embeddings: dict[int, list[float]] = {}
    needs_embedding: list[Asset] = []
    for a in sample_assets:
        if a.embedding is not None:
            sample_embeddings[a.id] = a.embedding
        else:
            needs_embedding.append(a)

    if needs_embedding:
        paths = [Path(pack.dir_path) / a.relative_path for a in needs_embedding]
        embeddings = await generate_image_embeddings(paths)
        for asset, emb in zip(needs_embedding, embeddings):
            if emb is not None:
                sample_embeddings[asset.id] = emb
                asset.embedding = emb
                db.add(asset)

    if not sample_embeddings:
        return []

    threshold = settings.duplicate_similarity_threshold

    # 格式化所有样本 embedding 为 pgvector halfvec 字符串
    def _to_halfvec_str(emb: list[float]) -> str:
        return "[" + ",".join(str(float(v)) for v in emb) + "]"

    sample_data = [
        (sid, _to_halfvec_str(emb))
        for sid, emb in sample_embeddings.items()
    ]

    # 构建 VALUES CTE，一次性查询所有样本的最近邻
    values_rows = ", ".join(
        f"({sid}, '{emb}'::halfvec)" for sid, emb in sample_data
    )
    query = text(f"""
        WITH samples(sample_id, sample_emb) AS (
            VALUES {values_rows}
        ),
        ranked AS (
            SELECT
                s.sample_id,
                a.id as asset_id,
                a.pack_id,
                (1 - (a.embedding <-> s.sample_emb) / 2) as similarity,
                ROW_NUMBER() OVER (
                    PARTITION BY s.sample_id
                    ORDER BY a.embedding <-> s.sample_emb
                ) as rn
            FROM samples s
            CROSS JOIN LATERAL (
                SELECT id, pack_id, embedding
                FROM assets
                WHERE embedding IS NOT NULL
                    AND pack_id != :pack_id
                    AND asset_type = 'image'
                ORDER BY embedding <-> s.sample_emb
                LIMIT 5
            ) a
        )
        SELECT sample_id, asset_id, pack_id, similarity
        FROM ranked
        WHERE rn = 1 AND similarity >= :threshold
    """)

    rows = db.execute(
        query,
        {"pack_id": pack_id, "threshold": threshold},
    ).all()

    if not rows:
        return []

    # 批量查询 pack titles
    duplicate_pack_ids = list({row.pack_id for row in rows})
    packs = db.exec(
        select(Pack).where(col(Pack.id).in_(duplicate_pack_ids))
    ).all()
    pack_titles = {p.id: p.title for p in packs}

    # 聚合：按 duplicate_pack_id 取 max_similarity
    best_per_pack: dict[int, dict] = {}
    for row in rows:
        pid = row.pack_id
        if pid not in best_per_pack or row.similarity > best_per_pack[pid]["max_similarity"]:
            best_per_pack[pid] = {
                "duplicate_pack_id": pid,
                "duplicate_pack_title": pack_titles.get(pid, ""),
                "max_similarity": row.similarity,
                "matched_asset_id": row.sample_id,
                "duplicate_asset_id": row.asset_id,
            }

    duplicates = list(best_per_pack.values())

    for dup in duplicates:
        check_record = PackDuplicateCheck(
            pack_id=pack_id,
            duplicate_pack_id=dup["duplicate_pack_id"],
            max_similarity=dup["max_similarity"],
            matched_asset_id=dup["matched_asset_id"],
            duplicate_asset_id=dup["duplicate_asset_id"],
        )
        db.add(check_record)

    db.commit()

    return duplicates


async def process_remaining_embeddings(db: Session, pack_id: int) -> dict:
    """异步处理 Pack 中剩余图片的 embedding，使用批量 API.

    Args:
        db: 数据库会话
        pack_id: Pack ID

    Returns:
        处理结果统计
    """
    pack = db.get(Pack, pack_id)
    if not pack:
        return {"processed": 0, "failed": 0}

    assets = db.exec(
        select(Asset)
        .where(
            Asset.pack_id == pack_id,
            Asset.asset_type == "image",
            Asset.embedding.is_(None),
        ),
    ).all()

    batch_size = 10
    processed = 0
    failed = 0

    for i in range(0, len(assets), batch_size):
        batch = assets[i : i + batch_size]
        paths = [Path(pack.dir_path) / a.relative_path for a in batch]
        embeddings = await generate_image_embeddings(paths)

        for asset, emb in zip(batch, embeddings):
            if emb is not None:
                asset.embedding = emb
                db.add(asset)
                processed += 1
            else:
                failed += 1

        db.commit()

    return {"processed": processed, "failed": failed}


def get_embedding_status(db: Session) -> list[dict]:
    """查询正在处理的 Pack（有部分 Asset 没有 embedding）."""
    result = db.exec(
        text("""
            SELECT
                p.id as pack_id,
                p.title as pack_title,
                COUNT(a.id) as total_images,
                COUNT(a.embedding) as processed_images
            FROM packs p
            JOIN assets a ON a.pack_id = p.id AND a.asset_type = 'image'
            GROUP BY p.id, p.title
            HAVING COUNT(a.embedding) < COUNT(a.id) AND COUNT(a.embedding) > 0
        """)
    ).all()

    return [
        {
            "pack_id": row[0],
            "pack_title": row[1],
            "total_images": row[2],
            "processed_images": row[3],
            "progress": row[3] / row[2] if row[2] > 0 else 0,
        }
        for row in result
    ]


def get_pack_embedding_status(db: Session, pack_id: int) -> dict | None:
    """查询单个 Pack 的 embedding 处理状态.

    Args:
        db: 数据库会话
        pack_id: Pack ID

    Returns:
        包含 total_images, processed_images, progress 的字典，
        Pack 不存在或无图片时返回 None
    """
    pack = db.get(Pack, pack_id)
    if not pack:
        return None

    total = db.exec(
        select(func.count()).where(
            Asset.pack_id == pack_id,
            Asset.asset_type == "image",
        )
    ).one()

    if total == 0:
        return None

    processed = db.exec(
        select(func.count()).where(
            Asset.pack_id == pack_id,
            Asset.asset_type == "image",
            Asset.embedding.isnot(None),
        )
    ).one()

    return {
        "pack_id": pack_id,
        "total_images": total,
        "processed_images": processed,
        "progress": processed / total if total > 0 else 0.0,
    }


def get_embedding_stats(db: Session) -> dict:
    """查询 embedding 覆盖统计."""
    total_assets = db.exec(
        select(func.count()).where(Asset.asset_type == "image")
    ).one()
    total_embeddings = db.exec(
        select(func.count()).where(
            Asset.asset_type == "image",
            Asset.embedding.isnot(None),
        )
    ).one()

    rows = db.exec(
        text("""
            SELECT
                p.id as pack_id,
                p.title as pack_title,
                COUNT(a.id) as total_images,
                COUNT(a.embedding) as processed_images
            FROM packs p
            JOIN assets a ON a.pack_id = p.id AND a.asset_type = 'image'
            GROUP BY p.id, p.title
        """)
    ).all()

    completed = 0
    incomplete_packs = []
    no_embedding_packs = []
    for row in rows:
        pack_id, pack_title, total, processed = row
        if processed == total:
            completed += 1
        elif processed == 0:
            no_embedding_packs.append({
                "pack_id": pack_id,
                "pack_title": pack_title,
                "total_images": total,
            })
        else:
            incomplete_packs.append({
                "pack_id": pack_id,
                "pack_title": pack_title,
                "total_images": total,
                "processed_images": processed,
                "progress": processed / total,
            })

    return {
        "total_packs": len(rows),
        "total_assets": total_assets,
        "embeddings_count": total_embeddings,
        "completed_packs": completed,
        "incomplete_packs": incomplete_packs,
        "no_embedding_packs": no_embedding_packs,
    }
