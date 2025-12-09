from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email}

@router.put("/profile")
def update_profile(current_user: User = Depends(get_current_user)):
    # Пример: обновление профиля
    return {"message": "Profile updated"}

@router.delete("/delete")
def delete_account(current_user: User = Depends(get_current_user)):
    return {"message": "Account deleted"}

@router.post("/allergies")
def add_allergy(allergy_name: str, current_user: User = Depends(get_current_user)):
    # Здесь можно добавить логику привязки аллергии к пользователю
    return {"message": f"Allergy '{allergy_name}' added for {current_user.email}"}