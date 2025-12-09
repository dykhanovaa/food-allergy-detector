# app/api/routes/auth.py
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.controllers.auth_controller import register, login
from app.api.models.auth_models import UserAuth
from app.db.database import SessionLocal

router = APIRouter()

# Вспомогательная функция для получения сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register_user(data: UserAuth = Body(...), db: Session = Depends(get_db)):
    return register(data, db)

@router.post("/login")
def login_user(data: UserAuth = Body(...), db: Session = Depends(get_db)):
    return login(data, db)