from fastapi.responses import JSONResponse
from app.utils.logger import log

def register(data):
    log(f"Регистрация: {data.email}")
    return JSONResponse(content={
        "message": "Регистрация успешна (заглушка)",
        "user": data.email
    })

def login(data):
    log(f"Попытка входа: {data.email}")
    if data.password == "123456":
        return JSONResponse(content={"message": "Успешный вход", "email": data.email})
    return JSONResponse(content={"error": "Неверный логин или пароль"}, status_code=401)
