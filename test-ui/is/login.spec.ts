import { test, expect } from '@playwright/test';

test('Checks login page is shown after clicking the login button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByRole('link', { name: 'Přihlásit se' }).click();
  await expect(page.getByRole('heading', { name: 'Přihlášení do IS MU' })).toBeVisible();
});

test('Checks login page contains login button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByRole('link', { name: 'Přihlásit se' }).click();
  await expect(page.getByRole('heading', { name: 'Přihlášení do IS MU' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Přihlásit' })).toBeVisible();
});

test('Checks login page contains login recovery link', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByRole('link', { name: 'Přihlásit se' }).click();
  await page.getByRole('link', { name: 'Nemůžete se přihlásit?' }).click();
  await expect(page.getByText('Obnova přístupu do IS MU')).toBeVisible();
});

test('Tries to log in with incorrect password', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByRole('link', { name: 'Přihlásit se' }).click();
  await page.getByLabel('Učo nebo přezdívka*').click();
  await page.getByLabel('Učo nebo přezdívka*').fill('524816');
  await page.getByLabel('Primární heslo*').click();
  await page.getByLabel('Primární heslo*').fill('test');
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await expect(page.locator('div').filter({ hasText: /^Nesprávné přihlašovací jméno nebo heslo\.$/ })).toBeVisible();
});