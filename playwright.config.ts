import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'BASE_PATH=/knittingtools npm run build && BASE_PATH=/knittingtools npm run preview -- --port 4174',
		port: 4174,
		reuseExistingServer: true
	},
	use: {
		baseURL: 'http://localhost:4174/knittingtools'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
