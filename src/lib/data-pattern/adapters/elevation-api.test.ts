import { describe, expect, it, vi, afterEach } from 'vitest';
import { ElevationFetchError, fetchElevations } from './elevation-api.js';

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

	it('batches large point lists', async () => {
		const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
			const body = JSON.parse(String(init?.body)) as {
				locations: Array<{ latitude: number; longitude: number }>;
			};
			return {
				ok: true,
				json: async () => ({
					results: body.locations.map((loc) => ({
						latitude: loc.latitude,
						longitude: loc.longitude,
						elevation: loc.latitude + loc.longitude
					}))
				})
			};
		});
		vi.stubGlobal('fetch', fetchMock);

		const points = Array.from({ length: 2500 }, (_, i) => ({ lat: i * 0.001, lng: 9 }));
		const elev = await fetchElevations(points);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(elev).toHaveLength(2500);
		expect(elev[0]).toBe(9);
	});

	it('throws ElevationFetchError when a batch fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 413
			})
		);
		await expect(fetchElevations([{ lat: 1, lng: 2 }])).rejects.toBeInstanceOf(
			ElevationFetchError
		);
	});
});
