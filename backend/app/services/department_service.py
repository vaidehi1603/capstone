from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate

def get_departments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Department).offset(skip).limit(limit).all()

def create_department(db: Session, dept_in: DepartmentCreate):
    db_dept = Department(**dept_in.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept
