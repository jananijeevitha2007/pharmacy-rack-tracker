from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from database import get_db
from models import Bill, BillItem, Medication, User
from schemas import BillCreate, BillResponse
from auth import get_current_user

router = APIRouter(prefix="/api/bills", tags=["bills"])

TAX_RATE = 0.0


def generate_bill_number(db: Session) -> str:
    count = db.query(Bill).count() + 1
    return f"BIL-{datetime.utcnow().strftime('%Y%m%d')}-{count:04d}"


@router.get("/", response_model=List[BillResponse])
def get_bills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bills = db.query(Bill).options(joinedload(Bill.items)).order_by(Bill.created_at.desc()).all()
    return bills


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).options(joinedload(Bill.items)).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.post("/", response_model=BillResponse, status_code=201)
def create_bill(payload: BillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Bill must have at least one item")

    bill_items = []
    subtotal = 0.0

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")

        medication = db.query(Medication).filter(Medication.id == item.medication_id).first()
        if not medication:
            raise HTTPException(status_code=404, detail=f"Medication {item.medication_id} not found")

        if medication.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{medication.name}' (available: {medication.quantity})"
            )

        line_total = round(medication.price * item.quantity, 2)
        subtotal += line_total

        bill_items.append(BillItem(
            medication_id=medication.id,
            medication_name=medication.name,
            quantity=item.quantity,
            unit_price=medication.price,
            line_total=line_total
        ))

    subtotal = round(subtotal, 2)
    discount = min(payload.discount, subtotal)
    taxable = subtotal - discount
    tax = round(taxable * TAX_RATE, 2)
    total = round(taxable + tax, 2)

    bill = Bill(
        bill_number=generate_bill_number(db),
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_address=payload.customer_address,
        payment_method=payload.payment_method,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        status="completed",
        created_by=current_user.id,
    )
    bill.items = bill_items

    db.add(bill)

    for item in bill_items:
        med = db.query(Medication).filter(Medication.id == item.medication_id).first()
        med.quantity -= item.quantity

    db.commit()
    db.refresh(bill)

    return get_bill(bill.id, db, current_user)


@router.delete("/{bill_id}")
def delete_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    for item in bill.items:
        med = db.query(Medication).filter(Medication.id == item.medication_id).first()
        if med:
            med.quantity += item.quantity

    db.delete(bill)
    db.commit()
    return {"message": "Bill deleted and stock restored"}


@router.post("/{bill_id}/void")
def void_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == "voided":
        raise HTTPException(status_code=400, detail="Bill is already voided")

    for item in bill.items:
        med = db.query(Medication).filter(Medication.id == item.medication_id).first()
        if med:
            med.quantity += item.quantity

    bill.status = "voided"
    db.commit()
    db.refresh(bill)

    return BillResponse(
        id=bill.id,
        bill_number=bill.bill_number,
        customer_name=bill.customer_name,
        customer_phone=bill.customer_phone,
        payment_method=bill.payment_method,
        subtotal=bill.subtotal,
        discount=bill.discount,
        tax=bill.tax,
        total=bill.total,
        status=bill.status,
        created_at=bill.created_at,
        items=bill.items
    )
