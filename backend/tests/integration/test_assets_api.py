"""Integration tests for asset serving, thumbnails, BlurHash, and tasks."""

import os
import tempfile

import pytest
from PIL import Image
from sqlmodel import select

from app.models.asset import Asset
from app.models.task import Task
from tests.conftest import make_asset, make_pack


@pytest.fixture()
def pack_with_images(db):
    """Create a pack with real image files in a temp directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create real JPEG images
        for name in ["001.jpg", "002.jpg", "003.png"]:
            img = Image.new("RGB", (800, 1200), color="red")
            img.save(os.path.join(tmpdir, name))

        pack = make_pack(db, title="ImgPack", dir_path=tmpdir)

        for idx, name in enumerate(["001.jpg", "002.jpg", "003.png"]):
            make_asset(
                db, pack_id=pack.id,
                file_name=name, relative_path=name,
                asset_type="image", sort_index=idx,
            )

        yield pack, tmpdir


class TestAssetListing:
    def test_list_pack_assets(self, client, db):
        pack = make_pack(db)
        make_asset(db, pack_id=pack.id, file_name="a.jpg", relative_path="a.jpg", sort_index=0)
        make_asset(db, pack_id=pack.id, file_name="b.jpg", relative_path="b.jpg", sort_index=1)

        r = client.get(f"/api/v1/packs/{pack.id}/assets")
        assert r.status_code == 200
        assert len(r.json()) == 2
        assert r.json()[0]["file_name"] == "a.jpg"

    def test_list_pack_assets_empty(self, client, db):
        pack = make_pack(db)
        r = client.get(f"/api/v1/packs/{pack.id}/assets")
        assert r.status_code == 200
        assert r.json() == []


class TestFileServing:
    def test_get_original_file(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        asset = db.exec(
            select(Asset).where(Asset.pack_id == pack.id).limit(1),
        ).first()
        r = client.get(f"/api/v1/assets/{asset.id}/file")
        assert r.status_code == 200

    def test_get_original_file_not_found(self, client):
        r = client.get("/api/v1/assets/9999/file")
        assert r.status_code == 404

    def test_get_thumbnail_not_found(self, client):
        r = client.get("/api/v1/assets/9999/thumbnail")
        assert r.status_code == 404


class TestThumbnailGeneration:
    def test_regenerate_creates_thumbnails(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        r = client.post(f"/api/v1/packs/{pack.id}/regenerate")
        assert r.status_code == 200
        assert r.json()["thumbnails_generated"] == 3
        assert r.json()["hashes_computed"] == 3

    def test_regenerate_updates_asset_status(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        assets = db.exec(select(Asset).where(Asset.pack_id == pack.id)).all()
        for asset in assets:
            db.refresh(asset)
            assert asset.thumbnail_status == "generated"
            assert asset.blurhash is not None

    def test_regenerate_creates_task_record(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        task = db.exec(
            select(Task).where(
                Task.target_type == "pack",
                Task.target_id == pack.id,
            ),
        ).first()
        assert task is not None
        assert task.status == "done"

    def test_thumbnail_file_can_be_served(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        asset = db.exec(
            select(Asset).where(Asset.pack_id == pack.id).limit(1),
        ).first()
        r = client.get(f"/api/v1/assets/{asset.id}/thumbnail")
        assert r.status_code == 200
        assert r.headers["content-type"] == "image/avif"


class TestCoverSetting:
    def test_set_cover(self, client, db):
        pack = make_pack(db)
        asset = make_asset(db, pack_id=pack.id)
        r = client.patch(
            f"/api/v1/packs/{pack.id}/cover",
            json={"asset_id": asset.id},
        )
        assert r.status_code == 200

        r = client.get(f"/api/v1/packs/{pack.id}")
        assert r.json()["cover_asset_id"] == asset.id


class TestTasksAPI:
    def test_list_tasks_empty(self, client):
        r = client.get("/api/v1/tasks")
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_list_tasks_after_regenerate(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        r = client.get("/api/v1/tasks")
        assert r.json()["total"] >= 1

    def test_get_task(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        r = client.get("/api/v1/tasks")
        task_id = r.json()["items"][0]["id"]

        r = client.get(f"/api/v1/tasks/{task_id}")
        assert r.status_code == 200
        assert r.json()["task_type"] == "generate_thumbnails"

    def test_filter_tasks_by_status(self, client, db, pack_with_images):
        pack, _ = pack_with_images
        client.post(f"/api/v1/packs/{pack.id}/regenerate")

        r = client.get("/api/v1/tasks", params={"status": "done"})
        assert r.json()["total"] >= 1

        r = client.get("/api/v1/tasks", params={"status": "pending"})
        assert r.json()["total"] == 0
