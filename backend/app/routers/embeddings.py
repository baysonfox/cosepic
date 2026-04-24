"""Embedding API routes — 去重检测和语义搜索."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session

from app.dependencies import get_db
from app.schemas.embedding import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from app.services import embedding_service

router = APIRouter(prefix="/api/v1/embeddings", tags=["embeddings"])


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


@router.post("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    body: SemanticSearchRequest,
    db: Session = Depends(get_db),
):
    """基于文本的语义搜索.

    - 输入文本描述
    - 返回最相似的 topk 张图片及其所属 Pack
    """
    results = await embedding_service.semantic_search(
        db,
        body.query_text,
        body.top_k,
    )

    if not results:
        raise HTTPException(status_code=404, detail="No results found")

    return SemanticSearchResponse(
        query_text=body.query_text,
        results=results,
    )
