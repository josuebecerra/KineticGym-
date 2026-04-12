import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Kinetic/i);
});

test('loads the login or main screen', async ({ page }) => {
  await page.goto('/');

  // Check for the main brand name in the page
  const brand = page.getByText(/KINETIC/i).first();
  await expect(brand).toBeVisible();
});
