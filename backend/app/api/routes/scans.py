# backend/app/api/routes/scans.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import User
from app.core.dependencies import get_current_user, get_db
from app.core.allergens import ALLERGEN_KEYWORDS
import pytesseract
from PIL import Image
import tempfile
from pathlib import Path
import re

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

router = APIRouter()

SUPPORTED_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp"}
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Валидация MIME-типа
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения")
    
    suffix = Path(file.filename).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise HTTPException(status_code=400, detail="Неподдерживаемое расширение файла")

    temp_path = None
    try:
        # Сохраняем во временный файл
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            while chunk := await file.read(1024 * 1024):
                tmp.write(chunk)
            temp_path = tmp.name

        # Открываем изображение
        image = Image.open(temp_path)
        text = pytesseract.image_to_string(image, lang='rus+eng')

        # Извлекаем ингредиенты
        ingredients = []
        matches = re.findall(r'(?i)(?:ингредиенты?|состав|ingredients?)\s*[:\-]?\s*(.+?)(?=\n|$)', text)
        if matches:
            raw = re.split(r'[;,\.]\s*|\s+и\s+', matches[0])
            ingredients = [ing.strip().lower() for ing in raw if ing.strip()]

        # Получаем точные названия аллергий пользователя (как в БД)
        user_allergies = [a.name for a in current_user.allergies]

        # Умное сопоставление через словарь ALLERGEN_KEYWORDS
        detected = set()
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            for allergen_name in user_allergies:
                # Получаем ключевые слова для аллергена (по точному имени из БД)
                keywords = ALLERGEN_KEYWORDS.get(allergen_name, [allergen_name.lower()])
                for kw in keywords:
                    if kw in ingredient_lower:
                        detected.add(allergen_name)
                        break  # найден один аллерген — дальше не проверяем

        detected = list(detected)
        is_safe = len(detected) == 0
        warnings = [f"Найдена аллергия: {a}" for a in detected]

        return {
            "product_name": "Не определено",
            "ingredients": ingredients,
            "detected_allergens": detected,
            "is_safe": is_safe,
            "warnings": warnings
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка анализа изображения")
    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()