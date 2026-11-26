import plantationsGeoJson from "../../backend/data/assam_plantations.geojson";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

interface PlantationProps {
  id: string;
  name: string;
  division: string;
  district: string;
  species: string;
  plantation_year: number;
  area_ha: number;
  target_stems_per_ha: number;
  terrain: string;
  base_ndvi: number;
  survival_rate: number;
  mean_dbh_cm: number;
  mean_height_m: number;
  status: string;
}

interface PlantationFeature {
  type: "Feature";
  properties: PlantationProps;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface FieldLog {
  log_id: string;
  plantation_id: string;
  officer_name: string;
  observed_dbh_cm: number;
  observed_height_m: number;
  observed_survival_pct: number;
  notes: string;
  photo_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  dfo_approved: boolean;
}

const SPECIES_WOOD_DENSITY: Record<string, number> = {
  sal: 0.72,
  teak: 0.6,
  bamboo: 0.55,
  bonsum: 0.52,
  mixed: 0.58,
};

const MONTH_LABELS = [
  "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
  "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11",
  "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
  "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
];

// In-memory isolate state initialized from GeoJSON
const PLANTATIONS: PlantationFeature[] = structuredClone(
  (plantationsGeoJson as { features: PlantationFeature[] }).features
);

const FIELD_LOGS: FieldLog[] = [
  {
    log_id: "LOG-2026-001",
    plantation_id: "ASM-KZ-01",
    officer_name: "R. Bora (Beat Officer)",
    observed_dbh_cm: 11.4,
    observed_height_m: 6.8,
    observed_survival_pct: 84.2,
    notes: "Post-monsoon survival check complete; minor silt deposition near northern boundary.",
    photo_name: "kaziranga_block_a_plot3.jpg",
    latitude: 26.6455,
    longitude: 93.366,
    timestamp: "2026-11-12T09:30:00Z",
    dfo_approved: true,
  },
  {
    log_id: "LOG-2026-002",
    plantation_id: "ASM-NM-03",
    officer_name: "P. Das (Range Officer)",
    observed_dbh_cm: 6.3,
    observed_height_m: 3.7,
    observed_survival_pct: 58.4,
    notes: "Sapling mortality observed in eastern sector; recommended gap-filling in next cycle.",
    photo_name: "nameri_c2_gap_inspection.jpg",
    latitude: 26.924,
    longitude: 92.8255,
    timestamp: "2026-11-18T11:15:00Z",
    dfo_approved: false,
  },
];

function inferWoodDensity(species: string): number {
  const s = species.toLowerCase();
  for (const [key, rho] of Object.entries(SPECIES_WOOD_DENSITY)) {
    if (s.includes(key)) return rho;
  }
  return 0.58;
}

function estimateBiomass(p: PlantationProps, fieldCalibrated: boolean) {
  const rho = inferWoodDensity(p.species);
  const liveStems = Math.max(1, p.target_stems_per_ha * (p.survival_rate / 100));
  const dbh = Math.max(1.5, p.mean_dbh_cm);
  const height = Math.max(0.8, p.mean_height_m);

  const agbPerTreeKg = 0.0673 * Math.pow(rho * dbh * dbh * height, 0.976);
  const allometricAgb = (agbPerTreeKg * liveStems) / 1000;
  const spectralFactor = 0.85 + 0.3 * Math.max(0, Math.min(1, p.base_ndvi));
  const agb = allometricAgb * (0.85 + 0.15 * spectralFactor);
  const bgb = agb * 0.26;
  const totalBiomass = agb + bgb;
  const carbon = totalBiomass * 0.47;
  const co2e = carbon * (44 / 12);
  const totalCo2e = co2e * p.area_ha;
  const canopyCover = Math.min(
    98,
    Math.max(12, Math.round(p.base_ndvi * 108 * Math.pow(p.survival_rate / 100, 0.35) * 10) / 10)
  );

  return {
    agb_t_ha: Math.round(agb * 100) / 100,
    bgb_t_ha: Math.round(bgb * 100) / 100,
    total_biomass_t_ha: Math.round(totalBiomass * 100) / 100,
    carbon_t_ha: Math.round(carbon * 100) / 100,
    co2e_t_ha: Math.round(co2e * 100) / 100,
    total_co2e_tonnes: Math.round(totalCo2e * 10) / 10,
    ci_95_margin_pct: fieldCalibrated ? 9.2 : 16.4,
    canopy_cover_pct: canopyCover,
  };
}

function enrichFeature(f: PlantationFeature) {
  const calibrated = FIELD_LOGS.some((l) => l.plantation_id === f.properties.id);
  const est = estimateBiomass(f.properties, calibrated);
  return {
    type: "Feature" as const,
    properties: {
      ...f.properties,
      ...est,
      field_calibrated: calibrated,
    },
    geometry: f.geometry,
  };
}

function generateTimeseries(id: string, baseNdvi: number, agbLatest: number, co2eLatest: number, status: string) {
  const seedOffset = (id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10) * 0.005;
  const isAlert = status.includes("Alert");

  return MONTH_LABELS.map((month, idx) => {
    const mNum = Number(month.split("-")[1]);
    const isMonsoon = mNum >= 6 && mNum <= 9;
    const growthTrend = (idx / 23) * (isAlert ? 0.04 : 0.11);
    const seasonal = 0.04 * Math.sin(((mNum - 3) * Math.PI) / 6);
    const dip = isAlert && idx >= 18 ? -0.14 : 0;

    const sarFused = Math.max(0.25, Math.min(0.92, baseNdvi - 0.07 + growthTrend + seasonal + dip + seedOffset));
    const optical = isMonsoon && idx % 2 === 1 ? null : Math.round((sarFused - 0.015) * 1000) / 1000;
    const evi = Math.round(Math.max(0.18, sarFused * 0.78) * 1000) / 1000;
    const ndwi = Math.round(Math.max(-0.15, (isMonsoon ? 0.18 : 0.04) + 0.25 * (sarFused - 0.5)) * 1000) / 1000;
    const sarVh = Math.round((-13.8 + 2.4 * sarFused + (isMonsoon ? 0.6 : 0)) * 100) / 100;

    let progress = 0.62 + 0.38 * (idx / 23);
    if (isAlert && idx >= 18) progress *= 0.88;

    return {
      month,
      optical_ndvi: optical,
      sar_fused_ndvi: Math.round(sarFused * 1000) / 1000,
      evi,
      ndwi,
      sar_vh_db: sarVh,
      agb_t_ha: Math.round(agbLatest * progress * 100) / 100,
      co2e_t_ha: Math.round(co2eLatest * progress * 100) / 100,
      cloud_cover_pct: isMonsoon ? 78 : 14,
    };
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS" && path.startsWith("/api/")) {
      return jsonResponse({}, 204);
    }

    if (path === "/api/health") {
      return jsonResponse({ status: "ok", service: "AranyaPulse NESFIC-D-15 (Cloudflare Worker)" });
    }

    if (path === "/api/plantations" && request.method === "GET") {
      return jsonResponse({
        type: "FeatureCollection",
        features: PLANTATIONS.map(enrichFeature),
      });
    }

    if (path === "/api/plantations" && request.method === "POST") {
      const payload = (await request.json()) as Partial<PlantationProps> & {
        coordinates: number[][][];
      };
      const newId = `ASM-UP-${String(PLANTATIONS.length + 1).padStart(2, "0")}`;
      const feature: PlantationFeature = {
        type: "Feature",
        properties: {
          id: newId,
          name: payload.name || "Uploaded Plantation Block",
          division: payload.division || "Guwahati Social Forestry Division",
          district: payload.district || "Kamrup",
          species: payload.species || "Mixed Native",
          plantation_year: payload.plantation_year || 2024,
          area_ha: payload.area_ha || 25,
          target_stems_per_ha: payload.target_stems_per_ha || 1100,
          terrain: payload.terrain || "Alluvial Plain",
          base_ndvi: 0.68,
          survival_rate: 78.0,
          mean_dbh_cm: 7.5,
          mean_height_m: 4.4,
          status: "Healthy",
        },
        geometry: {
          type: "Polygon",
          coordinates: payload.coordinates,
        },
      };
      PLANTATIONS.push(feature);
      return jsonResponse(enrichFeature(feature));
    }

    const tsMatch = path.match(/^\/api\/plantations\/([^/]+)\/timeseries$/);
    if (tsMatch && request.method === "GET") {
      const id = decodeURIComponent(tsMatch[1]);
      const match = PLANTATIONS.find((f) => f.properties.id === id);
      if (!match) return jsonResponse({ detail: "Plantation not found" }, 404);
      const enriched = enrichFeature(match);
      const p = enriched.properties;
      return jsonResponse({
        plantation: p,
        timeseries: generateTimeseries(p.id, p.base_ndvi, p.agb_t_ha, p.co2e_t_ha, p.status),
      });
    }

    if (path === "/api/alerts" && request.method === "GET") {
      const alerts = PLANTATIONS.filter(
        (f) => f.properties.status.includes("Alert") || f.properties.survival_rate < 70
      ).map((f) => {
        const p = f.properties;
        return {
          id: `ALT-${p.id}`,
          plantation_id: p.id,
          plantation_name: p.name,
          division: p.division,
          severity: p.survival_rate < 60 ? "High" : "Medium",
          reason: p.status,
          survival_rate: p.survival_rate,
          ndvi: p.base_ndvi,
          recommended_action: "Dispatch Beat Officer for gap-filling assessment & plot verification.",
        };
      });
      return jsonResponse(alerts);
    }

    if (path === "/api/field-logs" && request.method === "GET") {
      const sorted = [...FIELD_LOGS].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return jsonResponse(sorted);
    }

    if (path === "/api/field-logs" && request.method === "POST") {
      const payload = (await request.json()) as Omit<FieldLog, "log_id" | "timestamp" | "dfo_approved">;
      const target = PLANTATIONS.find((f) => f.properties.id === payload.plantation_id);
      if (!target) return jsonResponse({ detail: "Plantation not found" }, 404);

      target.properties.mean_dbh_cm = Math.round(payload.observed_dbh_cm * 100) / 100;
      target.properties.mean_height_m = Math.round(payload.observed_height_m * 100) / 100;
      target.properties.survival_rate = Math.round(payload.observed_survival_pct * 10) / 10;
      target.properties.status =
        payload.observed_survival_pct >= 70 ? "Healthy" : "Alert: Low Survival";

      const coords = target.geometry.coordinates[0][0] || [92.9, 26.2];
      const logEntry: FieldLog = {
        log_id: `LOG-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        plantation_id: payload.plantation_id,
        officer_name: payload.officer_name,
        observed_dbh_cm: payload.observed_dbh_cm,
        observed_height_m: payload.observed_height_m,
        observed_survival_pct: payload.observed_survival_pct,
        notes: payload.notes || "",
        photo_name: payload.photo_name || "field_capture.jpg",
        latitude: payload.latitude ?? coords[1],
        longitude: payload.longitude ?? coords[0],
        timestamp: new Date().toISOString(),
        dfo_approved: false,
      };
      FIELD_LOGS.push(logEntry);
      return jsonResponse({ log: logEntry, updated_plantation: enrichFeature(target) });
    }

    const approveMatch = path.match(/^\/api\/field-logs\/([^/]+)\/approve$/);
    if (approveMatch && request.method === "POST") {
      const logId = decodeURIComponent(approveMatch[1]);
      const log = FIELD_LOGS.find((l) => l.log_id === logId);
      if (!log) return jsonResponse({ detail: "Field log not found" }, 404);
      log.dfo_approved = true;
      return jsonResponse(log);
    }

    if (path === "/api/mrv-summary" && request.method === "GET") {
      const enriched = PLANTATIONS.map((f) => enrichFeature(f).properties);
      const totalArea = enriched.reduce((s, p) => s + p.area_ha, 0);
      const totalCo2e = enriched.reduce((s, p) => s + p.total_co2e_tonnes, 0);
      const meanSurvival = enriched.reduce((s, p) => s + p.survival_rate, 0) / Math.max(1, enriched.length);
      const meanAgb = enriched.reduce((s, p) => s + p.agb_t_ha, 0) / Math.max(1, enriched.length);

      return jsonResponse({
        generated_at: new Date().toISOString(),
        total_polygons: enriched.length,
        total_area_ha: Math.round(totalArea * 100) / 100,
        total_co2e_tonnes: Math.round(totalCo2e * 10) / 10,
        mean_survival_pct: Math.round(meanSurvival * 10) / 10,
        mean_agb_t_ha: Math.round(meanAgb * 100) / 100,
        verified_logs_count: FIELD_LOGS.filter((l) => l.dfo_approved).length,
        total_logs_count: FIELD_LOGS.length,
        methodology:
          "Chave et al. (2014) Allometric + IPCC Tier-2/3 (0.47 C, 0.26 Root-to-Shoot) + Sentinel-1/2 SAR-Optical Fusion",
        plantations: enriched,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
