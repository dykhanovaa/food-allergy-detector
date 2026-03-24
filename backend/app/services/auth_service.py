# backend/app/services/auth_service.py

from datetime import datetime, timedelta
from app.db.models import User
from app.db.repository.user_repo import UserRepository
from app.core.security import create_access_token, create_refresh_token, verify_password

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def authenticate_user(self, email: str, password: str) -> User | None:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    def create_tokens(self, user: User):
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})

        expires = datetime.utcnow() + timedelta(days=7)
        self.user_repo.update_refresh_token(user, refresh_token, expires)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def refresh_access_token(self, refresh_token: str):
        from jose import jwt
        from app.core.config import settings

        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "refresh":
                return None
            email = payload.get("sub")
            if not email:
                return None
        except Exception:
            return None

        user = self.user_repo.get_by_email(email)
        if not user or user.refresh_token != refresh_token:
            return None

        new_access_token = create_access_token(data={"sub": email})
        return {"access_token": new_access_token, "token_type": "bearer"}

    def logout(self, user: User):
        self.user_repo.clear_refresh_token(user)