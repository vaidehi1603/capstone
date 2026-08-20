from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.schemas.dashboard import FullDashboardResponse
from app.services import dashboard_service

router = APIRouter()

@router.get("/", response_model=FullDashboardResponse, dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_full_dashboard(db: Session = Depends(get_db)):
    """
    Retrieve all dashboard metrics: Overall, Building, Appliance, Solar, Waste, Sustainability.
    """
    return dashboard_service.get_dashboard_metrics(db)
