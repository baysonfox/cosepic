"""Integration tests for Coser API endpoints."""

from sqlmodel import select

from tests.conftest import make_coser, make_pack
from app.models.relations import PackCoser


def test_list_cosers_empty(client):
    """GET /cosers returns empty list when no cosers exist."""
    r = client.get("/api/v1/cosers")
    assert r.status_code == 200
    data = r.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_create_coser(client):
    """POST /cosers creates a new Coser."""
    r = client.post("/api/v1/cosers", json={"name": "Hokunaimeko"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Hokunaimeko"
    assert data["id"] is not None
    assert data["pack_count"] == 0


def test_get_coser(client, db):
    """GET /cosers/{id} returns Coser detail."""
    coser = make_coser(db, name="TestCoser")
    r = client.get(f"/api/v1/cosers/{coser.id}")
    assert r.status_code == 200
    assert r.json()["name"] == "TestCoser"


def test_get_coser_not_found(client):
    """GET /cosers/999 returns 404."""
    r = client.get("/api/v1/cosers/999")
    assert r.status_code == 404


def test_update_coser(client, db):
    """PATCH /cosers/{id} updates Coser name."""
    coser = make_coser(db, name="OldName")
    r = client.patch(f"/api/v1/cosers/{coser.id}", json={"name": "NewName"})
    assert r.status_code == 200
    assert r.json()["name"] == "NewName"


def test_delete_coser(client, db):
    """DELETE /cosers/{id} removes a Coser."""
    coser = make_coser(db, name="ToDelete")
    r = client.delete(f"/api/v1/cosers/{coser.id}")
    assert r.status_code == 204

    r = client.get(f"/api/v1/cosers/{coser.id}")
    assert r.status_code == 404


def test_delete_coser_with_packs_blocked(client, db):
    """DELETE /cosers/{id} returns 409 when Coser has packs."""
    coser = make_coser(db, name="HasPacks")
    pack = make_pack(db, title="SomePack")
    link = PackCoser(pack_id=pack.id, coser_id=coser.id, is_primary=True)
    db.add(link)
    db.commit()

    r = client.delete(f"/api/v1/cosers/{coser.id}")
    assert r.status_code == 409


def test_search_cosers(client, db):
    """GET /cosers?q= filters by name."""
    make_coser(db, name="Alpha")
    make_coser(db, name="Beta")
    r = client.get("/api/v1/cosers", params={"q": "alp"})
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1
    assert r.json()["items"][0]["name"] == "Alpha"


def test_add_alias(client, db):
    """POST /cosers/{id}/aliases adds an alias."""
    coser = make_coser(db, name="MainName")
    r = client.post(f"/api/v1/cosers/{coser.id}/aliases", json={"alias": "AltName"})
    assert r.status_code == 201
    assert r.json()["alias"] == "AltName"

    # Alias appears in coser detail
    r = client.get(f"/api/v1/cosers/{coser.id}")
    assert "AltName" in r.json()["aliases"]


def test_search_by_alias(client, db):
    """GET /cosers?q= finds cosers by alias."""
    from app.models.coser import CoserAlias

    coser = make_coser(db, name="RealName")
    db.add(CoserAlias(coser_id=coser.id, alias="NickName"))
    db.commit()

    r = client.get("/api/v1/cosers", params={"q": "nick"})
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1
    assert r.json()["items"][0]["name"] == "RealName"


def test_delete_alias(client, db):
    """DELETE /cosers/{id}/aliases/{alias_id} removes an alias."""
    from app.models.coser import CoserAlias

    coser = make_coser(db, name="SomeCoser")
    alias = CoserAlias(coser_id=coser.id, alias="ToRemove")
    db.add(alias)
    db.commit()
    db.refresh(alias)

    r = client.delete(f"/api/v1/cosers/{coser.id}/aliases/{alias.id}")
    assert r.status_code == 204


# ===================================================================
# Delete orphans
# ===================================================================

class TestDeleteOrphanCosers:
    """POST /api/v1/cosers/delete-orphans removes Cosers without packs."""

    def test_returns_zero_when_empty(self, client):
        r = client.post("/api/v1/cosers/delete-orphans")
        assert r.status_code == 200
        assert r.json() == {"deleted": 0}

    def test_skips_cosers_with_packs(self, client, db):
        linked = make_coser(db, name="Linked")
        pack = make_pack(db, title="P1")
        db.add(PackCoser(pack_id=pack.id, coser_id=linked.id, is_primary=True))
        db.commit()

        r = client.post("/api/v1/cosers/delete-orphans")
        assert r.status_code == 200
        assert r.json() == {"deleted": 0}
        # Coser still exists.
        assert client.get(f"/api/v1/cosers/{linked.id}").status_code == 200

    def test_deletes_orphan_and_keeps_linked(self, client, db):
        from app.models.coser import CoserAlias

        orphan = make_coser(db, name="Orphan")
        db.add(CoserAlias(coser_id=orphan.id, alias="OrphanAlias"))
        db.commit()

        linked = make_coser(db, name="Linked")
        pack = make_pack(db, title="LinkedPack")
        db.add(PackCoser(pack_id=pack.id, coser_id=linked.id, is_primary=True))
        db.commit()

        r = client.post("/api/v1/cosers/delete-orphans")
        assert r.status_code == 200
        assert r.json() == {"deleted": 1}

        # Orphan and its alias are gone.
        assert client.get(f"/api/v1/cosers/{orphan.id}").status_code == 404
        remaining_aliases = db.exec(
            select(CoserAlias).where(CoserAlias.coser_id == orphan.id),
        ).all()
        assert remaining_aliases == []
        # Linked Coser is still around.
        assert client.get(f"/api/v1/cosers/{linked.id}").status_code == 200
