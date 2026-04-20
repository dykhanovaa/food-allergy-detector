import pytest


pytestmark = pytest.mark.integration


def test_profile_requires_authentication(client):
    response = client.get("/api/users/profile")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_profile_returns_current_user_data(client, create_user, login_user, seeded_allergies):
    create_user(
        email="profile@test.com",
        allergies=seeded_allergies[:2],
        role="admin",
        name="Profile User",
    )
    login_user("profile@test.com")

    response = client.get("/api/users/profile")

    assert response.status_code == 200
    assert response.json() == {
        "email": "profile@test.com",
        "name": "Profile User",
        "allergies": ["Молоко", "Орехи"],
        "role": "admin",
    }


def test_add_user_allergies_updates_selection(client, create_user, login_user, seeded_allergies):
    create_user(email="allergies@test.com")
    login_user("allergies@test.com")

    response = client.post(
        "/api/users/allergies",
        json={"allergy_ids": [seeded_allergies[0].id, seeded_allergies[2].id]},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Аллергии успешно обновлены"

    profile_response = client.get("/api/users/profile")
    assert profile_response.json()["allergies"] == ["Молоко", "Соя"]


def test_add_user_allergies_returns_400_for_unknown_id(client, create_user, login_user):
    create_user(email="invalid-allergy@test.com")
    login_user("invalid-allergy@test.com")

    response = client.post(
        "/api/users/allergies",
        json={"allergy_ids": [999]},
    )

    assert response.status_code == 400
    assert "не найдены" in response.json()["detail"]


def test_admin_endpoint_forbidden_for_regular_user(client, create_user, login_user):
    create_user(email="user@test.com", role="user")
    login_user("user@test.com")

    response = client.get("/api/admin/users")

    assert response.status_code == 403


def test_admin_can_list_users(client, create_user, login_user):
    create_user(email="admin@test.com", role="admin", name="Admin")
    create_user(email="member@test.com", role="user", name="Member")
    login_user("admin@test.com")

    response = client.get("/api/admin/users")

    assert response.status_code == 200
    emails = {item["email"] for item in response.json()}
    assert {"admin@test.com", "member@test.com"} <= emails


def test_admin_can_update_other_user_role(client, create_user, login_user, db):
    create_user(email="boss@test.com", role="admin")
    target_user = create_user(email="target@test.com", role="user")
    login_user("boss@test.com")

    response = client.patch(
        f"/api/admin/users/{target_user.id}/role",
        params={"new_role": "admin"},
    )

    assert response.status_code == 200
    db.refresh(target_user)
    assert target_user.role == "admin"


def test_admin_cannot_change_own_role(client, create_user, login_user):
    admin = create_user(email="self@test.com", role="admin")
    login_user("self@test.com")

    response = client.patch(
        f"/api/admin/users/{admin.id}/role",
        params={"new_role": "user"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Нельзя изменить свою роль"
