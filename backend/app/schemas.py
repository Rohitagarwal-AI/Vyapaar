from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class CustomerBase(BaseModel):
    store_name: str = Field(..., min_length=2, max_length=140)
    phone: str = Field(..., min_length=7, max_length=30)
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    store_name: Optional[str] = Field(default=None, min_length=2, max_length=140)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=30)
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreditRecordBase(BaseModel):
    customer_id: int
    product_description: str = Field(..., min_length=2, max_length=180)
    amount_due: float = Field(..., ge=0)
    amount_paid: float = Field(default=0, ge=0)
    due_date: date
    status: Literal["pending", "partial", "paid", "overdue"] = "pending"
    reminder_count: int = Field(default=0, ge=0)


class CreditRecordCreate(CreditRecordBase):
    pass


class CreditRecordUpdate(BaseModel):
    product_description: Optional[str] = Field(default=None, min_length=2, max_length=180)
    amount_due: Optional[float] = Field(default=None, ge=0)
    amount_paid: Optional[float] = Field(default=None, ge=0)
    due_date: Optional[date] = None
    status: Optional[Literal["pending", "partial", "paid", "overdue"]] = None
    reminder_count: Optional[int] = Field(default=None, ge=0)


class CreditPaymentUpdate(BaseModel):
    amount_paid: float = Field(..., ge=0)


class CreditPaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_date: date = Field(default_factory=date.today)
    payment_mode: Literal["cash", "upi", "bank", "cheque", "other"] = "cash"
    notes: Optional[str] = None


class CreditPaymentOut(CreditPaymentCreate):
    id: int
    credit_record_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreditRecordOut(CreditRecordBase):
    id: int
    outstanding_amount: float
    days_overdue: int
    customer: Optional[CustomerOut] = None
    payments: list[CreditPaymentOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=140)
    category: str = Field(..., min_length=2, max_length=80)
    current_stock: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    purchase_price: float = Field(default=0, ge=0)
    selling_price: float = Field(default=0, ge=0)
    supplier: Optional[str] = None
    last_sold_date: Optional[date] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=140)
    category: Optional[str] = Field(default=None, min_length=2, max_length=80)
    current_stock: Optional[int] = Field(default=None, ge=0)
    minimum_stock: Optional[int] = Field(default=None, ge=0)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    selling_price: Optional[float] = Field(default=None, ge=0)
    supplier: Optional[str] = None
    last_sold_date: Optional[date] = None


class ProductOut(ProductBase):
    id: int
    is_low_stock: bool
    dead_stock_days: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaleBase(BaseModel):
    product_id: Optional[int] = None
    customer_id: Optional[int] = None
    product_name: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    sale_date: date


class SaleCreate(SaleBase):
    pass


class SaleOut(SaleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReminderRequest(BaseModel):
    customer_name: str
    amount: float
    product: str
    due_date: date
    days_overdue: int = Field(default=0, ge=0)
    tone: Literal["polite", "friendly", "professional", "strong"] = "polite"
    language: Literal["English", "Hindi", "Hinglish"] = "English"


class ReminderResponse(BaseModel):
    message: str
    provider: str


class RiskRequest(BaseModel):
    customer_name: str
    amount_due: float = Field(..., ge=0)
    overdue_days: int = Field(default=0, ge=0)
    reminder_count: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class RiskResponse(BaseModel):
    risk_level: Literal["Low", "Medium", "High"]
    score: int
    reason: str
    recommended_action: str


class BusinessQuestionRequest(BaseModel):
    question: str = Field(..., min_length=4)


class BusinessQuestionResponse(BaseModel):
    answer: str
    provider: str
