from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.analytics import product_dead_stock_days, serialize_product

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/products", response_model=list[schemas.ProductOut])
def list_products(
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> list[dict]:
    query = db.query(models.Product).order_by(models.Product.name)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(models.Product.name.ilike(term), models.Product.category.ilike(term))
        )
    return [serialize_product(product) for product in query.all()]


@router.get("/low-stock", response_model=list[schemas.ProductOut])
def low_stock_products(db: Session = Depends(get_db)) -> list[dict]:
    products = db.query(models.Product).order_by(models.Product.name).all()
    return [
        serialize_product(product)
        for product in products
        if product.current_stock <= product.minimum_stock
    ]


@router.get("/dead-stock", response_model=list[schemas.ProductOut])
def dead_stock_products(
    days: int = Query(default=60, ge=1), db: Session = Depends(get_db)
) -> list[dict]:
    products = db.query(models.Product).order_by(models.Product.name).all()
    return [
        serialize_product(product)
        for product in products
        if product_dead_stock_days(product) is not None
        and product_dead_stock_days(product) >= days
    ]


@router.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)) -> dict:
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)
) -> dict:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.delete(
    "/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response
)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
