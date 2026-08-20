from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.carbon_calculation import CarbonCalculation
from app.models.department import Department
from app.models.emission_factor import EmissionFactor
from app.models.schema import EnergyConsumption, Appliance, CarbonEmission, Institute
from app.schemas.analytics import DashboardOverview, DepartmentRanking, ScopeBreakdown
from datetime import datetime, date

MONTH_ORDER = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12
}

def get_grid_factor(db: Session) -> float:
    ef = db.query(EmissionFactor).filter(
        EmissionFactor.category.ilike("%Scope 2%") | 
        EmissionFactor.subcategory.ilike("%Grid%") |
        EmissionFactor.category.ilike("%Electricity%")
    ).first()
    return float(ef.factor_value) if ef else 0.82

def get_campus_overview(db: Session, mode: str = "VESIT_ACTUAL") -> DashboardOverview:
    """
    Return executive overview based on selected data mode (VESIT_ACTUAL vs TEST_DEMO).
    """
    if mode == "VESIT_ACTUAL":
        # Calculate from VESIT EnergyConsumption records
        factor = get_grid_factor(db)
        total_kwh = db.query(func.sum(EnergyConsumption.units_consumed_kwh)).filter(
            EnergyConsumption.data_source_type == "VESIT_ACTUAL"
        ).scalar() or 0.0

        if total_kwh > 0:
            total_co2e = total_kwh * factor

            # Top wings / sectors
            wing_records = db.query(
                EnergyConsumption.wing,
                func.sum(EnergyConsumption.units_consumed_kwh).label("kwh")
            ).filter(
                EnergyConsumption.data_source_type == "VESIT_ACTUAL"
            ).group_by(EnergyConsumption.wing).order_by(func.sum(EnergyConsumption.units_consumed_kwh).desc()).all()

            top_departments = [
                DepartmentRanking(
                    department_id=idx + 1,
                    department_name=f"VESIT {w or 'Main'} (Contract Demand: {'350 KVA' if 'A' in str(w) else '175 KVA'})",
                    total_kgco2e=round((kwh or 0.0) * factor, 1)
                )
                for idx, (w, kwh) in enumerate(wing_records)
            ]

            scope_breakdown = ScopeBreakdown(
                scope_1=0.0,
                scope_2=round(total_co2e, 1),
                scope_3=0.0
            )

            return DashboardOverview(
                total_campus_emissions_kgco2e=round(total_co2e, 1),
                scope_breakdown=scope_breakdown,
                top_departments=top_departments
            )

    # Fallback to test demo calculations (or if mode == "TEST_DEMO" / empty VESIT)
    total = db.query(func.sum(CarbonCalculation.calculated_emission)).scalar() or 0.0

    scope_breakdown_raw = db.query(
        EmissionFactor.category, 
        func.sum(CarbonCalculation.calculated_emission)
    ).join(CarbonCalculation, CarbonCalculation.factor_id == EmissionFactor.id)\
     .group_by(EmissionFactor.category).all()
     
    scope_map = {category: amount for category, amount in scope_breakdown_raw}
    scope_breakdown = ScopeBreakdown(
        scope_1=scope_map.get("Scope 1", 0.0),
        scope_2=scope_map.get("Scope 2", 0.0),
        scope_3=scope_map.get("Scope 3", 0.0),
    )

    dept_rankings_raw = db.query(
        Department.id,
        Department.name,
        func.sum(CarbonCalculation.calculated_emission).label('total')
    ).join(CarbonCalculation, CarbonCalculation.department_id == Department.id)\
     .group_by(Department.id, Department.name)\
     .order_by(func.sum(CarbonCalculation.calculated_emission).desc()).limit(5).all()

    top_departments = [
        DepartmentRanking(department_id=row.id, department_name=row.name, total_kgco2e=row.total)
        for row in dept_rankings_raw
    ]

    return DashboardOverview(
        total_campus_emissions_kgco2e=total,
        scope_breakdown=scope_breakdown,
        top_departments=top_departments
    )

def get_vesit_monthly_history(db: Session, year: int = None, wing: str = "ALL") -> dict:
    """
    Return comprehensive monthly breakdown (2022-2026) for A Wing, B Wing, and Construction.
    """
    factor = get_grid_factor(db)

    query = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL"
    )
    if year:
        query = query.filter(EnergyConsumption.year == year)
    if wing != "ALL":
        query = query.filter(EnergyConsumption.wing == wing)

    records = query.order_by(EnergyConsumption.date.asc(), EnergyConsumption.wing.asc()).all()

    # Group by date / month for combined monthly row
    months_dict = {}
    for r in records:
        key = str(r.date)
        if key not in months_dict:
            months_dict[key] = {
                "date": str(r.date),
                "year": r.year,
                "month_number": r.month_number,
                "month_name": r.month,
                "a_wing_kwh": 0.0,
                "a_wing_co2e": 0.0,
                "a_wing_amount": 0.0,
                "a_wing_demand": None,
                "a_wing_pf": None,
                "b_wing_kwh": 0.0,
                "b_wing_co2e": 0.0,
                "b_wing_amount": 0.0,
                "b_wing_demand": None,
                "b_wing_pf": None,
                "construction_kwh": 0.0,
                "construction_amount": 0.0,
                "total_kwh": 0.0,
                "total_co2e": 0.0,
                "total_amount": 0.0,
                "avg_rate": 0.0
            }

        kwh = r.units_consumed_kwh or 0.0
        amt = r.amount_paid or 0.0
        co2e = kwh * factor

        if r.wing == "A Wing":
            months_dict[key]["a_wing_kwh"] = round(kwh, 1)
            months_dict[key]["a_wing_co2e"] = round(co2e, 1)
            months_dict[key]["a_wing_amount"] = round(amt, 2)
            months_dict[key]["a_wing_demand"] = r.billing_demand
            months_dict[key]["a_wing_pf"] = r.power_factor
        elif r.wing == "B Wing":
            months_dict[key]["b_wing_kwh"] = round(kwh, 1)
            months_dict[key]["b_wing_co2e"] = round(co2e, 1)
            months_dict[key]["b_wing_amount"] = round(amt, 2)
            months_dict[key]["b_wing_demand"] = r.billing_demand
            months_dict[key]["b_wing_pf"] = r.power_factor
        elif r.wing == "Construction":
            months_dict[key]["construction_kwh"] = round(kwh, 1)
            months_dict[key]["construction_amount"] = round(amt, 2)

        months_dict[key]["total_kwh"] += kwh
        months_dict[key]["total_co2e"] += co2e
        months_dict[key]["total_amount"] += amt

    # Calculate average rates
    rows = []
    for k, item in sorted(months_dict.items(), key=lambda x: x[0]):
        item["total_kwh"] = round(item["total_kwh"], 1)
        item["total_co2e"] = round(item["total_co2e"], 1)
        item["total_amount"] = round(item["total_amount"], 2)
        if item["total_kwh"] > 0:
            item["avg_rate"] = round(item["total_amount"] / item["total_kwh"], 2)
        rows.append(item)

    return {
        "institute": "V.E.S. Institute of Technology (VESIT)",
        "emission_factor_used": factor,
        "total_records": len(rows),
        "history": rows
    }

def get_vesit_annual_trends(db: Session) -> dict:
    """
    Annual comparison trend analysis (2022, 2023, 2024, 2025, 2026).
    Calculates total kWh, total CO2e, total expense, monthly average, min/max months, and YoY change %.
    """
    factor = get_grid_factor(db)

    years = db.query(EnergyConsumption.year).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL"
    ).distinct().order_by(EnergyConsumption.year.asc()).all()

    annual_data = []
    prev_year_total_kwh = None

    for (y,) in years:
        records = db.query(
            EnergyConsumption.month_number,
            EnergyConsumption.month,
            func.sum(EnergyConsumption.units_consumed_kwh).label("month_kwh"),
            func.sum(EnergyConsumption.amount_paid).label("month_amount")
        ).filter(
            EnergyConsumption.year == y,
            EnergyConsumption.data_source_type == "VESIT_ACTUAL"
        ).group_by(EnergyConsumption.month_number, EnergyConsumption.month).all()

        if not records:
            continue

        months_count = len(records)
        total_kwh = sum(r.month_kwh or 0.0 for r in records)
        total_amount = sum(r.month_amount or 0.0 for r in records)
        total_co2e = total_kwh * factor

        month_kwh_vals = [r.month_kwh or 0.0 for r in records]
        avg_monthly = total_kwh / months_count if months_count > 0 else 0.0
        max_monthly = max(month_kwh_vals) if month_kwh_vals else 0.0
        min_monthly = min(month_kwh_vals) if month_kwh_vals else 0.0

        max_month_name = next(r.month for r in records if (r.month_kwh or 0.0) == max_monthly) if month_kwh_vals else "N/A"
        min_month_name = next(r.month for r in records if (r.month_kwh or 0.0) == min_monthly) if month_kwh_vals else "N/A"

        # Year over year calculation
        yoy_change_pct = None
        yoy_change_text = "Baseline Year"
        if prev_year_total_kwh is not None and prev_year_total_kwh > 0:
            # For 2026 (7 months), compare same 7 months of previous year
            if y == 2026:
                prev_same_period_kwh = db.query(func.sum(EnergyConsumption.units_consumed_kwh)).filter(
                    EnergyConsumption.year == y - 1,
                    EnergyConsumption.month_number <= months_count,
                    EnergyConsumption.data_source_type == "VESIT_ACTUAL"
                ).scalar() or prev_year_total_kwh
                yoy_change_pct = round(((total_kwh - prev_same_period_kwh) / prev_same_period_kwh) * 100, 1)
                direction = "increased" if yoy_change_pct >= 0 else "decreased"
                yoy_change_text = f"Electricity consumption {direction} by {abs(yoy_change_pct)}% compared with the same 7-month period in {y-1}."
            else:
                yoy_change_pct = round(((total_kwh - prev_year_total_kwh) / prev_year_total_kwh) * 100, 1)
                direction = "increased" if yoy_change_pct >= 0 else "decreased"
                yoy_change_text = f"Electricity consumption {direction} by {abs(yoy_change_pct)}% compared with {y-1}."

        annual_data.append({
            "year": y,
            "recorded_months": months_count,
            "is_complete_year": months_count == 12,
            "total_kwh": round(total_kwh, 1),
            "total_co2e_kg": round(total_co2e, 1),
            "total_co2e_tons": round(total_co2e / 1000.0, 2),
            "total_expense_inr": round(total_amount, 2),
            "avg_monthly_kwh": round(avg_monthly, 1),
            "avg_monthly_co2e_kg": round(avg_monthly * factor, 1),
            "max_monthly_kwh": round(max_monthly, 1),
            "max_month": max_month_name,
            "min_monthly_kwh": round(min_monthly, 1),
            "min_month": min_month_name,
            "yoy_change_pct": yoy_change_pct,
            "yoy_summary_text": yoy_change_text
        })

        prev_year_total_kwh = total_kwh

    return {
        "institute": "V.E.S. Institute of Technology (VESIT)",
        "emission_factor_used": factor,
        "annual_trends": annual_data
    }

def get_vesit_appliance_inventory(db: Session) -> dict:
    """
    Return VESIT electrical load inventory categorized with category totals and equipment lists.
    """
    factor = get_grid_factor(db)
    appliances = db.query(Appliance).filter(
        Appliance.source_type == "VESIT_ACTUAL"
    ).all()

    category_summary = {}
    total_equipment_count = 0
    total_estimated_monthly_kwh = 0.0

    items_list = []
    for a in appliances:
        cat = a.appliance_category or "Other"
        qty = a.quantity or 0
        total_equipment_count += qty

        # Estimated load if rated power is known
        est_monthly_kwh = 0.0
        if a.rated_power_kw and a.rated_power_kw > 0 and qty > 0:
            hrs = a.operating_hours_per_day or 8.0
            est_monthly_kwh = qty * a.rated_power_kw * hrs * 30.0
            total_estimated_monthly_kwh += est_monthly_kwh

        if cat not in category_summary:
            category_summary[cat] = {
                "category": cat,
                "total_quantity": 0,
                "item_count": 0,
                "known_power_count": 0,
                "estimated_monthly_kwh": 0.0,
                "estimated_monthly_co2e_kg": 0.0
            }

        category_summary[cat]["total_quantity"] += qty
        category_summary[cat]["item_count"] += 1
        if a.rated_power_kw:
            category_summary[cat]["known_power_count"] += 1
        category_summary[cat]["estimated_monthly_kwh"] += est_monthly_kwh
        category_summary[cat]["estimated_monthly_co2e_kg"] += est_monthly_kwh * factor

        items_list.append({
            "appliance_id": a.appliance_id,
            "appliance_name": a.appliance_name,
            "category": cat,
            "quantity": qty,
            "rated_power_kw": a.rated_power_kw,
            "capacity_tr": a.capacity_tr,
            "capacity_hp": a.capacity_hp,
            "operating_hours_per_day": a.operating_hours_per_day or 8.0,
            "estimated_monthly_kwh": round(est_monthly_kwh, 1) if est_monthly_kwh > 0 else None,
            "estimated_monthly_co2e_kg": round(est_monthly_kwh * factor, 1) if est_monthly_kwh > 0 else None,
            "has_exact_power": a.rated_power_kw is not None
        })

    for c in category_summary.values():
        c["estimated_monthly_kwh"] = round(c["estimated_monthly_kwh"], 1)
        c["estimated_monthly_co2e_kg"] = round(c["estimated_monthly_co2e_kg"], 1)

    # Average monthly metered electricity for comparison
    avg_metered_kwh = db.query(func.avg(EnergyConsumption.units_consumed_kwh)).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL"
    ).scalar() or 42000.0

    pct_of_metered = round((total_estimated_monthly_kwh / avg_metered_kwh) * 100, 1) if avg_metered_kwh > 0 else 0.0

    return {
        "institute": "V.E.S. Institute of Technology (VESIT)",
        "total_equipment_count": total_equipment_count,
        "total_categories": len(category_summary),
        "category_breakdown": list(category_summary.values()),
        "appliances": items_list,
        "appliance_energy_estimation": {
            "total_estimated_monthly_kwh": round(total_estimated_monthly_kwh, 1),
            "total_estimated_monthly_co2e_kg": round(total_estimated_monthly_kwh * factor, 1),
            "avg_actual_metered_monthly_kwh": round(avg_metered_kwh, 1),
            "estimated_load_percentage_of_metered": pct_of_metered,
            "comparison_text": f"Estimated appliance load accounts for approximately {pct_of_metered}% of metered electricity.",
            "disclaimer": "Appliance energy calculation is an engineering estimate based on verified rated wattages and nominal operating hours. Actual utility meter readings remain the authoritative consumption benchmark."
        }
    }

