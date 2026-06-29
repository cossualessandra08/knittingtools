import { expect, test, type Page } from '@playwright/test';

async function createBlankGrid(page: Page, width = 10, height = 5) {
	await page.goto('tools/intarsia-assistant/');
	await page.evaluate(() => localStorage.clear());
	await page.reload();

	await page.getByRole('button', { name: /Create grid/i }).first().click();
	await page.getByLabel('Width (stitches)').fill(String(width));
	await page.getByLabel('Height (rows)').fill(String(height));
	await page.getByRole('button', { name: /^Create grid$/i }).click();
	await expect(page.getByText('Row 1', { exact: true }).first()).toBeVisible();
}

test('intarsia tool page loads from catalog', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Intarsia work assistant/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Intarsia work assistant/i);
	await expect(page.getByText(/Load or create a pattern to get started/i)).toBeVisible();
});

test('create blank grid flow shows Row 1', async ({ page }) => {
	await createBlankGrid(page, 10, 5);
	await expect(page.getByRole('button', { name: /Next row/i })).toBeVisible();
});

test('next row button advances to Row 2', async ({ page }) => {
	await createBlankGrid(page, 10, 5);
	await page.getByRole('button', { name: /Next row/i }).click();
	await expect(page.getByText('Row 2', { exact: true }).first()).toBeVisible();
});

test('keyboard ArrowRight after grid focused', async ({ page }) => {
	await createBlankGrid(page, 10, 5);
	await page.getByLabel('Pattern grid').click();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByText('Row 1', { exact: true }).first()).toBeVisible();
	await page.getByRole('button', { name: /Next row/i }).click();
	await expect(page.getByText('Row 2', { exact: true }).first()).toBeVisible();
});
