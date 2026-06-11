import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://invite:invite123@localhost:5432/payment_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(String(50), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    method = Column(String(50), nullable=False)
    status = Column(String(20), default=PaymentStatus.PENDING.value)
    transaction_ref = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentRequest(BaseModel):
    order_id: str
    amount: float = Field(gt=0)
    method: str = Field(pattern="^(card|upi|netbanking|wallet)$")
    card_number: str | None = None
    card_holder: str | None = None


class PaymentResponse(BaseModel):
    payment_id: str
    order_id: str
    amount: float
    currency: str
    method: str
    status: str
    transaction_ref: str | None
    message: str

    model_config = {"from_attributes": True}


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Payment Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def simulate_payment(method: str, amount: float, card_number: str | None) -> tuple[str, str]:
    if method == "card" and card_number:
        if card_number.endswith("0000"):
            return PaymentStatus.FAILED.value, "Card declined by bank"
        return PaymentStatus.COMPLETED.value, f"Charged ${amount:.2f} to card ending {card_number[-4:]}"

    return PaymentStatus.COMPLETED.value, f"Payment of ${amount:.2f} via {method} successful"


@app.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service"}


@app.post("/payments", response_model=PaymentResponse, status_code=201)
def process_payment(payload: PaymentRequest, db: Session = next(get_db())):
    payment_id = f"PAY-{uuid.uuid4().hex[:12].upper()}"
    status, message = simulate_payment(payload.method, payload.amount, payload.card_number)
    transaction_ref = f"TXN-{uuid.uuid4().hex[:16].upper()}" if status == PaymentStatus.COMPLETED.value else None

    payment = Payment(
        payment_id=payment_id,
        order_id=payload.order_id,
        amount=payload.amount,
        method=payload.method,
        status=status,
        transaction_ref=transaction_ref,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return PaymentResponse(
        payment_id=payment.payment_id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        method=payment.method,
        status=payment.status,
        transaction_ref=payment.transaction_ref,
        message=message,
    )


@app.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: str, db: Session = next(get_db())):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentResponse(
        payment_id=payment.payment_id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        method=payment.method,
        status=payment.status,
        transaction_ref=payment.transaction_ref,
        message=f"Payment status: {payment.status}",
    )


@app.get("/payments/order/{order_id}", response_model=PaymentResponse)
def get_payment_by_order(order_id: str, db: Session = next(get_db())):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found for order")
    return PaymentResponse(
        payment_id=payment.payment_id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        method=payment.method,
        status=payment.status,
        transaction_ref=payment.transaction_ref,
        message=f"Payment status: {payment.status}",
    )
