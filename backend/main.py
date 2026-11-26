"""FastAPI backend for AranyaPulse — NESFIC-D-15 Forest & Plantation Monitoring."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.biomass import estimate_biomass_and_carbon
from models.satellite_sim import generate_timeseries

DATA_PATH = Path(__file__).parent / "data" / "assam_plantations.geojson"

app = FastAPI(
    title="AranyaPulse API (NESFIC-D-15)",
    description="AI-Driven Multi-Temporal Geospatial & Field-Verified Forest Biomass and Carbon MRV Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_initial_plantations() -> List[Dict[str, Any]]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        fc = json.load(f)
    return fc.get("features", [])


PLANTATIONS: List[Dict[str, Any]] = _load_initial_plantations()
FIELD_LOGS: List[Dict[str, Any]] = [
    {
        "log_id": "LOG-2026-001",
        "plantation_id": "ASM-KZ-01",
        "officer_name": "R. Bora (Beat Officer)",
        "observed_dbh_cm": 11.4,
        "observed_height_m": 6.8,
        "observed_survival_pct": 84.2,
        "notes": "Post-monsoon survival check complete; minor silt deposition near northern boundary.",
        "photo_name": "kaziranga_block_a_plot3.jpg",
        "latitude": 26.6455,
        "longitude": 93.3660,
        "timestamp": "2026-11-12T09:30:00Z",
        "dfo_approved": True,
    },
    {
        "log_id": "LOG-2026-002",
        "plantation_id": "ASM-NM-03",
        "officer_name": "P. Das (Range Officer)",
        "observed_dbh_cm": 6.3,
        "observed_height_m": 3.7,
        "observed_survival_pct": 58.4,
        "notes": "Sapling mortality observed in eastern sector; recommended gap-filling in next cycle.",
        "photo_name": "nameri_c2_gap_inspection.jpg",
        "latitude": 26.9240,
        "longitude": 92.8255,
        "timestamp": "2026-11-18T11:15:00Z",
        "dfo_approved": False,
    },
]

ADMIN_USERS: List[Dict[str, Any]] = [
    {"user_id": "USR-01", "name": "Dr. M. Hazarika", "role": "State Admin", "scope": "All Assam Divisions (ASSAC)", "active": True},
    {"user_id": "USR-02", "name": "S. Baruah, IFS", "role": "DFO", "scope": "Eastern Assam Wildlife Division", "active": True},
    {"user_id": "USR-03", "name": "P. Das", "role": "RFO", "scope": "Sonitpur West Division", "active": True},
    {"user_id": "USR-04", "name": "R. Bora", "role": "Beat Officer", "scope": "Kaziranga Buffer Range", "active": True},
    {"user_id": "USR-05", "name": "A. Nair (FSI/Verra)", "role": "External Auditor", "scope": "Read-Only Carbon MRV", "active": True},
]

SPECIES_REGISTRY: List[Dict[str, Any]] = [
    {"key": "sal", "label": "Sal & Teak Mix (Shorea robusta)", "wood_density": 0.72, "root_to_shoot": 0.26},
    {"key": "teak", "label": "Teak Plantation (Tectona grandis)", "wood_density": 0.60, "root_to_shoot": 0.25},
    {"key": "bamboo", "label": "Riparian Bamboo & Kadam", "wood_density": 0.55, "root_to_shoot": 0.28},
    {"key": "bonsum", "label": "Bonsum & Gamari (Phoebe goalparensis)", "wood_density": 0.52, "root_to_shoot": 0.26},
    {"key": "mixed", "label": "Mixed Native (Simul, Ajhar, Hollong)", "wood_density": 0.58, "root_to_shoot": 0.26},
]

ADMIN_SETTINGS: Dict[str, Any] = {
    "min_survival_pct": 70.0,
    "ndvi_alert_threshold": 0.60,
    "sensitive_zone_masking": False,
    "last_eo_refresh": "2026-11-26T06:00:00Z",
    "model_version": "Chave-2014-IPCC-v2.1",
}

AUDIT_TRAIL: List[Dict[str, Any]] = [
    {
        "audit_id": "AUD-001",
        "timestamp": "2026-11-26T06:00:00Z",
        "actor": "System EO Pipeline",
        "role": "State Admin",
        "action": "Sentinel-1/2 SAR-Optical Composite Refresh",
        "target": "All 5 Assam Plantation Blocks",
    },
    {
        "audit_id": "AUD-002",
        "timestamp": "2026-11-12T10:05:00Z",
        "actor": "S. Baruah, IFS",
        "role": "DFO",
        "action": "Approved Ground-Truth Verification",
        "target": "LOG-2026-001 (ASM-KZ-01)",
    },
]


def _log_audit(actor: str, role: str, action: str, target: str) -> None:
    AUDIT_TRAIL.insert(0, {
        "audit_id": f"AUD-{uuid.uuid4().hex[:5].upper()}",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "actor": actor,
        "role": role,
        "action": action,
        "target": target,
    })


def _lookup_species_params(species: str) -> tuple[float | None, float]:
    s = species.lower()
    for sp in SPECIES_REGISTRY:
        if sp["key"] in s:
            return float(sp["wood_density"]), float(sp["root_to_shoot"])
    return None, 0.26


class FieldLogCreate(BaseModel):
    plantation_id: str
    officer_name: str = Field(..., min_length=2)
    observed_dbh_cm: float = Field(..., gt=0, le=200)
    observed_height_m: float = Field(..., gt=0, le=80)
    observed_survival_pct: float = Field(..., ge=0, le=100)
    notes: str = ""
    photo_name: str = "field_capture.jpg"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PlantationUpload(BaseModel):
    name: str
    division: str = "Guwahati Social Forestry Division"
    district: str = "Kamrup"
    species: str = "Mixed Native"
    plantation_year: int = 2024
    area_ha: float = Field(..., gt=0)
    target_stems_per_ha: int = 1100
    terrain: str = "Alluvial Plain"
    coordinates: List[List[List[float]]]


def _enrich_feature(feature: Dict[str, Any]) -> Dict[str, Any]:
    props = dict(feature["properties"])
    calibrated = any(l["plantation_id"] == props["id"] for l in FIELD_LOGS)
    rho_override, rts = _lookup_species_params(props["species"])
    est = estimate_biomass_and_carbon(
        area_ha=props["area_ha"],
        target_stems_per_ha=props["target_stems_per_ha"],
        survival_rate_pct=props["survival_rate"],
        mean_dbh_cm=props["mean_dbh_cm"],
        mean_height_m=props["mean_height_m"],
        species=props["species"],
        ndvi=props["base_ndvi"],
        field_calibrated=calibrated,
        wood_density_override=rho_override,
        root_to_shoot_ratio=rts,
    )
    props.update({
        "agb_t_ha": est.agb_tonnes_per_ha,
        "bgb_t_ha": est.bgb_tonnes_per_ha,
        "total_biomass_t_ha": est.total_biomass_tonnes_per_ha,
        "carbon_t_ha": est.carbon_tonnes_per_ha,
        "co2e_t_ha": est.co2e_tonnes_per_ha,
        "total_co2e_tonnes": est.total_co2e_tonnes,
        "ci_95_margin_pct": est.ci_95_margin_pct,
        "canopy_cover_pct": est.canopy_cover_pct,
        "field_calibrated": calibrated,
    })
    return {
        "type": "Feature",
        "properties": props,
        "geometry": feature["geometry"],
    }


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "AranyaPulse NESFIC-D-15"}


@app.get("/api/plantations")
def list_plantations() -> Dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "features": [_enrich_feature(f) for f in PLANTATIONS],
    }


@app.post("/api/plantations")
def add_plantation(payload: PlantationUpload) -> Dict[str, Any]:
    new_id = f"ASM-UP-{len(PLANTATIONS) + 1:02d}"
    feature = {
        "type": "Feature",
        "properties": {
            "id": new_id,
            "name": payload.name,
            "division": payload.division,
            "district": payload.district,
            "species": payload.species,
            "plantation_year": payload.plantation_year,
            "area_ha": payload.area_ha,
            "target_stems_per_ha": payload.target_stems_per_ha,
            "terrain": payload.terrain,
            "base_ndvi": 0.68,
            "survival_rate": 78.0,
            "mean_dbh_cm": 7.5,
            "mean_height_m": 4.4,
            "status": "Healthy",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": payload.coordinates,
        },
    }
    PLANTATIONS.append(feature)
    return _enrich_feature(feature)


@app.get("/api/plantations/{plantation_id}/timeseries")
def get_plantation_timeseries(plantation_id: str) -> Dict[str, Any]:
    match = next((f for f in PLANTATIONS if f["properties"]["id"] == plantation_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Plantation not found")
    enriched = _enrich_feature(match)
    p = enriched["properties"]
    series = generate_timeseries(
        plantation_id=p["id"],
        base_ndvi=p["base_ndvi"],
        agb_latest=p["agb_t_ha"],
        co2e_latest=p["co2e_t_ha"],
        status=p["status"],
    )
    return {"plantation": p, "timeseries": series}


@app.get("/api/alerts")
def get_alerts() -> List[Dict[str, Any]]:
    alerts = []
    min_surv = float(ADMIN_SETTINGS["min_survival_pct"])
    min_ndvi = float(ADMIN_SETTINGS["ndvi_alert_threshold"])
    for f in PLANTATIONS:
        p = f["properties"]
        if "Alert" in p["status"] or p["survival_rate"] < min_surv or p["base_ndvi"] < min_ndvi:
            alerts.append({
                "id": f"ALT-{p['id']}",
                "plantation_id": p["id"],
                "plantation_name": p["name"],
                "division": p["division"],
                "severity": "High" if p["survival_rate"] < (min_surv - 10.0) else "Medium",
                "reason": p["status"] if "Alert" in p["status"] else f"Below threshold ({min_surv}% surv / {min_ndvi} NDVI)",
                "survival_rate": p["survival_rate"],
                "ndvi": p["base_ndvi"],
                "recommended_action": "Dispatch Beat Officer for gap-filling assessment & plot verification.",
            })
    return alerts


@app.get("/api/field-logs")
def get_field_logs() -> List[Dict[str, Any]]:
    return sorted(FIELD_LOGS, key=lambda x: x["timestamp"], reverse=True)


@app.post("/api/field-logs")
def create_field_log(payload: FieldLogCreate) -> Dict[str, Any]:
    target = next((f for f in PLANTATIONS if f["properties"]["id"] == payload.plantation_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Plantation not found")

    # Recalibrate plantation metrics with ground-truth observation
    props = target["properties"]
    props["mean_dbh_cm"] = round(payload.observed_dbh_cm, 2)
    props["mean_height_m"] = round(payload.observed_height_m, 2)
    props["survival_rate"] = round(payload.observed_survival_pct, 1)
    props["status"] = "Healthy" if payload.observed_survival_pct >= 70.0 else "Alert: Low Survival"

    coords = target["geometry"]["coordinates"][0][0]
    log_entry = {
        "log_id": f"LOG-{uuid.uuid4().hex[:6].upper()}",
        "plantation_id": payload.plantation_id,
        "officer_name": payload.officer_name,
        "observed_dbh_cm": payload.observed_dbh_cm,
        "observed_height_m": payload.observed_height_m,
        "observed_survival_pct": payload.observed_survival_pct,
        "notes": payload.notes,
        "photo_name": payload.photo_name,
        "latitude": payload.latitude or coords[1],
        "longitude": payload.longitude or coords[0],
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dfo_approved": False,
    }
    FIELD_LOGS.append(log_entry)
    return {"log": log_entry, "updated_plantation": _enrich_feature(target)}


@app.post("/api/field-logs/{log_id}/approve")
def approve_field_log(log_id: str) -> Dict[str, Any]:
    log = next((l for l in FIELD_LOGS if l["log_id"] == log_id), None)
    if not log:
        raise HTTPException(status_code=404, detail="Field log not found")
    log["dfo_approved"] = True
    _log_audit("DFO Reviewer", "DFO", "Approved Ground-Truth Verification", f"{log_id} ({log['plantation_id']})")
    return log


@app.get("/api/mrv-summary")
def mrv_summary() -> Dict[str, Any]:
    enriched = [_enrich_feature(f)["properties"] for f in PLANTATIONS]
    total_area = sum(p["area_ha"] for p in enriched)
    total_co2e = sum(p["total_co2e_tonnes"] for p in enriched)
    avg_survival = sum(p["survival_rate"] for p in enriched) / max(1, len(enriched))
    avg_agb = sum(p["agb_t_ha"] for p in enriched) / max(1, len(enriched))
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_polygons": len(enriched),
        "total_area_ha": round(total_area, 2),
        "total_co2e_tonnes": round(total_co2e, 1),
        "mean_survival_pct": round(avg_survival, 1),
        "mean_agb_t_ha": round(avg_agb, 2),
        "verified_logs_count": sum(1 for l in FIELD_LOGS if l["dfo_approved"]),
        "total_logs_count": len(FIELD_LOGS),
        "methodology": "Chave et al. (2014) Allometric + IPCC Tier-2/3 (0.47 C, 0.26 Root-to-Shoot) + Sentinel-1/2 SAR-Optical Fusion",
        "plantations": enriched,
    }


class AdminUserCreate(BaseModel):
    name: str = Field(..., min_length=2)
    role: str
    scope: str


class SpeciesUpsert(BaseModel):
    key: str = Field(..., min_length=2)
    label: str = Field(..., min_length=2)
    wood_density: float = Field(..., gt=0.1, le=1.5)
    root_to_shoot: float = Field(..., gt=0.05, le=0.8)


class AdminSettingsUpdate(BaseModel):
    min_survival_pct: float = Field(..., ge=10, le=100)
    ndvi_alert_threshold: float = Field(..., ge=0.1, le=0.95)
    sensitive_zone_masking: bool


@app.get("/api/admin/users")
def list_admin_users() -> List[Dict[str, Any]]:
    return ADMIN_USERS


@app.post("/api/admin/users")
def add_admin_user(payload: AdminUserCreate) -> Dict[str, Any]:
    user = {
        "user_id": f"USR-{len(ADMIN_USERS) + 1:02d}",
        "name": payload.name,
        "role": payload.role,
        "scope": payload.scope,
        "active": True,
    }
    ADMIN_USERS.append(user)
    _log_audit("State Admin", "State Admin", f"Provisioned {payload.role} Account", f"{payload.name} ({payload.scope})")
    return user


@app.get("/api/admin/species")
def list_species() -> List[Dict[str, Any]]:
    return SPECIES_REGISTRY


@app.post("/api/admin/species")
def upsert_species(payload: SpeciesUpsert) -> Dict[str, Any]:
    key_lower = payload.key.lower().strip()
    existing = next((s for s in SPECIES_REGISTRY if s["key"] == key_lower), None)
    if existing:
        existing["label"] = payload.label
        existing["wood_density"] = round(payload.wood_density, 3)
        existing["root_to_shoot"] = round(payload.root_to_shoot, 3)
        entry = existing
    else:
        entry = {
            "key": key_lower,
            "label": payload.label,
            "wood_density": round(payload.wood_density, 3),
            "root_to_shoot": round(payload.root_to_shoot, 3),
        }
        SPECIES_REGISTRY.append(entry)
    _log_audit("State Admin", "State Admin", "Updated Allometric Species Table", f"{entry['key']} (rho={entry['wood_density']})")
    return entry


@app.get("/api/admin/settings")
def get_admin_settings() -> Dict[str, Any]:
    return ADMIN_SETTINGS


@app.post("/api/admin/settings")
def update_admin_settings(payload: AdminSettingsUpdate) -> Dict[str, Any]:
    ADMIN_SETTINGS["min_survival_pct"] = round(payload.min_survival_pct, 1)
    ADMIN_SETTINGS["ndvi_alert_threshold"] = round(payload.ndvi_alert_threshold, 2)
    ADMIN_SETTINGS["sensitive_zone_masking"] = payload.sensitive_zone_masking
    _log_audit(
        "State Admin",
        "State Admin",
        "Updated Alert & Compliance Settings",
        f"Surv>={payload.min_survival_pct}%, NDVI>={payload.ndvi_alert_threshold}, Masking={payload.sensitive_zone_masking}",
    )
    return ADMIN_SETTINGS


@app.post("/api/admin/refresh-eo")
def trigger_eo_refresh() -> Dict[str, Any]:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ADMIN_SETTINGS["last_eo_refresh"] = now
    _log_audit("GIS Admin", "State Admin", "Triggered Sentinel-1/2 EO Refresh", f"{len(PLANTATIONS)} polygons re-indexed")
    return {"status": "refreshed", "last_eo_refresh": now}


@app.post("/api/admin/field-logs/approve-all")
def approve_all_field_logs() -> Dict[str, Any]:
    count = 0
    for log in FIELD_LOGS:
        if not log["dfo_approved"]:
            log["dfo_approved"] = True
            count += 1
    if count > 0:
        _log_audit("DFO Reviewer", "DFO", "Batch Approved Pending Field Logs", f"{count} verification log(s)")
    return {"approved_count": count}


@app.get("/api/admin/audit-logs")
def get_audit_logs() -> List[Dict[str, Any]]:
    return AUDIT_TRAIL
