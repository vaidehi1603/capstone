from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.services import ai_service, ml_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class RecommendationRequest(BaseModel):
    building_identifier: Optional[str] = "VESIT Chembur Campus"

@router.get("/recommendations", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
async def get_ai_recommendations_get(
    building: Optional[str] = Query("VESIT Chembur Campus", description="Building/Facility name"),
    db: Session = Depends(get_db)
):
    """
    Get AI sustainability recommendations powered by Google Gemini based on official VESIT data.
    """
    result = await ai_service.generate_recommendations(db, building_identifier=building)
    return {"recommendations": result}

@router.post("/recommendations", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
async def get_ai_recommendations_post(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Get AI sustainability recommendations powered by Google Gemini (with rule-based fallback).
    """
    result = await ai_service.generate_recommendations(db, building_identifier=req.building_identifier)
    return {"recommendations": result}

@router.get("/forecast", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_ml_carbon_forecast(
    months_ahead: int = Query(6, ge=1, le=24, description="Forecasting horizon (months)"),
    wing: str = Query("ALL", description="Filter wing ('ALL', 'A Wing', 'B Wing')"),
    db: Session = Depends(get_db)
):
    """
    Get multi-algorithm 6-month carbon & energy forecast using historical VESIT data.
    """
    result = ml_service.get_vesit_carbon_forecast(db, months_ahead=months_ahead, wing_filter=wing)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/forecast/solar", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def get_ml_solar_forecast(db: Session = Depends(get_db)):
    """
    Get solar generation forecast powered by scikit-learn RandomForestRegressor.
    """
    result = ml_service.get_solar_forecast(db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

