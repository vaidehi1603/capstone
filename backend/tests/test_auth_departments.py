def test_get_departments_unauthorized(client):
    response = client.get("/api/v1/departments")
    assert response.status_code == 401

def test_login_and_get_departments(client, setup_db):
    # Seed data first
    from app.db.seed import seed_data
    from tests.conftest import TestingSessionLocal
    db = TestingSessionLocal()
    seed_data(db)
    db.close()

    # Login
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    # Get departments
    response = client.get(
        "/api/v1/departments",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    assert data[0]["code"] == "ENG"
