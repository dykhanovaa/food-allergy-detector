from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from app.db.models import Scan
from typing import List, Optional
from sqlalchemy import func

class ScanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, scan: Scan) -> Scan:
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        return scan

    def get_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 10,
        search: str = None,
        is_safe: bool = None,
        sort_by: str = "created_at",
        order: str = "desc"
    ):
        query = self.db.query(Scan).filter(Scan.user_id == user_id)

        # Фильтрация поиска
        if search:
            query = query.filter(
                Scan.product_name.ilike(f"%{search}%") |
                Scan.ingredients.ilike(f"%{search}%")
            )

        # Фильтрация по безопасности
        if is_safe is not None:
            query = query.filter(Scan.is_safe == is_safe)

        # Валидация поля сортировки (только разрешённые поля)
        allowed_sort_fields = {"created_at", "product_name", "is_safe"}
        if sort_by not in allowed_sort_fields:
            sort_by = "created_at"

        sort_column = getattr(Scan, sort_by)

        # Применяем сортировку
        if order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Подсчёт общего количества ДО применения limit/offset
        total = query.count()

        # Применяем пагинацию
        scans = query.offset(skip).limit(limit).all()

        return total, scans

    def get_by_id(self, scan_id: int):
        return self.db.query(Scan).filter(Scan.id == scan_id).first()

    def delete(self, scan_id: int, user_id: int) -> bool:
        scan = self.db.query(Scan).filter(
            Scan.id == scan_id,
            Scan.user_id == user_id
        ).first()
        if scan:
            self.db.delete(scan)
            self.db.commit()
            return True
        return False