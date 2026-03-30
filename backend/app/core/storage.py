# backend/app/core/storage.py

import asyncio
from concurrent.futures import ThreadPoolExecutor
from minio import Minio
from minio.error import S3Error
from app.core.config import settings
from io import BytesIO
from datetime import timedelta

# Инициализация MinIO клиента
minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False 
)

executor = ThreadPoolExecutor(max_workers=10)

async def upload_file(file_data: bytes, object_name: str):
    """Асинхронная загрузка файла в MinIO"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        executor,
        _sync_upload,
        file_data,
        object_name
    )

def _sync_upload(file_data: bytes, object_name: str):
    """Синхронная загрузка (вызывается в потоке)"""
    try:
        data_stream = BytesIO(file_data)
        minio_client.put_object(
            settings.MINIO_BUCKET,
            object_name,
            data_stream,
            length=len(file_data),
            part_size=10*1024*1024
        )
    except S3Error as e:
        raise Exception(f"MinIO error: {e}")

async def generate_presigned_url(object_name: str, expires=3600):
    """Генерация pre-signed URL"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        _sync_presigned_url,
        object_name,
        expires
    )

def _sync_presigned_url(object_name: str, expires: int):
    expires_delta = timedelta(seconds=expires)
    return minio_client.presigned_get_object(
        settings.MINIO_BUCKET, 
        object_name, 
        expires=expires_delta
    )

async def delete_file(object_name: str):
    """Удаление файла"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _sync_delete, object_name)

def _sync_delete(object_name: str):
    try:
        minio_client.remove_object(settings.MINIO_BUCKET, object_name)
    except S3Error:
        pass