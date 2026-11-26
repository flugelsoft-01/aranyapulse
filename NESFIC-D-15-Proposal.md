# NESFIC-D-15 Proposal: Forest & Tree Plantation Monitoring for Growth, Biomass, and Carbon Assessment

**Problem Statement:** NESFIC-D-15 — *Forest & Tree Plantation Monitoring for Growth, Biomass and Carbon Assessment*  
**Track:** Government Track (Assam State Space Application Centre / Environment & Forest Department)  
**Proposed Solution:** **AranyaPulse** — AI-Driven Multi-Temporal Geospatial & Field-Verified Forest Biomass and Carbon MRV Platform

---

## 1. Problem Understanding & User Workflow

Assam and North-East India execute large-scale afforestation, compensatory plantation (CAMPA), and forest restoration drives across diverse, often remote, flood-prone, and hilly terrains. Currently, forest departments and nodal agencies such as ASSAC rely on periodic manual field inventories (sample plot surveys measuring Diameter at Breast Height [DBH], tree height, and survival counts) supplemented by sporadic, static satellite maps. This creates three critical gaps:

1. **Low Monitoring Frequency & Delayed Intervention:** Physical surveys across scattered plantation polygons occur annually or semi-annually, meaning sapling mortality, encroachment, pest stress, or flood damage are detected too late for corrective replanting.
2. **Spatial Inconsistency & Estimation Uncertainty:** Extrapolating sparse sample plots across heterogeneous terrain introduces significant error in canopy cover, Above-Ground Biomass (AGB), and carbon stock estimates.
3. **Fragmented Evidence Base:** Field records, geotagged photos, drone orthomosaics, and satellite indices reside in disconnected spreadsheets and GIS files, making transparent auditability for climate finance, Green Credit, or CAMPA reporting difficult.

**Users & Beneficiaries:**
- **Primary Users:** Range Forest Officers (RFOs), Beat Officers, and Field Surveyors conducting ground-truthing; GIS/Remote Sensing Analysts at ASSAC and State Forest Departments; Divisional Forest Officers (DFOs) reviewing compliance.
- **Beneficiaries:** State Environment & Forest Departments, local Joint Forest Management Committees (JFMCs), and climate/carbon verification bodies.

**Intended Outcome:**
Unify satellite remote sensing, optional UAV/drone survey ingestion, and mobile ground-truthing into a single automated workflow that increases monitoring frequency to bi-weekly/monthly cycles, improves spatial accuracy of growth and biomass estimates, and establishes an auditable, evidence-backed carbon ledger.

---

## 2. Proposed Solution & Key Features

**AranyaPulse** is an end-to-end geospatial intelligence and Monitoring, Reporting, and Verification (MRV) web platform tailored for Assam’s plantation ecosystems. It replaces manual, siloed reporting with a continuous multi-source monitoring pipeline.

**Key Modules & Functions:**
1. **Plantation Registry & Polygon Explorer:** Interactive GIS workspace to upload/draw plantation boundaries (KML/GeoJSON/Shapefile), track species mix, plantation year, and administrative division.
2. **Multi-Temporal Satellite & Drone Analytics:** Automated ingestion of cloud-masked Sentinel-2 optical imagery, Sentinel-1 SAR (critical during Assam’s monsoon cloud cover), and optional UAV RGB/LiDAR/multispectral orthomosaics. Computes NDVI, EVI, NDWI, Canopy Cover %, and Canopy Height Model (CHM) time-series.
3. **AI/ML Growth, Biomass & Carbon Engine:** Combines region-specific allometric equations with ML regression models (Random Forest / Gradient Boosted Trees) trained on spectral, radar backscatter, and structural features to estimate AGB (tonnes/ha), Below-Ground Biomass (BGB), and $\text{CO}_2$-equivalent ($\text{tCO}_2\text{e}$) sequestration, complete with confidence intervals.
4. **Anomaly & Mortality Early-Warning System:** Detects sudden vegetation drop, canopy gaps, fire scars, or waterlogging stress, generating prioritized field-inspection alerts for Beat Officers.
5. **Ground-Truthing & Audit Module:** Structured mobile-responsive form for field teams to log geotagged photos, survival counts, DBH, and tree height—automatically calibrating and validating remote-sensing predictions.
6. **MRV & Compliance Report Exporter:** One-click generation of division-wise PDF/CSV audit dossiers with time-series charts, spatial maps, and methodology metadata.

**What Changes vs. Current Approach:**
Transitions forest monitoring from slow, sample-only annual spreadsheets to continuous, wall-to-wall spatial tracking where remote sensing directs targeted field visits and field data continuously refines AI biomass models.

---

## 3. User Journey, Wireframes, Prototype & Proof of Work

**Proposed User Journey:**
1. **Onboarding & Baseline:** A GIS analyst uploads plantation polygons (GeoJSON/Shapefile) with planting metadata (species, year, target density). The system automatically fetches historical satellite baselines.
2. **Automated Monitoring:** Every 10–15 days (or upon drone upload), the pipeline updates vegetation health, canopy density, and biomass estimates, flagging underperforming zones (e.g., <65% survival or sharp NDVI drop).
3. **Targeted Field Verification:** A Range/Beat Officer receives an alert, visits the flagged coordinates, and logs geotagged photos plus sample DBH/height measurements via the field form.
4. **Review & Carbon Reporting:** The DFO reviews the calibrated biomass/carbon dashboard, approves the verification log, and exports an audit-ready MRV report.

**Prototype & Proof of Work Status:**
To demonstrate technical feasibility beyond a narrative proposal, we have designed and are building the **AranyaPulse Interactive MVP** comprising:
- **Interactive Web Dashboard & Wireframes:** Multi-panel GIS map view with Assam plantation polygons, time-series growth/biomass charts, alert queue, and field-verification workflow.
- **Simulation & Model Pipeline:** Reproducible Python-based biomass/carbon estimation pipeline using open Sentinel-2/SAR feature schemas and standard IPCC/FSI allometric formulas, generating sample AGB and $\text{tCO}_2\text{e}$ outputs with uncertainty bounds.
- **Proof of Work Dossier (PDF):** Attached in Section 03, containing annotated UI wireframes, system architecture diagrams, prototype screenshots, sample simulation outputs, and validation metrics from public benchmark datasets.

*(Note: Populate the Demo URL and Product URL fields in Section 03 once the prototype web app is deployed and recorded.)*

---

## 4. Technology & Solution Architecture

AranyaPulse uses a modular, cloud-native, open-standards geospatial stack designed for scalability and low operational cost:

**1. Frontend (Web & Field Interface):**
- **Framework:** Next.js / React with TypeScript and Tailwind CSS for a responsive dashboard usable on desktop (DFOs/Analysts) and mobile browsers (Field Officers, with offline-first local caching).
- **Geospatial Visualization:** MapLibre GL JS / Leaflet for rendering vector polygons, raster tile overlays (NDVI, CHM, Biomass heatmaps), and time-slider comparisons; Recharts/Plotly for growth and carbon curves.

**2. Backend & Geospatial Processing:**
- **API Layer:** FastAPI (Python) providing RESTful endpoints for polygon management, analytics triggers, and field-log ingestion.
- **Geospatial & EO Engine:** Rasterio, GDAL, GeoPandas, Shapely, and PySTAC for querying open satellite catalogs (Copernicus Data Space / Planetary Computer) and processing GeoTIFF/COG (Cloud-Optimized GeoTIFF) layers.
- **Database:** PostgreSQL with **PostGIS** for spatial indexing, time-series metrics, and immutable audit logs; S3-compatible object storage for drone orthomosaics and geotagged field photos.

**3. AI/ML & Domain Models:**
- **Cloud-Free Compositing:** Sentinel-2 Scene Classification Layer (SCL) masking fused with Sentinel-1 SAR (VV/VH backscatter) to maintain continuity during heavy monsoon clouds.
- **Biomass & Growth Models:** Scikit-learn / XGBoost regressors calibrated against field DBH/height plots using Forest Survey of India (FSI) and IPCC Tier-2/Tier-3 allometric equations ($AGB \to BGB \to Carbon \to tCO_2e$).

**4. Hosting & Deployment:**
- Containerized (Docker) microservices deployable on NIC MeghRaj / AWS / GCP India regions with automated CI/CD.

---

## 5. Development Methodology & Intermediate Steps

We follow an iterative, Agile geospatial engineering methodology structured into five sequential stages:

1. **Stage 1 — Discovery & Requirements Alignment:**
   - *Activities:* Consult with ASSAC and Forest Department stakeholders to confirm polygon formats, priority plantation species (e.g., Sal, Teak, Bamboo, mixed native), and existing FSI allometric standards.
   - *Output:* Finalized Data Schema, MRV Specification, and Role-Based Access Control (RBAC) matrix.
2. **Stage 2 — UI/UX Wireframing & Architecture Design:**
   - *Activities:* Design low- and high-fidelity wireframes for the GIS Dashboard, Alert Triage, and Field Verification mobile web view; finalize PostGIS and EO pipeline architecture.
   - *Output:* Interactive Wireframes & System Design Document.
3. **Stage 3 — Core Prototype & Pipeline Build:**
   - *Activities:* Build the Sentinel-2/Sentinel-1 ingestion script, implement allometric + ML biomass estimation, and develop the interactive map + chart frontend.
   - *Output:* Functional Prototype running on sample Assam/North-East plantation polygons.
4. **Stage 4 — MVP Integration & Field Workflow:**
   - *Activities:* Integrate PostGIS storage, user authentication, mobile field-data upload with geotagged photo support, and automated PDF/CSV MRV report generation.
   - *Output:* End-to-End MVP ready for controlled testing.
5. **Stage 5 — Testing, Calibration & Refinement:**
   - *Activities:* Run accuracy benchmarks against ground-truth sample plots, optimize monsoon SAR-optical fusion, conduct usability testing with forestry users, and refine thresholds.
   - *Output:* Validated v1.0 Pilot-Ready Application & User Manual.

---

## 6. Development Timeline & Milestones

An indicative **24-week (6-month)** development plan from project kickoff to pilot-validation readiness:

- **Phase 1: Discovery & Design (Weeks 1–4)**
  - *Milestones:* Stakeholder workshop, schema freeze, UI/UX wireframes approved.
  - *Deliverables:* SRS, PostGIS data model, clickable UI prototype.
  - *Dependencies:* Confirmation of sample plantation boundaries and target species list from problem-owner.

- **Phase 2: Geospatial & AI/ML Core (Weeks 5–12)**
  - *Milestones:* Automated Sentinel-2/1 pipeline operational; baseline biomass/carbon model trained on open benchmark + regional allometric data.
  - *Deliverables:* EO processing engine, REST APIs, model evaluation report.
  - *Dependencies:* Access to historical ground-truth plot data (if available) for regional calibration.

- **Phase 3: Full-Stack MVP & Field Module (Weeks 13–18)**
  - *Milestones:* Interactive GIS dashboard, anomaly alerting, mobile field-verification form, and PDF MRV exporter integrated.
  - *Deliverables:* Deployed staging MVP with role-based login.

- **Phase 4: Testing, Calibration & Security Hardening (Weeks 19–22)**
  - *Milestones:* End-to-end QA, load testing, security audit, and model recalibration with initial field samples.
  - *Deliverables:* Test report, calibrated model weights, security checklist.

- **Phase 5: Validation Readiness & Pilot Handover (Weeks 23–24)**
  - *Milestones:* User Acceptance Testing (UAT) with ASSAC/Forest Officers; **Solution ready for live field validation by Week 24**.
  - *Deliverables:* Production-ready v1.0 release, training guide, pilot validation protocol.

---

## 7. Data & Information Requirements

Accurate monitoring requires combining open Earth Observation (EO) data with authoritative department records, without assuming unconfirmed restricted access:

**1. Publicly Available EO & Ancillary Data (Confirmed Accessible):**
- **Optical Imagery:** Sentinel-2 L2A (10m–20m resolution, 5-day revisit) via Copernicus Data Space / AWS Open Data.
- **Radar Imagery:** Sentinel-1 GRD C-band SAR (10m, all-weather) for monsoon cloud penetration.
- **Terrain & Canopy Baselines:** SRTM/Copernicus DEM (30m) for slope/aspect correction; open global canopy height baselines (e.g., ETH/Meta Global Canopy Height) for initialization.

**2. Department / Problem-Owner Data (Requested, Not Assumed):**
- **Plantation Polygons:** GeoJSON/Shapefile/KML boundaries with plantation ID, year, area, and species composition.
- **Ground-Truth Plot Records:** Historical DBH, tree height, survival %, and soil/site class measurements for local ML calibration.
- **Optional High-Res Drone Data:** UAV RGB/multispectral orthomosaics and point clouds (LAS/LAZ) where flown by the department.

**3. Processing, Annotation & Assumptions:**
- Satellite tiles require cloud/shadow masking, topographic normalization, and polygon clipping.
- Field records require standardized units (cm for DBH, m for height, WGS84 coordinates).
- *Fallback Assumption:* Where historical department ground-truth plots are unavailable initially, the system will initialize using peer-reviewed FSI/IPCC regional allometric equations and open forestry benchmark datasets, then progressively self-calibrate as new field logs are collected.

---

## 8. Team, Manpower & Expertise

A lean, multidisciplinary team of **5 core specialists** (indicative **~22 person-months** over 6 months) combining geospatial AI, full-stack engineering, and forestry domain expertise:

1. **Project Lead & Geospatial Architect (1 FTE, Phases 1–5):**
   - *Expertise:* GIS systems, Earth Observation pipelines, cloud architecture, government stakeholder coordination.
2. **AI/ML & Remote Sensing Engineer (1 FTE, Phases 1–4):**
   - *Expertise:* Multi-spectral & SAR feature engineering, canopy height/biomass regression, uncertainty quantification (Python, PyTorch/XGBoost, GDAL).
3. **Full-Stack & GIS Web Developer (1 FTE, Phases 2–5):**
   - *Expertise:* Next.js, MapLibre/Leaflet, FastAPI, PostGIS, responsive offline-capable web forms.
4. **Forestry & Carbon MRV Domain Advisor (0.5 FTE, Phases 1, 2, 4, 5):**
   - *Expertise:* Forest inventory protocols, FSI/IPCC allometric equations, species-specific growth curves, Assam/NE India ecology.
5. **QA, DevOps & Field Testing Specialist (0.5 FTE, Phases 3–5):**
   - *Expertise:* Automated testing, Docker/cloud deployment, security hardening, and field UAT coordination.

**Critical Specialist Skills:**
- **SAR-Optical Fusion:** Essential for Northeast India’s prolonged cloud cover.
- **Forestry Allometry & MRV:** Ensures AI outputs align with recognized national (FSI) and international (IPCC/Verra) carbon accounting standards rather than black-box estimates.

---

## 9. Testing, Validation & Evidence

**Development Testing Strategy:**
- **Unit & Integration Testing:** Automated `pytest` suites for geospatial clipping, CRS reprojection, allometric math, and API endpoints; frontend component/E2E tests.
- **Model Cross-Validation:** Spatial K-fold cross-validation (preventing spatial autocorrelation leakage) comparing predicted AGB and canopy cover against held-out field plots.

**Proposed Performance & Quality Measures:**
- **Biomass & Carbon Accuracy:** Root Mean Square Error (RMSE) $\le 15–20\%$ and $R^2 \ge 0.75$ against ground-truth plot AGB; Mean Absolute Error (MAE) tracking across age classes.
- **Survival / Anomaly Detection:** Precision/Recall $\ge 0.85$ on simulated/historical canopy-loss and stress events.
- **System Performance:** Map tile & polygon analytics load time $< 2.5\text{ s}$; automated EO pipeline refresh $< 15\text{ mins}$ per 1,000 ha batch; 99.5% API uptime.

**Evidence of Progress:**
- As part of this submission, we are building a working **AranyaPulse Prototype** demonstrating live polygon rendering, multi-temporal vegetation index simulation, allometric/ML biomass calculation, and MRV report export.
- Prior open-science benchmarks in tropical/subtropical forestry demonstrate that fusing Sentinel-1 SAR with Sentinel-2 optical bands significantly reduces monsoon data gaps and improves AGB estimation accuracy over optical-only methods—principles directly operationalized in our pipeline.

---

## 10. Security, Privacy, Safety & Compliance

**1. Data Security & Access Control:**
- Role-Based Access Control (RBAC) separating Field Surveyors, GIS Analysts, DFOs, and System Admins.
- TLS 1.3 encryption in transit and AES-256 encryption at rest for PostGIS and object storage; JWT/OAuth2 session management.

**2. Privacy & Spatial Sensitivity:**
- Sensitive exact coordinates of protected/endangered species or restricted forest zones can be masked or role-restricted while still surfacing aggregated division-level carbon metrics.
- Field officer uploads strip unnecessary device metadata beyond required GPS coordinates and timestamps.

**3. Interoperability & Open Standards:**
- Full support for OGC-compliant formats (GeoJSON, Shapefile, KML, Cloud-Optimized GeoTIFF, WMS/WMTS) to integrate seamlessly with existing ASSAC and State GIS portals.

**4. Auditability & Human-in-the-Loop Governance:**
- **Immutable Audit Trail:** Every biomass estimate stores the model version, satellite acquisition dates, input parameters, and linked ground-truth photos/measurements.
- **Mandatory Human Review:** Automated mortality alerts and carbon-stock certifications require explicit DFO/Analyst sign-off before being finalized in official MRV reports, preventing automated false positives from triggering erroneous administrative actions.

**5. Regulatory Alignment:**
- Aligned with India’s National Forest Policy, Forest Survey of India (FSI) inventory norms, Green Credit Program (GCP) verification principles, and MeitY/NIC cloud hosting guidelines.

---

## 11. Innovation & Differentiation

**Novel Elements:**
1. **Monsoon-Resilient SAR + Optical Fusion:** Unlike standard NDVI dashboards that go blind during Assam’s 5–6 month cloudy monsoon, AranyaPulse fuses Sentinel-1 C-band radar with Sentinel-2 optical data for uninterrupted year-round growth tracking.
2. **Closed-Loop Active Ground-Truthing:** Instead of treating field surveys and remote sensing separately, our platform uses satellite anomaly maps to direct Beat Officers to exact stress coordinates, and feeds their DBH/photo logs back to recalibrate local ML biomass models.
3. **Explainable, Standard-Aligned Carbon Ledger:** Couples ML predictions with transparent FSI/IPCC allometric baselines and confidence intervals, avoiding opaque "black-box" carbon numbers.

**Existing Alternatives & Differentiation:**
- *Generic GIS Tools (QGIS/ArcGIS):* Powerful but require manual analyst effort for every update and lack automated ML biomass pipelines or mobile field-audit loops.
- *Global Forest Platforms (e.g., Global Forest Watch):* Built for macro deforestation alerts (30m resolution), not fine-grained plantation survival, species growth, or division-level carbon MRV.

**IP & Dependencies:**
- Core platform leverages open-source geospatial/ML libraries (GDAL, Rasterio, PostGIS, MapLibre, Scikit-learn/XGBoost) with **no vendor lock-in**.
- Proprietary IP resides in the regional calibration pipeline, SAR-optical fusion workflow, and automated MRV audit engine, deployable on government infrastructure.

---

## 12. Resources, Risks & Pilot Validation

**Indicative Resource & Cost Drivers:**
- **Engineering & Domain Manpower (~70%):** 5-person multidisciplinary team over 6 months.
- **Cloud Compute & Storage (~15%):** PostGIS server, Python worker nodes for EO processing, and object storage for orthomosaics/photos.
- **Field Validation & Calibration (~15%):** Travel, handheld GPS/tablet usage, and optional targeted drone flights for ground-truth benchmarking.

**Key Risks & Mitigations:**
1. *Persistent Cloud Cover:* Mitigated via Sentinel-1 SAR fusion and temporal compositing.
2. *Limited Historical Ground-Truth Data:* Mitigated by initializing with FSI/IPCC allometric baselines and running structured Phase-4 field sampling.
3. *Low Field Connectivity:* Mitigated via offline-capable mobile web caching that syncs when 4G/Wi-Fi resumes.
4. *Species Heterogeneity & Mixed Canopies:* Mitigated by stratifying ML models by plantation age, terrain slope, and dominant species group.

**Post-Development Pilot Validation Plan:**
Following Week-24 readiness, the solution will undergo a **3-month controlled pilot** across **3–5 representative plantation sites** in Assam (covering plain, flood-prone, and foothill divisions) selected with ASSAC/Forest Department. Field teams will conduct stratified sample-plot measurements (DBH, height, survival) to benchmark platform accuracy ($R^2$, RMSE), alert precision, and officer workflow usability—producing a joint validation report to guide state-wide rollout.
