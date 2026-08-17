from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.emission_factor import EmissionFactorRead, EmissionFactorCreate
from app.services import emission_factor_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[EmissionFactorRead])
def read_emission_factors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return emission_factor_service.get_emission_factors(db, skip=skip, limit=limit)

@router.post("/", response_model=EmissionFactorRead, dependencies=[Depends(RoleChecker(["ADMIN"]))])
def create_emission_factor(factor_in: EmissionFactorCreate, db: Session = Depends(get_db)):
    return emission_factor_service.create_emission_factor(db, factor_in)
