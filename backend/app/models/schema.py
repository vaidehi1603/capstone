from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class DataSource(Base):
    __tablename__ = "data_source"
    source_dataset_id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(255), nullable=False)
    source_type = Column(String(100))
    original_filename = Column(String(255))
    description = Column(Text)
    license = Column(String(100))
    date_imported = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_test_data = Column(Boolean, default=False)
    notes = Column(Text)

class Institute(Base):
    __tablename__ = "institute"
    institute_id = Column(Integer, primary_key=True, index=True)
    institute_name = Column(String(255), nullable=False)
    location = Column(String(255))
    area = Column(Float)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Campus(Base):
    __tablename__ = "campus"
    campus_id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institute.institute_id", ondelete="CASCADE"))
    campus_name = Column(String(255), nullable=False)
    location = Column(String(255))
    area = Column(Float)

class Building(Base):
    __tablename__ = "building"
    building_id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(Integer, ForeignKey("campus.campus_id", ondelete="CASCADE"))
    building_name = Column(String(255), nullable=False)
    building_type = Column(String(100))
    floor_count = Column(Integer)
    built_up_area = Column(Float)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Zone(Base):
    __tablename__ = "zone"
    zone_id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("building.building_id", ondelete="CASCADE"))
    zone_name = Column(String(255), nullable=False)
    floor_number = Column(Integer)
    zone_type = Column(String(100))

class EmissionFactor(Base):
    __tablename__ = "emission_factor"
    emission_factor_id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100))
    activity_unit = Column(String(50), nullable=False)
    factor_value = Column(Float, nullable=False)
    factor_unit = Column(String(50), nullable=False)
    scope = Column(String(50))
    source_name = Column(String(255))
    source_reference = Column(Text)
    valid_from = Column(DateTime(timezone=True))
    valid_to = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Appliance(Base):
    __tablename__ = "appliance"
    appliance_id = Column(Integer, primary_key=True, index=True)
    appliance_name = Column(String(255), nullable=False)
    appliance_type = Column(String(100))
    rated_power_kw = Column(Float)
    quantity = Column(Integer, default=1)
    building_id = Column(Integer, ForeignKey("building.building_id"))
    zone_id = Column(Integer, ForeignKey("zone.zone_id"))
    source_type = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ApplianceUsage(Base):
    __tablename__ = "appliance_usage"
    usage_id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliance.appliance_id", ondelete="CASCADE"))
    zone_id = Column(Integer, ForeignKey("zone.zone_id"))
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    power_kw = Column(Float)
    energy_kwh = Column(Float)
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class EnergyConsumption(Base):
    __tablename__ = "energy_consumption"
    energy_id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("building.building_id"))
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    energy_source = Column(String(100))
    consumption_value = Column(Float)
    unit = Column(String(50))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class SolarSite(Base):
    __tablename__ = "solar_site"
    site_id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    site_name = Column(String(255), nullable=False)
    location = Column(String(255))

class SolarGeneration(Base):
    __tablename__ = "solar_generation"
    solar_record_id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("solar_site.site_id"))
    year = Column(Integer, nullable=False)
    month = Column(String(50), nullable=False)
    data_status = Column(Boolean)
    average_generation = Column(Float)
    maximum_generation = Column(Float)
    minimum_generation = Column(Float)
    generation_unit = Column(String(50))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class WaterConsumption(Base):
    __tablename__ = "water_consumption"
    water_id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("building.building_id"))
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    date = Column(Date, nullable=False)
    consumption_value = Column(Float)
    unit = Column(String(50))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class SustainabilityProfile(Base):
    __tablename__ = "sustainability_profile"
    profile_id = Column(Integer, primary_key=True, index=True)
    clothing_spend_month = Column(Float)
    food_type = Column(String(100))
    housing_type = Column(String(100))
    energy_usage_kwh_month = Column(Float)
    water_usage_liters_day = Column(Float)
    transportation_mode = Column(String(100))
    consumption_spend_month = Column(Float)
    recycling_habits = Column(String(100))
    carbon_emissions_kgco2 = Column(Float)
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class TransportActivity(Base):
    __tablename__ = "transport_activity"
    transport_id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("sustainability_profile.profile_id"))
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    date = Column(Date, nullable=False)
    transport_mode = Column(String(100))
    distance_km = Column(Float)
    passenger_count = Column(Integer)
    fuel_type = Column(String(100))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class FoodWaste(Base):
    __tablename__ = "food_waste"
    waste_id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    meal = Column(String(100))
    canteen_section = Column(String(100))
    food_category = Column(String(100))
    waste_weight_kg = Column(Float)
    unit_price_per_kg = Column(Float)
    cost_loss = Column(Float)
    carbon_emission_kgco2e = Column(Float)
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class FoodConsumption(Base):
    __tablename__ = "food_consumption"
    food_id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    canteen_section = Column(String(100))
    food_category = Column(String(100))
    quantity = Column(Float)
    unit = Column(String(50))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class WasteGeneration(Base):
    __tablename__ = "waste_generation"
    waste_id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    building_id = Column(Integer, ForeignKey("building.building_id"))
    date = Column(Date, nullable=False)
    waste_type = Column(String(100))
    quantity = Column(Float)
    unit = Column(String(50))
    disposal_method = Column(String(100))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))

class CarbonEmission(Base):
    __tablename__ = "carbon_emission"
    emission_id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    campus_id = Column(Integer, ForeignKey("campus.campus_id"))
    building_id = Column(Integer, ForeignKey("building.building_id"))
    appliance_id = Column(Integer, ForeignKey("appliance.appliance_id"))
    category = Column(String(100))
    scope = Column(String(50))
    activity_value = Column(Float)
    activity_unit = Column(String(50))
    emission_factor_id = Column(Integer, ForeignKey("emission_factor.emission_factor_id"))
    emission_factor_value = Column(Float)
    emission_kgco2e = Column(Float)
    calculation_method = Column(String(100))
    source_dataset_id = Column(Integer, ForeignKey("data_source.source_dataset_id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
