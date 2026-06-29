import { OPEN_ELEVATION_URL } from '../constants.js';

export interface LatLng {
	lat: number;
	lng: number;
}

export async function fetchElevations(points: LatLng[]): Promise<number[]> {
	const res = await fetch(OPEN_ELEVATION_URL, {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		body: JSON.stringify({
			locations: points.map((p) => ({ latitude: p.lat, longitude: p.lng }))
		})
	});
	if (!res.ok) throw new Error('Elevation fetch failed');
	const data = (await res.json()) as { results: Array<{ elevation: number }> };
	return data.results.map((r) => r.elevation);
}
