from fastapi.responses import JSONResponse

def get_profile():
    return JSONResponse(content={
        "user": {
            "email": "test@example.com",
            "allergies": ["milk", "peanuts"],
            "age": 25
        }
    })

def update_profile():
    return JSONResponse(content={"message": "Профиль обновлен (заглушка)"})

def delete_account():
    return JSONResponse(content={"message": "Аккаунт удалён (заглушка)"})

def add_allergy(allergy):
    return JSONResponse(content={
        "message": f"Аллергия '{allergy.allergy}' добавлена (заглушка)"
    })
