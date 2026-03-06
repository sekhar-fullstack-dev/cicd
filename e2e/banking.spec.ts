import { expect, test } from '@playwright/test';

test('happy path: login, send money, verify transaction success', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('send-submit')).toBeEnabled();

  await page.getByTestId('amount').fill('200');
  await page.getByTestId('send-submit').click();

  await expect(page.getByTestId('tx-tx-1')).toContainText('pending');
  await page.getByTestId('verify-tx-1').click();

  await expect(page.getByTestId('tx-tx-1')).toContainText('success');
});

test('auth failure: invalid credentials', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('login-email').fill('invalid@bank.test');
  await page.getByTestId('login-submit').click();

  await expect(page.getByText('Invalid credentials.')).toBeVisible();
});

test('transfer failure: insufficient funds', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('send-submit')).toBeEnabled();

  await page.getByTestId('amount').fill('9999');
  await page.getByTestId('send-submit').click();

  await expect(page.getByText('Insufficient funds.')).toBeVisible();
});

test('verification failure: amount above compliance threshold', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('send-submit')).toBeEnabled();

  await page.getByTestId('amount').fill('600');
  await page.getByTestId('send-submit').click();

  await page.getByTestId('verify-tx-1').click();
  await expect(page.getByTestId('tx-tx-1')).toContainText('failed');
});
