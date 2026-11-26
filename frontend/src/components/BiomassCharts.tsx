"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TimeSeriesPoint, PlantationProperties } from "@/lib/types";
import { Activity, Trees } from "lucide-react";

interface BiomassChartsProps {
  plantation: PlantationProperties;
  timeseries: TimeSeriesPoint[];
}

export default function BiomassCharts({ plantation, timeseries }: BiomassChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Monsoon-Resilient SAR + Optical NDVI */}
      <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-50">
              24-Month SAR-Optical Vegetation Continuity
            </h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            {plantation.id}
          </span>
        </div>
        <p className="text-xs text-emerald-200/70 mb-3">
          Sentinel-1 C-band SAR fusion bridges optical cloud gaps during Assam&apos;s monsoon (Jun–Sep).
        </p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeseries} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3328" />
              <XAxis dataKey="month" tick={{ fill: "#93afa0", fontSize: 10 }} interval={3} />
              <YAxis domain={[0.2, 0.95]} tick={{ fill: "#93afa0", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0c1611",
                  borderColor: "#1e3328",
                  color: "#ecf5f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="sar_fused_ndvi"
                name="SAR-Fused NDVI"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="optical_ndvi"
                name="Optical NDVI (Clear Sky)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="evi"
                name="EVI"
                stroke="#a78bfa"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Above-Ground Biomass & CO2e Sequestration */}
      <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-50">
              Biomass (AGB) &amp; Carbon Sequestration Trajectory
            </h3>
          </div>
          <span className="text-[11px] text-emerald-300/80">
            ±{plantation.ci_95_margin_pct}% (95% CI)
          </span>
        </div>
        <p className="text-xs text-emerald-200/70 mb-3">
          Chave et al. (2014) allometric + IPCC Tier-2/3 ({plantation.species}).
        </p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeseries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3328" />
              <XAxis dataKey="month" tick={{ fill: "#93afa0", fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: "#93afa0", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0c1611",
                  borderColor: "#1e3328",
                  color: "#ecf5f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="agb_t_ha" name="AGB (t/ha)" fill="#059669" radius={[3, 3, 0, 0]} />
              <Bar dataKey="co2e_t_ha" name="CO2e (t/ha)" fill="#34d399" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
