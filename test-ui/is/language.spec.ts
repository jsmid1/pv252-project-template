import { test, expect } from '@playwright/test';

test('Changes language to English', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await expect(page.getByLabel('switches IS into English')).toBeVisible();
  await page.getByLabel('switches IS into English').click();
  await expect(page.getByLabel('Masaryk University')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});