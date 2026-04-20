import pytest


pytestmark = pytest.mark.integration


def test_register_user_returns_created(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "securepass123",
            "name": "Test User",
        },
    )

    assert response.status_code == 201
    assert response.json() == {"msg": "Регистрация успешна"}


def test_register_duplicate_email_returns_400(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@test.com",
            "password": "pass12345",
            "name": "User1",
        },
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@test.com",
            "password": "pass67890",
            "name": "User2",
        },
    )

    assert response.status_code == 400
    assert "существует" in response.json()["detail"]


def test_register_validation_error_for_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "securepass123", "name": "User"},
    )

    assert response.status_code == 422


def test_login_success_sets_auth_cookies(client):
    client.post(
        "/api/auth/register",
        json={"email": "login@test.com", "password": "loginpass123", "name": "User"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "login@test.com", "password": "loginpass123"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token")
    assert response.cookies.get("refresh_token")


def test_login_invalid_credentials_returns_400(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "wrong@test.com", "password": "wrongpass"},
    )

    assert response.status_code == 400
    assert "Неверный email" in response.json()["detail"]


def test_refresh_token_returns_new_access_token(client):
    client.post(
        "/api/auth/register",
        json={"email": "refresh@test.com", "password": "refreshpass", "name": "User"},
    )
    login_response = client.post(
        "/api/auth/login",
        json={"email": "refresh@test.com", "password": "refreshpass"},
    )

    response = client.post(
        "/api/auth/refresh",
        cookies={"refresh_token": login_response.cookies.get("refresh_token")},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token")


def test_refresh_token_missing_cookie_returns_401(client):
    response = client.post("/api/auth/refresh")

    assert response.status_code == 401
    assert "отсутствует" in response.json()["detail"]


def test_refresh_token_invalid_value_returns_401(client):
    response = client.post("/api/auth/refresh", cookies={"refresh_token": "bad-token"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Невалидный refresh token"


def test_logout_clears_auth_cookies(client, auth_cookies):
    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    set_cookie_headers = response.headers.get_list("set-cookie")
    assert any("access_token=" in header for header in set_cookie_headers)
    assert any("refresh_token=" in header for header in set_cookie_headers)
