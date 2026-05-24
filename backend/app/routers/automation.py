from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.analytics import automation_plan

router = APIRouter(prefix="/automation", tags=["automation"])


@router.get("/plan")
def get_automation_plan(db: Session = Depends(get_db)) -> dict:
    return automation_plan(db)
