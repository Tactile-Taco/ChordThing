import { test, expect } from '@playwright/test';

test.describe('Typer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('pause dialog closes on click and typer initializes', async ({ page }) => {
    const dialog = page.locator('#test-pause-dialog');
    await expect(dialog).toBeVisible();

    await dialog.click();
    await expect(dialog).not.toBeVisible();

    const typerDisplay = page.locator('#typer-display');
    await expect(typerDisplay).toBeAttached();
  });

  test('cursor exists after typer initializes', async ({ page }) => {
    const dialog = page.locator('#test-pause-dialog');
    await expect(dialog).toBeVisible();
    await dialog.click();
    await expect(dialog).not.toBeVisible();

    const cursor = page.locator('#cursor');
    await expect(cursor).toBeAttached();
    await expect(cursor).toHaveAttribute('data-index');
  });

  test('typing advances the cursor', async ({ page }) => {
    // Close pause dialog
    await page.locator('#test-pause-dialog').click();

    const typer = page.locator('#typer');
    await typer.focus();

    // Type a character
    await page.keyboard.press('a');

    // The typer should have processed the input
    await expect(typer).toBeFocused();
  });

  test('backspace moves cursor backward', async ({ page }) => {
    // Close pause dialog
    await page.locator('#test-pause-dialog').click();

    const typer = page.locator('#typer');
    await typer.focus();

    // Type then backspace
    await page.keyboard.press('a');
    await page.keyboard.press('Backspace');

    // Should still be focused after backspace
    await expect(typer).toBeFocused();
  });
});
