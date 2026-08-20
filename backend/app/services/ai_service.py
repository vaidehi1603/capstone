import logging
import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.services.dashboard_service import get_dashboard_metrics

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def get_rule_based_recommendations(metrics) -> list:
    """Fallback rule-based deterministic recommendation engine."""
    recommendations = []
    
    # Extract metrics safely
    energy = metrics.building.buildings[0].total_energy_kwh if metrics.building.buildings else 0
    ac_share = metrics.appliance.ac_consumption_kwh / energy if energy > 0 else 0
    lighting_share = metrics.appliance.lighting_consumption_kwh / energy if energy > 0 else 0
    solar_ratio = metrics.solar.total_generation_kwh / energy if energy > 0 else 0
    waste_kg = metrics.waste.total_food_waste_kg

    # 1. AC Rule
    if ac_share > 0.40:
        recommendations.append({
            "title": "Optimize AC Scheduling",
            "priority": "HIGH",
            "reason": "AC consumption accounts for over 40% of total energy.",
            "action": "Implement automated temperature setpoints and schedule AC shutoffs during non-operational hours.",
            "category": "Electricity",
            "source": "Offline Sustainability Rules"
        })
    else:
        recommendations.append({
            "title": "Maintain AC Efficiency",
            "priority": "LOW",
            "reason": "AC consumption is within normal operational bounds.",
            "action": "Ensure regular filter cleaning and maintenance.",
            "category": "Electricity",
            "source": "Offline Sustainability Rules"
        })
        
    # 2. Lighting Rule
    if lighting_share > 0.20:
        recommendations.append({
            "title": "LED Retrofitting",
            "priority": "MEDIUM",
            "reason": "Lighting accounts for a significant portion of energy usage.",
            "action": "Replace remaining conventional bulbs with LED and install motion sensors in corridors.",
            "category": "Electricity",
            "source": "Offline Sustainability Rules"
        })
        
    # 3. Solar Rule
    if solar_ratio < 0.10:
        recommendations.append({
            "title": "Expand Solar Generation",
            "priority": "HIGH",
            "reason": f"Solar energy offsets only {solar_ratio*100:.1f}% of total consumption.",
            "action": "Evaluate rooftop space for additional solar panel installation to increase green energy mix.",
            "category": "Solar",
            "source": "Offline Sustainability Rules"
        })
        
    # 4. Waste Rule
    if waste_kg > 0:
        recommendations.append({
            "title": "Food Waste Reduction",
            "priority": "MEDIUM",
            "reason": f"Total food waste generated is {waste_kg:.1f} kg.",
            "action": "Implement a canteen composting program and optimize meal preparation forecasting.",
            "category": "Waste",
            "source": "Offline Sustainability Rules"
        })
        
    # Return exactly 3 recommendations to match the AI expectation
    return recommendations[:3]

async def generate_recommendations(db: Session, building_identifier: str = None):
    """
    Generate sustainability recommendations using Gemini API on real VESIT carbon data,
    with deterministic offline rule-based fallback.
    """
    try:
        # 1. Query VESIT metrics
        from app.models.schema import EnergyConsumption, Appliance, EmissionFactor
        factor = db.query(EmissionFactor).filter(
            EmissionFactor.category.ilike("%Electricity%") | (EmissionFactor.scope == "Scope 2")
        ).first()
        ef_val = factor.factor_value if factor else 0.82

        latest_rec = db.query(EnergyConsumption).filter(
            EnergyConsumption.data_source_type == "VESIT_ACTUAL"
        ).order_by(EnergyConsumption.date.desc()).first()

        latest_year = latest_rec.year if latest_rec else 2026

        year_records = db.query(
            func.sum(EnergyConsumption.units_consumed_kwh).label("kwh"),
            func.sum(EnergyConsumption.amount_paid).label("amount")
        ).filter(
            EnergyConsumption.year == latest_year,
            EnergyConsumption.data_source_type == "VESIT_ACTUAL"
        ).first()

        year_kwh = float(year_records.kwh or 354208.0)
        year_co2e = year_kwh * ef_val

        # Appliance inventory count
        app_counts = db.query(
            Appliance.appliance_category,
            func.sum(Appliance.quantity)
        ).filter(
            Appliance.source_type == "VESIT_ACTUAL"
        ).group_by(Appliance.appliance_category).all()

        app_summary = {c: int(q or 0) for c, q in app_counts if c}

        # 6-Month prediction
        from app.services.ml_service import get_vesit_carbon_forecast
        fc = get_vesit_carbon_forecast(db, months_ahead=6)
        pred_6m_co2e = fc.get("forecast_summary", {}).get("total_predicted_co2e_kg", 195000.0)

        input_data = {
            "institute": "V.E.S. Institute of Technology (VESIT)",
            "monitored_facility": building_identifier or "VESIT Chembur Campus (A & B Wings)",
            "grid_emission_factor": f"{ef_val} kgCO2e/kWh (CEA India Baseline)",
            "annual_electricity_kwh": round(year_kwh, 1),
            "annual_carbon_kgco2e": round(year_co2e, 1),
            "six_month_predicted_carbon_kgco2e": round(pred_6m_co2e, 1),
            "top_equipment_inventory": app_summary,
            "cooling_equipment_detail": "308 AC units (211x 2TR, 81x 1.5TR, 5x 3TR cassette, 4x tower AC)",
            "lighting_inventory_detail": "3,235 fixtures (1,819x 20W LED, 850x 15W LED, 536x 36W tube lights)",
            "it_equipment_detail": "1,400 desktop PCs and 150 printers across labs and departments",
            "contract_demand": "A Wing: 350 KVA, B Wing: 175 KVA"
        }

        prompt = f"""
You are an expert Chief Sustainability Officer and Energy Engineer advising V.E.S. Institute of Technology (VESIT).
Review the following verified actual campus electricity and equipment inventory data:
{json.dumps(input_data, indent=2)}

Generate exactly 4 high-impact, actionable sustainability recommendations based STRICTLY on the provided data.
Important Constraints:
1. Ground recommendations in the actual VESIT electrical assets (e.g. 308 AC units, 1400 PCs, 536 remaining 36W fluorescent tube lights, rooftop solar PV opportunities).
2. Do NOT fabricate numerical carbon percentage savings unless directly derived from the data.
3. Every recommendation must include priority, justification based on data, and concrete technical implementation steps.

Return your response ONLY as a JSON array containing exactly 4 objects. Do not include markdown ticks (e.g. ```json) or extra text.
Each object MUST have exactly these keys:
- "title": (string) Actionable recommendation title
- "priority": (string) "HIGH", "MEDIUM", or "LOW"
- "reason": (string) Why this is recommended based on the VESIT inventory and load data
- "action": (string) Clear engineering / administrative action to implement
- "category": (string) "Cooling & HVAC", "Lighting", "IT Infrastructure", or "Renewable Energy"
"""

        if not settings.GEMINI_API_KEY:
            return get_rule_based_recommendations(get_dashboard_metrics(db))

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text_response = response.text.strip()

        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]

        recommendations = json.loads(text_response.strip())
        if isinstance(recommendations, list):
            for r in recommendations:
                r["source"] = "Google Gemini AI (VESIT Contextual Intelligence)"
            return recommendations[:4]

        return get_rule_based_recommendations(get_dashboard_metrics(db))

    except Exception as e:
        logger.error(f"Error in recommendation pipeline: {str(e)}")
        return [
            {
                "title": "HVAC Smart Scheduling & Temperature Setpoint Control",
                "priority": "HIGH",
                "reason": "VESIT operates 308 AC units (including 211x 2TR and 81x 1.5TR split units) representing the single largest campus electrical load.",
                "action": "Standardize cooling setpoints to 24°C-26°C and install automated timers to turn off ACs in unoccupied classrooms and labs.",
                "category": "Cooling & HVAC",
                "source": "VESIT Sustainability Engine (Offline)"
            },
            {
                "title": "Complete LED Retrofit for Remaining 536 Tube Light Fittings",
                "priority": "MEDIUM",
                "reason": "536 fluorescent 36W tube lights remain active alongside modern 15W/20W LEDs, presenting an immediate 58% energy reduction opportunity per fixture.",
                "action": "Phase out all 536 conventional 36W tubes with 15W LED batten fittings to avoid ~3,380 kWh annual consumption.",
                "category": "Lighting",
                "source": "VESIT Sustainability Engine (Offline)"
            },
            {
                "title": "Computer Lab Power Management & Sleep Schedules",
                "priority": "HIGH",
                "reason": "Campus inventory includes 1,400 desktop PCs. Idle machines draw 40W-80W each if left running overnight.",
                "action": "Deploy centralized Group Policy Objects (GPO) to trigger automatic sleep mode after 15 minutes of inactivity in labs.",
                "category": "IT Infrastructure",
                "source": "VESIT Sustainability Engine (Offline)"
            },
            {
                "title": "Commission Rooftop Solar PV Expansion",
                "priority": "HIGH",
                "reason": "Offset peak afternoon daytime loads for A Wing (350 KVA) and B Wing (175 KVA) using available terrace footprint.",
                "action": "Conduct technical feasibility assessment for 100 kWp to 200 kWp grid-interactive rooftop solar PV plant.",
                "category": "Renewable Energy",
                "source": "VESIT Sustainability Engine (Offline)"
            }
        ]

