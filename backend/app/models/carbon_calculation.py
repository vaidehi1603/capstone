from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.department import Department
from app.models.emission_factor import EmissionFactor

class CarbonCalculation(Base):
    __tablename__ = "carbon_calculations"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    activity_type = Column(String, nullable=False)
    activity_record_id = Column(Integer, nullable=False)
    factor_id = Column(Integer, ForeignKey("emission_factors.id"), nullable=False)
    calculated_emission = Column(Float, nullable=False)
    calculation_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    department = relationship(Department)
    emission_factor = relationship(EmissionFactor)
