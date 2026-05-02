"""Embedding service — 图片向量化和去重检测."""

import base64
import io
from pathlib import Path

import httpx
import numpy as np
from PIL import Image
from sqlmodel import Session, func, select, text

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
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            img_bytes = buffer.getvalue()

        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"
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


async def generate_image_embedding(image_path: str | Path) -> list[float] | None:
    """为单张图片生成 embedding 向量（兼容接口，内部使用批量方法）."""
    embeddings = await generate_image_embeddings([image_path])
    return embeddings[0] if embeddings else None


async def generate_image_embeddings(
    image_paths: list[str | Path],
) -> list[list[float] | None]:
    """为多张图片批量生成 embedding 向量，一次 API 请求完成.

    Args:
        image_paths: 图片文件路径列表

    Returns:
        与输入一一对应的 embedding 列表，编码失败或 API 错误的项为 None
    """
    if not image_paths:
        return []

    # 编码图片
    data_uris = []
    for path in image_paths:
        data_uris.append(_encode_image(path))

    valid_uris = [uri for uri in data_uris if uri is not None]
    if not valid_uris:
        return [None] * len(image_paths)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 尝试 vLLM
                content_parts = [
                    {"type": "image_url", "image_url": {"url": uri}}
                    for uri in valid_uris
                ]
                response = await client.post(
                    settings.embedding_vllm_url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "model": settings.embedding_model,
                        "messages": [
                            {
                                "role": "user",
                                "content": content_parts,
                            },
                        ],
                    },
                )
                response.raise_for_status()
                data = response.json()
            except Exception as vllm_error:
                print(f"vLLM failed, falling back to SiliconFlow: {vllm_error}")
                response = await client.post(
                    settings.embedding_api_url,
                    headers={
                        "Authorization": f"Bearer {settings.embedding_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.embedding_model,
                        "input": [{"image": uri} for uri in valid_uris],
                    },
                )
                response.raise_for_status()
                data = response.json()

        embeddings = _parse_embedding(data)

        # 将结果映射回原始顺序
        valid_idx = 0
        results: list[list[float] | None] = []
        for uri in data_uris:
            if uri is not None:
                if valid_idx < len(embeddings):
                    results.append(embeddings[valid_idx])
                else:
                    results.append(None)
                valid_idx += 1
            else:
                results.append(None)
        return results

    except Exception as e:
        print(f"Error generating batch embeddings: {e}")
        return [None] * len(image_paths)


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

    # 批量生成样本 embedding
    needs_embedding = [
        a for a in sample_assets if a.embedding is None
    ]
    if needs_embedding:
        paths = [Path(pack.dir_path) / a.relative_path for a in needs_embedding]
        embeddings = await generate_image_embeddings(paths)
        for asset, emb in zip(needs_embedding, embeddings):
            if emb is not None:
                asset.embedding = emb
                db.add(asset)
        db.commit()
        db.refresh(pack)

    # 重新加载样本（确保 embedding 已填充）
    sample_assets = [db.get(Asset, a.id) for a in sample_assets]
    sample_assets = [a for a in sample_assets if a and a.embedding is not None]

    if not sample_assets:
        return []

    duplicates = []
    threshold = settings.duplicate_similarity_threshold

    for sample_asset in sample_assets:
        if sample_asset.embedding is None:
            continue

        query = text("""
            SELECT
                a.id as asset_id,
                a.pack_id,
                p.title as pack_title,
                (1 - (embedding <-> CAST(:query_embedding AS halfvec)) / 2) as similarity
            FROM assets a
            JOIN packs p ON a.pack_id = p.id
            WHERE
                a.embedding IS NOT NULL
                AND a.pack_id != :pack_id
                AND a.asset_type = 'image'
            ORDER BY embedding <-> CAST(:query_embedding AS halfvec)
            LIMIT 1
        """)

        embedding_str = str(sample_asset.embedding)
        if embedding_str.startswith("HalfVector("):
            embedding_str = embedding_str[11:-1]

        result = db.execute(
            query,
            {
                "query_embedding": embedding_str,
                "pack_id": pack_id,
            },
        ).first()

        if result and result.similarity >= threshold:
            existing = next(
                (d for d in duplicates if d["duplicate_pack_id"] == result.pack_id),
                None,
            )

            if existing:
                if result.similarity > existing["max_similarity"]:
                    existing["max_similarity"] = result.similarity
                    existing["matched_asset_id"] = sample_asset.id
                    existing["duplicate_asset_id"] = result.asset_id
            else:
                duplicates.append({
                    "duplicate_pack_id": result.pack_id,
                    "duplicate_pack_title": result.pack_title,
                    "max_similarity": result.similarity,
                    "matched_asset_id": sample_asset.id,
                    "duplicate_asset_id": result.asset_id,
                })

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
    total_packs = db.exec(select(Pack)).all()

    total_assets = db.exec(
        select(func.count()).where(Asset.asset_type == "image")
    ).one()
    total_embeddings = db.exec(
        select(func.count()).where(
            Asset.asset_type == "image",
            Asset.embedding.isnot(None),
        )
    ).one()

    stats = {
        "total_packs": len(total_packs),
        "total_assets": total_assets,
        "embeddings_count": total_embeddings,
        "completed_packs": 0,
        "incomplete_packs": [],
        "no_embedding_packs": [],
    }

    for pack in total_packs:
        assets = db.exec(
            select(Asset).where(
                Asset.pack_id == pack.id,
                Asset.asset_type == "image",
            )
        ).all()

        if not assets:
            continue

        total = len(assets)
        with_embedding = sum(1 for a in assets if a.embedding is not None)

        if with_embedding == total:
            stats["completed_packs"] += 1
        elif with_embedding == 0:
            stats["no_embedding_packs"].append({
                "pack_id": pack.id,
                "pack_title": pack.title,
                "total_images": total,
            })
        else:
            stats["incomplete_packs"].append({
                "pack_id": pack.id,
                "pack_title": pack.title,
                "total_images": total,
                "processed_images": with_embedding,
                "progress": with_embedding / total,
            })

    return stats
