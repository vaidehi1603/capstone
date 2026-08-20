from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.schemas.analytics import DashboardOverview
from app.services import analytics_service

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOverview, dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_dashboard_overview(
    mode: str = Query("VESIT_ACTUAL", description="Data mode: 'VESIT_ACTUAL' or 'TEST_DEMO'"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_campus_overview(db, mode=mode)

@router.get("/vesit/history", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_vesit_history(
    year: int = Query(None, description="Optional filter for specific year (e.g. 2022-2026)"),
    wing: str = Query("ALL", description="Filter for specific wing: 'ALL', 'A Wing', 'B Wing'"),
    db: Session = Depends(get_db)
):
    """
    Get official VESIT monthly electricity timeline (2022-2026) with wing-level breakdowns and CO2e.
    """
    return analytics_service.get_vesit_monthly_history(db, year=year, wing=wing)

@router.get("/vesit/annual-trends", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_vesit_annual_trends(db: Session = Depends(get_db)):
    """
    Get official VESIT annual carbon trend (2022, 2023, 2024, 2025, 2026) with YoY percentage comparisons.
    """
    return analytics_service.get_vesit_annual_trends(db)

@router.get("/vesit/appliances", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_vesit_appliances(db: Session = Depends(get_db)):
    """
    Get official VESIT electrical appliance inventory & estimated appliance consumption analysis.
    """
    return analytics_service.get_vesit_appliance_inventory(db)
