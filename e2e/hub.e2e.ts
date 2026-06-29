import { expect, test } from '@playwright/test';

test('home shows intro, catalog, and navigates to needle chart', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Knitting Tools/i);
	await expect(page.getByText(/Free tools for knitting/i)).toBeVisible();
	await page.getByRole('link', { name: /Needle size chart/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Needle size chart/i);
	await expect(page.getByRole('link', { name: /All tools/i })).toBeVisible();
});

test('back link returns to catalog', async ({ page }) => {
	await page.goto('tools/needle-chart/');
	await page.getByRole('link', { name: /All tools/i }).click();
	await expect(page).toHaveURL(/\/knittingtools\/?$/);
	await expect(page.getByRole('heading', { level: 2 })).toContainText(/Tools/i);
});
