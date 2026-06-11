import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://invite:invite123@localhost:5432/catalog_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class InvitationCard(Base):
    __tablename__ = "invitation_cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)
    stock = Column(Integer, default=100)


class CardResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int

    model_config = {"from_attributes": True}


class CardCreate(BaseModel):
    name: str
    description: str
    price: float = Field(gt=0)
    image_url: str
    category: str
    stock: int = Field(default=100, ge=0)


SEED_CARDS = [
    {
        "name": "Elegant Wedding Invite",
        "description": "Premium gold-foil wedding invitation with floral border.",
        "price": 12.99,
        "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
        "category": "Wedding",
        "stock": 200,
    },
    {
        "name": "Birthday Bash Card",
        "description": "Colorful birthday party invitation with balloon design.",
        "price": 8.49,
        "image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400",
        "category": "Birthday",
        "stock": 150,
    },
    {
        "name": "Corporate Gala",
        "description": "Minimalist black-and-white corporate event invitation.",
        "price": 15.99,
        "image_url": "https://images.unsplash.com/photo-1505373877841-8d25f39d466f?w=400",
        "category": "Corporate",
        "stock": 100,
    },
    {
        "name": "Baby Shower Bliss",
        "description": "Soft pastel baby shower invite with cute illustrations.",
        "price": 9.99,
        "image_url": "https://images.unsplash.com/photo-1515488042361-ee00e17ddd77?w=400",
        "category": "Baby Shower",
        "stock": 120,
    },
    {
        "name": "Graduation Celebration",
        "description": "Bold graduation party invitation with cap and diploma motif.",
        "price": 10.49,
        "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400",
        "category": "Graduation",
        "stock": 80,
    },
    {
        "name": "Anniversary Elegance",
        "description": "Romantic anniversary dinner invitation with rose accents.",
        "price": 11.99,
        "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400",
        "category": "Anniversary",
        "stock": 90,
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(InvitationCard).count() == 0:
            for card in SEED_CARDS:
                db.add(InvitationCard(**card))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(title="Catalog Service", version="1.0.0", lifespan=lifespan)
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
    return {"status": "healthy", "service": "catalog-service"}


@app.get("/cards", response_model=list[CardResponse])
def list_cards(category: str | None = None, db: Session = next(get_db())):
    query = db.query(InvitationCard)
    if category:
        query = query.filter(InvitationCard.category == category)
    return query.all()


@app.get("/cards/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = next(get_db())):
    card = db.query(InvitationCard).filter(InvitationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.post("/cards", response_model=CardResponse, status_code=201)
def create_card(payload: CardCreate, db: Session = next(get_db())):
    card = InvitationCard(**payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.get("/cards/{card_id}/price")
def get_card_price(card_id: int, db: Session = next(get_db())):
    card = db.query(InvitationCard).filter(InvitationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"card_id": card.id, "price": card.price, "name": card.name, "stock": card.stock}
