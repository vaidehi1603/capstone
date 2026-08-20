import re
import io
import os
import datetime
import pandas as pd
from pypdf import PdfReader
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schema import EnergyConsumption, EmissionFactor, DataSource
from app.agents.carbon_calculator import CarbonCalculatorAgent
from app.services.ml_service import get_vesit_carbon_forecast

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
}

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract raw text from PDF, CSV, Excel, or plain text."""
    lower_fn = filename.lower()
    text = ""
    try:
        if lower_fn.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        elif lower_fn.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
            text = df.to_string()
        elif lower_fn.endswith(".xlsx") or lower_fn.endswith(".xls"):
            excel_file = pd.ExcelFile(io.BytesIO(file_bytes))
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                text += f"--- Sheet: {sheet_name} ---\n" + df.to_string() + "\n"
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        text = f"Error reading file content: {str(e)}"
    return text

def parse_electricity_bill_text(text: str, filename: str) -> dict:
    """
    Intelligent heuristic and regex parser to extract key electricity bill entities.
    """
    extracted = {
        "billing_period": None,
        "year": None,
        "month_number": None,
        "month_name": None,
        "units_consumed_kwh": None,
        "amount_paid": None,
        "billing_demand_kva": None,
        "power_factor": None,
        "wing": "A Wing", # default to A Wing or Whole Campus
        "meter_number": None,
        "confidence_score": 0.85,
        "raw_text_preview": text[:500] if text else ""
    }

    # 1. Detect Wing
    text_upper = text.upper()
    if "B WING" in text_upper or "B-WING" in text_upper:
        extracted["wing"] = "B Wing"
    elif "A WING" in text_upper or "A-WING" in text_upper:
        extracted["wing"] = "A Wing"
    elif "CONSTRUCTION" in text_upper or "CONST" in text_upper:
        extracted["wing"] = "Construction"

    # 2. Extract Units Consumed (kWh)
    # e.g., "Units: 25430", "Total Units: 34559", "25,430 kWh", "Units Consumed: 15,170"
    units_patterns = [
        r'(?:units|unit consumed|total units|consumption|kwh consumed|energy consumed)\s*[:=-]?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:kwh|units)?',
        r'([0-9,]+(?:\.[0-9]+)?)\s*(?:kwh|units)\b',
        r'\bunits\s+([0-9,]+(?:\.[0-9]+)?)\b'
    ]
    for pat in units_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val_str = m.group(1).replace(",", "")
            try:
                val = float(val_str)
                if 100 <= val <= 5000000: # realistic range
                    extracted["units_consumed_kwh"] = val
                    break
            except:
                pass

    # 3. Extract Amount Paid (₹)
    # e.g., "Amount: Rs. 3,12,830", "Total Amount Paid: 437290", "Bill Amount: ₹360,920"
    amount_patterns = [
        r'(?:amount paid|bill amount|total amount|payable amount|amount payable|net amount|amount)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]+)?)',
        r'(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]+)?)'
    ]
    for pat in amount_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val_str = m.group(1).replace(",", "")
            try:
                val = float(val_str)
                if 500 <= val <= 50000000:
                    extracted["amount_paid"] = val
                    break
            except:
                pass

    # 4. Extract Billing Demand (KVA / kW)
    demand_m = re.search(r'(?:billing demand|demand|contract demand)\s*[:=-]?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:kva|kw)?', text, re.IGNORECASE)
    if demand_m:
        try:
            extracted["billing_demand_kva"] = float(demand_m.group(1).replace(",", ""))
        except:
            pass

    # 5. Extract Power Factor
    pf_m = re.search(r'(?:power factor|pf)\s*[:=-]?\s*(0\.[0-9]+|1\.00?)', text, re.IGNORECASE)
    if pf_m:
        try:
            extracted["power_factor"] = float(pf_m.group(1))
        except:
            pass

    # 6. Extract Meter Number
    meter_m = re.search(r'(?:meter no|meter number|consumer no|account no)\s*[:=-]?\s*([A-Za-z0-9\-]+)', text, re.IGNORECASE)
    if meter_m:
        extracted["meter_number"] = meter_m.group(1)

    # 7. Extract Date / Billing Period
    # Look for Month Year e.g., "August 2026", "08/2026", "2026-08"
    month_year_m = re.search(r'\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(202[0-9])\b', text, re.IGNORECASE)
    if month_year_m:
        m_name = month_year_m.group(1).capitalize()
        y_val = int(month_year_m.group(2))
        m_num = MONTH_MAP.get(m_name.lower(), 8)
        extracted["year"] = y_val
        extracted["month_number"] = m_num
        extracted["month_name"] = m_name
        extracted["billing_period"] = f"{m_name} {y_val}"
    else:
        # Check filename or fallback to next month after latest dataset
        for k, v in MONTH_MAP.items():
            if k in filename.lower():
                extracted["month_name"] = k.capitalize()
                extracted["month_number"] = v
                break
        year_m = re.search(r'(202[2-9])', filename)
        if year_m:
            extracted["year"] = int(year_m.group(1))
            if extracted["month_name"]:
                extracted["billing_period"] = f"{extracted['month_name']} {extracted['year']}"

    # If still not found, default to August 2026 (next consecutive VESIT month)
    if not extracted["year"]:
        extracted["year"] = 2026
        extracted["month_number"] = 8
        extracted["month_name"] = "August"
        extracted["billing_period"] = "August 2026"

    return extracted

def validate_bill_data(db: Session, bill_data: dict) -> list:
    """
    Validate extracted bill fields against historical VESIT numbers.
    Returns list of warnings / validation notices.
    """
    warnings = []
    units = bill_data.get("units_consumed_kwh")
    amount = bill_data.get("amount_paid")
    year = bill_data.get("year")
    month_num = bill_data.get("month_number")
    wing = bill_data.get("wing")

    if not units or units <= 0:
        warnings.append("Could not reliably detect consumption units (kWh). Please confirm manually.")
        return warnings

    # Check for duplicate bill in database
    existing = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.year == year,
        EnergyConsumption.month_number == month_num,
        EnergyConsumption.wing == wing
    ).first()

    if existing:
        warnings.append(f"A bill for {bill_data.get('billing_period')} ({wing}) already exists in the database with {existing.units_consumed_kwh:,.0f} kWh. Confirming will update this record.")

    # Historical average comparison
    avg_kwh = db.query(func.avg(EnergyConsumption.units_consumed_kwh)).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.wing == wing
    ).scalar() or 22000.0

    if units > avg_kwh * 1.35:
        pct = round(((units - avg_kwh) / avg_kwh) * 100, 1)
        warnings.append(f"Electricity consumption ({units:,.0f} kWh) is {pct}% higher than historical average ({avg_kwh:,.0f} kWh) for {wing}.")
    elif units < avg_kwh * 0.4:
        pct = round(((avg_kwh - units) / avg_kwh) * 100, 1)
        warnings.append(f"Electricity consumption ({units:,.0f} kWh) is {pct}% lower than historical average ({avg_kwh:,.0f} kWh) for {wing}.")

    # Rate check
    if amount and units > 0:
        rate = amount / units
        if rate < 5.0 or rate > 30.0:
            warnings.append(f"Calculated electricity rate (₹{rate:.2f}/kWh) appears outside typical MSEDCL / Tata Power tariff range.")

    return warnings

def confirm_and_calculate_bill(
    db: Session,
    bill_data: dict,
    user_name: str = "Admin"
) -> dict:
    """
    Complete workflow:
    1. Store / update record in energy_consumption table
    2. Invoke CarbonCalculatorAgent to deterministically calculate CO2e
    3. Compare with previous month and same month last year
    4. Trigger 6-month ML forecast update
    """
    year = int(bill_data.get("year", 2026))
    month_num = int(bill_data.get("month_number", 8))
    month_name = bill_data.get("month_name") or "August"
    wing = bill_data.get("wing") or "A Wing"
    units_kwh = float(bill_data.get("units_consumed_kwh", 0.0))
    amount = float(bill_data.get("amount_paid", 0.0)) if bill_data.get("amount_paid") else None
    demand = float(bill_data.get("billing_demand_kva", 0.0)) if bill_data.get("billing_demand_kva") else None
    pf = float(bill_data.get("power_factor", 0.0)) if bill_data.get("power_factor") else None
    rate = (amount / units_kwh) if amount and units_kwh > 0 else None

    rec_date = datetime.date(year, month_num, 1)
    rec_dt = datetime.datetime(year, month_num, 1, 0, 0, tzinfo=datetime.timezone.utc)

    # Check for existing record or create new
    rec = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.year == year,
        EnergyConsumption.month_number == month_num,
        EnergyConsumption.wing == wing
    ).first()

    if not rec:
        rec = EnergyConsumption(
            institute_id=1,
            campus_id=1,
            wing=wing,
            timestamp=rec_dt,
            date=rec_date,
            year=year,
            month=month_name,
            month_number=month_num,
            billing_demand=demand,
            units_consumed_kwh=units_kwh,
            amount_paid=amount,
            rate_per_unit=rate,
            power_factor=pf,
            energy_source="Grid Electricity",
            consumption_value=units_kwh,
            unit="kWh",
            data_source_type="VESIT_ACTUAL"
        )
        db.add(rec)
    else:
        rec.units_consumed_kwh = units_kwh
        rec.consumption_value = units_kwh
        rec.amount_paid = amount
        rec.rate_per_unit = rate
        rec.billing_demand = demand
        rec.power_factor = pf

    db.commit()
    db.refresh(rec)

    # 2. Invoke Carbon Calculator Agent
    agent = CarbonCalculatorAgent(db)
    calc_res = agent.process_energy_consumption_record(rec)
    db.commit()

    factor_obj = agent.get_grid_emission_factor()
    carbon_kgco2e = calc_res.get("emission_kgco2e", units_kwh * factor_obj.factor_value)

    # 3. Calculate Historical Comparisons
    # Previous chronological month in DB
    prev_m_num = 12 if month_num == 1 else month_num - 1
    prev_year = year - 1 if month_num == 1 else year
    prev_month_rec = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.year == prev_year,
        EnergyConsumption.month_number == prev_m_num,
        EnergyConsumption.wing == wing
    ).first()

    prev_month_change_pct = None
    if prev_month_rec and prev_month_rec.units_consumed_kwh:
        prev_kwh = prev_month_rec.units_consumed_kwh
        prev_month_change_pct = round(((units_kwh - prev_kwh) / prev_kwh) * 100, 1)

    # Same month previous year
    prev_year_rec = db.query(EnergyConsumption).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL",
        EnergyConsumption.year == year - 1,
        EnergyConsumption.month_number == month_num,
        EnergyConsumption.wing == wing
    ).first()

    prev_year_change_pct = None
    if prev_year_rec and prev_year_rec.units_consumed_kwh:
        prev_y_kwh = prev_year_rec.units_consumed_kwh
        prev_year_change_pct = round(((units_kwh - prev_y_kwh) / prev_y_kwh) * 100, 1)

    # 4. Rerun 6-Month Time Series Forecast
    updated_forecast = get_vesit_carbon_forecast(db, months_ahead=6)

    return {
        "success": True,
        "message": f"Successfully processed bill for {bill_data.get('billing_period')} ({wing}). Carbon emissions calculated and forecast refreshed.",
        "bill_analysis": {
            "billing_period": bill_data.get("billing_period", f"{month_name} {year}"),
            "wing": wing,
            "units_consumed_kwh": units_kwh,
            "amount_paid": amount,
            "emission_factor_value": factor_obj.factor_value,
            "emission_factor_unit": factor_obj.factor_unit,
            "calculated_carbon_kgco2e": carbon_kgco2e,
            "comparison_prev_month_pct": prev_month_change_pct,
            "comparison_prev_year_pct": prev_year_change_pct
        },
        "updated_forecast": updated_forecast
    }
