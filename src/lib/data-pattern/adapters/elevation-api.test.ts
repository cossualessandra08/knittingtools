import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchElevations } from './elevation-api.js';

afterEach(() => vi.restoreAllMocks());

describe('fetchElevations', () => {
	it('POSTs locations and returns elevations', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [{ latitude: 1, longitude: 2, elevation: 100 }]
				})
			})
		);
		const elev = await fetchElevations([{ lat: 1, lng: 2 }]);
		expect(elev).toEqual([100]);
	});
});
