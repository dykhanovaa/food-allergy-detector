from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
