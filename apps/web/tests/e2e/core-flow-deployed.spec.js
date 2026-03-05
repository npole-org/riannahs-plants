import { env } from 'node:process';
import { test, expect } from '@playwright/test';

const email = env.E2E_EMAIL;
const password = env.E2E_PASSWORD;

test.skip(!email || !password, 'E2E_EMAIL/E2E_PASSWORD not set');

test('core deployed flow: login, add plant, see due/tasks sections', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Signed in as')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Due tasks' })).toBeVisible();

  const summary = page.getByLabel('dashboard-summary');
  const beforeText = (await summary.textContent()) || '';
  const beforeMatch = beforeText.match(/Total plants:\s*(\d+)/);
  const beforeCount = beforeMatch ? Number(beforeMatch[1]) : 0;

  const nickname = `e2e-${Date.now()}`;
  await page.getByLabel('New plant nickname').fill(nickname);

  const createResp = page.waitForResponse((r) => r.url().includes('/plants') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add plant' }).click();
  const resp = await createResp;
  expect(resp.ok()).toBeTruthy();

  await expect.poll(async () => {
    const text = (await summary.textContent()) || '';
    const m = text.match(/Total plants:\s*(\d+)/);
    return m ? Number(m[1]) : 0;
  }, { timeout: 15000 }).toBeGreaterThanOrEqual(beforeCount + 1);

  await expect(page.getByRole('heading', { name: 'Repot this week' })).toBeVisible();
});
