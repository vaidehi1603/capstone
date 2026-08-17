from pydantic import BaseModel
from typing import List, Dict

class DepartmentRanking(BaseModel):
    department_id: int
    department_name: str
    total_kgco2e: float

class ScopeBreakdown(BaseModel):
    scope_1: float
    scope_2: float
    scope_3: float

class DashboardOverview(BaseModel):
    total_campus_emissions_kgco2e: float
    scope_breakdown: ScopeBreakdown
    top_departments: List[DepartmentRanking]
