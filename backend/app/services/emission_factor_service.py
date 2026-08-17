from sqlalchemy.orm import Session
from app.models.emission_factor import EmissionFactor
from app.schemas.emission_factor import EmissionFactorCreate

def get_emission_factors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(EmissionFactor).offset(skip).limit(limit).all()

def create_emission_factor(db: Session, factor_in: EmissionFactorCreate):
    db_factor = EmissionFactor(**factor_in.model_dump())
    db.add(db_factor)
    db.commit()
    db.refresh(db_factor)
    return db_factor
