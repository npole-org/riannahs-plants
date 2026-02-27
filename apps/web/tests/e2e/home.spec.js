import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "riannah's plants" })).toBeVisible();
  await expect(page.getByText('Total plants: 0')).toBeVisible();
});
