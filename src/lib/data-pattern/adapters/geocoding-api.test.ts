import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchPlace } from './geocoding-api.js';

afterEach(() => vi.restoreAllMocks());

describe('searchPlace', () => {
	it('returns lat/lon from Nominatim response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => [{ lat: '45.0', lon: '9.0', display_name: 'Test' }]
			})
		);
		const result = await searchPlace('Test');
		expect(result).toEqual({ lat: 45, lon: 9, label: 'Test' });
	});
});
