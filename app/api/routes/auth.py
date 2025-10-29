from fastapi import APIRouter
from app.controllers import auth_controller
from app.api.models.auth_models import UserAuth

router = APIRouter()

@router.post("/register")
def register_user(data: UserAuth):
    return auth_controller.register(data)

@router.post("/login")
def login_user(data: UserAuth):
    return auth_controller.login(data)
