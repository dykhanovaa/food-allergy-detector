from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

user_allergies = Table(
    "user_allergies",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("allergy_id", Integer, ForeignKey("allergies.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, index=True) 
    hashed_password = Column(String)
    role = Column(String, default="user")
    # Связь с аллергиями
    allergies = relationship("Allergy", secondary=user_allergies, back_populates="users")

    refresh_token = Column(String, nullable=True)
    refresh_token_expires = Column(DateTime, nullable=True)

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    users = relationship("User", secondary=user_allergies, back_populates="allergies")