import { expect, test } from '@playwright/test';

test('login, analyze, filter scans and use barcode lookup', async ({ page }) => {
  let isAuthenticated = false;

  await page.route('**/api/auth/login', async (route) => {
    isAuthenticated = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ msg: 'ok' }),
    });
  });

  await page.route('**/api/users/allergies/list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Молоко' },
        { id: 2, name: 'Орехи' },
      ]),
    });
  });

  await page.route('**/api/users/profile', async (route) => {
    if (!isAuthenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not authenticated' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'user@test.com',
        name: 'User',
        allergies: ['Молоко'],
        role: 'user',
      }),
    });
  });

  await page.route('**/api/scans/analyze', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        scan_id: 1,
        product_name: 'Milk bar',
        ingredients: ['milk', 'sugar'],
        detected_allergens: ['Молоко'],
        is_safe: false,
        warnings: ['Найдена аллергия: Молоко'],
      }),
    });
  });

  await page.route('**/api/scans?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 1,
            image_url: null,
            product_name: 'Milk bar',
            ingredients: ['milk', 'sugar'],
            detected_allergens: ['Молоко'],
            is_safe: false,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }),
    });
  });

  await page.route('**/api/scans/1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ msg: 'deleted' }),
    });
  });

  await page.route('**/api/scans/barcode-lookup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Coca-Cola',
        brands: 'Coca-Cola',
        categories: 'Beverages',
        nutriments: { energy_100g: 42 },
        image_url: '',
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /food allergy detector/i })).toBeVisible();
  await page.getByRole('button', { name: /войти/i }).click();
  await page.getByLabel(/email/i).fill('user@test.com');
  await page.locator('#password').fill('password123');
  await page.getByRole('button', { name: /войти/i }).click();

  await expect(page.getByText(/профиль/i)).toBeVisible();
  await page.getByRole('button', { name: /анализ/i }).click();

  await page.setInputFiles('input[type="file"]', {
    name: 'label.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-image'),
  });
  await page.getByRole('button', { name: /начать анализ/i }).click();

  await expect(page.getByText(/результат анализа/i)).toBeVisible();
  await page.getByRole('button', { name: /профиль/i }).click();
  await page.getByRole('button', { name: /мои сканы/i }).click();
  await expect(page.getByText('Milk bar')).toBeVisible();
  await page.getByPlaceholder(/название или ингредиенты/i).fill('milk');
  await expect(page.getByText('Milk bar')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /удалить/i }).click();

  isAuthenticated = false;
  await page.goto('/');
  await page.getByRole('button', { name: /штрихкоду/i }).click();
  await page.setInputFiles('input[type="file"]', {
    name: 'barcode.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-image'),
  });
  await page.getByRole('button', { name: /найти продукт/i }).click();
  await expect(page.getByRole('heading', { name: 'Coca-Cola' })).toBeVisible();
});
