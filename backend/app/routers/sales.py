from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=list[schemas.SaleOut])
def list_sales(db: Session = Depends(get_db)) -> list[models.SaleRecord]:
    return db.query(models.SaleRecord).order_by(models.SaleRecord.sale_date.desc()).all()


@router.post("", response_model=schemas.SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(payload: schemas.SaleCreate, db: Session = Depends(get_db)) -> models.SaleRecord:
    data = payload.model_dump()
    if not data["total_amount"]:
        data["total_amount"] = data["quantity"] * data["unit_price"]
    sale = models.SaleRecord(**data)
    db.add(sale)

    if sale.product_id:
        product = db.get(models.Product, sale.product_id)
        if product:
            product.current_stock = max(product.current_stock - sale.quantity, 0)
            product.last_sold_date = sale.sale_date

    db.commit()
    db.refresh(sale)
    return sale

