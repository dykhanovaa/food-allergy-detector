# app/controllers/user_controller.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User, Allergy
from app.api.models.user_models import UserProfileResponse  # ← должен включать name

def get_profile(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    allergy_names = [allergy.name for allergy in user.allergies]
    return UserProfileResponse(
        email=user.email,
        name=user.name,      
        allergies=allergy_names
    )

def update_profile():
    return {"message": "Профиль обновлён"}

def delete_account():
    return {"message": "Аккаунт удалён"}

def add_user_allergies(db: Session, user_id: int, allergy_ids: list[int]):
    # Проверяем, что все аллергии существуют
    existing_allergies = db.query(Allergy).filter(Allergy.id.in_(allergy_ids)).all()
    if len(existing_allergies) != len(allergy_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Одна или несколько аллергий не найдены"
        )
    
    # Получаем пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем аллергии (полная замена)
    user.allergies = existing_allergies
    db.commit()
    db.refresh(user)
    
    return {"message": "Аллергии успешно обновлены"}