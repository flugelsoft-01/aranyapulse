"use client";

import React from "react";
import { MrvSummary } from "@/lib/types";
import { X, Printer, ShieldCheck } from "lucide-react";

interface MrvReportModalProps {
  open: boolean;
  summary: MrvSummary | null;
  onClose: () => void;
}

export default function MrvReportModal({ open, summary, onClose }: MrvReportModalProps) {
  if (!open || !summary) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mrv-report-title"
    >
      <div className="w-full max-w-4xl rounded-xl border border-[#1e3328] bg-white text-slate-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 id="mrv-report-title" className="text-base font-bold text-slate-900">
              NESFIC-D-15 MRV &amp; Proof-of-Work Dossier Preview
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close report preview"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                NESFIC 2026 — Problem Statement D-15
              </p>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                AranyaPulse: Forest &amp; Plantation Biomass / Carbon MRV Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Assam State Space Application Centre (ASSAC) &amp; Environment &amp; Forest Department Prototype
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Generated: {new Date(summary.generated_at).toLocaleString()}</p>
              <p>Standard: IPCC Tier-2/3 &amp; FSI Allometry</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Monitored Area</p>
              <p className="text-lg font-bold text-slate-900">{summary.total_area_ha} ha</p>
              <p className="text-[11px] text-slate-500">{summary.total_polygons} polygons</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Total Sequestered CO2e</p>
              <p className="text-lg font-bold text-emerald-700">
                {summary.total_co2e_tonnes.toLocaleString()} t
              </p>
              <p className="text-[11px] text-slate-500">AGB + BGB combined</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Mean Survival Rate</p>
              <p className="text-lg font-bold text-slate-900">{summary.mean_survival_pct}%</p>
              <p className="text-[11px] text-slate-500">Field-calibrated</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">DFO-Verified Logs</p>
              <p className="text-lg font-bold text-slate-900">
                {summary.verified_logs_count} / {summary.total_logs_count}
              </p>
              <p className="text-[11px] text-slate-500">Human-in-the-loop audit</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Plantation-Wise Biomass &amp; Carbon Ledger
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Plantation &amp; Division</th>
                    <th className="p-2.5">Area (ha)</th>
                    <th className="p-2.5">Survival</th>
                    <th className="p-2.5">AGB (t/ha)</th>
                    <th className="p-2.5">Total CO2e (t)</th>
                    <th className="p-2.5">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.plantations.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-semibold">{p.id}</td>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.division}</div>
                      </td>
                      <td className="p-2.5">{p.area_ha}</td>
                      <td className="p-2.5">{p.survival_rate}%</td>
                      <td className="p-2.5">{p.agb_t_ha}</td>
                      <td className="p-2.5 font-semibold text-emerald-700">{p.total_co2e_tonnes}</td>
                      <td className="p-2.5">
                        {p.field_calibrated ? "Field Calibrated" : "EO Baseline"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Methodology: </span>
            {summary.methodology}
          </div>
        </div>
      </div>
    </div>
  );
}
