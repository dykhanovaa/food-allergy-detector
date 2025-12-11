# backend/app/api/routes/scans.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import User
from app.core.dependencies import get_current_user, get_db
import pytesseract
from PIL import Image
import tempfile
from pathlib import Path
import re
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter()

SUPPORTED_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp"}
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"🔍 Начало анализа изображения. Пользователь: {current_user.email}, файл: {file.filename}")

    # Валидация типа файла
    if file.content_type not in SUPPORTED_TYPES:
        logger.warning(f"❌ Неподдерживаемый MIME-тип: {file.content_type}")
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения")
    
    suffix = Path(file.filename).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        logger.warning(f"❌ Неподдерживаемое расширение: {suffix}")
        raise HTTPException(status_code=400, detail="Неподдерживаемое расширение файла")

    temp_path = None
    try:
        # Сохраняем временный файл
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            while chunk := await file.read(1024 * 1024):
                tmp.write(chunk)
            temp_path = tmp.name

        logger.info(f"💾 Временный файл сохранён: {temp_path}")

        # Открываем изображение
        image = Image.open(temp_path)
        logger.info("🖼️ Изображение открыто успешно")

        # Распознаём текст
        text = pytesseract.image_to_string(image, lang='rus+eng')
        logger.info(f"🔤 Распознанный текст: {text[:100]}...")  # первые 100 символов

        # Извлекаем ингредиенты
        ingredients = []
        matches = re.findall(r'(?i)(?:ингредиенты?|состав|ingredients?)\s*[:\-]?\s*(.+?)(?=\n|$)', text)
        if matches:
            raw = re.split(r'[;,\.]\s*|\s+и\s+', matches[0])
            ingredients = [ing.strip().lower() for ing in raw if ing.strip()]
            logger.info(f"🥕 Найдены ингредиенты: {ingredients}")
        else:
            logger.warning("⚠️ Ингредиенты не найдены в тексте")

        # Получаем аллергии пользователя
        user_allergies = [a.name.lower() for a in current_user.allergies]
        logger.info(f"🩺 Аллергии пользователя: {user_allergies}")

        # Сравниваем
        detected = []
        for allergen in user_allergies:
            for ing in ingredients:
                if allergen in ing:
                    detected.append(allergen)
        detected = list(set(detected))
        logger.info(f"❗ Обнаруженные аллергены: {detected}")

        is_safe = len(detected) == 0
        warnings = [f"⚠️ Найдена аллергия: {a}" for a in detected]

        result = {
            "product_name": "Не определено",
            "ingredients": ingredients,
            "detected_allergens": detected,
            "is_safe": is_safe,
            "warnings": warnings
        }
        logger.info("✅ Анализ завершён успешно")
        return result

    except Exception as e:
        logger.exception(f"💥 КРИТИЧЕСКАЯ ОШИБКА при анализе: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка анализа: {str(e)}")
    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()
            logger.info(f"🧹 Временный файл удалён: {temp_path}")