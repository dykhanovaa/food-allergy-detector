from sqlalchemy.orm import Session
from app.db.models import Allergy
from fastapi import HTTPException

def get_all_allergies(db: Session):
    return db.query(Allergy).all()


def get_allergy(db: Session, allergy_id: int):
    allergy = db.query(Allergy).filter(Allergy.id == allergy_id).first()
    if not allergy:
        raise HTTPException(status_code=404, detail="Аллергия не найдена")
    return allergy


def create_allergy(db: Session, name: str):
    exists = db.query(Allergy).filter(Allergy.name == name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Такая аллергия уже существует")

    new = Allergy(name=name)
    db.add(new)
    db.commit()
    db.refresh(new)
    return new


def update_allergy(db: Session, allergy_id: int, new_name: str):
    allergy = db.query(Allergy).filter(Allergy.id == allergy_id).first()
    if not allergy:
        raise HTTPException(status_code=404, detail="Аллергия не найдена")

    allergy.name = new_name
    db.commit()
    db.refresh(allergy)
    return allergy


def delete_allergy(db: Session, allergy_id: int):
    allergy = db.query(Allergy).filter(Allergy.id == allergy_id).first()
    if not allergy:
        raise HTTPException(status_code=404, detail="Аллергия не найдена")

    db.delete(allergy)
    db.commit()
    return {"message": "Удалено"}
