from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_plantations_and_biomass():
    res = client.get("/api/plantations")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 5
    first_props = data["features"][0]["properties"]
    assert first_props["agb_t_ha"] > 0
    assert first_props["co2e_t_ha"] > first_props["carbon_t_ha"]


def test_timeseries_and_alerts():
    res = client.get("/api/plantations/ASM-KZ-01/timeseries")
    assert res.status_code == 200
    body = res.json()
    assert len(body["timeseries"]) == 24

    alerts = client.get("/api/alerts").json()
    assert len(alerts) >= 1


def test_field_log_calibration_and_approval():
    payload = {
        "plantation_id": "ASM-NM-03",
        "officer_name": "K. Kalita (RFO)",
        "observed_dbh_cm": 8.2,
        "observed_height_m": 4.9,
        "observed_survival_pct": 74.5,
        "notes": "Gap-filling completed and verified.",
        "photo_name": "nameri_replanted.jpg",
    }
    res = client.post("/api/field-logs", json=payload)
    assert res.status_code == 200
    body = res.json()
    log_id = body["log"]["log_id"]
    assert body["updated_plantation"]["properties"]["survival_rate"] == 74.5
    assert body["updated_plantation"]["properties"]["field_calibrated"] is True

    app_res = client.post(f"/api/field-logs/{log_id}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["dfo_approved"] is True


def test_admin_endpoints():
    users = client.get("/api/admin/users").json()
    assert len(users) >= 5

    sp_res = client.post(
        "/api/admin/species",
        json={"key": "hollong", "label": "Hollong", "wood_density": 0.65, "root_to_shoot": 0.26},
    )
    assert sp_res.status_code == 200
    assert sp_res.json()["wood_density"] == 0.65

    cfg_res = client.post(
        "/api/admin/settings",
        json={"min_survival_pct": 75.0, "ndvi_alert_threshold": 0.65, "sensitive_zone_masking": True},
    )
    assert cfg_res.status_code == 200
    assert cfg_res.json()["sensitive_zone_masking"] is True

    eo_res = client.post("/api/admin/refresh-eo")
    assert eo_res.status_code == 200
    assert eo_res.json()["status"] == "refreshed"

    audit = client.get("/api/admin/audit-logs").json()
    assert len(audit) >= 3
