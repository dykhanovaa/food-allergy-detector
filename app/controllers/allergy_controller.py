from fastapi import HTTPException
from app.api.models.allergy_model import Allergy

# Псевдо-база
allergies_db = []

# Загружаем список из задания
DEFAULT_ALLERGIES = [
    "Арахис", "Молоко", "Рыба", "Соя", "Кунжут", "Сельдерей", "Моллюски",
    "Орехи", "Яйца", "Морепродукты", "Пшеница (глютен)", "Горчица", "Люпин", "Сульфиты"
]

# Заполняем базу начальными данными
for index, item in enumerate(DEFAULT_ALLERGIES):
    allergies_db.append(Allergy(id=index + 1, name=item))


def get_all_allergies():
    return allergies_db


def get_allergy(allergy_id: int):
    for allergy in allergies_db:
        if allergy.id == allergy_id:
            return allergy
    raise HTTPException(status_code=404, detail="Аллергия не найдена")


def create_allergy(name: str):
    new_id = max([a.id for a in allergies_db], default=0) + 1
    new = Allergy(id=new_id, name=name)
    allergies_db.append(new)
    return new


def update_allergy(allergy_id: int, new_name: str):
    for allergy in allergies_db:
        if allergy.id == allergy_id:
            allergy.name = new_name
            return allergy
    raise HTTPException(status_code=404, detail="Аллергия не найдена")


def delete_allergy(allergy_id: int):
    for allergy in allergies_db:
        if allergy.id == allergy_id:
            allergies_db.remove(allergy)
            return {"message": "Удалено"}
    raise HTTPException(status_code=404, detail="Аллергия не найдена")
