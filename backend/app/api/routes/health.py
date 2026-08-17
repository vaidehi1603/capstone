from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.dependencies import get_db

router = APIRouter()

@router.get("")
def health_check():
    return {"success": True, "message": "Backend is healthy"}

@router.get("/database")
def database_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"success": True, "message": "Database connection is healthy"}
    except Exception as e:
        return {"success": False, "message": f"Database connection failed: {str(e)}"}
