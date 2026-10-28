from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Medication, Rack, User, Bill
from schemas import DashboardStats
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    thirty_days_later = now + timedelta(days=30)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_medications = db.query(Medication).count()
    total_racks = db.query(Rack).count()
    total_quantity = db.query(func.sum(Medication.quantity)).scalar() or 0
    zones = db.query(func.count(func.distinct(Rack.zone))).scalar() or 0

    expired = db.query(Medication).filter(Medication.expiry_date < now).count()
    expiring_soon = db.query(Medication).filter(
        Medication.expiry_date >= now,
        Medication.expiry_date <= thirty_days_later
    ).count()
    low_stock = db.query(Medication).filter(Medication.quantity < 10).count()

    total_revenue = db.query(func.sum(Bill.total)).filter(Bill.status == "completed").scalar() or 0
    total_bills = db.query(Bill).filter(Bill.status == "completed").count()
    today_revenue = db.query(func.sum(Bill.total)).filter(
        Bill.status == "completed",
        Bill.created_at >= start_of_day
    ).scalar() or 0
    today_bills = db.query(Bill).filter(
        Bill.status == "completed",
        Bill.created_at >= start_of_day
    ).count()

    return DashboardStats(
        total_medications=total_medications,
        total_racks=total_racks,
        total_quantity=total_quantity,
        expiring_soon=expiring_soon,
        expired=expired,
        low_stock=low_stock,
        zones=zones,
        total_revenue=total_revenue,
        total_bills=total_bills,
        today_revenue=today_revenue,
        today_bills=today_bills
    )
