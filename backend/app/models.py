from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_name: Mapped[str] = mapped_column(String(140), index=True)
    phone: Mapped[str] = mapped_column(String(30), index=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    credit_records: Mapped[list["CreditRecord"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    sales: Mapped[list["SaleRecord"]] = relationship(back_populates="customer")


class CreditRecord(Base, TimestampMixin):
    __tablename__ = "credit_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    product_description: Mapped[str] = mapped_column(String(180))
    amount_due: Mapped[float] = mapped_column(Float)
    amount_paid: Mapped[float] = mapped_column(Float, default=0)
    due_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)

    customer: Mapped[Customer] = relationship(back_populates="credit_records")
    payments: Mapped[list["CreditPayment"]] = relationship(
        back_populates="credit_record", cascade="all, delete-orphan"
    )


class CreditPayment(Base, TimestampMixin):
    __tablename__ = "credit_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    credit_record_id: Mapped[int] = mapped_column(ForeignKey("credit_records.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    payment_date: Mapped[date] = mapped_column(Date, index=True)
    payment_mode: Mapped[str] = mapped_column(String(30), default="cash")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    credit_record: Mapped[CreditRecord] = relationship(back_populates="payments")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    minimum_stock: Mapped[int] = mapped_column(Integer, default=0)
    purchase_price: Mapped[float] = mapped_column(Float, default=0)
    selling_price: Mapped[float] = mapped_column(Float, default=0)
    supplier: Mapped[Optional[str]] = mapped_column(String(140), nullable=True)
    last_sold_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    sales: Mapped[list["SaleRecord"]] = relationship(back_populates="product")


class SaleRecord(Base, TimestampMixin):
    __tablename__ = "sale_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id"), nullable=True)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(140))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    sale_date: Mapped[date] = mapped_column(Date, index=True)

    product: Mapped[Optional[Product]] = relationship(back_populates="sales")
    customer: Mapped[Optional[Customer]] = relationship(back_populates="sales")
