import { expect, test } from '@playwright/test';

test('restores session and logs out', async ({ page }) => {
  await page.route('**/api/users/profile', async (route) => {
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

  await page.route('**/api/users/allergies/list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Молоко' }]),
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ msg: 'ok' }),
    });
  });

  await page.goto('/');

  await expect(page.getByText(/профиль/i)).toBeVisible();
  await page.getByRole('button').filter({ hasText: /^$/ }).last().click();
  await expect(page.getByRole('heading', { name: /food allergy detector/i })).toBeVisible();
});
