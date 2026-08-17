from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ElectricityDataBase(BaseModel):
    department_id: int
    kwh: float
    timestamp: datetime
    source: str

class ElectricityDataCreate(ElectricityDataBase):
    document_id: Optional[int] = None

class ElectricityDataRead(ElectricityDataBase):
    id: int
    document_id: Optional[int]

    model_config = {"from_attributes": True}

class TransportationDataBase(BaseModel):
    department_id: int
    vehicle_type: str
    fuel_type: str
    distance_or_fuel_volume: float
    timestamp: datetime

class TransportationDataCreate(TransportationDataBase):
    pass

class TransportationDataRead(TransportationDataBase):
    id: int

    model_config = {"from_attributes": True}

class WasteDataBase(BaseModel):
    department_id: int
    waste_type: str
    weight_kg: float
    is_recycled: bool = False
    timestamp: datetime

class WasteDataCreate(WasteDataBase):
    pass

class WasteDataRead(WasteDataBase):
    id: int

    model_config = {"from_attributes": True}

class WaterDataBase(BaseModel):
    department_id: int
    liters_consumed: float
    timestamp: datetime

class WaterDataCreate(WaterDataBase):
    pass

class WaterDataRead(WaterDataBase):
    id: int

    model_config = {"from_attributes": True}
