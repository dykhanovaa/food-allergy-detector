from app.core.storage import upload_file, generate_presigned_url, delete_file
from app.db.repository.scan_repo import ScanRepository
from app.db.models import Scan
import json

class ScanService:
    def __init__(self, scan_repo: ScanRepository):
        self.scan_repo = scan_repo

    def create_scan(self, user_id: int, file, product_name: str, ingredients: str, detected_allergens: list, is_safe: bool):
        # Загружаем файл в хранилище
        file_key = f"scans/{user_id}/{file.filename}"
        upload_file(file.file, file_key)

        scan = Scan(
            user_id=user_id,
            image_url=file_key,
            product_name=product_name,
            ingredients=ingredients,
            detected_allergens=json.dumps(detected_allergens),
            is_safe=is_safe
        )
        return self.scan_repo.create(scan)

    def get_scans(self, user_id: int, **filters):
        return self.scan_repo.get_by_user(user_id, **filters)

    def get_scan_url(self, file_key: str):
        return generate_presigned_url(file_key)

    def delete_scan(self, scan_id: int, user_id: int):
        scan = self.scan_repo.get_by_id(scan_id)
        if not scan or scan.user_id != user_id:
            return False
        delete_file(scan.image_url)
        return self.scan_repo.delete(scan_id, user_id)