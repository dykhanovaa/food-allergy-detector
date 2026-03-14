
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User
from app.core.dependencies import get_db, require_role

router = APIRouter()

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
        for user in users
    ]

@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int, 
    new_role: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_role("admin"))
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить свою роль"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Недопустимая роль")
    
    user.role = new_role
    db.commit()
    return {"message": f"Роль пользователя обновлена на {new_role}"}