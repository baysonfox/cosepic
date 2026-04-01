"""Integration tests for Pack API endpoints."""

from app.models.relations import PackCharacter, PackCoser, PackTag
from tests.conftest import make_asset, make_character, make_coser, make_pack, make_tag, make_work


class TestPackCRUD:
    def test_create_pack(self, client):
        r = client.post("/api/v1/packs", json={
            "title": "Test Pack",
            "dir_path": "/tmp/test",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Test Pack"
        assert data["original_folder_name"] == "test"
        assert data["status"] == "active"

    def test_create_pack_custom_folder_name(self, client):
        r = client.post("/api/v1/packs", json={
            "title": "Custom",
            "dir_path": "/tmp/custom",
            "original_folder_name": "MyFolder",
        })
        assert r.json()["original_folder_name"] == "MyFolder"

    def test_get_pack(self, client, db):
        pack = make_pack(db)
        r = client.get(f"/api/v1/packs/{pack.id}")
        assert r.status_code == 200
        assert r.json()["title"] == "TestPack"

    def test_get_pack_not_found(self, client):
        assert client.get("/api/v1/packs/999").status_code == 404

    def test_update_pack(self, client, db):
        pack = make_pack(db, title="Old")
        r = client.patch(f"/api/v1/packs/{pack.id}", json={"title": "New"})
        assert r.status_code == 200
        assert r.json()["title"] == "New"

    def test_delete_pack(self, client, db):
        pack = make_pack(db)
        r = client.delete(f"/api/v1/packs/{pack.id}")
        assert r.status_code == 204
        assert client.get(f"/api/v1/packs/{pack.id}").status_code == 404

    def test_delete_pack_cascades_assets(self, client, db):
        pack = make_pack(db)
        make_asset(db, pack_id=pack.id, file_name="a.jpg", relative_path="a.jpg")
        r = client.delete(f"/api/v1/packs/{pack.id}")
        assert r.status_code == 204


class TestPackList:
    def test_list_packs_empty(self, client):
        r = client.get("/api/v1/packs")
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_list_packs_with_data(self, client, db):
        make_pack(db, title="Pack1", dir_path="/tmp/p1", original_folder_name="p1")
        make_pack(db, title="Pack2", dir_path="/tmp/p2", original_folder_name="p2")
        r = client.get("/api/v1/packs")
        assert r.json()["total"] == 2

    def test_search_packs(self, client, db):
        make_pack(db, title="Kafka Cosplay", dir_path="/tmp/k", original_folder_name="k")
        make_pack(db, title="Amiya Cosplay", dir_path="/tmp/a", original_folder_name="a")
        r = client.get("/api/v1/packs", params={"q": "kafka"})
        assert r.json()["total"] == 1
        assert r.json()["items"][0]["title"] == "Kafka Cosplay"

    def test_pagination(self, client, db):
        for i in range(5):
            make_pack(db, title=f"P{i}", dir_path=f"/tmp/{i}", original_folder_name=f"{i}")
        r = client.get("/api/v1/packs", params={"page": 1, "page_size": 2})
        assert len(r.json()["items"]) == 2
        assert r.json()["total"] == 5

    def test_sort_by_title_asc(self, client, db):
        make_pack(db, title="Bravo", dir_path="/tmp/b", original_folder_name="b")
        make_pack(db, title="Alpha", dir_path="/tmp/a", original_folder_name="a")
        r = client.get("/api/v1/packs", params={"sort": "title", "order": "asc"})
        items = r.json()["items"]
        assert items[0]["title"] == "Alpha"
        assert items[1]["title"] == "Bravo"


class TestPackFilters:
    def test_filter_by_coser(self, client, db):
        coser = make_coser(db, name="FilterCoser")
        p1 = make_pack(db, title="WithCoser", dir_path="/tmp/wc", original_folder_name="wc")
        p2 = make_pack(db, title="WithoutCoser", dir_path="/tmp/woc", original_folder_name="woc")
        db.add(PackCoser(pack_id=p1.id, coser_id=coser.id, is_primary=True))
        db.commit()

        r = client.get("/api/v1/packs", params={"coser_ids": coser.id})
        assert r.json()["total"] == 1
        assert r.json()["items"][0]["title"] == "WithCoser"

    def test_filter_by_character(self, client, db):
        char = make_character(db, name="FilterChar")
        p1 = make_pack(db, title="WithChar", dir_path="/tmp/wch", original_folder_name="wch")
        make_pack(db, title="Without", dir_path="/tmp/wo", original_folder_name="wo")
        db.add(PackCharacter(pack_id=p1.id, character_id=char.id, is_primary=True))
        db.commit()

        r = client.get("/api/v1/packs", params={"character_ids": char.id})
        assert r.json()["total"] == 1

    def test_filter_by_work(self, client, db):
        work = make_work(db, name="FilterWork")
        char = make_character(db, name="WChar", work_id=work.id)
        p1 = make_pack(db, title="WithWork", dir_path="/tmp/ww", original_folder_name="ww")
        make_pack(db, title="NoWork", dir_path="/tmp/nw", original_folder_name="nw")
        db.add(PackCharacter(pack_id=p1.id, character_id=char.id, is_primary=True))
        db.commit()

        r = client.get("/api/v1/packs", params={"work_ids": work.id})
        assert r.json()["total"] == 1

    def test_filter_by_tag(self, client, db):
        tag = make_tag(db, name="outdoor")
        p1 = make_pack(db, title="Tagged", dir_path="/tmp/t", original_folder_name="t")
        make_pack(db, title="Untagged", dir_path="/tmp/u", original_folder_name="u")
        db.add(PackTag(pack_id=p1.id, tag_id=tag.id))
        db.commit()

        r = client.get("/api/v1/packs", params={"tag_ids": tag.id})
        assert r.json()["total"] == 1

    def test_filter_has_video(self, client, db):
        make_pack(db, title="HasVideo", dir_path="/tmp/hv", original_folder_name="hv", video_count=2)
        make_pack(db, title="NoVideo", dir_path="/tmp/nv", original_folder_name="nv", video_count=0)

        r = client.get("/api/v1/packs", params={"has_video": True})
        assert r.json()["total"] == 1
        assert r.json()["items"][0]["title"] == "HasVideo"

    def test_filter_by_status(self, client, db):
        make_pack(db, title="Active", dir_path="/tmp/act", original_folder_name="act", status="active")
        make_pack(db, title="Archived", dir_path="/tmp/arc", original_folder_name="arc", status="archived")

        r = client.get("/api/v1/packs", params={"status": "archived"})
        assert r.json()["total"] == 1
        assert r.json()["items"][0]["title"] == "Archived"


class TestPackDetail:
    def test_detail_includes_cosers(self, client, db):
        coser = make_coser(db, name="DetailCoser")
        pack = make_pack(db)
        db.add(PackCoser(pack_id=pack.id, coser_id=coser.id, is_primary=True))
        db.commit()

        r = client.get(f"/api/v1/packs/{pack.id}")
        assert r.status_code == 200
        cosers = r.json()["cosers"]
        assert len(cosers) == 1
        assert cosers[0]["name"] == "DetailCoser"
        assert cosers[0]["is_primary"] is True

    def test_detail_includes_characters_with_work(self, client, db):
        work = make_work(db, name="Arknights")
        char = make_character(db, name="Amiya", work_id=work.id)
        pack = make_pack(db)
        db.add(PackCharacter(pack_id=pack.id, character_id=char.id, is_primary=True))
        db.commit()

        r = client.get(f"/api/v1/packs/{pack.id}")
        chars = r.json()["characters"]
        assert len(chars) == 1
        assert chars[0]["name"] == "Amiya"
        assert chars[0]["work_name"] == "Arknights"
