import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.schema import (
    EmissionFactor, CarbonEmission, ApplianceUsage,
    EnergyConsumption, TransportActivity, FoodWaste, WasteGeneration, WaterConsumption, Appliance, Building
)

logger = logging.getLogger(__name__)

class CarbonCalculationEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_emission_factor(self, category: str, subcategory: str = None) -> EmissionFactor:
        """Fetch the most applicable active emission factor."""
        query = self.db.query(EmissionFactor).filter(EmissionFactor.category == category)
        if subcategory:
            query = query.filter(EmissionFactor.subcategory == subcategory)
            
        # Prioritize currently valid factors
        now = datetime.now(timezone.utc)
        valid_query = query.filter(
            (EmissionFactor.valid_from <= now) | (EmissionFactor.valid_from == None),
            (EmissionFactor.valid_to >= now) | (EmissionFactor.valid_to == None)
        )
        
        factor = valid_query.order_by(EmissionFactor.created_at.desc()).first()
        if not factor:
            # Fallback to any latest if validity dates aren't set
            factor = query.order_by(EmissionFactor.created_at.desc()).first()
            
        return factor

    def _create_emission_record(
        self,
        date: datetime,
        activity_value: float,
        activity_unit: str,
        factor: EmissionFactor,
        campus_id: int = None,
        building_id: int = None,
        appliance_id: int = None,
        source_dataset_id: int = None,
        method: str = "Standard factor multiplication"
    ) -> CarbonEmission:
        
        emission = activity_value * factor.factor_value
        
        record = CarbonEmission(
            date=date,
            campus_id=campus_id,
            building_id=building_id,
            appliance_id=appliance_id,
            category=factor.category,
            scope=factor.scope,
            activity_value=activity_value,
            activity_unit=activity_unit,
            emission_factor_id=factor.emission_factor_id,
            emission_factor_value=factor.factor_value,
            emission_kgco2e=emission,
            calculation_method=method,
            source_dataset_id=source_dataset_id,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(record)
        return record

    def calculate_for_appliance_usage(self, usage: ApplianceUsage) -> CarbonEmission:
        """Calculate emissions for an appliance reading (energy in kWh)."""
        if not usage.energy_kwh:
            return None
            
        factor = self.get_emission_factor("Electricity", "Grid")
        if not factor:
            logger.warning("No emission factor found for Electricity -> Grid")
            return None
            
        # Get building and campus info
        app = self.db.query(Appliance).filter_by(appliance_id=usage.appliance_id).first()
        bldg = self.db.query(Building).filter_by(building_id=app.building_id).first() if app and app.building_id else None
        campus_id = bldg.campus_id if bldg else None
        
        return self._create_emission_record(
            date=usage.timestamp,
            activity_value=usage.energy_kwh,
            activity_unit="kWh",
            factor=factor,
            campus_id=campus_id,
            building_id=app.building_id if app else None,
            appliance_id=usage.appliance_id,
            source_dataset_id=usage.source_dataset_id
        )

    def calculate_for_food_waste(self, waste: FoodWaste) -> CarbonEmission:
        """Calculate emissions for food waste (weight in kg)."""
        if not waste.waste_weight_kg:
            return None
            
        # Could map waste.food_category to subcategories, but fallback to general Food Waste
        factor = self.get_emission_factor("Waste", "Food Waste")
        if not factor:
            factor = self.get_emission_factor("Waste", None)
            
        if not factor:
            logger.warning("No emission factor found for Food Waste")
            return None
            
        emission_record = self._create_emission_record(
            date=waste.date, # Stored as Date, will be converted to datetime internally by DB or we can cast
            activity_value=waste.waste_weight_kg,
            activity_unit="kg",
            factor=factor,
            source_dataset_id=waste.source_dataset_id
        )
        
        # Backfill the carbon footprint directly to the food waste record if needed
        waste.carbon_emission_kgco2e = emission_record.emission_kgco2e
        
        return emission_record
        
    def calculate_for_transport(self, transport: TransportActivity) -> CarbonEmission:
        """Calculate emissions for transport activity (distance in km)."""
        if not transport.distance_km:
            return None
            
        # Match the transport mode to the emission factor subcategory
        factor = self.get_emission_factor("Transport", transport.transport_mode)
        if not factor:
            factor = self.get_emission_factor("Transport", None)
            
        if not factor:
            logger.warning(f"No emission factor found for Transport -> {transport.transport_mode}")
            return None
            
        return self._create_emission_record(
            date=transport.date,
            activity_value=transport.distance_km,
            activity_unit="km",
            factor=factor,
            campus_id=transport.campus_id,
            source_dataset_id=transport.source_dataset_id
        )

    def calculate_for_water(self, water: WaterConsumption) -> CarbonEmission:
        """Calculate emissions for water consumption (liters/m3)."""
        if not water.consumption_value:
            return None
            
        factor = self.get_emission_factor("Water", None)
        if not factor:
            logger.warning("No emission factor found for Water")
            return None
            
        return self._create_emission_record(
            date=water.date,
            activity_value=water.consumption_value,
            activity_unit=water.unit,
            factor=factor,
            campus_id=water.campus_id,
            building_id=water.building_id,
            source_dataset_id=water.source_dataset_id
        )
