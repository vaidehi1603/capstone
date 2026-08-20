from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.department import Department

class ElectricityData(Base):
    __tablename__ = "electricity_data"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    source = Column(String, nullable=False) # e.g. Grid, Solar
    document_id = Column(Integer, nullable=True)
    
    department = relationship(Department)

class TransportationData(Base):
    __tablename__ = "transportation_data"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    vehicle_type = Column(String, nullable=False)
    fuel_type = Column(String, nullable=False)
    distance_or_fuel_volume = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship(Department)

class WasteData(Base):
    __tablename__ = "waste_data"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    waste_type = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    is_recycled = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship(Department)

class WaterData(Base):
    __tablename__ = "water_data"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    liters_consumed = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship(Department)
