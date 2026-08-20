import pandas as pd
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.schema import (
    CarbonCalculationRun, CarbonCalculationLog, CarbonEmission, EmissionFactor, EnergyConsumption, Appliance
)

class CarbonCalculatorAgent:
    def __init__(self, db: Session, run_id: int = None):
        self.db = db
        self.run_id = run_id
        if not self.run_id:
            # Create a run record
            run = CarbonCalculationRun(
                started_at=datetime.now(timezone.utc),
                status="IN_PROGRESS"
            )
            self.db.add(run)
            self.db.commit()
            self.db.refresh(run)
            self.run_id = run.run_id

    def get_grid_emission_factor(self) -> EmissionFactor:
        """
        Tool: Retrieve the active Grid Electricity Emission Factor from DB.
        Default: Central Electricity Authority (CEA) India (0.82 kgCO2e/kWh).
        """
        factor = self.db.query(EmissionFactor).filter(
            EmissionFactor.category.ilike("%Electricity%") | 
            EmissionFactor.subcategory.ilike("%Grid%") |
            (EmissionFactor.scope == "Scope 2")
        ).order_by(EmissionFactor.emission_factor_id.asc()).first()

        if not factor:
            # Fallback creation of standard CEA factor
            factor = EmissionFactor(
                category="Scope 2",
                subcategory="Grid Electricity",
                activity_unit="kWh",
                factor_value=0.82,
                factor_unit="kgCO2e/kWh",
                scope="Scope 2",
                source_name="Central Electricity Authority (CEA), Ministry of Power",
                source_reference="CO2 Baseline Database for the Indian Power Sector"
            )
            self.db.add(factor)
            self.db.commit()
            self.db.refresh(factor)
        return factor

    def calculate_electricity_emission(self, units_consumed_kwh: float, custom_factor_value: float = None) -> dict:
        """
        Tool: Deterministic Electricity Carbon Calculation.
        CO2e (kg) = Units Consumed (kWh) * Grid Emission Factor (kgCO2e/kWh)
        """
        if units_consumed_kwh is None or units_consumed_kwh < 0:
            return {"valid": False, "error": "Electricity consumption cannot be negative or empty."}

        factor = self.get_grid_emission_factor()
        factor_val = custom_factor_value if custom_factor_value is not None else factor.factor_value
        co2e = float(units_consumed_kwh) * float(factor_val)

        return {
            "valid": True,
            "units_consumed_kwh": round(units_consumed_kwh, 2),
            "factor_value": factor_val,
            "factor_unit": factor.factor_unit or "kgCO2e/kWh",
            "factor_source": factor.source_name or "Central Electricity Authority (CEA)",
            "emission_kgco2e": round(co2e, 2),
            "scope": "Scope 2",
            "calculation_method": "CO2e (kg) = kWh * Emission Factor (kgCO2e/kWh)"
        }

    def process_energy_consumption_record(self, record: EnergyConsumption) -> dict:
        """
        Process a single normalized VESIT EnergyConsumption record and store CarbonEmission & Log.
        """
        calc = self.calculate_electricity_emission(record.units_consumed_kwh or 0.0)
        if not calc["valid"]:
            return calc

        factor = self.get_grid_emission_factor()

        # Check if CarbonEmission record already exists for this energy record date and wing
        category_name = f"Electricity ({record.wing or 'General'})"
        rec_dt = record.timestamp or datetime(record.year, record.month_number or 1, 1, tzinfo=timezone.utc)

        emission = CarbonEmission(
            date=rec_dt,
            campus_id=record.campus_id,
            building_id=record.building_id,
            category=category_name,
            scope="Scope 2",
            activity_value=record.units_consumed_kwh,
            activity_unit="kWh",
            emission_factor_id=factor.emission_factor_id,
            emission_factor_value=calc["factor_value"],
            emission_kgco2e=calc["emission_kgco2e"],
            calculation_method=calc["calculation_method"],
            source_dataset_id=record.source_dataset_id
        )
        self.db.add(emission)
        self.db.flush()

        log = CarbonCalculationLog(
            run_id=self.run_id,
            emission_id=emission.emission_id,
            campus_id=record.campus_id,
            building_id=record.building_id,
            date=rec_dt,
            category=category_name,
            activity_value=record.units_consumed_kwh,
            activity_unit="kWh",
            emission_factor_id=factor.emission_factor_id,
            emission_factor_value=calc["factor_value"],
            emission_factor_source=calc["factor_source"],
            scope="Scope 2",
            emission_kgco2e=calc["emission_kgco2e"],
            calculation_method=calc["calculation_method"]
        )
        self.db.add(log)
        return {
            "valid": True,
            "emission_id": emission.emission_id,
            "emission_kgco2e": calc["emission_kgco2e"],
            "units_kwh": record.units_consumed_kwh,
            "wing": record.wing,
            "year": record.year,
            "month": record.month
        }

    def calculate_estimated_appliance_load(self, quantity: int, rated_power_kw: float, operating_hours: float, days_per_month: int = 30) -> dict:
        """
        Tool: Calculate Estimated Appliance Consumption.
        Energy (kWh/month) = Quantity * Rated Power (kW) * Hours/day * Days
        CO2e (kg/month) = Energy * Grid Factor
        """
        if quantity is None or quantity <= 0:
            return {"energy_kwh": 0.0, "co2e_kg": 0.0, "has_rated_power": False}

        if rated_power_kw is None or rated_power_kw <= 0:
            return {"energy_kwh": 0.0, "co2e_kg": 0.0, "has_rated_power": False}

        hours = operating_hours if operating_hours and operating_hours > 0 else 8.0
        monthly_energy = float(quantity) * float(rated_power_kw) * float(hours) * float(days_per_month)
        factor = self.get_grid_emission_factor()
        co2e = monthly_energy * factor.factor_value

        return {
            "has_rated_power": True,
            "monthly_energy_kwh": round(monthly_energy, 2),
            "monthly_co2e_kg": round(co2e, 2),
            "factor_value": factor.factor_value,
            "daily_hours": hours,
            "disclaimer": "Estimated Appliance Consumption (Not metered consumption)"
        }

    def run_all_vesit_calculations(self) -> dict:
        """
        Calculate carbon emissions across all VESIT electricity consumption records.
        """
        records = self.db.query(EnergyConsumption).filter(
            EnergyConsumption.data_source_type == "VESIT_ACTUAL"
        ).order_by(EnergyConsumption.timestamp.asc()).all()

        total_co2e = 0.0
        success_count = 0
        failed_count = 0

        # Clear previous emissions for VESIT to ensure clean recalculation
        self.db.query(CarbonEmission).filter(CarbonEmission.category.ilike("%Electricity%")).delete()
        self.db.commit()

        for rec in records:
            res = self.process_energy_consumption_record(rec)
            if res.get("valid"):
                total_co2e += res["emission_kgco2e"]
                success_count += 1
            else:
                failed_count += 1

        run = self.db.query(CarbonCalculationRun).filter(CarbonCalculationRun.run_id == self.run_id).first()
        if run:
            run.completed_at = datetime.now(timezone.utc)
            run.records_processed = len(records)
            run.records_successful = success_count
            run.records_failed = failed_count
            run.total_emissions_kgco2e = round(total_co2e, 2)
            run.status = "COMPLETED"
        self.db.commit()

        return {
            "run_id": self.run_id,
            "records_processed": len(records),
            "records_successful": success_count,
            "total_emissions_kgco2e": round(total_co2e, 2),
            "status": "COMPLETED"
        }
