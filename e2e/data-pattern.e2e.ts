import { expect, test } from '@playwright/test';

test('data pattern tool page loads from catalog', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Data pattern generator/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Data pattern generator/i);
});

test('data pattern tool shows source picker cards', async ({ page }) => {
	await page.goto('/tools/data-pattern/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Data pattern generator/i);
	// Source step is visible with 3 source cards
	await expect(page.getByRole('radio', { name: /Record from microphone/i })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Upload MP3, WAV, or OGG/i })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Pick a place on the map/i })).toBeVisible();
	// Continue button is disabled until a source is selected
	await expect(page.getByRole('button', { name: /Continue/i })).toBeDisabled();
});

test('selecting a source enables the Continue button', async ({ page }) => {
	await page.goto('/tools/data-pattern/');
	await page.getByRole('radio', { name: /Upload MP3, WAV, or OGG/i }).click();
	await expect(page.getByRole('button', { name: /Continue/i })).toBeEnabled();
});
