import io
import sys
from pathlib import Path
from typing import Callable, Generator

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.security import get_password_hash
from app.core.dependencies import get_db as dependency_get_db
from app.db.database import Base, get_db
from app.db.models import Allergy, Scan, User
from app.main import app


@pytest.fixture(scope="session")
def engine(tmp_path_factory):
    db_file = tmp_path_factory.mktemp("data") / "test.db"
    return create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )


@pytest.fixture(scope="session", autouse=True)
def setup_test_db(engine):
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(engine) -> Generator[Session, None, None]:
    testing_session_local = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    connection = engine.connect()
    transaction = connection.begin()
    session = testing_session_local(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[dependency_get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_allergies(db: Session) -> list[Allergy]:
    allergies = [
        Allergy(name="Молоко"),
        Allergy(name="Орехи"),
        Allergy(name="Соя"),
    ]
    db.add_all(allergies)
    db.commit()
    for allergy in allergies:
        db.refresh(allergy)
    return allergies


@pytest.fixture
def create_user(db: Session) -> Callable[..., User]:
    def _create_user(
        *,
        email: str,
        password: str = "password123",
        name: str = "Test User",
        role: str = "user",
        allergies: list[Allergy] | None = None,
    ) -> User:
        user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash(password),
            role=role,
        )
        if allergies:
            user.allergies = allergies
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _create_user


@pytest.fixture
def login_user(client: TestClient) -> Callable[[str, str], dict[str, str]]:
    def _login_user(email: str, password: str = "password123") -> dict[str, str]:
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert response.status_code == 200, response.text
        client.cookies.set("access_token", response.cookies.get("access_token"))
        client.cookies.set("refresh_token", response.cookies.get("refresh_token"))
        return {
            "access_token": response.cookies.get("access_token"),
            "refresh_token": response.cookies.get("refresh_token"),
        }

    return _login_user


@pytest.fixture
def auth_cookies(client: TestClient) -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200, response.text
    client.cookies.set("access_token", response.cookies.get("access_token"))
    client.cookies.set("refresh_token", response.cookies.get("refresh_token"))
    return {
        "access_token": response.cookies.get("access_token"),
        "refresh_token": response.cookies.get("refresh_token"),
    }


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (32, 32), color="red")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def create_scan(db: Session) -> Callable[..., Scan]:
    def _create_scan(
        *,
        user_id: int,
        image_url: str = "scans/user/file.png",
        product_name: str = "Test product",
        ingredients: str = "milk, sugar",
        detected_allergens: str = '["Молоко"]',
        is_safe: bool = False,
    ) -> Scan:
        scan = Scan(
            user_id=user_id,
            image_url=image_url,
            product_name=product_name,
            ingredients=ingredients,
            detected_allergens=detected_allergens,
            is_safe=is_safe,
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        return scan

    return _create_scan
