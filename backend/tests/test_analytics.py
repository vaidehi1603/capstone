def test_create_electricity_and_analytics(client, setup_db):
    from app.db.seed import seed_data
    from tests.conftest import TestingSessionLocal
    db = TestingSessionLocal()
    seed_data(db)
    
    # Login as admin to get token
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create electricity data
    # Department 1 should exist from seed
    payload = {
        "department_id": 1,
        "kwh": 1000.0,
        "timestamp": "2023-10-01T12:00:00Z",
        "source": "Grid"
    }
    response = client.post("/api/v1/electricity/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["kwh"] == 1000.0

    # 2. Check analytics
    response = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert response.status_code == 200
    dashboard = response.json()
    
    # 1000 kWh * 0.82 = 820 kgCO2e
    assert dashboard["total_campus_emissions_kgco2e"] == 820.0
    assert dashboard["scope_breakdown"]["scope_2"] == 820.0
    assert len(dashboard["top_departments"]) == 1
    assert dashboard["top_departments"][0]["total_kgco2e"] == 820.0
    assert dashboard["top_departments"][0]["department_id"] == 1

def test_missing_emission_factor_rejection(client, setup_db):
    from app.db.seed import seed_data
    from tests.conftest import TestingSessionLocal
    from app.models.emission_factor import EmissionFactor
    
    db = TestingSessionLocal()
    seed_data(db)
    # Remove emission factors to test rejection
    db.query(EmissionFactor).delete()
    db.commit()

    # Login
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create electricity data
    payload = {
        "department_id": 1,
        "kwh": 500.0,
        "timestamp": "2023-10-01T12:00:00Z",
        "source": "Grid"
    }
    response = client.post("/api/v1/electricity/", json=payload, headers=headers)
    # Should be rejected with 400 Bad Request
    assert response.status_code == 400
    assert "No active emission factor is available" in response.json()["detail"]
