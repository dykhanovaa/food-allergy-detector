from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.controllers import allergy_controller as ctrl
from app.api.models.allergy_model import AllergyCreate, AllergyOut

router = APIRouter(prefix="/api/allergies", tags=["Allergies"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AllergyOut])
def get_all(db: Session = Depends(get_db)):
    return ctrl.get_all_allergies(db)


@router.get("/{allergy_id}", response_model=AllergyOut)
def get_one(allergy_id: int, db: Session = Depends(get_db)):
    return ctrl.get_allergy(db, allergy_id)


@router.post("/", response_model=AllergyOut)
def create(data: AllergyCreate, db: Session = Depends(get_db)):
    return ctrl.create_allergy(db, data.name)


@router.put("/{allergy_id}", response_model=AllergyOut)
def update(allergy_id: int, new_name: str, db: Session = Depends(get_db)):
    return ctrl.update_allergy(db, allergy_id, new_name)


@router.delete("/{allergy_id}")
def delete(allergy_id: int, db: Session = Depends(get_db)):
    return ctrl.delete_allergy(db, allergy_id)
