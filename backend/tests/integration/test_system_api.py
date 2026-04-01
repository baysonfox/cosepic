"""Integration tests for system endpoints."""


def test_health_check(client):
    """GET /api/v1/system/health returns ok."""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_system_stats_empty(client):
    """GET /api/v1/system/stats returns zeros when DB is empty."""
    response = client.get("/api/v1/system/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["packs"] == 0
    assert data["assets"] == 0
    assert data["cosers"] == 0
    assert data["works"] == 0
    assert data["total_size_bytes"] == 0
