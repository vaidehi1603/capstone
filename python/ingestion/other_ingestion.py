import os
import sys
import pandas as pd
import numpy as np

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from app.db.session import SessionLocal
from app.models.schema import DataSource, FoodWaste, SustainabilityProfile, SolarSite, SolarGeneration, Campus

def ingest_food_waste(file_path):
    print(f"\n--- Ingesting {file_path} ---")
    df = pd.read_csv(file_path)
    filename = os.path.basename(file_path)
    
    total_rows = len(df)
    print(f"Total Rows: {total_rows}")
    
    if 'Date' not in df.columns:
        print("Missing Date column.")
        return
        
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.dropna(subset=['Date'])
    
    db = SessionLocal()
    try:
        ds = DataSource(
            source_name="Dataset Propely",
            source_type="Food Waste",
            original_filename=filename,
            is_test_data=True
        )
        db.add(ds)
        db.flush()
        
        records = []
        for _, row in df.iterrows():
            fw = FoodWaste(
                date=row['Date'],
                meal=row.get('Meal'),
                canteen_section=row.get('Canteen_Section'),
                food_category=row.get('Food_Category'),
                waste_weight_kg=float(row['Waste_Weight_kg']) if pd.notna(row.get('Waste_Weight_kg')) else None,
                unit_price_per_kg=float(row['Unit_Price_per_kg']) if pd.notna(row.get('Unit_Price_per_kg')) else None,
                cost_loss=float(row['Cost_Loss']) if pd.notna(row.get('Cost_Loss')) else None,
                source_dataset_id=ds.source_dataset_id
            )
            records.append(fw)
            
        db.bulk_save_objects(records)
        db.commit()
        print(f"Ingested {len(records)} Food Waste records.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

def ingest_sustainability_profile(file_path):
    print(f"\n--- Ingesting {file_path} ---")
    df = pd.read_csv(file_path)
    filename = os.path.basename(file_path)
    
    print(f"Total Rows: {len(df)}")
    
    db = SessionLocal()
    try:
        ds = DataSource(
            source_name="Campus Sustainability Survey",
            source_type="Survey",
            original_filename=filename,
            is_test_data=True
        )
        db.add(ds)
        db.flush()
        
        records = []
        for _, row in df.iterrows():
            sp = SustainabilityProfile(
                clothing_spend_month=float(row['Clothing_Spend_per_Month']) if pd.notna(row.get('Clothing_Spend_per_Month')) else None,
                food_type=row.get('Food_Type'),
                housing_type=row.get('Housing_Type'),
                energy_usage_kwh_month=float(row['Energy_Usage_kWh_per_Month']) if pd.notna(row.get('Energy_Usage_kWh_per_Month')) else None,
                water_usage_liters_day=float(row['Water_Usage_Liters_per_Day']) if pd.notna(row.get('Water_Usage_Liters_per_Day')) else None,
                transportation_mode=row.get('Transportation_Mode'),
                consumption_spend_month=float(row['Consumption_Spend_per_Month']) if pd.notna(row.get('Consumption_Spend_per_Month')) else None,
                recycling_habits=row.get('Recycling_Habits'),
                carbon_emissions_kgco2=float(row['Carbon_Emissions_kgCO2']) if pd.notna(row.get('Carbon_Emissions_kgCO2')) else None,
                source_dataset_id=ds.source_dataset_id
            )
            records.append(sp)
            
        db.bulk_save_objects(records)
        db.commit()
        print(f"Ingested {len(records)} Sustainability Profile records.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

def ingest_solar(file_path):
    print(f"\n--- Ingesting {file_path} ---")
    df = pd.read_csv(file_path)
    filename = os.path.basename(file_path)
    
    print(f"Total Rows: {len(df)}")
    
    db = SessionLocal()
    try:
        ds = DataSource(
            source_name="Solar Generation Data",
            source_type="Solar",
            original_filename=filename,
            is_test_data=True
        )
        db.add(ds)
        db.flush()
        
        # Get or create dummy campus
        campus = db.query(Campus).filter_by(campus_name="Test Campus").first()
        if not campus:
            campus = Campus(campus_name="Test Campus")
            db.add(campus)
            db.flush()
            
        site_cache = {}
        records = []
        for _, row in df.iterrows():
            site_key = str(row['SiteKey'])
            if site_key not in site_cache:
                site = db.query(SolarSite).filter_by(site_name=f"Site_{site_key}", campus_id=campus.campus_id).first()
                if not site:
                    site = SolarSite(site_name=f"Site_{site_key}", campus_id=campus.campus_id)
                    db.add(site)
                    db.flush()
                site_cache[site_key] = site.site_id
                
            sg = SolarGeneration(
                site_id=site_cache[site_key],
                year=int(row['Year']),
                month=row['Month'],
                data_status=bool(row['DataStatus']) if pd.notna(row.get('DataStatus')) else None,
                average_generation=float(row['AverageSolarGeneration']) if pd.notna(row.get('AverageSolarGeneration')) else None,
                maximum_generation=float(row['MaxSolarGeneration']) if pd.notna(row.get('MaxSolarGeneration')) else None,
                minimum_generation=float(row['MinSolarGeneration']) if pd.notna(row.get('MinSolarGeneration')) else None,
                source_dataset_id=ds.source_dataset_id
            )
            records.append(sg)
            
        db.bulk_save_objects(records)
        db.commit()
        print(f"Ingested {len(records)} Solar Generation records.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    downloads = "C:/Users/Lenovo/Downloads"
    
    food = os.path.join(downloads, "Dataset Propely.csv")
    if os.path.exists(food):
        ingest_food_waste(food)
        
    sustainability = os.path.join(downloads, "campus_sustainability_dataset.csv")
    if os.path.exists(sustainability):
        ingest_sustainability_profile(sustainability)
        
    solar = os.path.join(downloads, "Monthly_Summary_Solar.csv")
    if os.path.exists(solar):
        ingest_solar(solar)
