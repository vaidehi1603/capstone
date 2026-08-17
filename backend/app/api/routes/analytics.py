from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.schemas.analytics import DashboardOverview
from app.services import analytics_service

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOverview, dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_dashboard_overview(db: Session = Depends(get_db)):
    return analytics_service.get_campus_overview(db)
