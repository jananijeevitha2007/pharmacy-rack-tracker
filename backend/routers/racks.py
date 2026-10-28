from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Rack, Medication, User
from schemas import RackCreate, RackUpdate, RackResponse
from auth import get_current_user

router = APIRouter(prefix="/api/racks", tags=["racks"])


@router.get("/", response_model=List[RackResponse])
def get_racks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    racks = db.query(Rack).all()
    result = []
    for rack in racks:
        med_count = db.query(Medication).filter(Medication.rack_id == rack.id).count()
        result.append(RackResponse(
            id=rack.id,
            name=rack.name,
            zone=rack.zone,
            shelf_count=rack.shelf_count,
            location=rack.location,
            created_at=rack.created_at,
            medication_count=med_count
        ))
    return result


@router.get("/{rack_id}", response_model=RackResponse)
def get_rack(rack_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rack = db.query(Rack).filter(Rack.id == rack_id).first()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    med_count = db.query(Medication).filter(Medication.rack_id == rack.id).count()
    return RackResponse(
        id=rack.id,
        name=rack.name,
        zone=rack.zone,
        shelf_count=rack.shelf_count,
        location=rack.location,
        created_at=rack.created_at,
        medication_count=med_count
    )


@router.post("/", response_model=RackResponse)
def create_rack(rack: RackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Rack).filter(Rack.name == rack.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rack name already exists")

    db_rack = Rack(**rack.model_dump())
    db.add(db_rack)
    db.commit()
    db.refresh(db_rack)

    return RackResponse(
        id=db_rack.id,
        name=db_rack.name,
        zone=db_rack.zone,
        shelf_count=db_rack.shelf_count,
        location=db_rack.location,
        created_at=db_rack.created_at,
        medication_count=0
    )


@router.put("/{rack_id}", response_model=RackResponse)
def update_rack(rack_id: int, rack: RackUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_rack = db.query(Rack).filter(Rack.id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    update_data = rack.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rack, key, value)

    db.commit()
    db.refresh(db_rack)

    med_count = db.query(Medication).filter(Medication.rack_id == db_rack.id).count()
    return RackResponse(
        id=db_rack.id,
        name=db_rack.name,
        zone=db_rack.zone,
        shelf_count=db_rack.shelf_count,
        location=db_rack.location,
        created_at=db_rack.created_at,
        medication_count=med_count
    )


@router.delete("/{rack_id}")
def delete_rack(rack_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_rack = db.query(Rack).filter(Rack.id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    db.query(Medication).filter(Medication.rack_id == rack_id).update({"rack_id": None})
    db.delete(db_rack)
    db.commit()
    return {"message": "Rack deleted successfully"}
