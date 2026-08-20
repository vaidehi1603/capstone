import pytest
from app.db.session import SessionLocal
from app.models.schema import EnergyConsumption, Appliance, CarbonEmission
from app.agents.carbon_calculator import CarbonCalculatorAgent
from app.services.ml_service import get_vesit_carbon_forecast
from app.services.analytics_service import (
    get_vesit_monthly_history, get_vesit_annual_trends, get_vesit_appliance_inventory
)
from app.services.bill_parser_service import parse_electricity_bill_text, confirm_and_calculate_bill

def test_vesit_database_ingestion_and_carbon():
    db = SessionLocal()
    # Verify records exist
    count = db.query(EnergyConsumption).filter(EnergyConsumption.data_source_type == "VESIT_ACTUAL").count()
    assert count >= 116, f"Expected at least 116 VESIT records, found {count}"

    # Verify appliance inventory
    app_count = db.query(Appliance).filter(Appliance.source_type == "VESIT_ACTUAL").count()
    assert app_count >= 25, f"Expected at least 25 appliance categories, found {app_count}"

    # Verify deterministic carbon calculator agent run
    agent = CarbonCalculatorAgent(db)
    result = agent.run_all_vesit_calculations()
    assert result["records_processed"] >= 116
    assert result["status"] == "COMPLETED"
    assert result["total_emissions_kgco2e"] > 1000000.0
    db.close()

def test_vesit_ml_forecasting_pipeline():
    db = SessionLocal()
    result = get_vesit_carbon_forecast(db, months_ahead=6)
    
    assert "error" not in result
    assert "model_selection" in result
    assert "forecast_summary" in result
    assert len(result["forecast_breakdown"]) == 6

    # Verify ARIMA and Random Forest research paper benchmarking
    benchmarks = result["model_selection"]["benchmarks"]
    assert len(benchmarks) == 2
    model_names = [b["short_name"] for b in benchmarks]
    assert "ARIMA" in model_names
    assert "Random Forest" in model_names
    for b in benchmarks:
        assert "mae_kwh" in b
        assert "rmse_kwh" in b
        assert "r2_score" in b
        assert "mape_pct" in b

    # Verify forecast breakdown
    breakdown = result["forecast_breakdown"]
    assert len(breakdown) == 6
    for item in breakdown:
        assert item["predicted_energy_kwh"] > 0
        assert item["predicted_co2e_kg"] > 0
        assert item["lower_bound_co2e_kg"] <= item["upper_bound_co2e_kg"]
    db.close()

def test_vesit_analytics_and_trends():
    db = SessionLocal()
    # 1. Monthly History
    hist = get_vesit_monthly_history(db)
    assert hist["total_records"] >= 55
    assert len(hist["history"]) >= 55
    
    # 2. Annual Trends
    trends = get_vesit_annual_trends(db)
    assert len(trends["annual_trends"]) == 5
    years = [y["year"] for y in trends["annual_trends"]]
    assert 2022 in years and 2026 in years
    
    # 3. Appliance Inventory & Load estimation
    apps = get_vesit_appliance_inventory(db)
    assert apps["total_equipment_count"] > 6000
    assert apps["appliance_energy_estimation"]["total_estimated_monthly_kwh"] > 0
    db.close()

def test_vesit_bill_extraction_and_confirmation():
    db = SessionLocal()
    raw_sample = """
    MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.
    CONSUMER: V.E.S. INSTITUTE OF TECHNOLOGY (VESIT)
    WING: A WING (350 KVA DEMAND)
    BILLING MONTH: AUGUST 2026
    TOTAL UNITS CONSUMED: 42,500 kWh
    BILL AMOUNT: Rs. 6,15,250
    BILLING DEMAND: 320 KVA
    POWER FACTOR: 0.98
    """
    extracted = parse_electricity_bill_text(raw_sample, "bill_aug_2026.pdf")
    assert extracted["year"] == 2026
    assert extracted["month_number"] == 8
    assert extracted["units_consumed_kwh"] == 42500.0
    assert extracted["wing"] == "A Wing"

    # Confirm bill
    res = confirm_and_calculate_bill(db, extracted)
    assert res["success"] is True
    assert res["bill_analysis"]["units_consumed_kwh"] == 42500.0
    assert res["bill_analysis"]["calculated_carbon_kgco2e"] == round(42500.0 * 0.82, 2)
    assert "updated_forecast" in res
    db.close()
