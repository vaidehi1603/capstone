-- 1. Organization
CREATE TABLE institute (
    institute_id SERIAL PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campus (
    campus_id SERIAL PRIMARY KEY,
    institute_id INTEGER REFERENCES institute(institute_id) ON DELETE CASCADE,
    campus_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area FLOAT
);

CREATE TABLE building (
    building_id SERIAL PRIMARY KEY,
    campus_id INTEGER REFERENCES campus(campus_id) ON DELETE CASCADE,
    building_name VARCHAR(255) NOT NULL,
    building_type VARCHAR(100),
    floor_count INTEGER,
    built_up_area FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zone (
    zone_id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES building(building_id) ON DELETE CASCADE,
    zone_name VARCHAR(255) NOT NULL, -- e.g., 'z1', 'z2'
    floor_number INTEGER,
    zone_type VARCHAR(100)
);

-- 2. Data Source Tracking
CREATE TABLE data_source (
    source_dataset_id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100),
    original_filename VARCHAR(255),
    description TEXT,
    license VARCHAR(100),
    date_imported TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_test_data BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- 3. Emission Factors
CREATE TABLE emission_factor (
    emission_factor_id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    activity_unit VARCHAR(50) NOT NULL,
    factor_value FLOAT NOT NULL,
    factor_unit VARCHAR(50) NOT NULL,
    scope VARCHAR(50),
    source_name VARCHAR(255),
    source_reference TEXT,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appliance / Load Module
CREATE TABLE appliance (
    appliance_id SERIAL PRIMARY KEY,
    appliance_name VARCHAR(255) NOT NULL, -- e.g., AC1, Light, Plug
    appliance_type VARCHAR(100), -- e.g., AC, Lighting, Plug Load
    rated_power_kw FLOAT,
    quantity INTEGER DEFAULT 1,
    building_id INTEGER REFERENCES building(building_id),
    zone_id INTEGER REFERENCES zone(zone_id),
    source_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appliance_usage (
    usage_id SERIAL PRIMARY KEY,
    appliance_id INTEGER REFERENCES appliance(appliance_id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES zone(zone_id),
    timestamp TIMESTAMPTZ NOT NULL,
    power_kw FLOAT,
    energy_kwh FLOAT,
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 5. Energy Module
CREATE TABLE energy_consumption (
    energy_id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES building(building_id),
    campus_id INTEGER REFERENCES campus(campus_id),
    timestamp TIMESTAMPTZ NOT NULL,
    energy_source VARCHAR(100),
    consumption_value FLOAT,
    unit VARCHAR(50),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 6. Solar Module
CREATE TABLE solar_site (
    site_id SERIAL PRIMARY KEY,
    campus_id INTEGER REFERENCES campus(campus_id),
    site_name VARCHAR(255) NOT NULL,
    location VARCHAR(255)
);

CREATE TABLE solar_generation (
    solar_record_id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES solar_site(site_id),
    year INTEGER NOT NULL,
    month VARCHAR(50) NOT NULL,
    data_status BOOLEAN,
    average_generation FLOAT,
    maximum_generation FLOAT,
    minimum_generation FLOAT,
    generation_unit VARCHAR(50),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 7. Water Module
CREATE TABLE water_consumption (
    water_id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES building(building_id),
    campus_id INTEGER REFERENCES campus(campus_id),
    date DATE NOT NULL,
    consumption_value FLOAT,
    unit VARCHAR(50),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 8. Transport Module
CREATE TABLE transport_activity (
    transport_id SERIAL PRIMARY KEY,
    profile_id INTEGER, -- We'll define this later, nullable
    campus_id INTEGER REFERENCES campus(campus_id),
    date DATE NOT NULL,
    transport_mode VARCHAR(100),
    distance_km FLOAT,
    passenger_count INTEGER,
    fuel_type VARCHAR(100),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 9. Food / Canteen Module
CREATE TABLE food_waste (
    waste_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meal VARCHAR(100),
    canteen_section VARCHAR(100),
    food_category VARCHAR(100),
    waste_weight_kg FLOAT,
    unit_price_per_kg FLOAT,
    cost_loss FLOAT,
    carbon_emission_kgco2e FLOAT,
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

CREATE TABLE food_consumption (
    food_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    canteen_section VARCHAR(100),
    food_category VARCHAR(100),
    quantity FLOAT,
    unit VARCHAR(50),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 10. Waste Module
CREATE TABLE waste_generation (
    waste_id SERIAL PRIMARY KEY,
    campus_id INTEGER REFERENCES campus(campus_id),
    building_id INTEGER REFERENCES building(building_id),
    date DATE NOT NULL,
    waste_type VARCHAR(100),
    quantity FLOAT,
    unit VARCHAR(50),
    disposal_method VARCHAR(100),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- 11. Sustainability Profile Module
CREATE TABLE sustainability_profile (
    profile_id SERIAL PRIMARY KEY,
    clothing_spend_month FLOAT,
    food_type VARCHAR(100),
    housing_type VARCHAR(100),
    energy_usage_kwh_month FLOAT,
    water_usage_liters_day FLOAT,
    transportation_mode VARCHAR(100),
    consumption_spend_month FLOAT,
    recycling_habits VARCHAR(100),
    carbon_emissions_kgco2 FLOAT,
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id)
);

-- Add Foreign Key constraint back to profile for transport_activity
ALTER TABLE transport_activity ADD CONSTRAINT fk_transport_profile FOREIGN KEY (profile_id) REFERENCES sustainability_profile(profile_id);

-- 12. Carbon Calculation Module
CREATE TABLE carbon_emission (
    emission_id SERIAL PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    campus_id INTEGER REFERENCES campus(campus_id),
    building_id INTEGER REFERENCES building(building_id),
    appliance_id INTEGER REFERENCES appliance(appliance_id),
    category VARCHAR(100),
    scope VARCHAR(50),
    activity_value FLOAT,
    activity_unit VARCHAR(50),
    emission_factor_id INTEGER REFERENCES emission_factor(emission_factor_id),
    emission_factor_value FLOAT,
    emission_kgco2e FLOAT,
    calculation_method VARCHAR(100),
    source_dataset_id INTEGER REFERENCES data_source(source_dataset_id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying performance
CREATE INDEX idx_appliance_usage_ts ON appliance_usage(timestamp);
CREATE INDEX idx_carbon_emission_date ON carbon_emission(date);
CREATE INDEX idx_energy_consumption_ts ON energy_consumption(timestamp);
CREATE INDEX idx_food_waste_date ON food_waste(date);
