"""Multi-temporal Sentinel-2 optical & Sentinel-1 SAR time-series generator and anomaly detector."""

import math
from typing import List, Dict, Any


MONTH_LABELS = [
    "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
    "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11",
    "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
    "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
]


def generate_timeseries(
    plantation_id: str,
    base_ndvi: float,
    agb_latest: float,
    co2e_latest: float,
    status: str,
) -> List[Dict[str, Any]]:
    """
    Generate a 24-month multi-temporal EO series showing:
    - Optical NDVI (with monsoon cloud-masking gaps in Jun-Sep)
    - SAR-fused NDVI (Sentinel-1 VV/VH continuity through monsoon)
    - EVI & NDWI
    - Progressive AGB (t/ha) and cumulative CO2e (t/ha)
    """
    series: List[Dict[str, Any]] = []
    seed_offset = sum(ord(c) for c in plantation_id) % 10 * 0.005
    is_alert = "Alert" in status

    for idx, month in enumerate(MONTH_LABELS):
        m_num = int(month.split("-")[1])
        is_monsoon = m_num in (6, 7, 8, 9)

        # Seasonal phenology wave + gradual growth trend
        growth_trend = (idx / 23.0) * (0.04 if is_alert else 0.11)
        seasonal = 0.04 * math.sin((m_num - 3) * math.pi / 6.0)
        dip = -0.14 if (is_alert and idx >= 18) else 0.0

        sar_fused_ndvi = max(0.25, min(0.92, base_ndvi - 0.07 + growth_trend + seasonal + dip + seed_offset))
        optical_ndvi = None if (is_monsoon and idx % 2 == 1) else round(sar_fused_ndvi - 0.015, 3)

        evi = round(max(0.18, sar_fused_ndvi * 0.78), 3)
        ndwi = round(max(-0.15, (0.18 if is_monsoon else 0.04) + 0.25 * (sar_fused_ndvi - 0.5)), 3)
        sar_vh_db = round(-13.8 + 2.4 * sar_fused_ndvi + (0.6 if is_monsoon else 0.0), 2)

        progress = 0.62 + 0.38 * (idx / 23.0)
        if is_alert and idx >= 18:
            progress *= 0.88

        series.append({
            "month": month,
            "optical_ndvi": optical_ndvi,
            "sar_fused_ndvi": round(sar_fused_ndvi, 3),
            "evi": evi,
            "ndwi": ndwi,
            "sar_vh_db": sar_vh_db,
            "agb_t_ha": round(agb_latest * progress, 2),
            "co2e_t_ha": round(co2e_latest * progress, 2),
            "cloud_cover_pct": 78 if is_monsoon else 14,
        })

    return series
