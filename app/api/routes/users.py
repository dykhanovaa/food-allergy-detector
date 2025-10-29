from fastapi import APIRouter
from app.controllers import user_controller
from app.api.models.user_models import Allergy

router = APIRouter()

@router.get("/profile")
def get_profile():
    return user_controller.get_profile()

@router.put("/profile")
def update_profile():
    return user_controller.update_profile()

@router.delete("/delete")
def delete_account():
    return user_controller.delete_account()

@router.post("/allergies")
def add_allergy(allergy: Allergy):
    return user_controller.add_allergy(allergy)
