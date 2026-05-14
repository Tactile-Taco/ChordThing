import { test, expect } from '@playwright/test';

test('page loads and returns 200', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);
});

test('title contains ChordMan', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ChordMan/i);
});

test('typer display element exists', async ({ page }) => {
  await page.goto('/');
  const typerDisplay = page.locator('#typer-display');
  await expect(typerDisplay).toHaveCount(1);
  // Element may be hidden by CSS (zero height or similar), but it exists in DOM
  await expect(typerDisplay).toBeAttached();
});

test('device connect button exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#chara-connect')).toBeVisible();
});
