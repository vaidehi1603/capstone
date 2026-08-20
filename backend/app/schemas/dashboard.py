from pydantic import BaseModel
from typing import List, Dict, Optional

class ScopeBreakdown(BaseModel):
    scope_1: float
    scope_2: float
    scope_3: float

class OverallDashboard(BaseModel):
    total_co2e: float
    scope_breakdown: ScopeBreakdown
    emission_source_distribution: Dict[str, float]

class BuildingMetric(BaseModel):
    building_name: str
    total_energy_kwh: float
    total_carbon_kgco2e: float

class BuildingDashboard(BaseModel):
    buildings: List[BuildingMetric]
    highest_energy_building: Optional[str]

class ApplianceBreakdown(BaseModel):
    ac_consumption_kwh: float
    lighting_consumption_kwh: float
    plug_load_consumption_kwh: float
    peak_consumption_time: Optional[str]

class SolarDashboard(BaseModel):
    total_generation_kwh: float
    site_wise_generation: Dict[str, float]
    monthly_generation: Dict[str, float]

class WasteDashboard(BaseModel):
    total_food_waste_kg: float
    total_cost_loss: float
    waste_by_canteen_section: Dict[str, float]

class SustainabilityDashboard(BaseModel):
    transport_modes: Dict[str, int]
    avg_energy_usage: float
    avg_water_usage: float

class FullDashboardResponse(BaseModel):
    overall: OverallDashboard
    building: BuildingDashboard
    appliance: ApplianceBreakdown
    solar: SolarDashboard
    waste: WasteDashboard
    sustainability: SustainabilityDashboard
