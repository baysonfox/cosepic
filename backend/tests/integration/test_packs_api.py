"""Integration tests for Pack API endpoints."""

from app.models.relations import PackCharacter, PackCoser, PackTag
from tests.conftest import make_asset, make_character, make_coser, make_outfit, make_pack, make_tag, make_work


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


class TestPackRelationUpdate:
    """Tests for updating pack relations via PATCH."""

    def test_set_coser_ids(self, client, db):
        pack = make_pack(db)
        c1 = make_coser(db, name="Coser1")
        c2 = make_coser(db, name="Coser2")

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"coser_ids": [c1.id, c2.id]},
        )
        assert r.status_code == 200
        cosers = r.json()["cosers"]
        assert len(cosers) == 2
        names = {c["name"] for c in cosers}
        assert names == {"Coser1", "Coser2"}
        # First id is primary
        primary = [c for c in cosers if c["is_primary"]]
        assert len(primary) == 1
        assert primary[0]["name"] == "Coser1"

    def test_replace_coser_ids(self, client, db):
        pack = make_pack(db)
        c1 = make_coser(db, name="Old")
        c2 = make_coser(db, name="New")
        db.add(PackCoser(pack_id=pack.id, coser_id=c1.id, is_primary=True))
        db.commit()

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"coser_ids": [c2.id]},
        )
        cosers = r.json()["cosers"]
        assert len(cosers) == 1
        assert cosers[0]["name"] == "New"

    def test_clear_coser_ids(self, client, db):
        pack = make_pack(db)
        c1 = make_coser(db, name="ToRemove")
        db.add(PackCoser(pack_id=pack.id, coser_id=c1.id, is_primary=True))
        db.commit()

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"coser_ids": []},
        )
        assert r.json()["cosers"] == []

    def test_omitted_relation_unchanged(self, client, db):
        """When coser_ids is not in the request body, existing cosers stay."""
        pack = make_pack(db)
        c1 = make_coser(db, name="Keep")
        db.add(PackCoser(pack_id=pack.id, coser_id=c1.id, is_primary=True))
        db.commit()

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"title": "NewTitle"},
        )
        assert r.json()["title"] == "NewTitle"
        assert len(r.json()["cosers"]) == 1
        assert r.json()["cosers"][0]["name"] == "Keep"

    def test_set_character_ids(self, client, db):
        pack = make_pack(db)
        work = make_work(db, name="TestWork")
        ch = make_character(db, name="Char1", work_id=work.id)

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"character_ids": [ch.id]},
        )
        chars = r.json()["characters"]
        assert len(chars) == 1
        assert chars[0]["name"] == "Char1"
        assert chars[0]["work_name"] == "TestWork"

    def test_set_outfit_ids(self, client, db):
        pack = make_pack(db)
        ch = make_character(db, name="Char")
        outfit = make_outfit(db, name="Summer", character_id=ch.id)

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"outfit_ids": [outfit.id]},
        )
        outfits = r.json()["outfits"]
        assert len(outfits) == 1
        assert outfits[0]["name"] == "Summer"

    def test_set_tag_ids(self, client, db):
        pack = make_pack(db)
        t1 = make_tag(db, name="outdoor")
        t2 = make_tag(db, name="studio")

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={"tag_ids": [t1.id, t2.id]},
        )
        tags = r.json()["tags"]
        assert len(tags) == 2
        names = {t["name"] for t in tags}
        assert names == {"outdoor", "studio"}

    def test_update_multiple_relations_at_once(self, client, db):
        pack = make_pack(db)
        coser = make_coser(db, name="Multi")
        tag = make_tag(db, name="multi_tag")

        r = client.patch(
            f"/api/v1/packs/{pack.id}",
            json={
                "title": "Updated",
                "coser_ids": [coser.id],
                "tag_ids": [tag.id],
            },
        )
        assert r.json()["title"] == "Updated"
        assert len(r.json()["cosers"]) == 1
        assert len(r.json()["tags"]) == 1


class TestBulkOperations:
    """POST /api/v1/packs/bulk-delete and /bulk-regenerate."""

    def test_bulk_delete_success(self, client, db):
        p1 = make_pack(db, title="B1", dir_path="/tmp/b1", original_folder_name="b1")
        p2 = make_pack(db, title="B2", dir_path="/tmp/b2", original_folder_name="b2")
        p3 = make_pack(db, title="B3", dir_path="/tmp/b3", original_folder_name="b3")

        r = client.post(
            "/api/v1/packs/bulk-delete",
            json={"ids": [p1.id, p2.id, p3.id]},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["deleted"] == 3
        assert body["not_found"] == []
        # All gone
        for pid in (p1.id, p2.id, p3.id):
            assert client.get(f"/api/v1/packs/{pid}").status_code == 404

    def test_bulk_delete_partial(self, client, db):
        p1 = make_pack(db, title="P1", dir_path="/tmp/p1", original_folder_name="p1")
        p2 = make_pack(db, title="P2", dir_path="/tmp/p2", original_folder_name="p2")
        ghost = 999_999

        r = client.post(
            "/api/v1/packs/bulk-delete",
            json={"ids": [p1.id, ghost, p2.id]},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["deleted"] == 2
        assert body["not_found"] == [ghost]

    def test_bulk_delete_dedupes_ids(self, client, db):
        p1 = make_pack(db, title="Dup", dir_path="/tmp/dup", original_folder_name="dup")

        r = client.post(
            "/api/v1/packs/bulk-delete",
            json={"ids": [p1.id, p1.id, p1.id]},
        )
        assert r.status_code == 200
        body = r.json()
        # Service dedupes before lookup, so the duplicate ids are absorbed.
        assert body["deleted"] == 1
        assert body["not_found"] == []

    def test_bulk_delete_cascades_assets(self, client, db):
        p1 = make_pack(db, title="WithAssets", dir_path="/tmp/wa", original_folder_name="wa")
        make_asset(db, pack_id=p1.id, file_name="a.jpg", relative_path="a.jpg")
        make_asset(db, pack_id=p1.id, file_name="b.jpg", relative_path="b.jpg")

        r = client.post("/api/v1/packs/bulk-delete", json={"ids": [p1.id]})
        assert r.status_code == 200
        assert r.json()["deleted"] == 1
        # Assets should be gone — fetching the pack returns 404
        assert client.get(f"/api/v1/packs/{p1.id}").status_code == 404

    def test_bulk_delete_empty_ids_rejected(self, client):
        r = client.post("/api/v1/packs/bulk-delete", json={"ids": []})
        assert r.status_code == 422

    def test_bulk_delete_too_many_rejected(self, client):
        r = client.post(
            "/api/v1/packs/bulk-delete",
            json={"ids": list(range(1, 502))},
        )
        assert r.status_code == 422

    def test_bulk_regenerate_no_assets_succeeds(self, client, db):
        """Regenerate on a pack without assets is a successful no-op."""
        p1 = make_pack(db, title="NoAssets", dir_path="/tmp/na", original_folder_name="na")
        p2 = make_pack(db, title="NoAssets2", dir_path="/tmp/na2", original_folder_name="na2")

        r = client.post(
            "/api/v1/packs/bulk-regenerate",
            json={"ids": [p1.id, p2.id]},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["succeeded"] == 2
        assert body["failed"] == []
        assert body["thumbnails_generated"] == 0
        assert body["hashes_computed"] == 0

    def test_bulk_regenerate_partial(self, client, db):
        p1 = make_pack(db, title="Real", dir_path="/tmp/real", original_folder_name="real")
        ghost = 888_888

        r = client.post(
            "/api/v1/packs/bulk-regenerate",
            json={"ids": [p1.id, ghost]},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["succeeded"] == 1
        assert body["failed"] == [ghost]

    def test_bulk_regenerate_empty_ids_rejected(self, client):
        r = client.post("/api/v1/packs/bulk-regenerate", json={"ids": []})
        assert r.status_code == 422
