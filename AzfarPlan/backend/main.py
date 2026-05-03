import os
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic import BaseModel
from typing import Dict, List, Optional

# --- Dynamic Database Setup ---
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rezlsg.db")

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

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
    metrics = Column(JSON) # Sleep saves automatically here since it's JSON!
    milestones = Column(JSON)
    last_active_date = Column(String)

class History(Base):
    # RENAMED to force a fresh table with our new columns
    __tablename__ = "daily_history" 
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True)
    score = Column(Float)
    habits = Column(JSON)  # NEW: Tracks exact habits for streaks
    sleep = Column(Float)  # NEW: Tracks sleep for the correlation chart

Base.metadata.create_all(bind=engine)

# --- FastAPI App ---
app = FastAPI(title="RezlSG Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rezelsg-dashboard.vercel.app"], 
    allow_credentials=False,
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
    habits: Dict[str, bool]
    sleep: float

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
    # Order ascending so charts flow left to right (oldest to newest)
    history = db.query(History).order_by(History.date.asc()).all()
    db.close()
    return [{
        "date": h.date, 
        "score": h.score,
        "habits": h.habits or {},
        "sleep": h.sleep or 0
    } for h in history]

@app.post("/api/history")
def add_history(payload: HistoryPayload):
    db = SessionLocal()
    existing = db.query(History).filter(History.date == payload.date).first()
    if existing:
        existing.score = payload.score
        existing.habits = payload.habits
        existing.sleep = payload.sleep
    else:
        new_entry = History(
            date=payload.date, 
            score=payload.score,
            habits=payload.habits,
            sleep=payload.sleep
        )
        db.add(new_entry)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/streaks")
def get_streaks():
    db = SessionLocal()
    history = db.query(History).all()
    db.close()
    
    # Map out the default streaks
    streaks = {
        "tahajjud": 0, "gymOrRun": 0, "rezlSgDev": 0, 
        "contentCreation": 0, "jobApps": 0, "baking": 0
    }
    
    if not history:
        return streaks
        
    # Map dates to habits for lightning fast lookups
    history_map = {h.date: h.habits for h in history if h.habits}
    
    # Find the most recent day in the database
    latest_entry = max(history, key=lambda x: x.date)
    latest_date_obj = datetime.strptime(latest_entry.date, "%Y-%m-%d")
    
    # Calculate streak by stepping backwards 1 day at a time
    for habit_key in streaks.keys():
        current_streak = 0
        current_date_obj = latest_date_obj
        
        while True:
            date_str = current_date_obj.strftime("%Y-%m-%d")
            habits_for_day = history_map.get(date_str)
            
            # If the date exists AND the habit is true, increase streak
            if habits_for_day and habits_for_day.get(habit_key) == True:
                current_streak += 1
                current_date_obj -= timedelta(days=1)
            else:
                break # Streak broken!
                
        streaks[habit_key] = current_streak
        
    return streaks