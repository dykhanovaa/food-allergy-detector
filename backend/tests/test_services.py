from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

from app.services.auth_service import AuthService
from app.services.food_service import get_product_by_barcode


pytestmark = pytest.mark.unit


def test_auth_service_authenticates_valid_user(monkeypatch):
    user = SimpleNamespace(email="user@test.com", hashed_password="hashed")

    class FakeRepo:
        def get_by_email(self, email):
            return user if email == "user@test.com" else None

    monkeypatch.setattr(
        "app.services.auth_service.verify_password",
        lambda plain_password, hashed_password: plain_password == "secret" and hashed_password == "hashed",
    )

    service = AuthService(FakeRepo())

    assert service.authenticate_user("user@test.com", "secret") is user
    assert service.authenticate_user("user@test.com", "bad") is None


def test_auth_service_create_tokens_updates_refresh_token(monkeypatch):
    user = SimpleNamespace(email="user@test.com")
    captured = {}

    class FakeRepo:
        def update_refresh_token(self, target_user, token, expires):
            captured["user"] = target_user
            captured["token"] = token
            captured["expires"] = expires

    monkeypatch.setattr("app.services.auth_service.create_access_token", lambda data: "access-token")
    monkeypatch.setattr("app.services.auth_service.create_refresh_token", lambda data: "refresh-token")

    service = AuthService(FakeRepo())
    tokens = service.create_tokens(user)

    assert tokens["access_token"] == "access-token"
    assert tokens["refresh_token"] == "refresh-token"
    assert captured["user"] is user
    assert isinstance(captured["expires"], datetime)
    assert captured["expires"] > datetime.utcnow() + timedelta(days=6)


@pytest.mark.asyncio
async def test_food_service_returns_product_when_api_status_is_success(monkeypatch):
    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "status": 1,
                "product": {"product_name": "Milk"},
            }

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url, timeout):
            return FakeResponse()

    monkeypatch.setattr("app.services.food_service.httpx.AsyncClient", lambda: FakeClient())

    product = await get_product_by_barcode("1234567890123")

    assert product == {"product_name": "Milk"}


@pytest.mark.asyncio
async def test_food_service_returns_none_on_remote_failure(monkeypatch):
    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url, timeout):
            raise RuntimeError("boom")

    monkeypatch.setattr("app.services.food_service.httpx.AsyncClient", lambda: FakeClient())

    product = await get_product_by_barcode("1234567890123")

    assert product is None
