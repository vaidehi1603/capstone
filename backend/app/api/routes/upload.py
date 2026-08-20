from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.api.dependencies import get_db, RoleChecker
from app.agents.carbon_calculator import CarbonCalculatorAgent
from app.models.schema import CarbonCalculationRun
from app.services.bill_parser_service import (
    extract_text_from_file, parse_electricity_bill_text, validate_bill_data, confirm_and_calculate_bill
)
import pandas as pd
import io

router = APIRouter()

class BillConfirmRequest(BaseModel):
    billing_period: str
    year: int
    month_number: int
    month_name: str
    wing: str = "A Wing"
    units_consumed_kwh: float
    amount_paid: Optional[float] = None
    billing_demand_kva: Optional[float] = None
    power_factor: Optional[float] = None
    meter_number: Optional[str] = None

@router.post("/bill/extract", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
async def extract_electricity_bill(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Step 1 & 2 of Bill Workflow: Upload bill document (PDF/Image/Excel/CSV), extract fields, and validate.
    """
    file_bytes = await file.read()
    raw_text = extract_text_from_file(file_bytes, file.filename)
    extracted = parse_electricity_bill_text(raw_text, file.filename)
    warnings = validate_bill_data(db, extracted)

    return {
        "filename": file.filename,
        "extracted_data": extracted,
        "warnings": warnings,
        "has_warnings": len(warnings) > 0,
        "preview_ready": True
    }

@router.post("/bill/confirm", dependencies=[Depends(RoleChecker(["ADMIN"]))])
def confirm_bill_and_calculate(
    req: BillConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Step 3 & 4 of Bill Workflow: Confirm bill fields, run Carbon Calculator Agent, store results,
    and refresh the 6-month ML forecast.
    """
    try:
        result = confirm_and_calculate_bill(db, req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate and process bill: {str(e)}")

@router.post("/", dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Data Hub Pipeline: Upload dataset and process via Carbon Calculator Agent.
    """
    content = await file.read()
    
    # Create run
    run = CarbonCalculationRun(status="PROCESSING")
    db.add(run)
    db.commit()
    
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        agent = CarbonCalculatorAgent(db, run.run_id)
        
        success_count = 0
        fail_count = 0
        total_co2e = 0.0
        
        for _, row in df.iterrows():
            result = agent.process_appliance_row(row.to_dict())
            if result.get("success"):
                success_count += 1
                total_co2e += result.get("co2e", 0.0)
            else:
                fail_count += 1
                
        run.records_processed = len(df)
        run.records_successful = success_count
        run.records_failed = fail_count
        run.total_emissions_kgco2e = total_co2e
        run.status = "COMPLETED"
        
        db.commit()
        return {"run_id": run.run_id, "status": "COMPLETED", "co2e_generated": total_co2e}
        
    except Exception as e:
        run.status = "FAILED"
        run.error_summary = str(e)
        db.commit()
        return {"run_id": run.run_id, "status": "FAILED", "error": str(e)}

