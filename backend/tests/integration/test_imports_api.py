"""Integration tests for the import workflow: scan → commit."""

import os
import tempfile

import pytest
from PIL import Image

from app.models.asset import Asset
from app.models.character import Character
from app.models.coser import Coser
from app.models.relations import PackCharacter, PackCoser, PackOutfit
from app.models.suggestion import MetadataSuggestion
from app.models.work import Work


@pytest.fixture()
def media_root():
    """Create a temp directory tree simulating cosplay image packs."""
    with tempfile.TemporaryDirectory() as root:
        # Pack 1: single coser, single character, with outfit
        p1 = os.path.join(root, "Hokunaimeko - 明日方舟 - Kafka 泳装 3p")
        os.makedirs(p1)
        for name in ["001.jpg", "002.jpg", "003.png"]:
            img = Image.new("RGB", (800, 1200), color="red")
            img.save(os.path.join(p1, name))

        # Pack 2: multiple cosers, multiple characters
        p2 = os.path.join(root, "CoserA,CoserB - 原神 - 甘雨,申鹤 2p 1v")
        os.makedirs(p2)
        for name in ["a.jpg", "b.webp"]:
            img = Image.new("RGB", (800, 1200), color="blue")
            img.save(os.path.join(p2, name))
        open(os.path.join(p2, "clip.mp4"), "wb").write(b"\x00" * 200)

        # Non-matching directory (no " - " separator)
        p3 = os.path.join(root, "random_folder")
        os.makedirs(p3)
        img = Image.new("RGB", (800, 1200), color="green")
        img.save(os.path.join(p3, "img.jpg"))

        # Original work: use characters part as title, map character to placeholder
        p4 = os.path.join(root, "CoserOriginal - 原创 - 白兔女仆 5p")
        os.makedirs(p4)
        for name in ["o1.jpg", "o2.jpg"]:
            img = Image.new("RGB", (800, 1200), color="yellow")
            img.save(os.path.join(p4, name))

        yield root


class TestImportScan:
    def test_scan_returns_candidates(self, client, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        assert r.status_code == 200
        data = r.json()
        assert data["total_candidates"] == 4
        assert len(data["candidates"]) == 4

    def test_scan_parses_directory_names(self, client, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        candidates = {c["folder_name"]: c for c in r.json()["candidates"]}

        c1 = candidates["Hokunaimeko - 明日方舟 - Kafka 泳装 3p"]
        assert c1["detected_coser_names"] == "Hokunaimeko"
        assert c1["detected_work_name"] == "明日方舟"
        assert c1["detected_character_names"] == "Kafka 泳装"
        assert c1["photo_count"] == 3

        c2 = candidates["CoserA,CoserB - 原神 - 甘雨,申鹤 2p 1v"]
        assert c2["detected_coser_names"] == "CoserA,CoserB"
        assert c2["detected_work_name"] == "原神"
        assert c2["photo_count"] == 2
        assert c2["video_count"] == 1

        c3 = candidates["CoserOriginal - 原创 - 白兔女仆 5p"]
        assert c3["detected_work_name"] == "原创"
        assert c3["detected_title"] == "CoserOriginal - 原创 - 白兔女仆"
        assert c3["detected_character_names"] == "OriginalCharacter"

    def test_scan_detects_file_stats(self, client, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        candidates = {c["folder_name"]: c for c in r.json()["candidates"]}
        c1 = candidates["Hokunaimeko - 明日方舟 - Kafka 泳装 3p"]
        assert c1["total_size_bytes"] > 0

    def test_non_matching_folder_still_included(self, client, media_root):
        """Folders that don't match the naming pattern are still candidates."""
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        names = [c["folder_name"] for c in r.json()["candidates"]]
        assert "random_folder" in names

    def test_scan_returns_root_path(self, client, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        assert r.json()["root_path"] == media_root


class TestImportCommit:
    def test_commit_creates_packs(self, client, db, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        candidates = r.json()["candidates"]

        # Commit first two candidates
        r = client.post("/api/v1/imports/commit", json={
            "candidates": [
                {k: v for k, v in c.items() if k != "existing_pack_id"}
                for c in candidates[:2]
            ],
            "skip_duplicate_check": True,
        })
        assert r.status_code == 200
        assert r.json()["imported_count"] == 2
        assert len(r.json()["pack_ids"]) == 2

    def test_commit_creates_entities(self, client, db, media_root):
        from sqlmodel import select

        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})

        hokunaimeko = next(
            c for c in r.json()["candidates"]
            if "Hokunaimeko" in (c.get("detected_coser_names") or "")
        )
        payload = {k: v for k, v in hokunaimeko.items() if k != "existing_pack_id"}

        client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })

        coser = db.exec(
            select(Coser).where(Coser.name == "Hokunaimeko"),
        ).first()
        assert coser is not None

        work = db.exec(
            select(Work).where(Work.name == "明日方舟"),
        ).first()
        assert work is not None

    def test_commit_original_work_uses_placeholder_character(
        self, client, db, media_root,
    ):
        from sqlmodel import select

        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        original = next(
            c for c in r.json()["candidates"]
            if c["folder_name"] == "CoserOriginal - 原创 - 白兔女仆 5p"
        )
        payload = {k: v for k, v in original.items() if k != "existing_pack_id"}

        r = client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })
        pack_id = r.json()["pack_ids"][0]

        pack = client.get(f"/api/v1/packs/{pack_id}").json()
        assert pack["title"] == "CoserOriginal - 原创 - 白兔女仆"

        work = db.exec(select(Work).where(Work.name == "原创")).first()
        assert work is not None

        character = db.exec(
            select(Character).where(
                Character.name == "OriginalCharacter",
                Character.work_id == work.id,
            ),
        ).first()
        assert character is not None

    def test_commit_creates_assets(self, client, db, media_root):
        from sqlmodel import select

        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        first = r.json()["candidates"][0]
        payload = {k: v for k, v in first.items() if k != "existing_pack_id"}

        r = client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })
        pack_id = r.json()["pack_ids"][0]

        assets = db.exec(select(Asset).where(Asset.pack_id == pack_id)).all()
        assert len(assets) > 0

    def test_commit_creates_suggestions(self, client, db, media_root):
        from sqlmodel import select

        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})

        coser_candidate = next(
            c for c in r.json()["candidates"]
            if c.get("detected_coser_names")
        )
        payload = {
            k: v for k, v in coser_candidate.items() if k != "existing_pack_id"
        }

        r = client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })
        pack_id = r.json()["pack_ids"][0]

        suggestions = db.exec(
            select(MetadataSuggestion).where(
                MetadataSuggestion.pack_id == pack_id,
            ),
        ).all()
        assert len(suggestions) > 0
        assert all(s.source == "folder_parser" for s in suggestions)
        assert all(s.status == "accepted" for s in suggestions)

    def test_commit_sets_cover_asset(self, client, db, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        first = r.json()["candidates"][0]
        payload = {k: v for k, v in first.items() if k != "existing_pack_id"}

        r = client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })
        pack_id = r.json()["pack_ids"][0]

        pack = client.get(f"/api/v1/packs/{pack_id}").json()
        assert pack["cover_asset_id"] is not None

    def test_commit_generates_thumbnails(self, client, db, media_root):
        from sqlmodel import select

        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        first = r.json()["candidates"][0]
        payload = {k: v for k, v in first.items() if k != "existing_pack_id"}

        r = client.post("/api/v1/imports/commit", json={
            "candidates": [payload],
            "skip_duplicate_check": True,
        })
        pack_id = r.json()["pack_ids"][0]

        assets = db.exec(select(Asset).where(Asset.pack_id == pack_id)).all()
        image_assets = [
            asset for asset in assets if asset.asset_type == "image"
        ]
        assert image_assets
        assert all(
            asset.thumbnail_status == "generated" for asset in image_assets
        )
        assert all(asset.blurhash is not None for asset in image_assets)

    def test_commit_all_candidates(self, client, db, media_root):
        r = client.post("/api/v1/imports/scan", json={"root_path": media_root})
        candidates = r.json()["candidates"]
        payload = [
            {k: v for k, v in c.items() if k != "existing_pack_id"}
            for c in candidates
        ]

        r = client.post("/api/v1/imports/commit", json={
            "candidates": payload,
            "skip_duplicate_check": True,
        })
        assert r.json()["imported_count"] == 4
