from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class EmissionFactorBase(BaseModel):
    category: str
    subcategory: str
    activity_unit: str
    factor_value: float
    factor_unit: str
    source: str
    region: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_active: bool = True

class EmissionFactorCreate(EmissionFactorBase):
    pass

class EmissionFactorUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    activity_unit: Optional[str] = None
    factor_value: Optional[float] = None
    factor_unit: Optional[str] = None
    source: Optional[str] = None
    region: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_active: Optional[bool] = None

class EmissionFactorRead(EmissionFactorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
