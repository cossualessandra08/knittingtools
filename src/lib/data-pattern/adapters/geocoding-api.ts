import { NOMINATIM_SEARCH_URL } from '../constants.js';

export interface PlaceResult {
	lat: number;
	lon: number;
	label: string;
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
	const url = new URL(NOMINATIM_SEARCH_URL);
	url.searchParams.set('q', query);
	url.searchParams.set('format', 'json');
	url.searchParams.set('limit', '1');
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!res.ok) throw new Error('Geocoding failed');
	const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
	if (!data.length) return null;
	const item = data[0];
	return { lat: Number(item.lat), lon: Number(item.lon), label: item.display_name };
}
