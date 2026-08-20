from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schema import EnergyConsumption, EmissionFactor
from app.services.dashboard_service import get_dashboard_metrics

def calculate_what_if(db: Session, target_category: str, reduction_percentage: float):
    """
    Deterministic What-If Sustainability Simulation Engine using actual VESIT campus figures.
    """
    # 1. Fetch grid factor
    try:
        from app.models.emission_factor import EmissionFactor as EFModel
        ef = db.query(EFModel).filter(
            EFModel.category.ilike("%Scope 2%") | 
            EFModel.subcategory.ilike("%Grid%") |
            EFModel.category.ilike("%Electricity%")
        ).first()
        factor = float(ef.factor_value) if ef else 0.82
    except:
        factor = 0.82

    # 2. Query VESIT baseline (latest full annual consumption or YTD annualized)
    vesit_annual_kwh = db.query(func.sum(EnergyConsumption.units_consumed_kwh)).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.year == 2025
    ).scalar()

    if not vesit_annual_kwh:
        # Fallback to general dashboard metrics if VESIT data not loaded
        metrics = get_dashboard_metrics(db)
        total_energy = sum(b.total_energy_kwh for b in metrics.building.buildings) if metrics.building.buildings else 510968.0
        old_co2e = metrics.overall.total_co2e if metrics.overall.total_co2e > 0 else (total_energy * factor)
    else:
        total_energy = float(vesit_annual_kwh)
        old_co2e = total_energy * factor

    cat_upper = target_category.upper()
    savings_kwh = 0.0

    if cat_upper in ["AC", "COOLING", "HVAC"]:
        # AC cooling represents ~45% of total VESIT electrical demand
        ac_baseline_kwh = total_energy * 0.45
        savings_kwh = ac_baseline_kwh * (reduction_percentage / 100.0)
    elif cat_upper in ["LIGHTING", "LIGHT"]:
        # Lighting accounts for ~18% of total electrical demand
        light_baseline_kwh = total_energy * 0.18
        savings_kwh = light_baseline_kwh * (reduction_percentage / 100.0)
    elif cat_upper in ["SOLAR", "RENEWABLE"]:
        # Solar offset directly reduces grid electricity demand
        savings_kwh = total_energy * (reduction_percentage / 100.0)
    else:
        savings_kwh = total_energy * (reduction_percentage / 100.0) * 0.20

    savings_co2e = savings_kwh * factor
    new_energy = max(0.0, total_energy - savings_kwh)
    new_co2e = max(0.0, old_co2e - savings_co2e)
    pct_reduction = (savings_co2e / old_co2e * 100) if old_co2e > 0 else 0.0

    return {
        "target_category": target_category,
        "reduction_applied_pct": reduction_percentage,
        "baseline_energy_kwh": round(total_energy, 1),
        "baseline_co2e": round(old_co2e, 1),
        "new_energy_kwh": round(new_energy, 1),
        "new_co2e": round(new_co2e, 1),
        "co2e_saved": round(savings_co2e, 1),
        "overall_impact_pct": round(pct_reduction, 2),
        "emission_factor_used": factor,
        "benchmark": "V.E.S. Institute of Technology (VESIT) Annual Electricity Baseline"
    }

