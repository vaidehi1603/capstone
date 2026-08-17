from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CarbonCalculation(Base):
    __tablename__ = "carbon_calculations"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    activity_type = Column(String, nullable=False) # e.g. 'electricity', 'water'
    activity_record_id = Column(Integer, nullable=False) # ID of the source record
    factor_id = Column(Integer, ForeignKey("emission_factors.id"), nullable=False)
    calculated_emission = Column(Float, nullable=False) # in kgCO2e
    calculation_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="carbon_calculations")
    emission_factor = relationship("EmissionFactor")
