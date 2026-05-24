from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.services.analytics import (
    effective_credit_status,
    outstanding_amount,
    serialize_credit,
    serialize_product,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/daily")
def daily_summary(
    report_date: date = Query(default_factory=date.today), db: Session = Depends(get_db)
) -> dict:
    sales_total = (
        db.query(func.coalesce(func.sum(models.SaleRecord.total_amount), 0))
        .filter(models.SaleRecord.sale_date == report_date)
        .scalar()
    )
    sales_count = (
        db.query(func.count(models.SaleRecord.id))
        .filter(models.SaleRecord.sale_date == report_date)
        .scalar()
    )
    due_today = (
        db.query(models.CreditRecord)
        .options(joinedload(models.CreditRecord.customer))
        .filter(models.CreditRecord.due_date == report_date)
        .all()
    )
    return {
        "date": report_date,
        "sales_total": round(float(sales_total or 0), 2),
        "sales_count": sales_count,
        "credit_due_today": [serialize_credit(record) for record in due_today],
        "recommendations": [
            "Send reminders for accounts due today.",
            "Check low-stock items before closing.",
            "Record cash and UPI collections separately for reconciliation.",
        ],
    }


@router.get("/monthly")
def monthly_summary(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
) -> dict:
    sales_total = (
        db.query(func.coalesce(func.sum(models.SaleRecord.total_amount), 0))
        .filter(extract("year", models.SaleRecord.sale_date) == year)
        .filter(extract("month", models.SaleRecord.sale_date) == month)
        .scalar()
    )
    pending_credit = sum(
        outstanding_amount(record) for record in db.query(models.CreditRecord).all()
    )
    overdue_count = len(
        [
            record
            for record in db.query(models.CreditRecord).all()
            if effective_credit_status(record) == "overdue"
        ]
    )
    return {
        "year": year,
        "month": month,
        "sales_total": round(float(sales_total or 0), 2),
        "pending_credit": round(pending_credit, 2),
        "overdue_accounts": overdue_count,
        "recommendations": [
            "Prioritize high-value overdue accounts before month-end.",
            "Compare slow-moving stock with supplier purchase terms.",
            "Keep a weekly reminder cadence for large pending balances.",
        ],
    }


@router.get("/pending-credit")
def pending_credit_report(db: Session = Depends(get_db)) -> dict:
    records = (
        db.query(models.CreditRecord)
        .options(joinedload(models.CreditRecord.customer))
        .order_by(models.CreditRecord.due_date)
        .all()
    )
    pending = [serialize_credit(record) for record in records if outstanding_amount(record) > 0]
    return {
        "total_pending": round(sum(record["outstanding_amount"] for record in pending), 2),
        "records": pending,
        "recommendations": [
            "Start with customers who are overdue and have high reminder counts.",
            "Ask for partial payment from customers with large balances.",
        ],
    }


@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db)) -> dict:
    products = db.query(models.Product).order_by(models.Product.name).all()
    serialized = [serialize_product(product) for product in products]
    low_stock = [product for product in serialized if product["is_low_stock"]]
    dead_stock = [
        product
        for product in serialized
        if product["dead_stock_days"] is not None and product["dead_stock_days"] >= 60
    ]
    return {
        "total_products": len(serialized),
        "low_stock_count": len(low_stock),
        "dead_stock_count": len(dead_stock),
        "products": serialized,
        "recommendations": [
            "Reorder low-stock essentials first.",
            "Bundle or discount items not sold in 60+ days.",
            "Review suppliers for products with low margin.",
        ],
    }

