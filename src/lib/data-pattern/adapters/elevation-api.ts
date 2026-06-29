import { OPEN_ELEVATION_URL } from '../constants.js';

/** Open-Elevation rejects large single POST bodies (~413 above ~3k points). */
const BATCH_SIZE = 1000;
const MAX_RETRIES = 3;
const BATCH_DELAY_MS = 150;

export interface LatLng {
	lat: number;
	lng: number;
}

export class ElevationFetchError extends Error {
	constructor(cause?: unknown) {
		super('Elevation fetch failed');
		this.name = 'ElevationFetchError';
		if (cause !== undefined) this.cause = cause;
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(batch: LatLng[], attempt = 0): Promise<number[]> {
	try {
		const res = await fetch(OPEN_ELEVATION_URL, {
			method: 'POST',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
			body: JSON.stringify({
				locations: batch.map((p) => ({ latitude: p.lat, longitude: p.lng }))
			})
		});
		if (!res.ok) {
			if (attempt < MAX_RETRIES - 1) {
				await delay(BATCH_DELAY_MS * (attempt + 1));
				return fetchBatch(batch, attempt + 1);
			}
			throw new ElevationFetchError(`HTTP ${res.status}`);
		}
		const data = (await res.json()) as { results: Array<{ elevation: number | null }> };
		if (!Array.isArray(data.results) || data.results.length !== batch.length) {
			if (attempt < MAX_RETRIES - 1) {
				await delay(BATCH_DELAY_MS * (attempt + 1));
				return fetchBatch(batch, attempt + 1);
			}
			throw new ElevationFetchError('Unexpected response shape');
		}
		return data.results.map((r) => (typeof r.elevation === 'number' ? r.elevation : 0));
	} catch (e) {
		if (e instanceof ElevationFetchError) throw e;
		if (attempt < MAX_RETRIES - 1) {
			await delay(BATCH_DELAY_MS * (attempt + 1));
			return fetchBatch(batch, attempt + 1);
		}
		throw new ElevationFetchError(e);
	}
}

export async function fetchElevations(points: LatLng[]): Promise<number[]> {
	const elevations: number[] = [];

	for (let offset = 0; offset < points.length; offset += BATCH_SIZE) {
		const batch = points.slice(offset, offset + BATCH_SIZE);
		const batchElevations = await fetchBatch(batch);
		elevations.push(...batchElevations);
		if (offset + BATCH_SIZE < points.length) {
			await delay(BATCH_DELAY_MS);
		}
	}

	return elevations;
}
