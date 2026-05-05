"""Embedding API routes — 去重检测和状态查询."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.dependencies import get_db
from app.models.pack import Pack
from app.schemas.embedding import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    EmbeddingStatsResponse,
    PackEmbeddingStatusResponse,
    ProcessEmbeddingResponse,
)
from app.services import embedding_service

router = APIRouter(prefix="/api/v1/embeddings", tags=["embeddings"])


class EmbeddingStatusResponse(BaseModel):
    processing_packs: list[dict]


@router.get("/status", response_model=EmbeddingStatusResponse)
def get_embedding_status(db: Session = Depends(get_db)):
    """查询正在处理的 Pack 状态."""
    processing = embedding_service.get_embedding_status(db)
    return EmbeddingStatusResponse(processing_packs=processing)


@router.get("/stats", response_model=EmbeddingStatsResponse)
def get_embedding_stats(db: Session = Depends(get_db)):
    """查询 embedding 覆盖统计."""
    stats = embedding_service.get_embedding_stats(db)
    return EmbeddingStatsResponse(**stats)


@router.get(
    "/pack/{pack_id}/status",
    response_model=PackEmbeddingStatusResponse,
)
def get_pack_embedding_status(pack_id: int, db: Session = Depends(get_db)):
    """查询指定 Pack 的 embedding 处理状态."""
    status = embedding_service.get_pack_embedding_status(db, pack_id)
    if not status:
        raise HTTPException(
            status_code=404,
            detail=f"Pack {pack_id} not found or has no images",
        )
    return PackEmbeddingStatusResponse(**status)


@router.post(
    "/process/{pack_id}",
    response_model=ProcessEmbeddingResponse,
)
def process_pack_embeddings(
    pack_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """触发指定 Pack 的 embedding 处理（异步）."""
    pack = db.get(Pack, pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail=f"Pack {pack_id} not found")
    background_tasks.add_task(
        embedding_service.process_remaining_embeddings,
        db,
        pack_id,
    )
    return ProcessEmbeddingResponse(pack_id=pack_id, status="queued")


@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(
    body: DuplicateCheckRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """检测 Pack 是否与现有 Pack 重复.

    - 抽样 5 张图片进行检测
    - 如果没有重复，在后台异步处理剩余图片的 embedding
    """
    duplicates = await embedding_service.check_pack_duplicates(db, body.pack_id)

    if not duplicates:
        background_tasks.add_task(
            embedding_service.process_remaining_embeddings,
            db,
            body.pack_id,
        )

    return DuplicateCheckResponse(
        pack_id=body.pack_id,
        has_duplicates=len(duplicates) > 0,
        duplicates=duplicates,
    )
