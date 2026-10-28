# 💊 Pharmacy Rack Tracker

A full-stack **Pharmacy Rack Management System** with inventory, rack management, expiry alerts, and a billing (point-of-sale) system.

Built with **React + FastAPI (Python) + SQLite** — ideal as a college final-year / mini project.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Features](#-features)
4. [System Requirements](#-system-requirements)
5. [Step-by-Step Setup](#-step-by-step-setup)
6. [How to Run the Project](#-how-to-run-the-project)
7. [Default Login Credentials](#-default-login-credentials)
8. [Sample Data & Testing (Postman)](#-sample-data--testing-postman)
9. [Project Structure](#-project-structure)
10. [Feature-to-Code Mapping](#-feature-to-code-mapping)
11. [API Reference](#-api-reference)
12. [Common Errors & Troubleshooting](#-common-errors--troubleshooting)

---

## 📖 Project Overview

This system helps a pharmacy track its medications across physical racks, monitor expiry dates, and generate customer bills. The admin can:

- Log in securely (JWT authentication)
- View a dashboard of inventory & revenue stats
- Add / edit / delete medications and racks
- Search and filter medications
- Get alerts for expired / expiring medications
- Create customer bills (POS) which automatically deduct stock
- View, print, and void bills

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, React Router, Axios, Lucide Icons |
| Backend     | Python, FastAPI, SQLAlchemy        |
| Database    | SQLite (file: `pharmacy.db`)        |
| Auth        | JWT (python-jose) + bcrypt          |
| Styling     | Custom CSS                          |

---

## ✨ Features

1. **Admin Login** — JWT-based secure authentication
2. **Dashboard** — total meds, racks, revenue, bills, expiry alerts, low stock
3. **Medication Inventory** — full CRUD (name, generic, qty, unit, expiry, rack, shelf, price, manufacturer)
4. **Rack Management** — CRUD for racks with zones, shelf count, location
5. **Search & Filter** — by name, generic, manufacturer, or rack
6. **Expiry Alerts** — auto-flag expired & expiring (<30 days) medications
7. **Billing / POS** — create bills, customer info, payment method, discounts; auto-deducts stock
8. **Bill History** — view/print/void past bills; void restores stock

---

## ⚙️ System Requirements

| Software          | Minimum Version | Download                                      |
|-------------------|-----------------|-----------------------------------------------|
| Python            | 3.10+           | https://www.python.org/downloads/             |
| Node.js           | 18+             | https://nodejs.org/                           |
| npm               | 9+              | (comes with Node.js)                          |
| A browser         | Chrome/Edge     | —                                             |

> **Important (Windows):** During Python installation, **tick the checkbox "Add Python to PATH"**.

Verify installations before continuing:
```bash
python --version
node --version
npm --version
```

---

## 📥 Step-by-Step Setup

### Step 1: Download / Get the Project
Open a terminal in the folder where you want the project.

### Step 2: Install Backend Dependencies
Navigate to the backend folder and install Python packages:

```bash
cd pharmacy-rack-tracker/backend
python -m pip install -r requirements.txt
```

This installs: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose`, `bcrypt`, and more.

### Step 3: Install Frontend Dependencies
Open a **second terminal** and install Node packages:

```bash
cd pharmacy-rack-tracker/frontend
npm install
```

### Step 4: (Optional) Set Up a Python Virtual Environment
For a cleaner setup (recommended for college projects):

```bash
cd pharmacy-rack-tracker/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

python -m pip install -r requirements.txt
```

---

## 🚀 How to Run the Project

You need **two terminals open at the same time**.

### Terminal 1 — Start the Backend
```bash
cd pharmacy-rack-tracker/backend
python -m uvicorn main:app --reload --port 8000
```
You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 — Start the Frontend
```bash
cd pharmacy-rack-tracker/frontend
npm run dev
```
You should see:
```
Local: http://localhost:5173/
```

### Open the App
Visit **http://localhost:5173** in your browser.

> The first time the backend starts, it automatically creates the SQLite database (`pharmacy.db`) and a default admin account.

---

## 🔑 Default Login Credentials

| Username | Password  |
|----------|-----------|
| `admin`  | `admin123`|

> ⚠️ Change the password for real deployments.

---

## 🧪 Sample Data & Testing (Postman)

### Create a Rack
**POST** `http://localhost:8000/api/racks/`
```json
{
  "name": "Rack-A1",
  "zone": "Zone 1",
  "shelf_count": 5,
  "location": "Building A, Floor 2"
}
```

### Create a Medication
**POST** `http://localhost:8000/api/medications/`
```json
{
  "name": "Paracetamol 500mg",
  "generic_name": "Acetaminophen",
  "quantity": 200,
  "unit": "tablets",
  "expiry_date": "2026-12-31T00:00:00",
  "rack_id": 1,
  "shelf_number": 2,
  "price": 15.50,
  "manufacturer": "Cipla"
}
```

### Login (get token)
**POST** `http://localhost:8000/api/auth/login`
```json
{ "username": "admin", "password": "admin123" }
```
Response gives an `access_token`. Put it in **Authorization → Bearer Token** for all other requests.

### Create a Bill (deducts stock)
**POST** `http://localhost:8000/api/bills/`
```json
{
  "customer_name": "Rahul",
  "customer_phone": "9876543210",
  "payment_method": "cash",
  "discount": 5.0,
  "items": [
    { "medication_id": 1, "quantity": 2 }
  ]
}
```

### Full API Testing Quickly (curl)
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get dashboard stats (use your token)
curl http://localhost:8000/api/dashboard/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Interactive API Docs (built into FastAPI)
Just open **http://localhost:8000/docs** — you can test every endpoint from the browser without Postman.

---

## 📂 Project Structure

```
pharmacy-rack-tracker/
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # App entrypoint, CORS, route registration
│   ├── database.py               # SQLite connection + session
│   ├── models.py                 # SQLAlchemy models (User, Rack, Medication, Bill, BillItem)
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── auth.py                   # JWT token generation & verification
│   ├── requirements.txt          # Python dependencies
│   ├── pharmacy.db               # SQLite database (auto-created)
│   └── routers/
│       ├── auth_routes.py        # Login / register
│       ├── medications.py        # Medication CRUD, search, alerts
│       ├── racks.py              # Rack CRUD
│       ├── dashboard.py          # Dashboard statistics
│       └── billing.py            # Bill create/list/void
│
└── frontend/                     # React frontend
    ├── package.json              # Node dependencies & scripts
    ├── vite.config.js            # Dev server + API proxy config
    ├── index.html
    └── src/
        ├── main.jsx              # React entry
        ├── App.jsx               # Router + sidebar layout
        ├── index.css             # All styling
        ├── services/
        │   └── api.js            # Axios API service layer
        └── pages/
            ├── Login.jsx         # Admin login page
            ├── Dashboard.jsx     # Stats overview
            ├── Medications.jsx   # Inventory management
            ├── Racks.jsx         # Rack management
            ├── Alerts.jsx        # Expiry alerts
            └── Billing.jsx       # Point-of-sale billing
```

---

## 🧩 Feature-to-Code Mapping

| Feature               | Backend File(s)                          | Frontend File(s)          |
|-----------------------|------------------------------------------|---------------------------|
| Admin Login / Auth    | `backend/routers/auth_routes.py`, `auth.py` | `frontend/src/pages/Login.jsx` |
| Dashboard stats       | `backend/routers/dashboard.py`           | `frontend/src/pages/Dashboard.jsx` |
| Medication CRUD       | `backend/routers/medications.py`         | `frontend/src/pages/Medications.jsx` |
| Search & Filter       | `backend/routers/medications.py` (GET query params) | `frontend/src/pages/Medications.jsx` |
| Rack CRUD             | `backend/routers/racks.py`               | `frontend/src/pages/Racks.jsx` |
| Expiry Alerts         | `backend/routers/medications.py` (`/alerts/expiring`) | `frontend/src/pages/Alerts.jsx` |
| Billing / POS         | `backend/routers/billing.py`             | `frontend/src/pages/Billing.jsx` |
| Stock auto-deduction  | `backend/routers/billing.py` (create_bill) | — |
| Bill void / restore   | `backend/routers/billing.py` (`/void`)    | `frontend/src/pages/Billing.jsx` |
| Database models       | `backend/models.py`                       | — |
| API service layer     | —                                        | `frontend/src/services/api.js` |

---

## 📡 API Reference

All endpoints require a Bearer token except `/api/auth/login` and the root `/`.

| Method | Endpoint                    | Description                             |
|--------|-----------------------------|-----------------------------------------|
| POST   | `/api/auth/login`           | Login, returns JWT token                |
| POST   | `/api/auth/register`        | Create a new user                       |
| GET    | `/api/auth/me`              | Get current user                        |
| GET    | `/api/dashboard/`           | Dashboard statistics                    |
| GET    | `/api/medications/`         | List meds (search, filter by rack/status)|
| GET    | `/api/medications/alerts/expiring` | List expiring/expired meds       |
| POST   | `/api/medications/`         | Create medication                       |
| GET    | `/api/medications/{id}`     | Get one medication                      |
| PUT    | `/api/medications/{id}`     | Update medication                       |
| DELETE | `/api/medications/{id}`     | Delete medication                       |
| GET    | `/api/racks/`               | List racks                              |
| POST   | `/api/racks/`               | Create rack                             |
| PUT    | `/api/racks/{id}`           | Update rack                             |
| DELETE | `/api/racks/{id}`           | Delete rack                             |
| GET    | `/api/bills/`               | List all bills                          |
| GET    | `/api/bills/{id}`           | Get one bill (with items)               |
| POST   | `/api/bills/`               | Create bill (deducts stock)             |
| POST   | `/api/bills/{id}/void`      | Void bill (restores stock)              |

Full interactive docs at: **http://localhost:8000/docs**

---

## 🛑 Common Errors & Troubleshooting

### 1. `pip` not recognized / Python not found
- Python is not on PATH. Reinstall Python and **tick "Add Python to PATH"**.
- Or use `python -m pip install ...` instead of `pip install ...`.

### 2. `pydantic-core` build error on Python 3.14
If you see a Rust/Cargo build error while installing, your `requirements.txt` pins old versions with no prebuilt wheels.
**Fix:** Use the updated `requirements.txt` (already provided) which uses un-pinned latest versions that ship prebuilt wheels. Then reinstall:
```bash
python -m pip install -r requirements.txt
```

### 3. Port 8000 already in use
```bash
# Find the process using the port and kill it (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```
Or change the backend port:
```bash
python -m uvicorn main:app --reload --port 8001
```

### 4. Frontend can't reach backend
The app uses a Vite dev proxy. Ensure:
- The backend is running on port **8000**.
- Open the app at **http://localhost:5173** (not a file path).

### 5. `CORS` errors in browser
We've already configured CORS to allow `http://localhost:5173`. If you change ports, update `allow_origins` in `backend/main.py`.

### 6. Login returns "Incorrect username or password"
Use the default credentials `admin` / `admin123`. If you deleted the database, delete `pharmacy.db` and restart the backend (the admin is auto-created).

---

## 🎓 Presentation Tips (Viva Q&A)

- **How does auth work?** Admin logs in → backend verifies password with bcrypt → issues a JWT token → the React app sends this token in the `Authorization` header for every API call.
- **How does billing reduce stock?** In `billing.py`, when a bill is created, it checks available quantity, then subtracts the sold quantity from the medication row.
- **How does voiding work?** The bill's status changes to "voided" and the sold quantity is added back to stock.
- **How are expiry alerts computed?** The backend compares each medication's `expiry_date` against the current date and flags items expiring within 30 days.
- **Why SQLite?** No separate database server needed — it's a single file, perfect for a demo/mini project.

---

_Project created for the Pharmacy Rack Tracker full-stack application._ 🚀
