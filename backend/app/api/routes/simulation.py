from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.services.simulation_service import calculate_what_if
from pydantic import BaseModel

router = APIRouter()

class SimulationRequest(BaseModel):
    category: str
    reduction_percentage: float

@router.post("/", dependencies=[Depends(RoleChecker(["ADMIN", "VIEWER"]))])
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Run a deterministic what-if sustainability simulation.
    """
    return calculate_what_if(db, req.category, req.reduction_percentage)
