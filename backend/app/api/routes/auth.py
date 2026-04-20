from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.models.auth_models import UserLogin, UserRegister
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash
from app.db.database import get_db
from app.db.repository.user_repo import UserRepository
from app.services.auth_service import AuthService

router = APIRouter()

REGISTER_SUCCESS = "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0443\u0441\u043f\u0435\u0448\u043d\u0430"
DUPLICATE_EMAIL = "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0441 \u0442\u0430\u043a\u0438\u043c email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
INVALID_CREDENTIALS = "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 email \u0438\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c"
LOGIN_SUCCESS = "\u0423\u0441\u043f\u0435\u0448\u043d\u044b\u0439 \u0432\u0445\u043e\u0434"
REFRESH_TOKEN_MISSING = "Refresh token \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442"
REFRESH_TOKEN_INVALID = "\u041d\u0435\u0432\u0430\u043b\u0438\u0434\u043d\u044b\u0439 refresh token"
REFRESH_SUCCESS = "\u0422\u043e\u043a\u0435\u043d \u043e\u0431\u043d\u043e\u0432\u043b\u0451\u043d"
LOGOUT_SUCCESS = "\u0412\u044b\u0445\u043e\u0434 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d"


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserRegister = Body(...),
    db: Session = Depends(get_db),
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    if user_repo.get_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=DUPLICATE_EMAIL,
        )

    hashed_password = get_password_hash(user_data.password)

    from app.db.models import User

    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    auth_service.create_tokens(new_user)
    return {"msg": REGISTER_SUCCESS}


@router.post("/login")
def login_user(
    user_data: UserLogin = Body(...),
    db: Session = Depends(get_db),
    response: Response = None,
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    user = auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_CREDENTIALS,
        )

    tokens = auth_service.create_tokens(user)

    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=900,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=604800,
        path="/",
    )

    return {"msg": LOGIN_SUCCESS}


@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=REFRESH_TOKEN_MISSING,
        )

    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    tokens = auth_service.refresh_access_token(refresh_token_value)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=REFRESH_TOKEN_INVALID,
        )

    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=900,
        path="/",
    )

    return {"msg": REFRESH_SUCCESS}


@router.post("/logout")
def logout(
    response: Response,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    auth_service.logout(current_user)

    response.delete_cookie("access_token", domain=settings.COOKIE_DOMAIN, path="/")
    response.delete_cookie("refresh_token", domain=settings.COOKIE_DOMAIN, path="/")

    return {"msg": LOGOUT_SUCCESS}
