from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from models import Medication, Rack, User
from schemas import MedicationCreate, MedicationUpdate, MedicationResponse
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/medications", tags=["medications"])


@router.get("/", response_model=List[MedicationResponse])
def get_medications(
    search: Optional[str] = Query(None),
    rack_id: Optional[int] = Query(None),
    expiring_soon: Optional[bool] = Query(None),
    expired: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Medication)

    if search:
        query = query.filter(
            (Medication.name.ilike(f"%{search}%")) |
            (Medication.generic_name.ilike(f"%{search}%")) |
            (Medication.manufacturer.ilike(f"%{search}%"))
        )

    if rack_id:
        query = query.filter(Medication.rack_id == rack_id)

    medications = query.all()
    result = []
    now = datetime.utcnow()
    thirty_days = datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)

    for med in medications:
        is_expired = med.expiry_date < now
        is_expiring_soon = not is_expired and med.expiry_date.timestamp() <= thirty_days

        if expired is not None and is_expired != expired:
            continue
        if expiring_soon is not None and is_expiring_soon != expiring_soon:
            continue

        med_response = MedicationResponse(
            id=med.id,
            name=med.name,
            generic_name=med.generic_name,
            quantity=med.quantity,
            unit=med.unit,
            expiry_date=med.expiry_date,
            rack_id=med.rack_id,
            rack_name=med.rack.name if med.rack else None,
            shelf_number=med.shelf_number,
            price=med.price,
            manufacturer=med.manufacturer,
            created_at=med.created_at,
            updated_at=med.updated_at,
            is_expired=is_expired,
            is_expiring_soon=is_expiring_soon
        )
        result.append(med_response)

    return result


@router.get("/{med_id}", response_model=MedicationResponse)
def get_medication(med_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medication).filter(Medication.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    now = datetime.utcnow()
    thirty_days = datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)
    is_expired = med.expiry_date < now
    is_expiring_soon = not is_expired and med.expiry_date.timestamp() <= thirty_days

    return MedicationResponse(
        id=med.id,
        name=med.name,
        generic_name=med.generic_name,
        quantity=med.quantity,
        unit=med.unit,
        expiry_date=med.expiry_date,
        rack_id=med.rack_id,
        rack_name=med.rack.name if med.rack else None,
        shelf_number=med.shelf_number,
        price=med.price,
        manufacturer=med.manufacturer,
        created_at=med.created_at,
        updated_at=med.updated_at,
        is_expired=is_expired,
        is_expiring_soon=is_expiring_soon
    )


@router.post("/", response_model=MedicationResponse)
def create_medication(med: MedicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if med.rack_id:
        rack = db.query(Rack).filter(Rack.id == med.rack_id).first()
        if not rack:
            raise HTTPException(status_code=404, detail="Rack not found")

    db_med = Medication(**med.model_dump())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)

    now = datetime.utcnow()
    thirty_days = datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)
    is_expired = db_med.expiry_date < now
    is_expiring_soon = not is_expired and db_med.expiry_date.timestamp() <= thirty_days

    return MedicationResponse(
        id=db_med.id,
        name=db_med.name,
        generic_name=db_med.generic_name,
        quantity=db_med.quantity,
        unit=db_med.unit,
        expiry_date=db_med.expiry_date,
        rack_id=db_med.rack_id,
        rack_name=db_med.rack.name if db_med.rack else None,
        shelf_number=db_med.shelf_number,
        price=db_med.price,
        manufacturer=db_med.manufacturer,
        created_at=db_med.created_at,
        updated_at=db_med.updated_at,
        is_expired=is_expired,
        is_expiring_soon=is_expiring_soon
    )


@router.put("/{med_id}", response_model=MedicationResponse)
def update_medication(med_id: int, med: MedicationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_med = db.query(Medication).filter(Medication.id == med_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    update_data = med.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_med, key, value)

    db.commit()
    db.refresh(db_med)

    now = datetime.utcnow()
    thirty_days = datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)
    is_expired = db_med.expiry_date < now
    is_expiring_soon = not is_expired and db_med.expiry_date.timestamp() <= thirty_days

    return MedicationResponse(
        id=db_med.id,
        name=db_med.name,
        generic_name=db_med.generic_name,
        quantity=db_med.quantity,
        unit=db_med.unit,
        expiry_date=db_med.expiry_date,
        rack_id=db_med.rack_id,
        rack_name=db_med.rack.name if db_med.rack else None,
        shelf_number=db_med.shelf_number,
        price=db_med.price,
        manufacturer=db_med.manufacturer,
        created_at=db_med.created_at,
        updated_at=db_med.updated_at,
        is_expired=is_expired,
        is_expiring_soon=is_expiring_soon
    )


@router.delete("/{med_id}")
def delete_medication(med_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_med = db.query(Medication).filter(Medication.id == med_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    db.delete(db_med)
    db.commit()
    return {"message": "Medication deleted successfully"}


@router.get("/alerts/expiring", response_model=List[MedicationResponse])
def get_expiring_medications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medications = db.query(Medication).all()
    result = []
    now = datetime.utcnow()
    thirty_days = datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)

    for med in medications:
        is_expired = med.expiry_date < now
        is_expiring_soon = not is_expired and med.expiry_date.timestamp() <= thirty_days

        if is_expired or is_expiring_soon:
            result.append(MedicationResponse(
                id=med.id,
                name=med.name,
                generic_name=med.generic_name,
                quantity=med.quantity,
                unit=med.unit,
                expiry_date=med.expiry_date,
                rack_id=med.rack_id,
                rack_name=med.rack.name if med.rack else None,
                shelf_number=med.shelf_number,
                price=med.price,
                manufacturer=med.manufacturer,
                created_at=med.created_at,
                updated_at=med.updated_at,
                is_expired=is_expired,
                is_expiring_soon=is_expiring_soon
            ))

    return result
