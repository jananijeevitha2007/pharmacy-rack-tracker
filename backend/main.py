from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import User
from auth import get_password_hash
from routers import auth_routes, medications, racks, dashboard, billing

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pharmacy Rack Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(medications.router)
app.include_router(racks.router)
app.include_router(dashboard.router)
app.include_router(billing.router)


@app.on_event("startup")
def create_default_admin():
    from database import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Pharmacy Rack Tracker API"}
