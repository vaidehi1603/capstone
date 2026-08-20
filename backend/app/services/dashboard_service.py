from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schema import (
    CarbonEmission, Building, ApplianceUsage, Appliance,
    SolarGeneration, SolarSite, FoodWaste, SustainabilityProfile
)
from app.schemas.dashboard import (
    FullDashboardResponse, OverallDashboard, ScopeBreakdown,
    BuildingDashboard, BuildingMetric, ApplianceBreakdown,
    SolarDashboard, WasteDashboard, SustainabilityDashboard
)

def get_dashboard_metrics(db: Session) -> FullDashboardResponse:
    # 1. Overall Dashboard
    total_co2e = db.query(func.sum(CarbonEmission.emission_kgco2e)).scalar() or 0.0
    
    scopes = db.query(CarbonEmission.scope, func.sum(CarbonEmission.emission_kgco2e)).group_by(CarbonEmission.scope).all()
    scope_dict = {s: v for s, v in scopes if s}
    scope_breakdown = ScopeBreakdown(
        scope_1=scope_dict.get("Scope 1", 0.0),
        scope_2=scope_dict.get("Scope 2", 0.0),
        scope_3=scope_dict.get("Scope 3", 0.0)
    )
    
    categories = db.query(CarbonEmission.category, func.sum(CarbonEmission.emission_kgco2e)).group_by(CarbonEmission.category).all()
    source_dist = {c: v for c, v in categories if c}
    
    overall = OverallDashboard(
        total_co2e=total_co2e,
        scope_breakdown=scope_breakdown,
        emission_source_distribution=source_dist
    )
    
    # 2. Building Dashboard
    b_metrics = db.query(
        Building.building_name,
        func.sum(ApplianceUsage.energy_kwh).label("energy"),
    ).select_from(Building).join(Appliance, Appliance.building_id == Building.building_id)\
     .join(ApplianceUsage, ApplianceUsage.appliance_id == Appliance.appliance_id)\
     .group_by(Building.building_name).all()
     
    # Combine with Carbon emissions by building
    c_metrics = db.query(
        Building.building_name,
        func.sum(CarbonEmission.emission_kgco2e).label("carbon")
    ).select_from(Building).join(CarbonEmission, CarbonEmission.building_id == Building.building_id)\
     .group_by(Building.building_name).all()
     
    carbon_dict = {b: c for b, c in c_metrics}
    
    buildings = []
    highest_bldg = None
    max_e = -1
    for b, e in b_metrics:
        buildings.append(BuildingMetric(
            building_name=b,
            total_energy_kwh=e or 0,
            total_carbon_kgco2e=carbon_dict.get(b, 0.0)
        ))
        if e and e > max_e:
            max_e = e
            highest_bldg = b
            
    building_dash = BuildingDashboard(buildings=buildings, highest_energy_building=highest_bldg)
    
    # 3. Appliance Dashboard
    app_types = db.query(Appliance.appliance_type, func.sum(ApplianceUsage.energy_kwh))\
        .join(ApplianceUsage, Appliance.appliance_id == ApplianceUsage.appliance_id)\
        .group_by(Appliance.appliance_type).all()
    app_dict = {a: e for a, e in app_types}
    
    appliance_dash = ApplianceBreakdown(
        ac_consumption_kwh=app_dict.get("AC", 0.0),
        lighting_consumption_kwh=app_dict.get("Lighting", 0.0),
        plug_load_consumption_kwh=app_dict.get("Plug Load", 0.0),
        peak_consumption_time="14:00" # Placeholder, would require complex timeseries aggregation
    )
    
    # 4. Solar Dashboard
    total_solar = db.query(func.sum(SolarGeneration.average_generation)).scalar() or 0.0
    site_solar = db.query(SolarSite.site_name, func.sum(SolarGeneration.average_generation))\
        .join(SolarGeneration, SolarSite.site_id == SolarGeneration.site_id)\
        .group_by(SolarSite.site_name).all()
    month_solar = db.query(SolarGeneration.month, func.sum(SolarGeneration.average_generation))\
        .group_by(SolarGeneration.month).all()
        
    solar_dash = SolarDashboard(
        total_generation_kwh=total_solar,
        site_wise_generation={s: v for s, v in site_solar},
        monthly_generation={m: v for m, v in month_solar}
    )
    
    # 5. Waste Dashboard
    total_fw = db.query(func.sum(FoodWaste.waste_weight_kg)).scalar() or 0.0
    total_cost = db.query(func.sum(FoodWaste.cost_loss)).scalar() or 0.0
    fw_canteen = db.query(FoodWaste.canteen_section, func.sum(FoodWaste.waste_weight_kg))\
        .group_by(FoodWaste.canteen_section).all()
        
    waste_dash = WasteDashboard(
        total_food_waste_kg=total_fw,
        total_cost_loss=total_cost,
        waste_by_canteen_section={c: v for c, v in fw_canteen if c}
    )
    
    # 6. Sustainability Dashboard
    transport = db.query(SustainabilityProfile.transportation_mode, func.count(SustainabilityProfile.profile_id))\
        .group_by(SustainabilityProfile.transportation_mode).all()
    avg_e = db.query(func.avg(SustainabilityProfile.energy_usage_kwh_month)).scalar() or 0.0
    avg_w = db.query(func.avg(SustainabilityProfile.water_usage_liters_day)).scalar() or 0.0
    
    sust_dash = SustainabilityDashboard(
        transport_modes={t: c for t, c in transport if t},
        avg_energy_usage=avg_e,
        avg_water_usage=avg_w
    )
    
    return FullDashboardResponse(
        overall=overall,
        building=building_dash,
        appliance=appliance_dash,
        solar=solar_dash,
        waste=waste_dash,
        sustainability=sust_dash
    )
