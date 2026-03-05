import { test, expect } from '@playwright/test';

test('login endpoint is reachable from deployed app (no Pages 405)', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password').fill('nottherightpass');

  const loginRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().includes('/auth/login'),
    { timeout: 15000 }
  );

  await page.getByRole('button', { name: 'Sign in' }).click();

  const loginRequest = await loginRequestPromise;
  const loginResponse = await loginRequest.response();
  expect(loginResponse).not.toBeNull();
  expect(loginResponse.status()).not.toBe(405);
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });
});
