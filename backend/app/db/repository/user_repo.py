from sqlalchemy.orm import Session
from app.db.models import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def update_refresh_token(self, user: User, token: str | None, expires):
        user.refresh_token = token
        user.refresh_token_expires = expires
        self.db.commit()

    def clear_refresh_token(self, user: User):
        user.refresh_token = None
        user.refresh_token_expires = None
        self.db.commit()