"""Task API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.config import settings
from app.dependencies import get_db
from app.schemas.common import PaginatedResponse
from app.services import task_service


class TaskOut(BaseModel):
    id: int
    task_type: str
    target_type: str
    target_id: int
    status: str
    error_message: str | None


router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=PaginatedResponse[TaskOut])
def list_tasks(
    status: str | None = None,
    task_type: str | None = None,
    page: int = 1,
    page_size: int | None = None,
    db: Session = Depends(get_db),
):
    """List background tasks with optional filters."""
    ps = min(page_size or settings.default_page_size, settings.max_page_size)
    tasks, total = task_service.list_tasks(db, status=status, task_type=task_type, page=page, page_size=ps)
    return PaginatedResponse(items=tasks, total=total, page=page, page_size=ps)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID."""
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
