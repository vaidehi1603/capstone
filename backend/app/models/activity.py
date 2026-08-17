from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class ElectricityData(Base):
    __tablename__ = "electricity_data"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    source = Column(String, nullable=False) # e.g. Grid, Solar
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"), nullable=True)
    
    department = relationship("Department", back_populates="electricity_data")
    document = relationship("UploadedDocument")

class TransportationData(Base):
    __tablename__ = "transportation_data"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    vehicle_type = Column(String, nullable=False)
    fuel_type = Column(String, nullable=False)
    distance_or_fuel_volume = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship("Department", back_populates="transportation_data")

class WasteData(Base):
    __tablename__ = "waste_data"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    waste_type = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    is_recycled = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship("Department", back_populates="waste_data")

class WaterData(Base):
    __tablename__ = "water_data"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    liters_consumed = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    department = relationship("Department", back_populates="water_data")
