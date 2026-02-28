import { test, expect } from '@playwright/test';

test('login endpoint is reachable from deployed app (no Pages 405)', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password').fill('nottherightpass');

  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
  );

  await page.getByRole('button', { name: 'Sign in' }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).not.toBe(405);
  await expect(page.getByRole('alert')).toBeVisible();
});
