from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.services.analytics import effective_credit_status, serialize_credit

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("", response_model=list[schemas.CreditRecordOut])
def list_credit_records(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> list[dict]:
    query = (
        db.query(models.CreditRecord)
        .options(
            joinedload(models.CreditRecord.customer),
            joinedload(models.CreditRecord.payments),
        )
        .order_by(models.CreditRecord.due_date)
    )
    if customer_id:
        query = query.filter(models.CreditRecord.customer_id == customer_id)
    records = [serialize_credit(record) for record in query.all()]
    if status_filter:
        records = [record for record in records if record["status"] == status_filter]
    return records


@router.get("/overdue", response_model=list[schemas.CreditRecordOut])
def list_overdue_credit_records(db: Session = Depends(get_db)) -> list[dict]:
    records = (
        db.query(models.CreditRecord)
        .options(
            joinedload(models.CreditRecord.customer),
            joinedload(models.CreditRecord.payments),
        )
        .order_by(models.CreditRecord.due_date)
        .all()
    )
    return [
        serialize_credit(record)
        for record in records
        if effective_credit_status(record) == "overdue"
    ]


@router.post("", response_model=schemas.CreditRecordOut, status_code=status.HTTP_201_CREATED)
def create_credit_record(
    payload: schemas.CreditRecordCreate, db: Session = Depends(get_db)
) -> dict:
    if not db.get(models.Customer, payload.customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    record = models.CreditRecord(**payload.model_dump())
    db.add(record)
    db.flush()
    if record.amount_paid > 0:
        db.add(
            models.CreditPayment(
                credit_record_id=record.id,
                amount=min(record.amount_paid, record.amount_due),
                payment_date=record.due_date,
                payment_mode="cash",
                notes="Opening paid amount",
            )
        )
    db.commit()
    db.refresh(record)
    return serialize_credit(record)


@router.put("/{record_id}", response_model=schemas.CreditRecordOut)
def update_credit_record(
    record_id: int, payload: schemas.CreditRecordUpdate, db: Session = Depends(get_db)
) -> dict:
    record = db.get(models.CreditRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Credit record not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return serialize_credit(record)


@router.patch("/{record_id}/payment", response_model=schemas.CreditRecordOut)
def update_payment(
    record_id: int, payload: schemas.CreditPaymentUpdate, db: Session = Depends(get_db)
) -> dict:
    record = db.get(models.CreditRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Credit record not found")
    record.amount_paid = min(payload.amount_paid, record.amount_due)
    record.status = "paid" if record.amount_paid >= record.amount_due else "partial"
    db.commit()
    db.refresh(record)
    return serialize_credit(record)


@router.post("/{record_id}/payments", response_model=schemas.CreditRecordOut)
def record_payment(
    record_id: int, payload: schemas.CreditPaymentCreate, db: Session = Depends(get_db)
) -> dict:
    record = (
        db.query(models.CreditRecord)
        .options(joinedload(models.CreditRecord.customer), joinedload(models.CreditRecord.payments))
        .filter(models.CreditRecord.id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Credit record not found")

    payment_amount = min(payload.amount, max(record.amount_due - record.amount_paid, 0))
    if payment_amount <= 0:
        raise HTTPException(status_code=400, detail="This credit record is already paid")

    payment = models.CreditPayment(
        amount=payment_amount,
        payment_date=payload.payment_date,
        payment_mode=payload.payment_mode,
        notes=payload.notes,
    )
    record.payments.append(payment)
    record.amount_paid = min(record.amount_paid + payment_amount, record.amount_due)
    record.status = "paid" if record.amount_paid >= record.amount_due else "partial"
    db.commit()
    db.refresh(record)
    return serialize_credit(record)


@router.post("/{record_id}/reminder-sent", response_model=schemas.CreditRecordOut)
def increment_reminder_count(record_id: int, db: Session = Depends(get_db)) -> dict:
    record = db.get(models.CreditRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Credit record not found")
    record.reminder_count += 1
    db.commit()
    db.refresh(record)
    return serialize_credit(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_credit_record(record_id: int, db: Session = Depends(get_db)) -> Response:
    record = db.get(models.CreditRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Credit record not found")
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
