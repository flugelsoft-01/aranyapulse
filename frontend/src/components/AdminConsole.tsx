"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AdminSettings,
  AdminUser,
  AuditLogEntry,
  FieldLogItem,
  SpeciesEntry,
  UserRole,
} from "@/lib/types";
import {
  Users,
  Sliders,
  TreePine,
  ShieldAlert,
  RefreshCw,
  CheckCheck,
  History,
  UserPlus,
  Save,
} from "lucide-react";

interface AdminConsoleProps {
  apiBase: string;
  activeRole: UserRole;
  fieldLogs: FieldLogItem[];
  onDataChanged: () => Promise<void>;
}

export default function AdminConsole({
  apiBase,
  activeRole,
  fieldLogs,
  onDataChanged,
}: AdminConsoleProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [speciesList, setSpeciesList] = useState<SpeciesEntry[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("Beat Officer");
  const [newUserScope, setNewUserScope] = useState("Kamrup East Division");

  const [spKey, setSpKey] = useState("hollong");
  const [spLabel, setSpLabel] = useState("Hollong (Dipterocarpus retusus)");
  const [spRho, setSpRho] = useState("0.64");
  const [spRts, setSpRts] = useState("0.26");

  const [minSurv, setMinSurv] = useState("70");
  const [minNdvi, setMinNdvi] = useState("0.60");
  const [masking, setMasking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canManageAdmin = activeRole === "State Admin";
  const canApproveLogs = activeRole === "State Admin" || activeRole === "DFO";

  const loadAdminData = useCallback(async () => {
    const [uRes, sRes, setRes, aRes] = await Promise.all([
      fetch(`${apiBase}/api/admin/users`),
      fetch(`${apiBase}/api/admin/species`),
      fetch(`${apiBase}/api/admin/settings`),
      fetch(`${apiBase}/api/admin/audit-logs`),
    ]);
    if (uRes.ok) setUsers(await uRes.json());
    if (sRes.ok) setSpeciesList(await sRes.json());
    if (setRes.ok) {
      const cfg: AdminSettings = await setRes.json();
      setSettings(cfg);
      setMinSurv(String(cfg.min_survival_pct));
      setMinNdvi(String(cfg.ndvi_alert_threshold));
      setMasking(cfg.sensitive_zone_masking);
    }
    if (aRes.ok) setAuditLogs(await aRes.json());
  }, [apiBase]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const res = await fetch(`${apiBase}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName, role: newUserRole, scope: newUserScope }),
    });
    if (res.ok) {
      setNewUserName("");
      await loadAdminData();
      flash(`Provisioned ${newUserRole} account.`);
    }
  };

  const handleUpsertSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/species`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: spKey,
        label: spLabel,
        wood_density: parseFloat(spRho),
        root_to_shoot: parseFloat(spRts),
      }),
    });
    if (res.ok) {
      await Promise.all([loadAdminData(), onDataChanged()]);
      flash(`Updated allometric parameters for "${spKey}" and recalculated biomass.`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        min_survival_pct: parseFloat(minSurv),
        ndvi_alert_threshold: parseFloat(minNdvi),
        sensitive_zone_masking: masking,
      }),
    });
    if (res.ok) {
      await Promise.all([loadAdminData(), onDataChanged()]);
      flash("Alert thresholds & compliance settings saved.");
    }
  };

  const handleEoRefresh = async () => {
    const res = await fetch(`${apiBase}/api/admin/refresh-eo`, { method: "POST" });
    if (res.ok) {
      await Promise.all([loadAdminData(), onDataChanged()]);
      flash("Sentinel-1/2 SAR-Optical composite refreshed across all blocks.");
    }
  };

  const handleApproveAll = async () => {
    const res = await fetch(`${apiBase}/api/admin/field-logs/approve-all`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      await Promise.all([loadAdminData(), onDataChanged()]);
      flash(`Batch approved ${data.approved_count} pending verification log(s).`);
    }
  };

  const pendingLogs = fieldLogs.filter((l) => !l.dfo_approved);

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-emerald-50">
            Governance, RBAC &amp; Allometric Admin Console
          </h2>
          <p className="text-xs text-emerald-200/70">
            Active Role: <span className="font-semibold text-emerald-400">{activeRole}</span>{" "}
            {!canManageAdmin && "(Read-only mode for non-State Admin roles)"}
          </p>
        </div>
        {statusMsg && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {statusMsg}
          </span>
        )}
      </div>

      {/* Row 1: Alert Thresholds & EO Controls + DFO Batch Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={handleSaveSettings}
          className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#1e3328] pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-50">
                Alert Thresholds, Masking &amp; EO Pipeline
              </h3>
            </div>
            <button
              type="button"
              disabled={!canManageAdmin}
              onClick={handleEoRefresh}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/25 disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Sentinel-1/2
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-emerald-200/80 mb-1">Min Survival Alert (%)</label>
              <input
                type="number"
                step="0.5"
                min="10"
                max="100"
                disabled={!canManageAdmin}
                value={minSurv}
                onChange={(e) => setMinSurv(e.target.value)}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-emerald-50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-emerald-200/80 mb-1">Min NDVI Threshold</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="0.95"
                disabled={!canManageAdmin}
                value={minNdvi}
                onChange={(e) => setMinNdvi(e.target.value)}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] px-3 py-2 text-emerald-50 disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-emerald-200/90 pt-1 cursor-pointer">
            <input
              type="checkbox"
              disabled={!canManageAdmin}
              checked={masking}
              onChange={(e) => setMasking(e.target.checked)}
              className="rounded border-[#1e3328] bg-[#09110d] text-emerald-500"
            />
            <span>
              Enable Sensitive Zone Coordinate Masking (obfuscate exact corridor GPS for external viewers)
            </span>
          </label>

          <div className="flex items-center justify-between pt-2 border-t border-[#1e3328] text-[11px] text-emerald-300/70">
            <span>
              Last EO Sync: {settings ? new Date(settings.last_eo_refresh).toLocaleString() : "—"}
            </span>
            <button
              type="submit"
              disabled={!canManageAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </div>
        </form>

        {/* DFO Batch Verification Queue */}
        <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#1e3328] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-emerald-50">
                  DFO Human-in-the-Loop Verification Queue
                </h3>
              </div>
              <span className="text-xs text-amber-300">{pendingLogs.length} pending</span>
            </div>

            {pendingLogs.length === 0 ? (
              <p className="text-xs text-emerald-300/70 py-6 text-center">
                All ground-truth verification logs are DFO-approved and locked in the carbon ledger.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pendingLogs.map((l) => (
                  <div
                    key={l.log_id}
                    className="rounded-lg border border-amber-500/30 bg-[#09110d] p-2.5 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-amber-300">{l.plantation_id}</span> ·{" "}
                      <span className="text-emerald-100">{l.officer_name}</span>
                      <p className="text-[11px] text-emerald-200/70">
                        DBH {l.observed_dbh_cm} cm, H {l.observed_height_m} m, Survival {l.observed_survival_pct}%
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1e3328]">
            <button
              type="button"
              disabled={!canApproveLogs || pendingLogs.length === 0}
              onClick={handleApproveAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Batch Approve All ({pendingLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: RBAC Users & Species Allometric Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RBAC Users */}
        <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e3328] pb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-50">
              RBAC &amp; Forest Division Accounts
            </h3>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-emerald-300/80 border-b border-[#1e3328]">
                <tr>
                  <th className="py-1.5 pr-2">Officer</th>
                  <th className="py-1.5 pr-2">Role</th>
                  <th className="py-1.5">Division / Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3328]">
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td className="py-1.5 pr-2 font-medium text-emerald-50">{u.name}</td>
                    <td className="py-1.5 pr-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-1.5 text-emerald-200/70">{u.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e3328]">
            <input
              type="text"
              placeholder="Officer name"
              disabled={!canManageAdmin}
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="rounded-lg border border-[#1e3328] bg-[#09110d] px-2.5 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            />
            <select
              disabled={!canManageAdmin}
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="rounded-lg border border-[#1e3328] bg-[#09110d] px-2 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            >
              <option value="Beat Officer">Beat Officer</option>
              <option value="RFO">RFO</option>
              <option value="DFO">DFO</option>
              <option value="State Admin">State Admin</option>
              <option value="External Auditor">External Auditor</option>
            </select>
            <input
              type="text"
              placeholder="Division scope"
              disabled={!canManageAdmin}
              value={newUserScope}
              onChange={(e) => setNewUserScope(e.target.value)}
              className="rounded-lg border border-[#1e3328] bg-[#09110d] px-2.5 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canManageAdmin}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500 text-slate-950 px-3 py-1.5 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Species Allometric Registry */}
        <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e3328] pb-2">
            <TreePine className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-50">
              Species Allometric &amp; Wood Density Table (FSI/IPCC)
            </h3>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-emerald-300/80 border-b border-[#1e3328]">
                <tr>
                  <th className="py-1.5 pr-2">Key</th>
                  <th className="py-1.5 pr-2">Species Group</th>
                  <th className="py-1.5 pr-2">ρ (g/cm³)</th>
                  <th className="py-1.5">Root:Shoot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3328]">
                {speciesList.map((sp) => (
                  <tr key={sp.key}>
                    <td className="py-1.5 pr-2 font-mono text-emerald-300">{sp.key}</td>
                    <td className="py-1.5 pr-2 text-emerald-50">{sp.label}</td>
                    <td className="py-1.5 pr-2 font-semibold text-emerald-300">{sp.wood_density}</td>
                    <td className="py-1.5 text-emerald-200/80">{sp.root_to_shoot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleUpsertSpecies} className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#1e3328]">
            <input
              type="text"
              placeholder="key"
              disabled={!canManageAdmin}
              value={spKey}
              onChange={(e) => setSpKey(e.target.value)}
              className="rounded-lg border border-[#1e3328] bg-[#09110d] px-2 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            />
            <input
              type="text"
              placeholder="Species label"
              disabled={!canManageAdmin}
              value={spLabel}
              onChange={(e) => setSpLabel(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-[#1e3328] bg-[#09110d] px-2 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            />
            <input
              type="number"
              step="0.01"
              placeholder="ρ"
              disabled={!canManageAdmin}
              value={spRho}
              onChange={(e) => setSpRho(e.target.value)}
              className="rounded-lg border border-[#1e3328] bg-[#09110d] px-2 py-1.5 text-xs text-emerald-50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canManageAdmin}
              className="rounded-lg bg-emerald-500 text-slate-950 px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
            >
              Upsert
            </button>
          </form>
        </div>
      </div>

      {/* Row 3: Immutable Audit Trail */}
      <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4">
        <div className="flex items-center justify-between border-b border-[#1e3328] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-50">Immutable Governance Audit Trail</h3>
          </div>
          <span className="text-xs text-emerald-300/70">{auditLogs.length} events</span>
        </div>
        <div className="overflow-x-auto max-h-52 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-emerald-300/80 border-b border-[#1e3328]">
              <tr>
                <th className="py-1.5 pr-3">ID</th>
                <th className="py-1.5 pr-3">Timestamp</th>
                <th className="py-1.5 pr-3">Actor (Role)</th>
                <th className="py-1.5 pr-3">Action</th>
                <th className="py-1.5">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3328]">
              {auditLogs.map((a) => (
                <tr key={a.audit_id}>
                  <td className="py-1.5 pr-3 font-mono text-emerald-300">{a.audit_id}</td>
                  <td className="py-1.5 pr-3 text-emerald-200/70">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="py-1.5 pr-3 text-emerald-50">
                    {a.actor} <span className="text-emerald-400/70">({a.role})</span>
                  </td>
                  <td className="py-1.5 pr-3 text-emerald-100">{a.action}</td>
                  <td className="py-1.5 text-emerald-200/80">{a.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
