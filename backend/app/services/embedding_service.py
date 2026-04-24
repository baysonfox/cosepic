"""Embedding service — 图片向量化和相似度搜索."""

import base64
import io
from pathlib import Path

import httpx
import numpy as np
from pgvector.psycopg import register_vector
from PIL import Image
from sqlmodel import Session, select, text

from app.config import settings
from app.models.asset import Asset
from app.models.duplicate_check import PackDuplicateCheck
from app.models.pack import Pack


async def generate_image_embedding(image_path: str | Path) -> list[float] | None:
    """为单张图片生成 embedding 向量.

    Args:
        image_path: 图片文件路径

    Returns:
        2560 维的 embedding 向量，失败返回 None
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
        data_uri = f"data:image/png;base64,{b64_str}"

        async with httpx.AsyncClient(timeout=30.0) as client:
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
                                    {"type": "image_url", "image_url": {"url": data_uri}},
                                ],
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
                        "input": [{"image": data_uri}],
                    },
                )
                response.raise_for_status()
                data = response.json()

        embedding_4096 = np.array(data["data"][0]["embedding"], dtype=np.float32)
        embedding_2560 = embedding_4096[: settings.embedding_dimension]

        norm = np.linalg.norm(embedding_2560)
        if norm > 0:
            embedding_2560 = embedding_2560 / norm

        return embedding_2560.tolist()

    except Exception as e:
        print(f"Error generating embedding for {image_path}: {e}")
        return None


async def generate_text_embedding(text: str) -> list[float] | None:
    """为文本生成 embedding 向量.

    Args:
        text: 搜索文本

    Returns:
        2560 维的 embedding 向量，失败返回 None
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
                                    {"type": "text", "text": text},
                                ],
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
                        "input": [{"text": text}],
                    },
                )
                response.raise_for_status()
                data = response.json()

        embedding_4096 = np.array(data["data"][0]["embedding"], dtype=np.float32)
        embedding_2560 = embedding_4096[: settings.embedding_dimension]

        norm = np.linalg.norm(embedding_2560)
        if norm > 0:
            embedding_2560 = embedding_2560 / norm

        return embedding_2560.tolist()

    except Exception as e:
        print(f"Error generating text embedding: {e}")
        return None


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

    for asset in sample_assets:
        if asset.embedding is None:
            await process_asset_embedding(db, asset.id, pack.dir_path)

    db.refresh(pack)
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
    """异步处理 Pack 中剩余图片的 embedding.

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

    processed = 0
    failed = 0

    for asset in assets:
        success = await process_asset_embedding(db, asset.id, pack.dir_path)
        if success:
            processed += 1
        else:
            failed += 1

    return {"processed": processed, "failed": failed}


async def semantic_search(
    db: Session,
    query_text: str,
    top_k: int | None = None,
) -> list[dict]:
    """基于文本的语义搜索.

    Args:
        db: 数据库会话
        query_text: 搜索文本
        top_k: 返回结果数量

    Returns:
        搜索结果列表
    """
    if top_k is None:
        top_k = settings.search_top_k

    query_embedding = await generate_text_embedding(query_text)
    if query_embedding is None:
        return []

    query = text("""
        SELECT
            a.id as asset_id,
            a.pack_id,
            a.file_name,
            p.title as pack_title,
            (1 - (embedding <-> CAST(:query_embedding AS halfvec)) / 2) as similarity
        FROM assets a
        JOIN packs p ON a.pack_id = p.id
        WHERE
            a.embedding IS NOT NULL
            AND a.asset_type = 'image'
        ORDER BY embedding <-> CAST(:query_embedding AS halfvec)
        LIMIT :top_k
    """)

    results = db.execute(
        query,
        {
            "query_embedding": str(query_embedding),
            "top_k": top_k,
        },
    ).all()

    return [
        {
            "asset_id": r.asset_id,
            "pack_id": r.pack_id,
            "pack_title": r.pack_title,
            "file_name": r.file_name,
            "similarity": r.similarity,
        }
        for r in results
    ]
