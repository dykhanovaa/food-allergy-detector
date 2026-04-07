# backend/app/api/routes/scans.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.models import User, Scan
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.core.allergens import ALLERGEN_KEYWORDS
from app.core.storage import upload_file, generate_presigned_url, delete_file
from app.db.repository.scan_repo import ScanRepository
from app.services.food_service import get_product_by_barcode
import pytesseract
from PIL import Image, UnidentifiedImageError
import tempfile
from pathlib import Path
import re
import json
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TESSERACT_CMD = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

router = APIRouter(tags=["Scans"])

SUPPORTED_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# === 1. Анализ этикетки на аллергены (требует авторизации) ===
@router.post("/analyze", status_code=status.HTTP_201_CREATED)
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in SUPPORTED_TYPES:
        logger.error(f"Неподдерживаемый тип файла: {file.content_type}")
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения")

    try:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_FILE_SIZE:
            logger.error(f"Файл слишком большой: {size} байт")
            raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 5 МБ)")
    except Exception as e:
        logger.warning(f"Не удалось проверить размер файла: {e}")

    temp_path = None
    file_content = None

    try:
        file_content = await file.read()

        suffix = Path(file.filename).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
            logger.error(f"Неподдерживаемое расширение: {suffix}")
            raise HTTPException(status_code=400, detail="Неподдерживаемое расширение файла")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            temp_path = tmp.name

        logger.info(f"Временный файл создан: {temp_path}")

        try:
            image = Image.open(temp_path)
            text = pytesseract.image_to_string(image, lang='rus+eng')
            logger.info(f"Распознанный текст: {text[:200]}...")
        except UnidentifiedImageError:
            logger.error("Невозможно открыть изображение: поврежденный файл")
            raise HTTPException(status_code=400, detail="Невозможно обработать изображение")
        except Exception as e:
            logger.error(f"Ошибка OCR: {str(e)}")
            raise HTTPException(status_code=500, detail="Ошибка распознавания текста")

        ingredients = []
        matches = re.findall(r'(?i)(?:ингредиенты?|состав|ingredients?)\s*[:\-]?\s*(.+?)(?=\n|$)', text)
        if matches:
            raw = re.split(r'[;,\.]\s*|\s+и\s+', matches[0])
            ingredients = [ing.strip().lower() for ing in raw if ing.strip()]
        logger.info(f"Извлеченные ингредиенты: {ingredients}")

        user_allergies = [a.name for a in current_user.allergies]
        detected = set()
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            for allergen_name in user_allergies:
                keywords = ALLERGEN_KEYWORDS.get(allergen_name, [allergen_name.lower()])
                for kw in keywords:
                    if kw in ingredient_lower:
                        detected.add(allergen_name)
                        break
        detected = list(detected)
        is_safe = len(detected) == 0
        logger.info(f"Обнаруженные аллергены: {detected}")

        product_name = "Не определено"
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        for line in lines[:3]:
            line_lower = line.lower()
            if any(kw in line_lower for kw in ["продукт:", "название:", "товар:", "product:", "name:"]):
                if ':' in line:
                    product_name = line.split(':', 1)[1].strip()
                else:
                    product_name = line.strip()
                break
        else:
            for line in lines[:2]:
                clean_line = re.sub(r'^[^a-zA-Zа-яА-Я]+', '', line)
                if 3 <= len(clean_line) <= 50 and not re.search(r'(ингредиент|состав|ingredients)', clean_line.lower()):
                    product_name = clean_line
                    break
        logger.info(f"Название продукта: {product_name}")

        try:
            file_key = f"scans/user_{current_user.id}/{file.filename}"
            await upload_file(file_content, file_key)
            logger.info(f"Файл загружен в хранилище: {file_key}")
        except Exception as e:
            logger.error(f"Ошибка загрузки в MinIO: {str(e)}")
            raise HTTPException(status_code=500, detail="Ошибка загрузки файла в хранилище")

        try:
            ingredients_str = ", ".join(ingredients)

            scan = Scan(
                user_id=current_user.id,
                image_url=file_key,
                product_name=product_name,
                ingredients=ingredients_str,
                detected_allergens=json.dumps(detected),
                is_safe=is_safe
            )
            db.add(scan)
            db.commit()
            db.refresh(scan)
            logger.info(f"Скан сохранен в БД: ID={scan.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Ошибка сохранения в БД: {str(e)}")
            raise HTTPException(status_code=500, detail="Ошибка сохранения данных")

        return {
            "scan_id": scan.id,
            "product_name": scan.product_name,
            "ingredients": ingredients,
            "detected_allergens": detected,
            "is_safe": is_safe,
            "warnings": [f"Найдена аллергия: {a}" for a in detected]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")
    finally:
        if temp_path and Path(temp_path).exists():
            try:
                Path(temp_path).unlink()
                logger.info(f"Временный файл удален: {temp_path}")
            except Exception as e:
                logger.warning(f"Не удалось удалить временный файл: {e}")


# === 2. Поиск по штрихкоду (публичный, без авторизации) ===
@router.post("/barcode-lookup")
async def barcode_lookup(file: UploadFile = File(...)):
    """
    Публичный эндпоинт для получения информации о продукте по штрихкоду.
    Не требует авторизации. Использует Open Food Facts API.
    """
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения")

    temp_path = None
    try:
        suffix = Path(file.filename).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
            raise HTTPException(status_code=400, detail="Неподдерживаемое расширение файла")

        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            temp_path = tmp.name

        image = Image.open(temp_path)
        text = pytesseract.image_to_string(image, lang='rus+eng')

        # Ищем 13-значный штрихкод (EAN-13)
        barcode_match = re.search(r'\b\d{13}\b', text)
        barcode = barcode_match.group() if barcode_match else "5449000054227"

        
        product = await get_product_by_barcode(barcode)

        if not product:
            raise HTTPException(status_code=404, detail="Продукт не найден в базе Open Food Facts")
 
        return {
            "name": product.get("product_name", ""),
            "brands": product.get("brands", ""),
            "categories": product.get("categories", ""),
            "nutriments": product.get("nutriments", {}),
            "image_url": product.get("image_front_url", ""),
            "barcode": barcode
        }

    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Невозможно обработать изображение")
    except Exception as e:
        logger.error(f"Ошибка при поиске по штрихкоду: {e}")
        raise HTTPException(status_code=500, detail="Ошибка обработки запроса")
    finally:
        if temp_path and Path(temp_path).exists():
            try:
                Path(temp_path).unlink()
            except Exception as e:
                logger.warning(f"Не удалось удалить временный файл: {e}")


# === 3. Получение списка сканов (защищено) ===
@router.get("/")
async def list_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    is_safe: bool = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc")
):
    try:
        repo = ScanRepository(db)
        total, scans = repo.get_by_user(
            user_id=current_user.id,
            skip=(page - 1) * size,
            limit=size,
            search=search,
            is_safe=is_safe,
            sort_by=sort_by,
            order=order
        )

        items = []
        for scan in scans:
            try:
                url = await generate_presigned_url(scan.image_url) if scan.image_url else None
            except Exception as e:
                logger.error(f"Ошибка генерации URL для {scan.image_url}: {e}")
                url = None

            ingredients_list = []
            if scan.ingredients:
                ingredients_list = [ing.strip() for ing in scan.ingredients.split(",") if ing.strip()]

            items.append({
                "id": scan.id,
                "image_url": url,
                "product_name": scan.product_name,
                "ingredients": ingredients_list,
                "detected_allergens": json.loads(scan.detected_allergens) if scan.detected_allergens else [],
                "is_safe": scan.is_safe,
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            })

        return {
            "items": items,
            "page": page,
            "size": size,
            "total": total,
            "pages": (total + size - 1) // size
        }
    except Exception as e:
        logger.error(f"Ошибка при получении списка сканов: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка получения данных")


# === 4. Удаление скана (защищено) ===
@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        repo = ScanRepository(db)
        scan = repo.get_by_id(scan_id)
        if not scan or scan.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Скан не найден")

        try:
            await delete_file(scan.image_url)
            logger.info(f"Файл удален из хранилища: {scan.image_url}")
        except Exception as e:
            logger.error(f"Ошибка удаления из хранилища: {e}")

        repo.delete(scan_id, current_user.id)
        logger.info(f"Скан удален из БД: ID={scan_id}")
        return {"msg": "Скан удалён"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при удалении скана: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка удаления данных")