/* eslint-env node */
import { test, expect } from '@playwright/test';

test('login endpoint is reachable from deployed app (no Pages 405)', async ({ page, request }) => {
  await page.goto('/');

  const apiBaseUrl = process.env.API_BASE_URL;
  expect(apiBaseUrl, 'API_BASE_URL must be provided by deploy-api job output').toBeTruthy();

  const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      email: 'nobody@example.com',
      password: 'nottherightpass'
    }
  });

  expect(loginResponse.status()).not.toBe(405);
});
