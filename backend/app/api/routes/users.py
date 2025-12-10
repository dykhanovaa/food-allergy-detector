# app/api/routes/users.py

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.controllers import user_controller
from app.api.models.user_models import AllergyIdList
from app.db.models import Allergy

router = APIRouter()

@router.get("/profile")
def get_profile(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_controller.get_profile(db, current_user.id)

@router.put("/profile")
def update_profile():
    return user_controller.update_profile()

@router.delete("/delete")
def delete_account():
    return user_controller.delete_account()

@router.post("/allergies")
def add_allergy(
    allergy_ids: AllergyIdList,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return user_controller.add_user_allergies(db, current_user.id, allergy_ids.allergy_ids)

@router.post("/init-allergies", include_in_schema=True)
def init_allergies(db: Session = Depends(get_db)):
    from app.db.models import Allergy
    ALLERGIES = [
        "Арахис", "Орехи", "Молоко", "Яйца", "Рыба", "Морепродукты", "Соя",
        "Пшеница (глютен)", "Кунжут", "Горчица", "Сельдерей", "Люпин", "Моллюски", "Сульфиты"
    ]
    if db.query(Allergy).count() == 0:
        for name in ALLERGIES:
            db.add(Allergy(name=name))
        db.commit()
    return {"message": "Allergies initialized"}


@router.get("/allergies/list")
def get_all_allergies(db: Session = Depends(get_db)):
    allergies = db.query(Allergy).all()
    return [{"id": a.id, "name": a.name} for a in allergies]