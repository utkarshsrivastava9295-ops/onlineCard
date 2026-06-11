# InviteShop — Invitation Card Shopping Platform

A microservices-based online invitation card shop built with **FastAPI** (backend) and **React + Vite + Tailwind** (frontend).

## Features

| Feature | Service |
|---------|---------|
| Browse cards with prices | Catalog Service |
| Add to cart with quantity | Cart Service |
| Single & multiple delivery addresses | Order Service |
| Bulk address upload via Excel | Order Service |
| Address validation | Address Service |
| Payment processing | Payment Service |
| Order status tracking | Tracking Service |
| Unified API | API Gateway |

## Architecture

```
┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│  API Gateway │ :8000
│   (React)   │     └──────┬───────┘
└─────────────┘            │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │   Catalog   │  │    Cart     │  │    Order    │
  │    :8001    │  │    :8002    │  │    :8003    │
  └─────────────┘  └─────────────┘  └──────┬──────┘
         ┌─────────────────┬───────────────┤
         ▼                 ▼               ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │   Address   │  │   Payment   │  │  Tracking   │
  │    :8004    │  │    :8005    │  │    :8006    │
  └─────────────┘  └─────────────┘  └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    └─────────────┘
```

## Quick Start (Docker)

```bash
# Start all services
docker compose up --build

# Open the app
# Frontend:  http://localhost:3000
# API Docs:  http://localhost:8000/docs (gateway)
```

## Local Development (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16

### 1. Database setup

```bash
# Create databases (run in psql)
psql -U postgres -f infra/init-db.sql
```

Update connection strings if needed. Default: `postgresql://invite:invite123@localhost:5432/<db_name>`

### 2. Start backend services

In separate terminals:

```bash
cd services/catalog-service && pip install -r requirements.txt && uvicorn main:app --port 8001 --reload
cd services/cart-service    && pip install -r requirements.txt && uvicorn main:app --port 8002 --reload
cd services/address-service && pip install -r requirements.txt && uvicorn main:app --port 8004 --reload
cd services/payment-service && pip install -r requirements.txt && uvicorn main:app --port 8005 --reload
cd services/tracking-service && pip install -r requirements.txt && uvicorn main:app --port 8006 --reload
cd services/order-service   && pip install -r requirements.txt && uvicorn main:app --port 8003 --reload
cd services/api-gateway     && pip install -r requirements.txt && uvicorn main:app --port 8000 --reload
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Excel Bulk Upload

Generate a sample Excel file:

```bash
pip install openpyxl
python scripts/generate_sample_excel.py
```

Required columns: `name`, `street`, `city`, `state`, `postal_code`, `country` (optional: `phone`)

## API Endpoints (via Gateway)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards` | List invitation cards |
| POST | `/api/cart/add` | Add item to cart |
| GET | `/api/cart/{session_id}` | Get cart |
| POST | `/api/orders/validate-addresses` | Validate addresses |
| POST | `/api/orders/parse-excel` | Upload & validate Excel |
| POST | `/api/orders/checkout` | Place order + payment |
| GET | `/api/tracking/{order_id}` | Track order status |

## Payment Testing

- Any card number works except those ending in `0000` (simulates decline)
- Methods: `card`, `upi`, `netbanking`, `wallet`

## Address Validation

The address service validates:
- Postal code format (5–6 digits)
- Known cities database
- Street length
- Phone format
- Country serviceability

Returns a confidence score; addresses scoring below 70% are rejected at checkout.

## Project Structure

```
├── docker-compose.yml
├── frontend/                 # React + Vite + Tailwind
├── infra/                    # DB init scripts
├── scripts/                  # Utility scripts
└── services/
    ├── api-gateway/
    ├── catalog-service/
    ├── cart-service/
    ├── order-service/
    ├── address-service/
    ├── payment-service/
    └── tracking-service/
```
