from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import models


def outstanding_amount(record: models.CreditRecord) -> float:
    return max(record.amount_due - record.amount_paid, 0)


def days_overdue(due_date: date) -> int:
    return max((date.today() - due_date).days, 0)


def effective_credit_status(record: models.CreditRecord) -> str:
    if outstanding_amount(record) <= 0:
        return "paid"
    if record.due_date < date.today():
        return "overdue"
    if record.amount_paid > 0:
        return "partial"
    return record.status or "pending"


def serialize_customer(customer: models.Customer | None) -> dict | None:
    if not customer:
        return None
    return {
        "id": customer.id,
        "store_name": customer.store_name,
        "phone": customer.phone,
        "address": customer.address,
        "notes": customer.notes,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
    }


def serialize_payment(payment: models.CreditPayment) -> dict:
    return {
        "id": payment.id,
        "credit_record_id": payment.credit_record_id,
        "amount": payment.amount,
        "payment_date": payment.payment_date,
        "payment_mode": payment.payment_mode,
        "notes": payment.notes,
        "created_at": payment.created_at,
        "updated_at": payment.updated_at,
    }


def serialize_credit(record: models.CreditRecord) -> dict:
    return {
        "id": record.id,
        "customer_id": record.customer_id,
        "product_description": record.product_description,
        "amount_due": record.amount_due,
        "amount_paid": record.amount_paid,
        "due_date": record.due_date,
        "status": effective_credit_status(record),
        "reminder_count": record.reminder_count,
        "outstanding_amount": outstanding_amount(record),
        "days_overdue": days_overdue(record.due_date) if effective_credit_status(record) == "overdue" else 0,
        "customer": serialize_customer(record.customer),
        "payments": [
            serialize_payment(payment)
            for payment in sorted(record.payments, key=lambda item: item.payment_date, reverse=True)
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def product_dead_stock_days(product: models.Product) -> Optional[int]:
    if not product.last_sold_date:
        return None
    return (date.today() - product.last_sold_date).days


def serialize_product(product: models.Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "current_stock": product.current_stock,
        "minimum_stock": product.minimum_stock,
        "purchase_price": product.purchase_price,
        "selling_price": product.selling_price,
        "supplier": product.supplier,
        "last_sold_date": product.last_sold_date,
        "is_low_stock": product.current_stock <= product.minimum_stock,
        "dead_stock_days": product_dead_stock_days(product),
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def heuristic_risk_score(
    amount_due: float, overdue_days_value: int, reminder_count: int, notes: Optional[str]
) -> tuple[str, int, str, str]:
    score = 0
    if amount_due >= 50000:
        score += 35
    elif amount_due >= 20000:
        score += 25
    elif amount_due >= 5000:
        score += 12

    if overdue_days_value >= 45:
        score += 35
    elif overdue_days_value >= 21:
        score += 25
    elif overdue_days_value >= 7:
        score += 12

    if reminder_count >= 5:
        score += 20
    elif reminder_count >= 3:
        score += 12
    elif reminder_count >= 1:
        score += 5

    note_text = (notes or "").lower()
    warning_words = ["avoid", "delay", "dispute", "not picking", "cash issue", "old balance"]
    if any(word in note_text for word in warning_words):
        score += 10

    if score >= 65:
        return (
            "High",
            min(score, 100),
            "Large outstanding amount, long overdue period, or repeated reminders indicate collection risk.",
            "Call the customer today, pause new credit, and request a partial payment commitment.",
        )
    if score >= 35:
        return (
            "Medium",
            min(score, 100),
            "The account needs attention because amount, overdue days, or reminder count is rising.",
            "Send a professional reminder and schedule follow-up within two working days.",
        )
    return (
        "Low",
        min(score, 100),
        "The outstanding balance and overdue indicators are currently manageable.",
        "Send a polite reminder and continue normal credit monitoring.",
    )


def dashboard_summary(db: Session) -> dict:
    credit_records = db.query(models.CreditRecord).all()
    products = db.query(models.Product).all()

    total_pending_credit = sum(outstanding_amount(record) for record in credit_records)
    overdue_records = [
        record for record in credit_records if effective_credit_status(record) == "overdue"
    ]
    low_stock_products = [product for product in products if product.current_stock <= product.minimum_stock]

    today_sales = (
        db.query(func.coalesce(func.sum(models.SaleRecord.total_amount), 0))
        .filter(models.SaleRecord.sale_date == date.today())
        .scalar()
    )

    suggested_actions: list[str] = []
    if overdue_records:
        suggested_actions.append(f"Follow up with {len(overdue_records)} overdue customer account(s).")
    if low_stock_products:
        suggested_actions.append(f"Reorder {len(low_stock_products)} low-stock product(s).")

    slow_movers = [
        product
        for product in products
        if product.last_sold_date and (date.today() - product.last_sold_date).days >= 60
    ]
    if slow_movers:
        suggested_actions.append("Review slow-moving inventory and consider a bundle or discount.")
    if not suggested_actions:
        suggested_actions.append("No urgent alerts. Review sales and plan tomorrow's follow-ups.")

    return {
        "total_pending_credit": round(total_pending_credit, 2),
        "overdue_customers": len({record.customer_id for record in overdue_records}),
        "low_stock_products": len(low_stock_products),
        "todays_sales": round(float(today_sales or 0), 2),
        "ai_suggested_actions": suggested_actions,
        "recent_overdue": [serialize_credit(record) for record in overdue_records[:5]],
        "low_stock_items": [serialize_product(product) for product in low_stock_products[:5]],
    }


def business_context(db: Session) -> dict:
    summary = dashboard_summary(db)
    overdue = db.query(models.CreditRecord).join(models.Customer).all()
    products = db.query(models.Product).all()
    return {
        "dashboard": summary,
        "credits": [
            {
                "customer": record.customer.store_name,
                "phone": record.customer.phone,
                "product": record.product_description,
                "outstanding": outstanding_amount(record),
                "due_date": str(record.due_date),
                "days_overdue": days_overdue(record.due_date),
                "status": effective_credit_status(record),
                "reminders": record.reminder_count,
                "notes": record.customer.notes,
            }
            for record in overdue
            if outstanding_amount(record) > 0
        ],
        "inventory": [
            {
                "name": product.name,
                "category": product.category,
                "stock": product.current_stock,
                "minimum_stock": product.minimum_stock,
                "supplier": product.supplier,
                "last_sold_date": str(product.last_sold_date) if product.last_sold_date else None,
                "dead_stock_days": product_dead_stock_days(product),
            }
            for product in products
        ],
    }


def priority_label(amount: float, overdue_days_value: int, reminders: int) -> str:
    if amount >= 50000 or overdue_days_value >= 30 or reminders >= 5:
        return "High"
    if amount >= 15000 or overdue_days_value >= 10 or reminders >= 2:
        return "Medium"
    return "Low"


def automation_plan(db: Session) -> dict:
    credits = (
        db.query(models.CreditRecord)
        .options(joinedload(models.CreditRecord.customer), joinedload(models.CreditRecord.payments))
        .all()
    )
    products = db.query(models.Product).all()

    open_credits = [record for record in credits if outstanding_amount(record) > 0]
    overdue = [
        record for record in open_credits if effective_credit_status(record) == "overdue"
    ]
    upcoming = [
        record
        for record in open_credits
        if 0 <= (record.due_date - date.today()).days <= 7
        and effective_credit_status(record) != "overdue"
    ]

    follow_ups = []
    for record in sorted(
        overdue,
        key=lambda item: (
            days_overdue(item.due_date),
            outstanding_amount(item),
            item.reminder_count,
        ),
        reverse=True,
    )[:8]:
        overdue_days_value = days_overdue(record.due_date)
        amount = outstanding_amount(record)
        priority = priority_label(amount, overdue_days_value, record.reminder_count)
        follow_ups.append(
            {
                "credit_record_id": record.id,
                "customer_id": record.customer_id,
                "customer_name": record.customer.store_name,
                "phone": record.customer.phone,
                "product": record.product_description,
                "amount": round(amount, 2),
                "due_date": record.due_date,
                "days_overdue": overdue_days_value,
                "reminders": record.reminder_count,
                "priority": priority,
                "tone": "strong" if priority == "High" else "professional",
                "language": "Hinglish",
                "next_step": (
                    "Call owner and ask for partial payment today."
                    if priority == "High"
                    else "Send WhatsApp reminder and follow up in two days."
                ),
            }
        )

    reorder_items = []
    for product in sorted(
        [item for item in products if item.current_stock <= item.minimum_stock],
        key=lambda item: (item.minimum_stock - item.current_stock, item.selling_price),
        reverse=True,
    ):
        shortage = max(product.minimum_stock - product.current_stock, 0)
        suggested_quantity = max(shortage, product.minimum_stock)
        reorder_items.append(
            {
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "supplier": product.supplier,
                "current_stock": product.current_stock,
                "minimum_stock": product.minimum_stock,
                "shortage": shortage,
                "suggested_quantity": suggested_quantity,
                "estimated_cost": round(suggested_quantity * product.purchase_price, 2),
                "priority": "High" if product.current_stock == 0 or shortage >= product.minimum_stock else "Medium",
            }
        )

    slow_stock = []
    for product in sorted(
        [
            item
            for item in products
            if product_dead_stock_days(item) is not None and product_dead_stock_days(item) >= 60
        ],
        key=lambda item: product_dead_stock_days(item) or 0,
        reverse=True,
    ):
        slow_stock.append(
            {
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "stock": product.current_stock,
                "last_sold_date": product.last_sold_date,
                "dead_stock_days": product_dead_stock_days(product),
                "action": "Create bundle offer, discount, or supplier return discussion.",
            }
        )

    due_this_week_amount = sum(outstanding_amount(record) for record in upcoming)
    collection_target = sum(outstanding_amount(record) for record in overdue[:5])
    workload_score = min(
        100,
        len(overdue) * 8 + len(reorder_items) * 5 + len(slow_stock) * 4,
    )
    automation_score = max(0, 100 - workload_score)

    daily_playbook = [
        {
            "title": "Collect overdue credit",
            "detail": f"Start with {len(follow_ups)} priority follow-up(s), target {round(collection_target, 2)} today.",
            "type": "credit",
        },
        {
            "title": "Prevent new stockouts",
            "detail": f"Reorder {len(reorder_items)} low-stock item(s) before peak sales time.",
            "type": "inventory",
        },
        {
            "title": "Clean slow-moving stock",
            "detail": f"Review {len(slow_stock)} slow-moving item(s) for bundle or discount action.",
            "type": "stock",
        },
        {
            "title": "Watch upcoming dues",
            "detail": f"{len(upcoming)} account(s) are due this week worth Rs {round(due_this_week_amount, 2)}.",
            "type": "planning",
        },
    ]

    return {
        "automation_score": automation_score,
        "collection_target": round(collection_target, 2),
        "follow_ups": follow_ups,
        "reorder_items": reorder_items[:8],
        "slow_stock": slow_stock[:8],
        "daily_playbook": daily_playbook,
        "automation_rules": [
            "Every morning: show overdue customers sorted by amount and days overdue.",
            "When a reminder is sent: increase reminder count and raise risk priority if ignored.",
            "When stock reaches minimum: add product to reorder queue automatically.",
            "When an item is unsold for 60+ days: add it to slow-stock actions.",
        ],
    }
