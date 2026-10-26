def test_get_departments_unauthorized(client):
    response = client.get("/api/v1/departments")
    assert response.status_code == 401

def test_login_and_get_departments(client):
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

def test_register_and_login_new_user(client):
    # 1. Register a new arbitrary user
    signup_payload = {
        "name": "Prof. Ananya Sen",
        "email": "ananya.sen@vesit.edu",
        "password": "securepassword123",
        "role": "HOD"
    }
    signup_res = client.post("/api/v1/auth/register", json=signup_payload)
    assert signup_res.status_code == 201
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    assert signup_data["user"]["email"] == "ananya.sen@vesit.edu"
    assert signup_data["user"]["role"] == "HOD"

    # 2. Login with newly registered credentials via OAuth2 password flow
    login_res = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "ananya.sen@vesit.edu", "password": "securepassword123"}
    )
    assert login_res.status_code == 200
    login_token = login_res.json()["access_token"]

    # 3. Verify user profile using issued JWT token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "ananya.sen@vesit.edu"
    assert me_data["name"] == "Prof. Ananya Sen"
    assert me_data["role"] == "HOD"
