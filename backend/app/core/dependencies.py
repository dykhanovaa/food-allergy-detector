# backend/app/core/dependencies.py

from fastapi import Depends, HTTPException, status, Request
from jose import jwt
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.database import SessionLocal
from app.core.config import settings


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения действия"
            )
        return current_user
    return role_checker