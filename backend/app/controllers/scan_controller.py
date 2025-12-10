import shutil
from fastapi.responses import JSONResponse
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)  # создаём папку uploads, если её нет

async def upload_image(image):
    file_path = UPLOAD_DIR / image.filename

    # сохраняем файл
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # здесь позже будет вызов OCR-сервиса
    return JSONResponse(content={
        "message": f"Файл '{image.filename}' успешно загружен",
        "path": str(file_path)
    })
