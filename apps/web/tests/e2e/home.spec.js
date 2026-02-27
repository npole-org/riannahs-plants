import { test, expect } from '@playwright/test';

test('home page loads with login prompt', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "riannah's plants" })).toBeVisible();
  await expect(page.getByText('Sign in to continue.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
