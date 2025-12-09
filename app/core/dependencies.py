from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.database import SessionLocal
from app.core.config import settings

bearer_scheme = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token_data: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    print("SECRET_KEY при ПРОВЕРКЕ токена:", settings.SECRET_KEY) 
    print("Получен токен:", token_data.credentials) 
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = token_data.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user