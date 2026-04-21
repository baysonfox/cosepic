"""Tests for Playwright seed data script."""

import importlib.util
from pathlib import Path

from sqlmodel import select

from app.models import Asset, Character, Coser, Pack, Work

SCRIPT_PATH = Path(__file__).resolve().parents[2] / "scripts" / "seed_playwright_data.py"
SPEC = importlib.util.spec_from_file_location("seed_playwright_data", SCRIPT_PATH)
seed_playwright_data = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(seed_playwright_data)


def test_seed_script_honors_environment_paths(monkeypatch, tmp_path, db):
    data_dir = tmp_path / "custom_data"
    thumb_dir = data_dir / "thumbs"

    monkeypatch.setattr(seed_playwright_data, "DATA_DIR", data_dir)
    monkeypatch.setattr(seed_playwright_data, "THUMB_DIR", thumb_dir)

    seed_playwright_data.main(session=db)

    assert (data_dir / "packs" / "amiya_winter" / "cover.png").exists()
    assert (data_dir / "imports" / "鳗鱼霏儿 - 明日方舟 - 阿米娅 2p" / "01.png").exists()
    assert (thumb_dir / "1.avif").exists()

    assert db.exec(select(Coser)).all()
    assert db.exec(select(Work)).all()
    assert db.exec(select(Character)).all()
    assert db.exec(select(Pack)).all()
    assert db.exec(select(Asset)).all()
