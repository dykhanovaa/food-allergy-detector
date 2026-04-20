#backend\app\api\routes\auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.repository.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.api.models.auth_models import UserRegister, UserLogin
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserRegister = Body(...),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    if user_repo.get_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    hashed_password = get_password_hash(user_data.password)

    from app.db.models import User
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    tokens = auth_service.create_tokens(new_user)
    return {"msg": "Регистрация успешна"}

@router.post("/login")
def login_user(
    user_data: UserLogin = Body(...),
    db: Session = Depends(get_db),
    response: Response = None
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    user = auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный email или пароль"
        )

    tokens = auth_service.create_tokens(user)

    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=False, 
        samesite="strict",
        max_age=900
    )

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=False,
        samesite="strict",
        max_age=604800
    )

    return {"msg": "Успешный вход"}

@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token отсутствует"
        )

    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    tokens = auth_service.refresh_access_token(refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидный refresh token"
        )

    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=False,
        samesite="strict",
        max_age=900
    )

    return {"msg": "Токен обновлён"}

@router.post("/logout")
def logout(
    response: Response,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    auth_service.logout(current_user)

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"msg": "Выход выполнен"}

