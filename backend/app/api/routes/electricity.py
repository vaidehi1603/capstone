from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.activity import ElectricityDataRead, ElectricityDataCreate
from app.services import activity_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ElectricityDataRead])
def read_electricity_data(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return activity_service.get_electricity_data(db, user=current_user, skip=skip, limit=limit)

@router.post("/", response_model=ElectricityDataRead, dependencies=[Depends(RoleChecker(["ADMIN", "MAINTENANCE"]))])
def create_electricity_data(data_in: ElectricityDataCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return activity_service.create_electricity_data(db, data_in, user=current_user)
