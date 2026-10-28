"""
Seed script - populates the database with dummy data.

Usage (from backend/ folder):
    python seed.py          # with dummy data (skips if data exists)
    python seed.py --force  # wipes and reseeds everything
"""

import sys
from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
from models import User, Rack, Medication, Bill, BillItem
from auth import get_password_hash

TAX_RATE = 0.0

RACKS = [
    {"name": "Rack-A1", "zone": "Zone 1 - General", "shelf_count": 5, "location": "Building A, Floor 1"},
    {"name": "Rack-A2", "zone": "Zone 1 - General", "shelf_count": 4, "location": "Building A, Floor 1"},
    {"name": "Rack-B1", "zone": "Zone 2 - Antibiotics", "shelf_count": 6, "location": "Building A, Floor 2"},
    {"name": "Rack-C1", "zone": "Zone 3 - Cold Storage", "shelf_count": 3, "location": "Building B, Floor 1"},
    {"name": "Rack-D1", "zone": "Zone 4 - Pediatric", "shelf_count": 4, "location": "Building B, Floor 2"},
]

MEDICATIONS = [
    {"name": "Paracetamol 500mg", "generic_name": "Acetaminophen", "quantity": 200, "unit": "tablets", "expiry_days": 400, "rack": 0, "shelf_number": 1, "price": 15.50, "manufacturer": "Cipla"},
    {"name": "Amoxicillin 250mg", "generic_name": "Amoxicillin", "quantity": 120, "unit": "capsules", "expiry_days": 300, "rack": 2, "shelf_number": 1, "price": 85.00, "manufacturer": "Sun Pharma"},
    {"name": "Aspirin 75mg", "generic_name": "Acetylsalicylic Acid", "quantity": 300, "unit": "tablets", "expiry_days": 500, "rack": 0, "shelf_number": 2, "price": 12.00, "manufacturer": "GSK"},
    {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "quantity": 150, "unit": "tablets", "expiry_days": 350, "rack": 1, "shelf_number": 1, "price": 28.00, "manufacturer": "Zydus"},
    {"name": "Cetirizine 10mg", "generic_name": "Cetirizine HCl", "quantity": 180, "unit": "tablets", "expiry_days": 450, "rack": 1, "shelf_number": 2, "price": 22.50, "manufacturer": "Dr Reddy's"},
    {"name": "Metformin 500mg", "generic_name": "Metformin HCl", "quantity": 90, "unit": "tablets", "expiry_days": 200, "rack": 2, "shelf_number": 3, "price": 35.00, "manufacturer": "USV"},
    {"name": "Insulin Glargine", "generic_name": "Insulin", "quantity": 40, "unit": "vials", "expiry_days": 25, "rack": 3, "shelf_number": 1, "price": 650.00, "manufacturer": "Sanofi"},
    {"name": "Azithromycin 500mg", "generic_name": "Azithromycin", "quantity": 60, "unit": "tablets", "expiry_days": -15, "rack": 2, "shelf_number": 2, "price": 120.00, "manufacturer": "Pfizer"},
    {"name": "Omeprazole 20mg", "generic_name": "Omeprazole", "quantity": 110, "unit": "capsules", "expiry_days": 280, "rack": 1, "shelf_number": 3, "price": 45.00, "manufacturer": "AstraZeneca"},
    {"name": "Salbutamol Inhaler", "generic_name": "Albuterol", "quantity": 5, "unit": "inhalers", "expiry_days": 320, "rack": 3, "shelf_number": 2, "price": 180.00, "manufacturer": "Cipla"},
    {"name": "Amoxiclav 625mg", "generic_name": "Amoxicillin-Clavulanate", "quantity": 75, "unit": "tablets", "expiry_days": 10, "rack": 2, "shelf_number": 4, "price": 150.00, "manufacturer": "Glaxo"},
    {"name": "Vitamin D3 60k IU", "generic_name": "Cholecalciferol", "quantity": 140, "unit": "capsules", "expiry_days": 600, "rack": 4, "shelf_number": 1, "price": 55.00, "manufacturer": "Abbott"},
]

# (rack_index, med_name_index, quantity, payment_method, discount)
SAMPLE_BILLS = [
    (0, 0, 4, "cash", 0),
    (2, 1, 10, "card", 0),
    (1, 3, 6, "cash", 10.0),
    (2, 7, 5, "insurance", 0),
    (3, 6, 2, "cash", 0),
    (0, 5, 5, "card", 5.0),
]


def generate_bill_number(db, seq):
    return f"BIL-{datetime.utcnow().strftime('%Y%m%d')}-{seq:04d}"


def seed(force=False):
    # Destructive reseed
    if force:
        Base.metadata.drop_all(bind=engine)
        print("[1/5] Dropped all tables")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if data already exists
        if db.query(Rack).count() > 0 or db.query(Medication).count() > 0:
            print("Database already has data. Use --force to wipe and reseed.")
            return

        print("[1/5] Creating admin user...")
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(username="admin", password_hash=get_password_hash("admin123"), role="admin")
            db.add(admin)
            db.flush()

        print("[2/5] Creating racks...")
        rack_map = {}
        for rack_data in RACKS:
            rack = Rack(**rack_data)
            db.add(rack)
            db.flush()
            rack_map[rack.name] = rack
            print(f"     + {rack.name} ({rack.zone})")

        print("[3/5] Creating medications...")
        med_map = {}
        for m in MEDICATIONS:
            entry = {k: v for k, v in m.items() if k not in ("expiry_days", "rack")}
            entry["expiry_date"] = datetime.utcnow() + timedelta(days=m["expiry_days"])
            rack = rack_map[RACKS[m["rack"]]["name"]]
            med = Medication(rack_id=rack.id, **entry)
            db.add(med)
            db.flush()
            med_map[m["name"]] = med
            print(f"     + {m['name']} | qty={m['quantity']} | expiry in {m['expiry_days']}d | Rs.{m['price']}")

        print("[4/5] Creating sample bills...")
        meds_list = list(med_map.values())
        seq = 1
        for rack_idx, med_idx, qty, method, discount in SAMPLE_BILLS:
            med = meds_list[med_idx]
            if med.quantity < qty:
                continue
            line_total = round(med.price * qty, 2)
            subtotal = line_total
            disc = min(discount, subtotal)
            tax = round((subtotal - disc) * TAX_RATE, 2)
            total = round(subtotal - disc + tax, 2)

            bill = Bill(
                bill_number=generate_bill_number(db, seq),
                customer_name=f"Customer {seq}",
                customer_phone=f"98765{seq:05d}",
                payment_method=method,
                subtotal=subtotal,
                discount=disc,
                tax=tax,
                total=total,
                status="completed",
                created_by=admin.id,
                created_at=datetime.utcnow() - timedelta(hours=seq * 3),
            )
            bill.items = [BillItem(
                medication_id=med.id,
                medication_name=med.name,
                quantity=qty,
                unit_price=med.price,
                line_total=line_total,
            )]
            med.quantity -= qty
            db.add(bill)
            seq += 1
            print(f"     + {bill.bill_number} | {med.name} x{qty} | total Rs.{total:.2f}")

        db.commit()
        print("[5/5] Done!")
        print("\nSeeded summary:")
        print(f"  Users      : {db.query(User).count()}")
        print(f"  Racks      : {db.query(Rack).count()}")
        print(f"  Medications: {db.query(Medication).count()}")
        print(f"  Bills      : {db.query(Bill).count()}")
        print("\nLogin with ->  admin / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    seed(force=force)