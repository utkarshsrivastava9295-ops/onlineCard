import os
from contextlib import asynccontextmanager
from datetime import datetime

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://invite:invite123@localhost:5432/cart_db"
)
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8001")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    card_id = Column(Integer, nullable=False)
    card_name = Column(String(200), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    image_url = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AddToCartRequest(BaseModel):
    session_id: str
    card_id: int
    quantity: int = Field(default=1, ge=1, le=100)


class UpdateCartRequest(BaseModel):
    quantity: int = Field(ge=1, le=100)


class CartItemResponse(BaseModel):
    id: int
    card_id: int
    card_name: str
    unit_price: float
    quantity: int
    image_url: str | None
    line_total: float

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    session_id: str
    items: list[CartItemResponse]
    subtotal: float
    item_count: int


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Cart Service", version="1.0.0", lifespan=lifespan)
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


async def fetch_card_info(card_id: int) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CATALOG_SERVICE_URL}/cards/{card_id}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Card not found in catalog")
        response.raise_for_status()
        return response.json()


def build_cart_response(session_id: str, items: list[CartItem]) -> CartResponse:
    cart_items = []
    subtotal = 0.0
    for item in items:
        line_total = item.unit_price * item.quantity
        subtotal += line_total
        cart_items.append(
            CartItemResponse(
                id=item.id,
                card_id=item.card_id,
                card_name=item.card_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                image_url=item.image_url,
                line_total=round(line_total, 2),
            )
        )
    return CartResponse(
        session_id=session_id,
        items=cart_items,
        subtotal=round(subtotal, 2),
        item_count=sum(i.quantity for i in items),
    )


@app.get("/health")
def health():
    return {"status": "healthy", "service": "cart-service"}


@app.get("/cart/{session_id}", response_model=CartResponse)
def get_cart(session_id: str, db: Session = next(get_db())):
    items = db.query(CartItem).filter(CartItem.session_id == session_id).all()
    return build_cart_response(session_id, items)


@app.post("/cart/add", response_model=CartResponse)
async def add_to_cart(payload: AddToCartRequest, db: Session = next(get_db())):
    card = await fetch_card_info(payload.card_id)

    existing = (
        db.query(CartItem)
        .filter(
            CartItem.session_id == payload.session_id,
            CartItem.card_id == payload.card_id,
        )
        .first()
    )

    if existing:
        existing.quantity += payload.quantity
        existing.unit_price = card["price"]
        existing.card_name = card["name"]
        existing.image_url = card["image_url"]
    else:
        db.add(
            CartItem(
                session_id=payload.session_id,
                card_id=payload.card_id,
                card_name=card["name"],
                unit_price=card["price"],
                quantity=payload.quantity,
                image_url=card["image_url"],
            )
        )

    db.commit()
    items = db.query(CartItem).filter(CartItem.session_id == payload.session_id).all()
    return build_cart_response(payload.session_id, items)


@app.put("/cart/{session_id}/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    session_id: str, item_id: int, payload: UpdateCartRequest, db: Session = next(get_db())
):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.session_id == session_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = payload.quantity
    db.commit()

    items = db.query(CartItem).filter(CartItem.session_id == session_id).all()
    return build_cart_response(session_id, items)


@app.delete("/cart/{session_id}/items/{item_id}", response_model=CartResponse)
def remove_cart_item(session_id: str, item_id: int, db: Session = next(get_db())):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.session_id == session_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()

    items = db.query(CartItem).filter(CartItem.session_id == session_id).all()
    return build_cart_response(session_id, items)


@app.delete("/cart/{session_id}")
def clear_cart(session_id: str, db: Session = next(get_db())):
    db.query(CartItem).filter(CartItem.session_id == session_id).delete()
    db.commit()
    return {"message": "Cart cleared", "session_id": session_id}
