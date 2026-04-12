"""Integration tests for Work, Character, Outfit, and Tag API endpoints."""

from tests.conftest import make_character, make_outfit, make_work


# ===================================================================
# Works
# ===================================================================

class TestWorksAPI:
    def test_create_work(self, client):
        r = client.post("/api/v1/works", json={"name": "明日方舟"})
        assert r.status_code == 201
        assert r.json()["name"] == "明日方舟"

    def test_list_works(self, client, db):
        make_work(db, name="原神")
        make_work(db, name="崩坏:星穹铁道")
        r = client.get("/api/v1/works")
        assert r.status_code == 200
        assert r.json()["total"] == 2

    def test_search_works(self, client, db):
        make_work(db, name="原神")
        make_work(db, name="崩坏:星穹铁道")
        r = client.get("/api/v1/works", params={"q": "崩坏"})
        assert len(r.json()["items"]) == 1

    def test_get_work(self, client, db):
        w = make_work(db, name="TestWork")
        r = client.get(f"/api/v1/works/{w.id}")
        assert r.status_code == 200
        assert r.json()["name"] == "TestWork"

    def test_update_work(self, client, db):
        w = make_work(db, name="OldName")
        r = client.patch(f"/api/v1/works/{w.id}", json={"name": "NewName"})
        assert r.status_code == 200
        assert r.json()["name"] == "NewName"

    def test_delete_work_unlinks_characters(self, client, db):
        w = make_work(db, name="ToDelete")
        c = make_character(db, name="Char", work_id=w.id)
        r = client.delete(f"/api/v1/works/{w.id}")
        assert r.status_code == 204
        # Character still exists but work_id is null
        r = client.get(f"/api/v1/characters/{c.id}")
        assert r.status_code == 200
        assert r.json()["work_id"] is None

    def test_get_work_not_found(self, client):
        assert client.get("/api/v1/works/999").status_code == 404


# ===================================================================
# Characters
# ===================================================================

class TestCharactersAPI:
    def test_create_character(self, client, db):
        w = make_work(db, name="ArkWork")
        r = client.post("/api/v1/characters", json={"name": "Amiya", "work_id": w.id})
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Amiya"
        assert data["work_name"] == "ArkWork"

    def test_create_character_no_work(self, client):
        r = client.post("/api/v1/characters", json={"name": "Original"})
        assert r.status_code == 201
        assert r.json()["work_id"] is None

    def test_list_characters_filter_by_work(self, client, db):
        w = make_work(db, name="FilterWork")
        make_character(db, name="C1", work_id=w.id)
        make_character(db, name="C2")
        r = client.get("/api/v1/characters", params={"work_id": w.id})
        assert r.json()["total"] == 1
        assert r.json()["items"][0]["name"] == "C1"

    def test_update_character(self, client, db):
        c = make_character(db, name="OldChar")
        r = client.patch(f"/api/v1/characters/{c.id}", json={"name": "NewChar"})
        assert r.status_code == 200
        assert r.json()["name"] == "NewChar"

    def test_clear_character_work(self, client, db):
        w = make_work(db, name="ArkWork")
        c = make_character(db, name="Amiya", work_id=w.id)
        r = client.patch(f"/api/v1/characters/{c.id}", json={"work_id": None})
        assert r.status_code == 200
        assert r.json()["work_id"] is None
        assert r.json()["work_name"] is None

    def test_delete_character_cascades_outfits(self, client, db):
        c = make_character(db, name="CharWithOutfit")
        o = make_outfit(db, name="Swimsuit", character_id=c.id)
        r = client.delete(f"/api/v1/characters/{c.id}")
        assert r.status_code == 204
        # Outfit is also gone
        assert client.get(f"/api/v1/outfits/{o.id}").status_code == 404

    def test_get_character_not_found(self, client):
        assert client.get("/api/v1/characters/999").status_code == 404


# ===================================================================
# Outfits
# ===================================================================

class TestOutfitsAPI:
    def test_create_outfit(self, client, db):
        c = make_character(db, name="Kafka")
        r = client.post("/api/v1/outfits", json={"name": "泳装", "character_id": c.id})
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "泳装"
        assert data["character_name"] == "Kafka"

    def test_list_outfits_filter_by_character(self, client, db):
        c1 = make_character(db, name="C1")
        c2 = make_character(db, name="C2")
        make_outfit(db, name="O1", character_id=c1.id)
        make_outfit(db, name="O2", character_id=c2.id)
        r = client.get("/api/v1/outfits", params={"character_id": c1.id})
        assert r.json()["total"] == 1

    def test_update_outfit(self, client, db):
        c = make_character(db, name="SomeChar")
        o = make_outfit(db, name="OldOutfit", character_id=c.id)
        r = client.patch(f"/api/v1/outfits/{o.id}", json={"name": "NewOutfit"})
        assert r.status_code == 200
        assert r.json()["name"] == "NewOutfit"

    def test_update_outfit_character(self, client, db):
        c1 = make_character(db, name="OldChar")
        c2 = make_character(db, name="NewChar")
        o = make_outfit(db, name="Switchable", character_id=c1.id)
        r = client.patch(
            f"/api/v1/outfits/{o.id}",
            json={"character_id": c2.id},
        )
        assert r.status_code == 200
        assert r.json()["character_id"] == c2.id
        assert r.json()["character_name"] == "NewChar"

    def test_delete_outfit(self, client, db):
        c = make_character(db, name="DelChar")
        o = make_outfit(db, name="DelOutfit", character_id=c.id)
        r = client.delete(f"/api/v1/outfits/{o.id}")
        assert r.status_code == 204


# ===================================================================
# Tags
# ===================================================================

class TestTagsAPI:
    def test_create_tag(self, client):
        r = client.post("/api/v1/tags", json={"name": "outdoor", "tag_type": "genre"})
        assert r.status_code == 201
        assert r.json()["tag_type"] == "genre"

    def test_list_tags(self, client):
        client.post("/api/v1/tags", json={"name": "t1"})
        client.post("/api/v1/tags", json={"name": "t2"})
        r = client.get("/api/v1/tags")
        assert r.json()["total"] == 2

    def test_update_tag(self, client):
        r = client.post("/api/v1/tags", json={"name": "old"})
        tag_id = r.json()["id"]
        r = client.patch(f"/api/v1/tags/{tag_id}", json={"name": "new", "tag_type": "style"})
        assert r.status_code == 200
        assert r.json()["name"] == "new"
        assert r.json()["tag_type"] == "style"

    def test_delete_tag(self, client):
        r = client.post("/api/v1/tags", json={"name": "todel"})
        tag_id = r.json()["id"]
        r = client.delete(f"/api/v1/tags/{tag_id}")
        assert r.status_code == 204

    def test_get_tag_not_found(self, client):
        assert client.get("/api/v1/tags/999").status_code == 404
