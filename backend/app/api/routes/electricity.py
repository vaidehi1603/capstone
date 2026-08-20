from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.activity import ElectricityDataRead, ElectricityDataCreate
from app.services import activity_service
from app.models.schema import EnergyConsumption
from app.models.user import User

router = APIRouter()

@router.get("/vesit", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def read_vesit_electricity_records(
    year: Optional[int] = Query(None, description="Filter by year (e.g. 2022-2026)"),
    wing: Optional[str] = Query(None, description="Filter by wing ('A Wing', 'B Wing')"),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """
    Get official VESIT EnergyConsumption records.
    """
    query = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL"
    )
    if year:
        query = query.filter(EnergyConsumption.year == year)
    if wing and wing != "ALL":
        query = query.filter(EnergyConsumption.wing == wing)
    records = query.order_by(EnergyConsumption.date.desc(), EnergyConsumption.wing.asc()).offset(skip).limit(limit).all()
    return records

@router.get("/", response_model=List[ElectricityDataRead])
def read_electricity_data(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return activity_service.get_electricity_data(db, user=current_user, skip=skip, limit=limit)

@router.post("/", response_model=ElectricityDataRead, dependencies=[Depends(RoleChecker(["ADMIN", "MAINTENANCE"]))])
def create_electricity_data(data_in: ElectricityDataCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return activity_service.create_electricity_data(db, data_in, user=current_user)

