from datetime import date, timedelta

from sqlalchemy.orm import Session

from app import models


def seed_database(db: Session) -> None:
    if db.query(models.Customer).count() > 0:
        return

    today = date.today()
    customers = [
        models.Customer(
            store_name="Sharma Hardware",
            phone="+91 98765 43210",
            address="Main Road, Jaipur",
            notes="Pays after reminders, prefers WhatsApp follow-up.",
        ),
        models.Customer(
            store_name="Gupta Stationery",
            phone="+91 99887 76655",
            address="Station Road, Kota",
            notes="Regular customer, usually pays within 10 days.",
        ),
        models.Customer(
            store_name="City Grocery Mart",
            phone="+91 91234 56780",
            address="Bapu Bazaar, Jaipur",
            notes="Old balance pending; owner sometimes delays calls.",
        ),
        models.Customer(
            store_name="Metro Plywood House",
            phone="+91 90123 45098",
            address="Industrial Area, Sikar",
            notes="Bulk buyer with high order value.",
        ),
    ]
    db.add_all(customers)
    db.flush()

    products = [
        models.Product(
            name="Century Plywood 18mm",
            category="Plywood",
            current_stock=8,
            minimum_stock=10,
            purchase_price=1620,
            selling_price=1850,
            supplier="Rajasthan Timber Supply",
            last_sold_date=today - timedelta(days=3),
        ),
        models.Product(
            name="Asian Paints Primer 20L",
            category="Paint",
            current_stock=6,
            minimum_stock=5,
            purchase_price=1950,
            selling_price=2250,
            supplier="Paint World",
            last_sold_date=today - timedelta(days=12),
        ),
        models.Product(
            name="A4 Copier Paper Box",
            category="Stationery",
            current_stock=3,
            minimum_stock=8,
            purchase_price=920,
            selling_price=1100,
            supplier="Paper Hub",
            last_sold_date=today - timedelta(days=1),
        ),
        models.Product(
            name="Door Handle Premium Set",
            category="Hardware",
            current_stock=24,
            minimum_stock=6,
            purchase_price=310,
            selling_price=480,
            supplier="Bright Fittings",
            last_sold_date=today - timedelta(days=76),
        ),
        models.Product(
            name="LED Bulb 12W",
            category="Electrical",
            current_stock=5,
            minimum_stock=20,
            purchase_price=74,
            selling_price=115,
            supplier="LightMax Distributors",
            last_sold_date=today - timedelta(days=5),
        ),
    ]
    db.add_all(products)
    db.flush()

    credits = [
        models.CreditRecord(
            customer_id=customers[0].id,
            product_description="Paint and hardware invoice #VH-1021",
            amount_due=18400,
            amount_paid=5000,
            due_date=today - timedelta(days=9),
            status="partial",
            reminder_count=2,
        ),
        models.CreditRecord(
            customer_id=customers[1].id,
            product_description="Stationery stock invoice #VH-1034",
            amount_due=7200,
            amount_paid=0,
            due_date=today + timedelta(days=2),
            status="pending",
            reminder_count=0,
        ),
        models.CreditRecord(
            customer_id=customers[2].id,
            product_description="Grocery fixtures invoice #VH-0998",
            amount_due=53000,
            amount_paid=12000,
            due_date=today - timedelta(days=43),
            status="partial",
            reminder_count=5,
        ),
        models.CreditRecord(
            customer_id=customers[3].id,
            product_description="Plywood sheets invoice #VH-1041",
            amount_due=92500,
            amount_paid=40000,
            due_date=today - timedelta(days=15),
            status="partial",
            reminder_count=3,
        ),
    ]
    db.add_all(credits)
    db.flush()

    payments = [
        models.CreditPayment(
            credit_record_id=credits[0].id,
            amount=5000,
            payment_date=today - timedelta(days=6),
            payment_mode="upi",
            notes="Partial UPI payment after first reminder.",
        ),
        models.CreditPayment(
            credit_record_id=credits[2].id,
            amount=12000,
            payment_date=today - timedelta(days=31),
            payment_mode="cash",
            notes="Cash collected from owner.",
        ),
        models.CreditPayment(
            credit_record_id=credits[3].id,
            amount=40000,
            payment_date=today - timedelta(days=10),
            payment_mode="bank",
            notes="Advance transfer received.",
        ),
    ]
    db.add_all(payments)

    sales = [
        models.SaleRecord(
            product_id=products[0].id,
            customer_id=customers[3].id,
            product_name=products[0].name,
            quantity=4,
            unit_price=1850,
            total_amount=7400,
            sale_date=today,
        ),
        models.SaleRecord(
            product_id=products[2].id,
            customer_id=customers[1].id,
            product_name=products[2].name,
            quantity=2,
            unit_price=1100,
            total_amount=2200,
            sale_date=today,
        ),
        models.SaleRecord(
            product_id=products[1].id,
            customer_id=customers[0].id,
            product_name=products[1].name,
            quantity=1,
            unit_price=2250,
            total_amount=2250,
            sale_date=today - timedelta(days=1),
        ),
    ]
    db.add_all(sales)
    db.commit()


def backfill_payment_history(db: Session) -> None:
    if db.query(models.CreditPayment).count() > 0:
        return

    records = db.query(models.CreditRecord).filter(models.CreditRecord.amount_paid > 0).all()
    for record in records:
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
