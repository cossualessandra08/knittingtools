import { expect, test } from '@playwright/test';
import path from 'node:path';

test('jacquard tool page loads from catalog', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Jacquard pattern converter/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Jacquard pattern converter/i);
	await expect(page.getByRole('button', { name: /Export for AYAB/i })).toBeVisible();
});

test('upload shows preview and enables export', async ({ page }) => {
	await page.goto('/tools/jacquard-pattern');
	const fixture = path.join(process.cwd(), 'e2e/fixtures/checker.png');
	await page.locator('input[type="file"]').setInputFiles(fixture);
	await expect(page.getByText(/Rows \(computed\)/i)).toBeVisible();
	await expect(page.getByRole('button', { name: /Export for AYAB/i })).toBeEnabled();
});
