#\backend\app\db\models.py

from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=False)
    product_name = Column(String, nullable=True)
    ingredients = Column(Text, nullable=True)
    detected_allergens = Column(Text, nullable=True)  # JSON строка
    is_safe = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())