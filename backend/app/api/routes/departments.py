from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.department import DepartmentRead, DepartmentCreate
from app.services import department_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[DepartmentRead])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return department_service.get_departments(db, skip=skip, limit=limit)

@router.post("/", response_model=DepartmentRead, dependencies=[Depends(RoleChecker(["ADMIN"]))])
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    return department_service.create_department(db, dept_in)
