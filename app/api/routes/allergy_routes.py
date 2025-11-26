from fastapi import APIRouter
from app.controllers import allergy_controller as ctrl

router = APIRouter(prefix="/api/allergies", tags=["Allergies"])


@router.get("/")
def get_all():
    return ctrl.get_all_allergies()


@router.get("/{allergy_id}")
def get_one(allergy_id: int):
    return ctrl.get_allergy(allergy_id)


@router.post("/")
def create(name: str):
    return ctrl.create_allergy(name)


@router.put("/{allergy_id}")
def update(allergy_id: int, new_name: str):
    return ctrl.update_allergy(allergy_id, new_name)


@router.delete("/{allergy_id}")
def delete(allergy_id: int):
    return ctrl.delete_allergy(allergy_id)
