import os
from contextlib import asynccontextmanager
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://invite:invite123@localhost:5432/tracking_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class OrderStatus(str, Enum):
    PLACED = "placed"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PROCESSING = "processing"
    PRINTING = "printing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), index=True, nullable=False)
    status = Column(String(30), nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CreateTrackingRequest(BaseModel):
    order_id: str
    status: str = OrderStatus.PLACED.value
    message: str
    location: str | None = None


class TrackingEventResponse(BaseModel):
    status: str
    message: str
    location: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderTrackingResponse(BaseModel):
    order_id: str
    current_status: str
    events: list[TrackingEventResponse]


STATUS_FLOW = [
    OrderStatus.PLACED,
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.PRINTING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Tracking Service", version="1.0.0", lifespan=lifespan)
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


@app.get("/health")
def health():
    return {"status": "healthy", "service": "tracking-service"}


@app.post("/tracking", status_code=201)
def create_tracking_event(payload: CreateTrackingRequest, db: Session = next(get_db())):
    event = TrackingEvent(
        order_id=payload.order_id,
        status=payload.status,
        message=payload.message,
        location=payload.location,
    )
    db.add(event)
    db.commit()
    return {"message": "Tracking event created", "order_id": payload.order_id, "status": payload.status}


@app.get("/tracking/{order_id}", response_model=OrderTrackingResponse)
def get_order_tracking(order_id: str, db: Session = next(get_db())):
    events = (
        db.query(TrackingEvent)
        .filter(TrackingEvent.order_id == order_id)
        .order_by(TrackingEvent.created_at.asc())
        .all()
    )
    if not events:
        raise HTTPException(status_code=404, detail="No tracking info found for this order")

    return OrderTrackingResponse(
        order_id=order_id,
        current_status=events[-1].status,
        events=events,
    )


@app.post("/tracking/{order_id}/advance")
def advance_order_status(order_id: str, db: Session = next(get_db())):
    events = (
        db.query(TrackingEvent)
        .filter(TrackingEvent.order_id == order_id)
        .order_by(TrackingEvent.created_at.desc())
        .all()
    )
    if not events:
        raise HTTPException(status_code=404, detail="Order not found")

    current = events[0].status
    try:
        idx = STATUS_FLOW.index(OrderStatus(current))
        if idx >= len(STATUS_FLOW) - 1:
            return {"message": "Order already delivered", "status": current}
        next_status = STATUS_FLOW[idx + 1]
    except ValueError:
        next_status = OrderStatus.PROCESSING

    messages = {
        OrderStatus.PAYMENT_CONFIRMED: "Payment confirmed, order queued for processing",
        OrderStatus.PROCESSING: "Order is being prepared",
        OrderStatus.PRINTING: "Invitation cards are being printed",
        OrderStatus.SHIPPED: "Package shipped from fulfillment center",
        OrderStatus.OUT_FOR_DELIVERY: "Package is out for delivery",
        OrderStatus.DELIVERED: "Package delivered successfully",
    }

    event = TrackingEvent(
        order_id=order_id,
        status=next_status.value,
        message=messages.get(next_status, f"Status updated to {next_status.value}"),
        location="Fulfillment Center",
    )
    db.add(event)
    db.commit()
    return {"message": "Status advanced", "status": next_status.value}
