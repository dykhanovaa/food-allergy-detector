from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


async def extract_barcode_from_image(file_content: bytes) -> Optional[str]:
    """
    Р—Р°РіР»СѓС€РєР°: РІ СЂРµР°Р»СЊРЅРѕРј РїСЂРѕРµРєС‚Рµ Р·РґРµСЃСЊ Р±С‹Р» Р±С‹ OCR + РїРѕРёСЃРє С€С‚СЂРёС…РєРѕРґР°.
    Р”Р»СЏ Р»Р°Р±С‹ Р±СѓРґРµРј СЃС‡РёС‚Р°С‚СЊ, С‡С‚Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ Р·Р°РіСЂСѓР¶Р°РµС‚ С„РѕС‚Рѕ,
    Р° РјС‹ РїСЂРѕСЃС‚Рѕ РёС‰РµРј 13-Р·РЅР°С‡РЅС‹Р№ С€С‚СЂРёС…РєРѕРґ РІ С‚РµРєСЃС‚Рµ.
    """
    return None


async def get_product_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{settings.OPENFOODFACTS_BASE_URL}/product/{barcode}.json",
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1:
                    return data["product"]
        except Exception as exc:
            print(f"Open Food Facts error: {exc}")
    return None
