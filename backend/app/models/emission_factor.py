from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.db.base import Base

class EmissionFactor(Base):
    __tablename__ = "emission_factors"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    subcategory = Column(String, nullable=False)
    activity_unit = Column(String, nullable=False)
    factor_value = Column(Float, nullable=False)
    factor_unit = Column(String, nullable=False)
    source = Column(String, nullable=False)
    region = Column(String, nullable=True)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
