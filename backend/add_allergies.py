# backend/seed_allergies.py

from app.db.database import SessionLocal, Base, engine
from app.db.models import Allergy

# Создаём таблицы (если ещё не созданы)
Base.metadata.create_all(bind=engine)

# Список аллергенов
ALLERGENS = [
    "Арахис", "Орехи", "Молоко", "Яйца", "Рыба", "Морепродукты",
    "Соя", "Пшеница (глютен)", "Кунжут", "Горчица", "Сельдерей",
    "Люпин", "Моллюски", "Сульфиты"
]

db = SessionLocal()
try:
    # Добавляем только отсутствующие
    for name in ALLERGENS:
        existing = db.query(Allergy).filter(Allergy.name == name).first()
        if not existing:
            db.add(Allergy(name=name))
    db.commit()
    print("✅ Все аллергены добавлены!")
finally:
    db.close()