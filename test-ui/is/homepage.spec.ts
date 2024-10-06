import { expect } from "@playwright/test";
import { test } from "../coverage_wrapper";

test('Checks that homepage contains title', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await expect(page.getByLabel('Informační systém Masarykovy')).toBeVisible();
});

test('Checks that homepage contains search button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await expect(page.getByLabel('Vyhledávání')).toBeVisible();
});

test('Checks that homepage contains language switch', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByLabel('switches IS into English').click();
});

test('Checks that homepage contains login button', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await expect(page.getByLabel('Přihlášení do IS MU')).toBeVisible();
});
