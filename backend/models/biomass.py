"""Biomass and carbon stock estimation engine aligned with FSI & IPCC Tier-2/3 equations."""

from dataclasses import dataclass
import math


@dataclass
class BiomassEstimate:
    agb_tonnes_per_ha: float
    bgb_tonnes_per_ha: float
    total_biomass_tonnes_per_ha: float
    carbon_tonnes_per_ha: float
    co2e_tonnes_per_ha: float
    total_co2e_tonnes: float
    ci_95_margin_pct: float
    canopy_cover_pct: float


# Wood density (g/cm^3) approximations by species group for Assam/NE India
SPECIES_WOOD_DENSITY = {
    "sal": 0.72,
    "teak": 0.60,
    "bamboo": 0.55,
    "bonsum": 0.52,
    "mixed": 0.58,
}


def _infer_wood_density(species: str) -> float:
    s = species.lower()
    for key, rho in SPECIES_WOOD_DENSITY.items():
        if key in s:
            return rho
    return 0.58


def estimate_biomass_and_carbon(
    area_ha: float,
    target_stems_per_ha: int,
    survival_rate_pct: float,
    mean_dbh_cm: float,
    mean_height_m: float,
    species: str = "Mixed Native",
    ndvi: float = 0.70,
    field_calibrated: bool = False,
    wood_density_override: float | None = None,
    root_to_shoot_ratio: float = 0.26,
) -> BiomassEstimate:
    """
    Estimate Above-Ground Biomass (AGB), Below-Ground Biomass (BGB),
    Carbon Stock, and CO2-equivalent using Chave et al. (2014) pantropical
    allometric equation blended with satellite NDVI structural prior.
    """
    rho = wood_density_override if wood_density_override is not None else _infer_wood_density(species)
    live_stems_per_ha = max(1.0, target_stems_per_ha * (survival_rate_pct / 100.0))

    # Chave et al. (2014) pantropical AGB per tree (kg): 0.0673 * (rho * D^2 * H)^0.976
    dbh = max(1.5, mean_dbh_cm)
    height = max(0.8, mean_height_m)
    agb_per_tree_kg = 0.0673 * ((rho * (dbh ** 2) * height) ** 0.976)

    # Convert to tonnes/ha and apply mild spectral consistency adjustment
    allometric_agb_t_ha = (agb_per_tree_kg * live_stems_per_ha) / 1000.0
    spectral_factor = 0.85 + 0.30 * max(0.0, min(1.0, ndvi))
    agb_t_ha = allometric_agb_t_ha * (0.85 + 0.15 * spectral_factor)

    # IPCC default root-to-shoot ratio for tropical/subtropical moist forests (~0.26)
    bgb_t_ha = agb_t_ha * root_to_shoot_ratio
    total_biomass_t_ha = agb_t_ha + bgb_t_ha

    # IPCC carbon fraction = 0.47; CO2e = Carbon * (44/12)
    carbon_t_ha = total_biomass_t_ha * 0.47
    co2e_t_ha = carbon_t_ha * (44.0 / 12.0)
    total_co2e = co2e_t_ha * area_ha

    # Confidence interval narrows when field-calibrated
    ci_margin = 9.2 if field_calibrated else 16.4
    canopy_cover = min(98.0, max(12.0, round(ndvi * 108.0 * (survival_rate_pct / 100.0) ** 0.35, 1)))

    return BiomassEstimate(
        agb_tonnes_per_ha=round(agb_t_ha, 2),
        bgb_tonnes_per_ha=round(bgb_t_ha, 2),
        total_biomass_tonnes_per_ha=round(total_biomass_t_ha, 2),
        carbon_tonnes_per_ha=round(carbon_t_ha, 2),
        co2e_tonnes_per_ha=round(co2e_t_ha, 2),
        total_co2e_tonnes=round(total_co2e, 1),
        ci_95_margin_pct=ci_margin,
        canopy_cover_pct=canopy_cover,
    )
