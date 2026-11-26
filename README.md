# AranyaPulse — NESFIC-D-15 Forest & Plantation Monitoring MVP

**Challenge:** NESFIC-D-15 — *Forest & Tree Plantation Monitoring for Growth, Biomass, and Carbon Assessment*  
**Proposal Document:** [`NESFIC-D-15-Proposal.md`](./NESFIC-D-15-Proposal.md)

## Architecture
- **`frontend/` (Next.js + TypeScript + Tailwind + Recharts):**
  - Interactive Assam Plantation GIS Explorer (`NDVI`, `AGB`, `Canopy Height`, `Mortality Alerts`).
  - 24-month SAR-Optical & Biomass/CO2e analytics charts.
  - Ground-Truthing Verification modal (recalibrates plot AGB & logs DFO audit trail).
  - One-click **Export MRV / Proof PDF** dossier generator.
- **`worker/` (Cloudflare Worker Edge API + Static Assets):**
  - Serves `frontend/out` via Cloudflare Workers Static Assets and handles `/api/*` endpoints at the edge for single-command deployment.
- **`backend/` (FastAPI + Python):**
  - Local/cloud Python backend (`models/biomass.py`, `models/satellite_sim.py`, `data/assam_plantations.geojson`) with `pytest` suite.

## Cloudflare Workers Deployment (Single-Command Full-Stack)
1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```
2. Build static frontend (`frontend/out`) and deploy Worker + Static Assets:
   ```bash
   npm run deploy:cf
   ```
   *(Or test locally with `npm run build:frontend && npm run dev:cf`.)*

## Local Development (Python FastAPI + Next.js)
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
*(Ensure `frontend/.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8000`.)*
