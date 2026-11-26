# AranyaPulse — NESFIC-D-15 Forest & Plantation Monitoring MVP

**Challenge:** NESFIC-D-15 — *Forest & Tree Plantation Monitoring for Growth, Biomass, and Carbon Assessment*  
**Proposal Document:** [`NESFIC-D-15-Proposal.md`](./NESFIC-D-15-Proposal.md)

## Architecture
- **`backend/` (FastAPI + Python):**
  - `models/biomass.py`: Chave et al. (2014) allometric + IPCC Tier-2/3 AGB, BGB, Carbon Stock, and $\text{CO}_2\text{e}$ estimation engine.
  - `models/satellite_sim.py`: 24-month Sentinel-2 optical + Sentinel-1 C-band SAR fusion time-series generator (maintaining continuity during Assam's monsoon).
  - `data/assam_plantations.geojson`: Sample Assam plantation polygons (Kaziranga Buffer, Rani Reserve, Nameri Corridor, Dibru-Saikhowa, Orang Fringe).
- **`frontend/` (Next.js + TypeScript + Tailwind + Recharts):**
  - Interactive Assam Plantation GIS Explorer (`NDVI`, `AGB`, `Canopy Height`, `Mortality Alerts`).
  - 24-month SAR-Optical & Biomass/CO2e analytics charts.
  - Ground-Truthing Verification modal (recalibrates plot AGB & logs DFO audit trail).
  - One-click **Export MRV / Proof PDF** dossier generator.

## Quickstart

### 1. Run Backend (Port 8000)
```bash
cd backend
.venv/bin/uvicorn main:app --reload --port 8000
```

### 2. Run Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser. Click **Export MRV / Proof PDF** -> **Print / Save as PDF** to generate the Proof-of-Work PDF for NESFIC Section 03.
