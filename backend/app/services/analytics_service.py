from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.carbon_calculation import CarbonCalculation
from app.models.department import Department
from app.models.emission_factor import EmissionFactor
from app.schemas.analytics import DashboardOverview, DepartmentRanking, ScopeBreakdown

def get_campus_overview(db: Session) -> DashboardOverview:
    # Get total emissions
    total = db.query(func.sum(CarbonCalculation.calculated_emission)).scalar() or 0.0

    # For scope breakdown, we need to join with EmissionFactor
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

    # Get department rankings
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
