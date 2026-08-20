import os
import sys
import pandas as pd
import re
from datetime import datetime

# Add backend directory to path so we can import app models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from app.db.session import SessionLocal
from app.models.schema import DataSource, Building, Zone, Appliance, ApplianceUsage

def parse_column_name(col_name):
    # e.g., "z2_AC1(kW)" -> zone="z2", app="AC1"
    # e.g., "z1_Light(kW)" -> zone="z1", app="Light"
    match = re.match(r'(z\d+)_([A-Za-z0-9]+)\(kW\)', col_name)
    if not match:
        return None, None
    zone_name = match.group(1)
    appliance_id = match.group(2)
    return zone_name, appliance_id

def classify_appliance(app_id):
    app_id = app_id.upper()
    if 'AC' in app_id:
        return 'AC'
    elif 'LIGHT' in app_id:
        return 'Lighting'
    elif 'PLUG' in app_id:
        return 'Plug Load'
    return 'Other'

def ingest_appliance_data(file_path):
    print(f"Ingesting {file_path}...")
    df = pd.read_csv(file_path)
    
    filename = os.path.basename(file_path)
    
    # 1. Validation pipeline
    total_rows = len(df)
    print(f"Total Rows: {total_rows}")
    
    # Check for missing Date
    if 'Date' not in df.columns:
        print("ERROR: Missing Date column.")
        return
        
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    invalid_dates = df['Date'].isna().sum()
    print(f"Invalid Dates (Dropped): {invalid_dates}")
    df = df.dropna(subset=['Date'])
    
    valid_rows = len(df)
    
    # Identify Load vs Non-Load columns
    all_cols = df.columns
    load_cols = [c for c in all_cols if c.endswith('(kW)')]
    non_load_cols = [c for c in all_cols if c not in load_cols and c != 'Date']
    
    print(f"Detected Load Columns: {load_cols}")
    print(f"Detected Non-Load Columns (Ignored by melter): {non_load_cols}")
    
    # 2. Database Insertion
    db = SessionLocal()
    
    try:
        # Create Data Source
        ds = DataSource(
            source_name="Kaggle CU-BEMS",
            source_type="Building Energy",
            original_filename=filename,
            is_test_data=True,
            notes="Dynamically ingested"
        )
        db.add(ds)
        db.flush()
        
        # Create Dummy Building since the CSV doesn't specify one
        bldg = db.query(Building).filter_by(building_name="Test Building 1").first()
        if not bldg:
            bldg = Building(building_name="Test Building 1", building_type="Educational")
            db.add(bldg)
            db.flush()
            
        # Melt DataFrame
        melted = pd.melt(df, id_vars=['Date'], value_vars=load_cols, 
                         var_name='RawColumn', value_name='power_kw')
                         
        # Filter NaNs in power
        melted = melted.dropna(subset=['power_kw'])
        
        zone_cache = {}
        appliance_cache = {}
        
        # Process Unique Columns to create Zones and Appliances
        for col in load_cols:
            zone_str, app_str = parse_column_name(col)
            if not zone_str:
                continue
                
            # Get or create Zone
            if zone_str not in zone_cache:
                z = db.query(Zone).filter_by(building_id=bldg.building_id, zone_name=zone_str).first()
                if not z:
                    z = Zone(building_id=bldg.building_id, zone_name=zone_str)
                    db.add(z)
                    db.flush()
                zone_cache[zone_str] = z.zone_id
                
            # Get or create Appliance
            app_key = f"{zone_str}_{app_str}"
            if app_key not in appliance_cache:
                app = db.query(Appliance).filter_by(building_id=bldg.building_id, zone_id=zone_cache[zone_str], appliance_name=app_str).first()
                if not app:
                    app = Appliance(
                        appliance_name=app_str,
                        appliance_type=classify_appliance(app_str),
                        building_id=bldg.building_id,
                        zone_id=zone_cache[zone_str],
                        source_type="Metered"
                    )
                    db.add(app)
                    db.flush()
                appliance_cache[col] = (app.appliance_id, zone_cache[zone_str])
        
        # Bulk Insert Usage
        records = []
        for idx, row in melted.iterrows():
            col = row['RawColumn']
            if col not in appliance_cache:
                continue
            
            app_id, zone_id = appliance_cache[col]
            power = float(row['power_kw'])
            energy = power / 60.0 # 1 minute interval assumption
            
            records.append(ApplianceUsage(
                appliance_id=app_id,
                zone_id=zone_id,
                timestamp=row['Date'],
                power_kw=power,
                energy_kwh=energy,
                source_dataset_id=ds.source_dataset_id
            ))
            
            # Commit in batches to avoid memory overflow
            if len(records) >= 5000:
                db.bulk_save_objects(records)
                records = []
        
        if records:
            db.bulk_save_objects(records)
            
        db.commit()
        print(f"Successfully ingested {valid_rows} rows from {filename} into normalized tables.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import glob
    # Find floor CSVs
    downloads = "C:/Users/Lenovo/Downloads"
    files = glob.glob(f"{downloads}/*2018Floor*.csv")
    for f in files:
        if os.path.isfile(f):
            ingest_appliance_data(f)
