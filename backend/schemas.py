from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Auth schemas
class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


# Rack schemas
class RackCreate(BaseModel):
    name: str
    zone: str
    shelf_count: int = 1
    location: Optional[str] = None


class RackUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    shelf_count: Optional[int] = None
    location: Optional[str] = None


class RackResponse(BaseModel):
    id: int
    name: str
    zone: str
    shelf_count: int
    location: Optional[str]
    created_at: datetime
    medication_count: int = 0

    class Config:
        from_attributes = True


# Medication schemas
class MedicationCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    quantity: int = 0
    unit: str = "tablets"
    expiry_date: datetime
    rack_id: Optional[int] = None
    shelf_number: int = 1
    price: float = 0.0
    manufacturer: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    expiry_date: Optional[datetime] = None
    rack_id: Optional[int] = None
    shelf_number: Optional[int] = None
    price: Optional[float] = None
    manufacturer: Optional[str] = None


class MedicationResponse(BaseModel):
    id: int
    name: str
    generic_name: Optional[str]
    quantity: int
    unit: str
    expiry_date: datetime
    rack_id: Optional[int]
    rack_name: Optional[str] = None
    shelf_number: int
    price: float
    manufacturer: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_expired: bool = False
    is_expiring_soon: bool = False

    class Config:
        from_attributes = True


# Dashboard schema
class DashboardStats(BaseModel):
    total_medications: int
    total_racks: int
    total_quantity: int
    expiring_soon: int
    expired: int
    low_stock: int
    zones: int
    total_revenue: float = 0.0
    total_bills: int = 0
    today_revenue: float = 0.0
    today_bills: int = 0


# Billing schemas
class BillItemCreate(BaseModel):
    medication_id: int
    quantity: int


class BillItemResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    quantity: int
    unit_price: float
    line_total: float

    class Config:
        from_attributes = True


class BillCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    payment_method: str = "cash"
    discount: float = 0.0
    items: List[BillItemCreate]


class BillResponse(BaseModel):
    id: int
    bill_number: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    payment_method: str
    subtotal: float
    discount: float
    tax: float
    total: float
    status: str
    created_at: datetime
    items: List[BillItemResponse]

    class Config:
        from_attributes = True
