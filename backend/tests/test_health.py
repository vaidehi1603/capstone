def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"success": True, "message": "Backend is healthy"}

def test_database_health_check(client):
    response = client.get("/api/v1/health/database")
    assert response.status_code == 200
    assert response.json() == {"success": True, "message": "Database connection is healthy"}
