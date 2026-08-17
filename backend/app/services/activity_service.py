from sqlalchemy.orm import Session
from app.models.activity import ElectricityData
from app.schemas.activity import ElectricityDataCreate
from app.models.user import User
from fastapi import HTTPException
from app.services.calculation_service import calculate_and_store_emission

def check_department_access(user: User, department_id: int):
    if user.role != "ADMIN" and user.department_id != department_id:
        raise HTTPException(status_code=403, detail="Not authorized to access data for this department")

def get_electricity_data(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(ElectricityData)
    if user.role != "ADMIN":
        query = query.filter(ElectricityData.department_id == user.department_id)
    return query.offset(skip).limit(limit).all()

def create_electricity_data(db: Session, data_in: ElectricityDataCreate, user: User):
    check_department_access(user, data_in.department_id)
    db_data = ElectricityData(**data_in.model_dump())
    db.add(db_data)
    db.flush() # Flush to get the ID for the calculation record

    # Calculate Carbon Emission Synchronously (Scope 2, Grid Electricity)
    calculate_and_store_emission(
        db=db,
        department_id=db_data.department_id,
        activity_type="electricity",
        activity_record_id=db_data.id,
        activity_amount=db_data.kwh,
        category="Scope 2",
        subcategory="Grid Electricity"
    )

    db.commit()
    db.refresh(db_data)
    return db_data
