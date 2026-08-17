from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="department")
    electricity_data = relationship("ElectricityData", back_populates="department")
    transportation_data = relationship("TransportationData", back_populates="department")
    waste_data = relationship("WasteData", back_populates="department")
    water_data = relationship("WaterData", back_populates="department")
    appliances = relationship("Appliance", back_populates="department")
    infrastructure = relationship("InfrastructureData", back_populates="department")
    carbon_calculations = relationship("CarbonCalculation", back_populates="department")
    recommendations = relationship("Recommendation", back_populates="department")
    reports = relationship("Report", back_populates="department")
