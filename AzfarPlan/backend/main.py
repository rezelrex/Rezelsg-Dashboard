import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic import BaseModel
from typing import Dict, List

# --- Dynamic Database Setup ---
# Railway automatically injects a DATABASE_URL environment variable.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rezlsg.db")

# SQLAlchemy requires the prefix 'postgresql://' but Railway provides 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires specific connect_args, Postgres does not
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- Models ---
class UserData(Base):
    __tablename__ = "user_data"
    id = Column(Integer, primary_key=True, index=True)
    habits = Column(JSON)
    metrics = Column(JSON)
    milestones = Column(JSON)
    last_active_date = Column(String)

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True)
    score = Column(Float)

Base.metadata.create_all(bind=engine)

# --- FastAPI App ---
app = FastAPI(title="RezlSG Dashboard API")

# Allow React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rezelsg-dashboard-bw311z6ec-azfar200-gmailcoms-projects.vercel.app/"], # <--- This opens the gate for Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class StatePayload(BaseModel):
    habits: Dict[str, bool]
    metrics: Dict[str, float]
    milestones: Dict[str, bool]
    last_active_date: str

class HistoryPayload(BaseModel):
    date: str
    score: float

# --- Endpoints ---
@app.get("/api/state")
def get_state():
    db = SessionLocal()
    data = db.query(UserData).first()
    db.close()
    if not data:
        return {"status": "no_data"}
    return {
        "habits": data.habits,
        "metrics": data.metrics,
        "milestones": data.milestones,
        "last_active_date": data.last_active_date
    }

@app.post("/api/state")
def update_state(payload: StatePayload):
    db = SessionLocal()
    data = db.query(UserData).first()
    if not data:
        data = UserData(id=1)
        db.add(data)
    
    data.habits = payload.habits
    data.metrics = payload.metrics
    data.milestones = payload.milestones
    data.last_active_date = payload.last_active_date
    
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/history")
def get_history():
    db = SessionLocal()
    history = db.query(History).all()
    db.close()
    return [{"date": h.date, "score": h.score} for h in history]

@app.post("/api/history")
def add_history(payload: HistoryPayload):
    db = SessionLocal()
    existing = db.query(History).filter(History.date == payload.date).first()
    if existing:
        existing.score = payload.score
    else:
        new_entry = History(date=payload.date, score=payload.score)
        db.add(new_entry)
    db.commit()
    db.close()
    return {"status": "success"}