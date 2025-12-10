# backend/app/controllers/auth_controller.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User
from app.api.models.auth_models import UserLogin, UserRegister  
from app.core.security import verify_password, get_password_hash, create_access_token

def register(data: UserRegister, db: Session):  # ← используйте UserRegister
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    hashed_password = get_password_hash(data.password)
    new_user = User(email=data.email, name=data.name, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Пользователь успешно зарегистрирован"}

def login(data: UserLogin, db: Session):  # ← используйте UserLogin
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }