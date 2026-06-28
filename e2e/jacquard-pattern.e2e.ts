import { expect, test } from '@playwright/test';
import path from 'node:path';

test('jacquard tool page loads from catalog', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Jacquard pattern converter/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Jacquard pattern converter/i);
	await expect(page.getByRole('button', { name: /^Image$/i })).toBeVisible();
});

test('upload shows preview and enables export', async ({ page }) => {
	await page.goto('tools/jacquard-pattern/');
	const fixture = path.join(process.cwd(), 'e2e/fixtures/checker.png');
	await page.locator('input[type="file"]').setInputFiles(fixture);
	await expect(page.getByRole('button', { name: /^Crop$/i })).toHaveAttribute('aria-current', 'step');
	await page.getByRole('button', { name: /^Export$/i }).click();
	await expect(page.getByRole('button', { name: /Export for AYAB/i })).toBeEnabled();
});

test('editor uses two columns on tablet-width viewports', async ({ page }) => {
	await page.setViewportSize({ width: 700, height: 900 });
	await page.goto('tools/jacquard-pattern/');
	const layout = page.locator('.jacquard-editor-layout');
	const columns = await layout.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns).not.toBe('700px');
	expect(columns).toMatch(/\d+(\.\d+)?px\s+\d+(\.\d+)?px/);
});
