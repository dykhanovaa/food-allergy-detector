from io import BytesIO

import pytest


pytestmark = pytest.mark.integration


def test_analyze_image_requires_authentication(client, sample_image_bytes):
    response = client.post(
        "/api/scans/analyze",
        files={"file": ("label.png", BytesIO(sample_image_bytes), "image/png")},
    )

    assert response.status_code == 401


def test_analyze_image_rejects_invalid_content_type(client, auth_cookies):
    response = client.post(
        "/api/scans/analyze",
        files={"file": ("notes.txt", BytesIO(b"hello"), "text/plain")},
    )

    assert response.status_code == 400
    assert "формат" in response.json()["detail"]


def test_analyze_image_creates_scan_and_detects_user_allergens(
    client,
    create_user,
    login_user,
    sample_image_bytes,
    monkeypatch,
    db,
):
    from app.db.models import Allergy

    allergy = Allergy(name="milk")
    db.add(allergy)
    db.commit()
    db.refresh(allergy)

    create_user(
        email="scan@test.com",
        allergies=[allergy],
    )
    login_user("scan@test.com")

    async def fake_upload_file(file_data, object_name):
        assert file_data
        assert object_name.endswith("label.png")

    monkeypatch.setattr("app.api.routes.scans.upload_file", fake_upload_file)
    monkeypatch.setattr(
        "app.api.routes.scans.pytesseract.image_to_string",
        lambda image, lang=None: "Product: Milk Bar\nIngredients: milk, sugar",
    )

    response = client.post(
        "/api/scans/analyze",
        files={"file": ("label.png", BytesIO(sample_image_bytes), "image/png")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Milk Bar"
    assert data["detected_allergens"] == ["milk"]
    assert data["is_safe"] is False


def test_barcode_lookup_returns_product_data(client, sample_image_bytes, monkeypatch):
    async def fake_get_product_by_barcode(barcode):
        assert barcode == "5449000054227"
        return {
            "product_name": "Coca-Cola",
            "brands": "Coca-Cola",
            "categories": "Beverages",
            "nutriments": {"energy_100g": 42},
            "image_front_url": "https://example.com/image.jpg",
        }

    monkeypatch.setattr(
        "app.api.routes.scans.pytesseract.image_to_string",
        lambda image, lang=None: "no barcode in text",
    )
    monkeypatch.setattr("app.api.routes.scans.get_product_by_barcode", fake_get_product_by_barcode)

    response = client.post(
        "/api/scans/barcode-lookup",
        files={"file": ("barcode.png", BytesIO(sample_image_bytes), "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Coca-Cola"


def test_barcode_lookup_returns_404_when_product_not_found(client, sample_image_bytes, monkeypatch):
    async def fake_get_product_by_barcode(barcode):
        return None

    monkeypatch.setattr(
        "app.api.routes.scans.pytesseract.image_to_string",
        lambda image, lang=None: "4601234567890",
    )
    monkeypatch.setattr("app.api.routes.scans.get_product_by_barcode", fake_get_product_by_barcode)

    response = client.post(
        "/api/scans/barcode-lookup",
        files={"file": ("barcode.png", BytesIO(sample_image_bytes), "image/png")},
    )

    assert response.status_code == 404


def test_list_scans_returns_paginated_data(
    client,
    create_user,
    login_user,
    create_scan,
    monkeypatch,
):
    user = create_user(email="history@test.com")
    create_scan(
        user_id=user.id,
        product_name="Safe product",
        ingredients="rice",
        detected_allergens="[]",
        is_safe=True,
    )
    create_scan(
        user_id=user.id,
        product_name="Hazelnut cream",
        ingredients="nuts, sugar",
        detected_allergens='["Орехи"]',
        is_safe=False,
    )
    login_user("history@test.com")

    async def fake_generate_presigned_url(object_name):
        return f"https://storage.local/{object_name}"

    monkeypatch.setattr("app.api.routes.scans.generate_presigned_url", fake_generate_presigned_url)

    response = client.get(
        "/api/scans/",
        params={"search": "Hazelnut", "is_safe": "false", "size": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["pages"] == 1
    assert payload["items"][0]["product_name"] == "Hazelnut cream"
    assert payload["items"][0]["image_url"].startswith("https://storage.local/")


def test_delete_scan_removes_existing_item(
    client,
    create_user,
    login_user,
    create_scan,
    monkeypatch,
):
    user = create_user(email="delete@test.com")
    scan = create_scan(user_id=user.id)
    login_user("delete@test.com")
    deleted_keys = []

    async def fake_delete_file(object_name):
        deleted_keys.append(object_name)

    monkeypatch.setattr("app.api.routes.scans.delete_file", fake_delete_file)

    response = client.delete(f"/api/scans/{scan.id}")

    assert response.status_code == 200
    assert deleted_keys == [scan.image_url]


def test_delete_scan_cannot_remove_foreign_item(
    client,
    create_user,
    login_user,
    create_scan,
):
    owner = create_user(email="owner@test.com")
    create_user(email="intruder@test.com")
    scan = create_scan(user_id=owner.id)
    login_user("intruder@test.com")

    response = client.delete(f"/api/scans/{scan.id}")

    assert response.status_code == 404


def test_sitemap_xml(client):
    response = client.get("/sitemap.xml")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/xml"
    assert b"<loc>http://localhost:5173/</loc>" in response.content
    assert b"<loc>http://localhost:5173/barcode-lookup</loc>" in response.content


def test_robots_txt(client):
    response = client.get("/robots.txt")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "Disallow: /profile/" in response.text
    assert "Sitemap: http://localhost:8000/sitemap.xml" in response.text
