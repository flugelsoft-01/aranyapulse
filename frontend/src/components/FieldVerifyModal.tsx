"use client";

import React, { useState, useEffect } from "react";
import { PlantationProperties } from "@/lib/types";
import { X, Camera, CheckCircle2 } from "lucide-react";

interface FieldVerifyModalProps {
  open: boolean;
  plantation: PlantationProperties | null;
  onClose: () => void;
  onSubmit: (payload: {
    plantation_id: string;
    officer_name: string;
    observed_dbh_cm: number;
    observed_height_m: number;
    observed_survival_pct: number;
    notes: string;
    photo_name: string;
  }) => Promise<void>;
}

export default function FieldVerifyModal({
  open,
  plantation,
  onClose,
  onSubmit,
}: FieldVerifyModalProps) {
  const [officerName, setOfficerName] = useState("A. Gogoi (Beat Officer)");
  const [dbh, setDbh] = useState("10.5");
  const [height, setHeight] = useState("6.2");
  const [survival, setSurvival] = useState("82.0");
  const [notes, setNotes] = useState("");
  const [photoName, setPhotoName] = useState("plot_sample_geotag.jpg");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (plantation) {
      setDbh(String(plantation.mean_dbh_cm));
      setHeight(String(plantation.mean_height_m));
      setSurvival(String(plantation.survival_rate));
      setNotes("");
    }
  }, [plantation]);

  if (!open || !plantation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        plantation_id: plantation.id,
        officer_name: officerName,
        observed_dbh_cm: parseFloat(dbh),
        observed_height_m: parseFloat(height),
        observed_survival_pct: parseFloat(survival),
        notes,
        photo_name: photoName,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-verify-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#1e3328] bg-[#101b15] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e3328] pb-3 mb-4">
          <div>
            <h2 id="field-verify-title" className="text-base font-bold text-emerald-50">
              Ground-Truth Field Verification
            </h2>
            <p className="text-xs text-emerald-300/80">
              {plantation.id} — {plantation.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-emerald-200/70 hover:bg-[#1e3328] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-emerald-200 mb-1">
              Field Officer / Surveyor Name
            </label>
            <input
              type="text"
              required
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-emerald-200 mb-1">
                Mean DBH (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="200"
                required
                value={dbh}
                onChange={(e) => setDbh(e.target.value)}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-200 mb-1">
                Height (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="80"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-200 mb-1">
                Survival (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={survival}
                onChange={(e) => setSurvival(e.target.value)}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-emerald-200 mb-1">
              Geotagged Field Photo Evidence
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a4738] bg-[#09110d] px-3 py-2">
              <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoName(file.name);
                }}
                className="text-xs text-emerald-200/80 file:mr-3 file:rounded file:border-0 file:bg-emerald-900/60 file:px-2.5 file:py-1 file:text-xs file:text-emerald-200 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-emerald-200 mb-1">
              Field Observations / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Sapling survival verified; recommended weeding in Sector B..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-[#1e3328] text-xs font-medium text-emerald-200 hover:bg-[#16261d] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {submitting ? "Calibrating Model..." : "Submit & Recalibrate AGB"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
