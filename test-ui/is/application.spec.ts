import { test, expect } from '@playwright/test';

test('Filters Software Engineering study application', async ({ page }) => {
  await page.goto('https://is.muni.cz/?lang=cs');
  await page.getByRole('link', { name: 'Založit přihlášku' }).click();
  await page.getByRole('link', { name: ']" / " Oblast studia Vyberte' }).click();
  await page.getByRole('link', { name: 'Informatika, programování a v' }).click();
  await page.getByRole('link', { name: ']" / " Typ studia Vyberte typ' }).click();
  await page.getByText('Navazující magisterské (pro').click();
  await page.getByRole('link', { name: ']" / " Forma studia Vyberte' }).click();
  await page.getByLabel('Forma studia Vyberte formu').locator('div').filter({ hasText: 'Prezenční forma' }).click();
  await page.getByRole('link', { name: ']" / " Fakulta Libovolná' }).click();
  await page.getByLabel('Fakulta Libovolná fakulta').locator('div').filter({ hasText: 'Fakulta informatiky' }).click();
  await page.getByRole('link', { name: ']" / " Jazyk studia Libovoln' }).click();
  await page.getByLabel('Jazyk studia Libovolný jazyk').locator('div').filter({ hasText: 'Čeština' }).click();
  await expect(page.getByRole('link', { name: 'Softwarové inženýrství' })).toBeVisible();
});