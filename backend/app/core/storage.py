import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

executor = ThreadPoolExecutor(max_workers=10)


async def upload_file(file_data: bytes, object_name: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        executor,
        _sync_upload,
        file_data,
        object_name,
    )


def _sync_upload(file_data: bytes, object_name: str):
    try:
        data_stream = BytesIO(file_data)
        minio_client.put_object(
            settings.MINIO_BUCKET,
            object_name,
            data_stream,
            length=len(file_data),
            part_size=10 * 1024 * 1024,
        )
    except S3Error as exc:
        raise Exception(f"MinIO error: {exc}") from exc


async def generate_presigned_url(object_name: str, expires=3600):
    if settings.MINIO_PUBLIC_BASE_URL:
        base_url = settings.MINIO_PUBLIC_BASE_URL.rstrip("/")
        return f"{base_url}/{settings.MINIO_BUCKET}/{object_name}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        _sync_presigned_url,
        object_name,
        expires,
    )


def _sync_presigned_url(object_name: str, expires: int):
    expires_delta = timedelta(seconds=expires)
    return minio_client.presigned_get_object(
        settings.MINIO_BUCKET,
        object_name,
        expires=expires_delta,
    )


async def delete_file(object_name: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _sync_delete, object_name)


def _sync_delete(object_name: str):
    try:
        minio_client.remove_object(settings.MINIO_BUCKET, object_name)
    except S3Error:
        pass


def ensure_bucket_exists() -> None:
    found = minio_client.bucket_exists(settings.MINIO_BUCKET)
    if not found:
        minio_client.make_bucket(settings.MINIO_BUCKET)


def check_storage_connection() -> bool:
    ensure_bucket_exists()
    return True
