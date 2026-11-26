"use client";

import React from "react";
import { MapLayerMode, PlantationFeature } from "@/lib/types";
import { Layers, CheckCircle2, AlertTriangle } from "lucide-react";

interface MapExplorerProps {
  features: PlantationFeature[];
  selectedId: string;
  onSelect: (id: string) => void;
  layerMode: MapLayerMode;
  onLayerChange: (mode: MapLayerMode) => void;
}

// Bounding box for Assam Brahmaputra Valley & Foothills
const MIN_LON = 90.8;
const MAX_LON = 95.8;
const MIN_LAT = 25.6;
const MAX_LAT = 28.0;

const SVG_W = 800;
const SVG_H = 420;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (SVG_W - 80) + 40;
  const y = SVG_H - (((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * (SVG_H - 60) + 30);
  return [x, y];
}

function getPolygonCentroid(coords: number[][][]): [number, number] {
  const ring = coords[0] || [];
  if (ring.length === 0) return [SVG_W / 2, SVG_H / 2];
  let sumX = 0;
  let sumY = 0;
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    sumX += x;
    sumY += y;
  }
  return [sumX / ring.length, sumY / ring.length];
}

function getFillColor(f: PlantationFeature, mode: MapLayerMode): string {
  const p = f.properties;
  if (mode === "alerts") {
    return p.status.includes("Alert") ? "#ef4444" : "#10b981";
  }
  if (mode === "ndvi") {
    if (p.base_ndvi >= 0.75) return "#10b981";
    if (p.base_ndvi >= 0.65) return "#84cc16";
    return "#f59e0b";
  }
  if (mode === "agb") {
    if (p.agb_t_ha >= 60) return "#059669";
    if (p.agb_t_ha >= 25) return "#34d399";
    return "#fbbf24";
  }
  // chm
  if (p.mean_height_m >= 8) return "#06b6d4";
  if (p.mean_height_m >= 5) return "#38bdf8";
  return "#f97316";
}

export default function MapExplorer({
  features,
  selectedId,
  onSelect,
  layerMode,
  onLayerChange,
}: MapExplorerProps) {
  const layers: { id: MapLayerMode; label: string }[] = [
    { id: "ndvi", label: "SAR-Fused NDVI" },
    { id: "agb", label: "Biomass (AGB)" },
    { id: "chm", label: "Canopy Height" },
    { id: "alerts", label: "Mortality Alerts" },
  ];

  // Stylized Brahmaputra River path across Assam
  const riverCoords: [number, number][] = [
    [90.9, 26.15],
    [91.7, 26.20],
    [92.3, 26.55],
    [92.85, 26.62],
    [93.4, 26.69],
    [94.1, 26.85],
    [94.9, 27.32],
    [95.5, 27.68],
  ];
  const riverPath = riverCoords
    .map(([lon, lat], idx) => {
      const [x, y] = project(lon, lat);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-emerald-50">
            Assam Plantation GIS Explorer (EPSG:4326)
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Map layer selector">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => onLayerChange(layer.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                layerMode === layer.id
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-[#16261d] text-emerald-200/80 hover:bg-[#1e3328]"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-[#1e3328] bg-[#08100c]">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Interactive map of Assam plantation polygons"
        >
          {/* Graticule Grid */}
          {[91, 92, 93, 94, 95].map((lon) => {
            const [x] = project(lon, MIN_LAT);
            return (
              <g key={`lon-${lon}`}>
                <line x1={x} y1={15} x2={x} y2={SVG_H - 20} stroke="#16281f" strokeDasharray="3 3" />
                <text x={x} y={SVG_H - 6} fill="#5c7d6b" fontSize="10" textAnchor="middle">
                  {lon}°E
                </text>
              </g>
            );
          })}
          {[26.0, 26.5, 27.0, 27.5].map((lat) => {
            const [, y] = project(MIN_LON, lat);
            return (
              <g key={`lat-${lat}`}>
                <line x1={35} y1={y} x2={SVG_W - 20} y2={y} stroke="#16281f" strokeDasharray="3 3" />
                <text x={8} y={y + 3} fill="#5c7d6b" fontSize="10">
                  {lat}°N
                </text>
              </g>
            );
          })}

          {/* Brahmaputra River Context */}
          <path d={riverPath} fill="none" stroke="#164e63" strokeWidth="10" strokeLinecap="round" opacity="0.45" />
          <path d={riverPath} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.55" />
          <text x={430} y={208} fill="#38bdf8" fontSize="10" opacity="0.7" fontStyle="italic">
            Brahmaputra River Basin
          </text>

          {/* Plantation Polygons (drawn with generous hit-marker circles for regional visibility) */}
          {features.map((f) => {
            const p = f.properties;
            const isSelected = p.id === selectedId;
            const color = getFillColor(f, layerMode);
            const [cx, cy] = getPolygonCentroid(f.geometry.coordinates);
            const ringPts = (f.geometry.coordinates[0] || [])
              .map(([lon, lat]) => {
                const [px, py] = project(lon, lat);
                return `${px.toFixed(1)},${py.toFixed(1)}`;
              })
              .join(" ");

            return (
              <g
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="cursor-pointer group"
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={22}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
                {/* Visual Footprint Marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill={color}
                  fillOpacity={0.25}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Actual Projected Polygon */}
                <polygon
                  points={ringPts}
                  fill={color}
                  fillOpacity={0.85}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                {/* Label */}
                <text
                  x={cx}
                  y={cy - 20}
                  fill={isSelected ? "#ffffff" : "#cce3d6"}
                  fontSize="11"
                  fontWeight={isSelected ? "700" : "500"}
                  textAnchor="middle"
                >
                  {p.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0c1611] border-t border-[#1e3328] text-xs text-emerald-200/80">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Optimal / Healthy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Moderate Growth
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Alert / Intervention Needed
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/80">
            Click any plantation block to inspect time-series & biomass
          </span>
        </div>
      </div>

      {/* Quick Polygon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {features.map((f) => {
          const p = f.properties;
          const isSelected = p.id === selectedId;
          const isAlert = p.status.includes("Alert");
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-400 bg-emerald-950/50"
                  : "border-[#1e3328] bg-[#0c1611] hover:border-emerald-700"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-emerald-300">{p.id}</span>
                {isAlert ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-xs font-medium text-emerald-50 truncate mt-0.5">{p.name}</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">
                {p.area_ha} ha · {p.survival_rate}% surv.
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
