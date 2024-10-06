import { test, expect } from '@playwright/test';

test('Checks searchbox pops up after clicking the search button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByLabel('Vyhledávání').click();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('Checks search button pops up after clicking the search button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByLabel('Vyhledávání').click();
  await expect(page.getByRole('button', { name: 'Vyhledat' })).toBeVisible();
});

test('Searches PV252 in catalog', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByLabel('Vyhledávání').click();
  await page.getByRole('searchbox').fill('pv252');
  await page.getByRole('button', { name: 'Vyhledat' }).click();
  await expect(page.getByText('PV252 Frontend Web Development and User Experience Předmět Katedra počítačových')).toBeVisible();
  await page.getByRole('link', { name: 'PV252 Frontend Web Development and User Experience', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PV252 Frontend Web Development and User Experience' })).toBeVisible();
});