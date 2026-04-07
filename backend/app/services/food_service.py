# backend/app/core/services/food_service.py

import httpx
from typing import Optional, Dict, Any

async def extract_barcode_from_image(file_content: bytes) -> Optional[str]:
    """
    Заглушка: в реальном проекте здесь был бы OCR + поиск штрихкода.
    Для лабы будем считать, что пользователь загружает фото,
    а мы просто ищем 13-значный штрихкод в тексте.
    """
    # TODO: в будущем — интеграция с Tesseract + regex
    return None  # временно не используется

async def get_product_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    """Получает данные о продукте из Open Food Facts по штрихкоду"""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json",
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1:
                    return data["product"]
        except Exception as e:
            print(f"Open Food Facts error: {e}")
    return None