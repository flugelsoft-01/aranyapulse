"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertItem,
  FieldLogItem,
  MapLayerMode,
  MrvSummary,
  PlantationFeature,
  TimeSeriesPoint,
} from "@/lib/types";
import MapExplorer from "@/components/MapExplorer";
import BiomassCharts from "@/components/BiomassCharts";
import FieldVerifyModal from "@/components/FieldVerifyModal";
import MrvReportModal from "@/components/MrvReportModal";
import {
  Trees,
  Leaf,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const [features, setFeatures] = useState<PlantationFeature[]>([]);
  const [selectedId, setSelectedId] = useState<string>("ASM-KZ-01");
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [fieldLogs, setFieldLogs] = useState<FieldLogItem[]>([]);
  const [layerMode, setLayerMode] = useState<MapLayerMode>("ndvi");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mrvSummary, setMrvSummary] = useState<MrvSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [pRes, aRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/plantations`),
        fetch(`${API_BASE}/api/alerts`),
        fetch(`${API_BASE}/api/field-logs`),
      ]);
      if (!pRes.ok) throw new Error("Failed to load plantation data from backend");
      const pJson = await pRes.json();
      setFeatures(pJson.features || []);
      setAlerts(await aRes.json());
      setFieldLogs(await lRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimeseries = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/plantations/${id}/timeseries`);
      if (res.ok) {
        const data = await res.json();
        setTimeseries(data.timeseries || []);
      }
    } catch {
      // ignore transient error
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (selectedId) {
      fetchTimeseries(selectedId);
    }
  }, [selectedId, fetchTimeseries]);

  const selectedFeature = features.find((f) => f.properties.id === selectedId) || features[0];
  const selectedProps = selectedFeature?.properties || null;

  const totalArea = features.reduce((acc, f) => acc + f.properties.area_ha, 0);
  const totalCo2e = features.reduce((acc, f) => acc + f.properties.total_co2e_tonnes, 0);
  const meanSurvival =
    features.length > 0
      ? features.reduce((acc, f) => acc + f.properties.survival_rate, 0) / features.length
      : 0;

  const handleFieldSubmit = async (payload: {
    plantation_id: string;
    officer_name: string;
    observed_dbh_cm: number;
    observed_height_m: number;
    observed_survival_pct: number;
    notes: string;
    photo_name: string;
  }) => {
    const res = await fetch(`${API_BASE}/api/field-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to submit field log");
    await fetchAll();
    await fetchTimeseries(payload.plantation_id);
  };

  const handleApproveLog = async (logId: string) => {
    const res = await fetch(`${API_BASE}/api/field-logs/${logId}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      await fetchAll();
    }
  };

  const handleOpenReport = async () => {
    const res = await fetch(`${API_BASE}/api/mrv-summary`);
    if (res.ok) {
      setMrvSummary(await res.json());
      setReportOpen(true);
    }
  };

  const handleAddSamplePlot = async () => {
    const res = await fetch(`${API_BASE}/api/plantations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pobitora Fringe Restoration Block",
        division: "Morigaon Forest Division",
        district: "Morigaon",
        species: "Mixed Native & Bamboo",
        plantation_year: 2024,
        area_ha: 42.0,
        target_stems_per_ha: 1100,
        terrain: "Alluvial Floodplain",
        coordinates: [[[92.04, 26.23], [92.052, 26.23], [92.052, 26.238], [92.04, 26.238], [92.04, 26.23]]],
      }),
    });
    if (res.ok) {
      const created = await res.json();
      await fetchAll();
      setSelectedId(created.properties.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#09110d] text-[#ecf5f0] pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#1e3328] bg-[#09110d]/95 backdrop-blur px-4 sm:px-6 py-3 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <Trees className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-emerald-50">
                  AranyaPulse
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  NESFIC-D-15
                </span>
              </div>
              <p className="text-xs text-emerald-200/70">
                Forest &amp; Plantation Growth, Biomass &amp; Carbon MRV Platform (Assam)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSamplePlot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3328] bg-[#101b15] text-xs font-medium text-emerald-200 hover:border-emerald-600 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Add GeoJSON Plot
            </button>
            <button
              type="button"
              onClick={handleOpenReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Export MRV / Proof PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5 no-print">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 flex items-center justify-between">
            <p className="text-sm text-red-200">
              {error} — Ensure FastAPI backend is running on <code className="font-mono">{API_BASE}</code>.
            </p>
            <button
              type="button"
              onClick={fetchAll}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-500/20 text-xs text-red-100 hover:bg-red-500/30 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Top KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <p className="text-xs text-emerald-200/70">Total Monitored Area</p>
            <p className="text-2xl font-bold text-emerald-50 mt-1">
              {totalArea.toFixed(1)} <span className="text-sm font-normal text-emerald-300">ha</span>
            </p>
            <p className="text-[11px] text-emerald-400/80 mt-1">
              Across {features.length} Assam plantation blocks
            </p>
          </div>

          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <p className="text-xs text-emerald-200/70">Total Carbon Sequestered</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {totalCo2e.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
              <span className="text-sm font-normal">tCO2e</span>
            </p>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              AGB + BGB (IPCC Tier-2/3)
            </p>
          </div>

          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <p className="text-xs text-emerald-200/70">Mean Plantation Survival</p>
            <p className="text-2xl font-bold text-emerald-50 mt-1">
              {meanSurvival.toFixed(1)}%
            </p>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              SAR-Optical + Field Verified
            </p>
          </div>

          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <p className="text-xs text-emerald-200/70">Active Anomaly Alerts</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{alerts.length}</p>
            <p className="text-[11px] text-amber-300/80 mt-1">
              Blocks flagged for Beat Officer check
            </p>
          </div>
        </section>

        {/* Map + Selected Block Inspector */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <MapExplorer
              features={features}
              selectedId={selectedId}
              onSelect={setSelectedId}
              layerMode={layerMode}
              onLayerChange={setLayerMode}
            />
          </div>

          {/* Selected Block Inspector */}
          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-col justify-between gap-4">
            {loading || !selectedProps ? (
              <p className="text-sm text-emerald-200/70">Loading plantation telemetry...</p>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#1e3328] pb-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-400">{selectedProps.id}</span>
                      <h2 className="text-base font-bold text-emerald-50 leading-snug">
                        {selectedProps.name}
                      </h2>
                      <p className="text-xs text-emerald-200/70 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {selectedProps.division} ({selectedProps.district})
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        selectedProps.status.includes("Alert")
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {selectedProps.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">Species Mix</span>
                      <span className="font-medium text-emerald-50">{selectedProps.species}</span>
                    </div>
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">Planted / Terrain</span>
                      <span className="font-medium text-emerald-50">
                        {selectedProps.plantation_year} · {selectedProps.terrain}
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">AGB / BGB (t/ha)</span>
                      <span className="font-bold text-emerald-300">
                        {selectedProps.agb_t_ha} / {selectedProps.bgb_t_ha}
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">Block Total CO2e</span>
                      <span className="font-bold text-emerald-400">
                        {selectedProps.total_co2e_tonnes} t
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">Mean DBH / Height</span>
                      <span className="font-medium text-emerald-50">
                        {selectedProps.mean_dbh_cm} cm / {selectedProps.mean_height_m} m
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0c1611] border border-[#1e3328] p-2.5">
                      <span className="text-emerald-200/60 block">Canopy Cover / NDVI</span>
                      <span className="font-medium text-emerald-50">
                        {selectedProps.canopy_cover_pct}% · {selectedProps.base_ndvi}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1e3328]">
                  <div className="flex items-center justify-between text-[11px] text-emerald-200/70">
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedProps.field_calibrated
                        ? "Calibrated with Field Plot Data"
                        : "EO Satellite Baseline (Unverified)"}
                    </span>
                    <span>±{selectedProps.ci_95_margin_pct}% CI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifyOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Log Ground-Truth Verification
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Time Series Charts */}
        {selectedProps && timeseries.length > 0 && (
          <BiomassCharts plantation={selectedProps} timeseries={timeseries} />
        )}

        {/* Bottom Panels: Alert Queue & Audit Ledger */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anomaly Alert Queue */}
          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-emerald-50">
                  Anomaly &amp; Mortality Early-Warning Queue
                </h3>
              </div>
              <span className="text-xs text-amber-300">{alerts.length} active</span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-emerald-300/70 py-4">
                All monitored blocks are above survival and NDVI thresholds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-amber-500/30 bg-[#0c1611] p-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">{a.plantation_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-emerald-50 mt-0.5">
                        {a.plantation_name} — {a.reason}
                      </p>
                      <p className="text-[11px] text-emerald-200/70 mt-1">
                        Survival: {a.survival_rate}% · {a.recommended_action}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(a.plantation_id);
                        setVerifyOpen(true);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 text-[11px] font-semibold hover:bg-amber-500/30 shrink-0 cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Ground-Truthing & DFO Audit Ledger */}
          <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-50">
                  Ground-Truth &amp; DFO Audit Ledger
                </h3>
              </div>
              <span className="text-xs text-emerald-300/80">{fieldLogs.length} entries</span>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {fieldLogs.map((log) => (
                <div
                  key={log.log_id}
                  className="rounded-lg border border-[#1e3328] bg-[#0c1611] p-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300">{log.plantation_id}</span>
                      <span className="text-[11px] text-emerald-200/60">{log.log_id}</span>
                    </div>
                    <p className="text-xs text-emerald-50 mt-0.5">
                      {log.officer_name} · DBH {log.observed_dbh_cm} cm, H {log.observed_height_m} m,
                      Survival {log.observed_survival_pct}%
                    </p>
                    {log.notes && (
                      <p className="text-[11px] text-emerald-200/70 mt-1">{log.notes}</p>
                    )}
                    <p className="text-[10px] text-emerald-400/70 mt-1">
                      Photo: {log.photo_name} · GPS: {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                    </p>
                  </div>
                  {log.dfo_approved ? (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                      DFO Approved
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApproveLog(log.log_id)}
                      className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[11px] font-bold hover:bg-emerald-400 shrink-0 cursor-pointer"
                    >
                      DFO Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FieldVerifyModal
        open={verifyOpen}
        plantation={selectedProps}
        onClose={() => setVerifyOpen(false)}
        onSubmit={handleFieldSubmit}
      />

      <MrvReportModal
        open={reportOpen}
        summary={mrvSummary}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
