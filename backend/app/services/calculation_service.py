from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.emission_factor import EmissionFactor
from app.models.carbon_calculation import CarbonCalculation
from datetime import datetime, timezone

def get_active_emission_factor(db: Session, category: str, subcategory: str):
    # Retrieve the most recently updated active emission factor for the category/subcategory
    factor = db.query(EmissionFactor).filter(
        EmissionFactor.category == category,
        EmissionFactor.subcategory == subcategory,
        EmissionFactor.is_active == True
    ).order_by(EmissionFactor.updated_at.desc()).first()

    if not factor:
        raise HTTPException(
            status_code=400,
            detail=f"No active emission factor is available for {category} ({subcategory}).",
        )
    return factor

def calculate_and_store_emission(
    db: Session, 
    department_id: int, 
    activity_type: str, 
    activity_record_id: int, 
    activity_amount: float, 
    category: str, 
    subcategory: str
):
    factor = get_active_emission_factor(db, category, subcategory)
    
    calculated_emission = activity_amount * factor.factor_value

    calculation_record = CarbonCalculation(
        department_id=department_id,
        activity_type=activity_type,
        activity_record_id=activity_record_id,
        factor_id=factor.id,
        calculated_emission=calculated_emission,
        calculation_date=datetime.now(timezone.utc)
    )
    db.add(calculation_record)
    # Note: caller is responsible for db.commit() to ensure atomicity
    return calculation_record
