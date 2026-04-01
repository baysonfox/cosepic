"""Task management service — track background job status."""

from datetime import datetime, timezone

from sqlmodel import Session, col, func, select

from app.models.task import Task


def create_task(
    db: Session,
    *,
    task_type: str,
    target_type: str,
    target_id: int,
) -> Task:
    """Create a pending task record."""
    task = Task(task_type=task_type, target_type=target_type, target_id=target_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def mark_running(db: Session, task_id: int) -> None:
    """Mark a task as running."""
    task = db.get(Task, task_id)
    if task:
        task.status = "running"
        task.started_at = datetime.now(timezone.utc)
        db.add(task)
        db.commit()


def mark_done(db: Session, task_id: int) -> None:
    """Mark a task as done."""
    task = db.get(Task, task_id)
    if task:
        task.status = "done"
        task.finished_at = datetime.now(timezone.utc)
        db.add(task)
        db.commit()


def mark_failed(db: Session, task_id: int, error: str) -> None:
    """Mark a task as failed with an error message."""
    task = db.get(Task, task_id)
    if task:
        task.status = "failed"
        task.error_message = error
        task.finished_at = datetime.now(timezone.utc)
        db.add(task)
        db.commit()


def list_tasks(
    db: Session,
    *,
    status: str | None = None,
    task_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Task], int]:
    """Return a paginated list of tasks."""
    base = select(Task)
    count_q = select(func.count(Task.id))

    if status:
        base = base.where(Task.status == status)
        count_q = count_q.where(Task.status == status)
    if task_type:
        base = base.where(Task.task_type == task_type)
        count_q = count_q.where(Task.task_type == task_type)

    total = db.exec(count_q).one()
    tasks = db.exec(
        base.order_by(col(Task.id).desc()).offset((page - 1) * page_size).limit(page_size),
    ).all()
    return tasks, total


def get_task(db: Session, task_id: int) -> Task | None:
    """Return a single task."""
    return db.get(Task, task_id)
