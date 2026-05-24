from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.services.ai_service import AIService
from app.services.analytics import business_context, days_overdue, outstanding_amount

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/reminder", response_model=schemas.ReminderResponse)
async def generate_reminder(payload: schemas.ReminderRequest) -> dict:
    service = AIService()
    return await service.generate_reminder(
        customer_name=payload.customer_name,
        amount=payload.amount,
        product=payload.product,
        due_date=payload.due_date,
        days_overdue=payload.days_overdue,
        tone=payload.tone,
        language=payload.language,
    )


@router.post("/risk", response_model=schemas.RiskResponse)
async def analyze_manual_risk(payload: schemas.RiskRequest) -> dict:
    service = AIService()
    return await service.analyze_risk(
        customer_name=payload.customer_name,
        amount_due=payload.amount_due,
        overdue_days=payload.overdue_days,
        reminder_count=payload.reminder_count,
        notes=payload.notes,
    )


@router.get("/risk/customer/{customer_id}", response_model=schemas.RiskResponse)
async def analyze_customer_risk(customer_id: int, db: Session = Depends(get_db)) -> dict:
    customer = (
        db.query(models.Customer)
        .options(joinedload(models.Customer.credit_records))
        .filter(models.Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    open_records = [
        record for record in customer.credit_records if outstanding_amount(record) > 0
    ]
    total_due = sum(outstanding_amount(record) for record in open_records)
    max_overdue = max((days_overdue(record.due_date) for record in open_records), default=0)
    reminder_count = sum(record.reminder_count for record in open_records)

    service = AIService()
    return await service.analyze_risk(
        customer_name=customer.store_name,
        amount_due=total_due,
        overdue_days=max_overdue,
        reminder_count=reminder_count,
        notes=customer.notes,
    )


@router.post("/business-assistant", response_model=schemas.BusinessQuestionResponse)
async def ask_business_assistant(
    payload: schemas.BusinessQuestionRequest, db: Session = Depends(get_db)
) -> dict:
    service = AIService()
    context = business_context(db)
    return await service.answer_business_question(payload.question, context)

