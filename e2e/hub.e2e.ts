import { expect, test } from '@playwright/test';

test('home shows catalog and navigates to needle chart', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Knitting Tools/i);
	await page.getByRole('link', { name: /Needle size chart/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Needle size chart/i);
	await expect(page.getByRole('link', { name: /All tools/i })).toBeVisible();
});

test('italian locale shows translated home', async ({ page }) => {
	await page.goto('/it/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Strumenti maglieria/i);
});

test('italian jacquard tool page loads', async ({ page }) => {
	await page.goto('/it/tools/jacquard-pattern');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		/Convertitore pattern jacquard/i
	);
	await expect(page.getByRole('link', { name: /^IT$/i })).toHaveAttribute('aria-current', 'page');
});

test('back link returns to catalog', async ({ page }) => {
	await page.goto('/tools/needle-chart');
	await page.getByRole('link', { name: /All tools/i }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('heading', { level: 2 })).toContainText(/Tools/i);
});
