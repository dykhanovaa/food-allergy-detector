from fastapi import APIRouter, UploadFile, File
from app.controllers import scan_controller

router = APIRouter()

@router.post("/upload")
async def upload_scan(image: UploadFile = File(...)):
    """
    Принимает изображение с этикеткой и передает его контроллеру.
    """
    return await scan_controller.upload_image(image)
