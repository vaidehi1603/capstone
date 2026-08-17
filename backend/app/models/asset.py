from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Appliance(Base):
    __tablename__ = "appliances"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    type = Column(String, nullable=False)
    power_rating_kw = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, nullable=False)

    department = relationship("Department", back_populates="appliances")

class InfrastructureData(Base):
    __tablename__ = "infrastructure_data"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, nullable=False)

    department = relationship("Department", back_populates="infrastructure")
