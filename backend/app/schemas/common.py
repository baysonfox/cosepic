"""Paginated response schema and helpers."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated list response."""

    items: list[T]
    total: int
    page: int
    page_size: int


class DeleteOrphansResponse(BaseModel):
    """Response body for bulk-orphan deletion endpoints."""

    deleted: int
