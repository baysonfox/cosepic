"""Alembic environment.

Reads the database URL from ``app.config.settings`` (the same Pydantic
Settings instance the application uses), attaches ``SQLModel.metadata`` as
the autogenerate target, and imports :mod:`app.models` so every SQLModel
table is registered on the metadata before comparison runs.
"""

from logging.config import fileConfig

import sqlmodel
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

from alembic import context

from app.config import settings
from app import models  # noqa: F401 — register all SQLModel tables

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def _render_item(type_, obj, autogen_context):
    """Render SQLModel's AutoString as plain sa.String to avoid
    forcing generated migrations to import sqlmodel."""
    if type_ == "type" and isinstance(obj, sqlmodel.sql.sqltypes.AutoString):
        length = getattr(obj, "length", None)
        return f"sa.String(length={length})" if length else "sa.String()"
    return False


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL without a live connection)."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_item=_render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations bound to a live connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_item=_render_item,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
