import type { Map, Rectangle, LeafletMouseEvent } from 'leaflet';
import type { TerrainBbox } from './types.js';

export const MIN_BBOX_SPAN_DEG = 0.002;

/** Map-only view scale (pattern workspace uses ZOOM_LEVELS in constants.ts). */
export const TERRAIN_MAP_VIEW_LEVELS = [25, 100] as const;
export type TerrainMapViewLevel = (typeof TERRAIN_MAP_VIEW_LEVELS)[number];

export function viewBoundsForScale(bbox: TerrainBbox, viewPercent: number): TerrainBbox {
	const scale = 100 / viewPercent;
	const latMid = (bbox.north + bbox.south) / 2;
	const lngMid = (bbox.east + bbox.west) / 2;
	const latHalf = ((bbox.north - bbox.south) / 2) * scale;
	const lngHalf = ((bbox.east - bbox.west) / 2) * scale;
	return {
		south: latMid - latHalf,
		north: latMid + latHalf,
		west: lngMid - lngHalf,
		east: lngMid + lngHalf
	};
}

export function selectionBounds(b: TerrainBbox): [[number, number], [number, number]] {
	return [
		[b.south, b.west],
		[b.north, b.east]
	];
}

export function normalizeBbox(s: number, n: number, w: number, e: number): TerrainBbox {
	let south = Math.min(s, n);
	let north = Math.max(s, n);
	let west = Math.min(w, e);
	let east = Math.max(w, e);
	if (north - south < MIN_BBOX_SPAN_DEG) {
		const mid = (south + north) / 2;
		south = mid - MIN_BBOX_SPAN_DEG / 2;
		north = mid + MIN_BBOX_SPAN_DEG / 2;
	}
	if (east - west < MIN_BBOX_SPAN_DEG) {
		const mid = (west + east) / 2;
		west = mid - MIN_BBOX_SPAN_DEG / 2;
		east = mid + MIN_BBOX_SPAN_DEG / 2;
	}
	return { south, north, west, east };
}

export interface TerrainMapController {
	map: Map;
	setBbox: (bbox: TerrainBbox, options?: { fit?: boolean; viewPercent?: number }) => void;
	flyTo: (lat: number, lon: number, zoom?: number) => void;
	invalidateSize: () => void;
	destroy: () => void;
}

export async function createTerrainMap(
	container: HTMLElement,
	initialBbox: TerrainBbox
): Promise<TerrainMapController> {
	const L = (await import('leaflet')).default;
	await import('leaflet/dist/leaflet.css');

	const centerLat = (initialBbox.north + initialBbox.south) / 2;
	const centerLng = (initialBbox.east + initialBbox.west) / 2;

	const map = L.map(container, {
		zoomControl: true,
		scrollWheelZoom: true
	}).setView([centerLat, centerLng], 11);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors',
		maxZoom: 18
	}).addTo(map);

	let selectionRect: Rectangle | null = null;
	let viewPercent = 100;

	function fitMapView(bbox: TerrainBbox, percent: number) {
		viewPercent = percent;
		const bounds = selectionBounds(viewBoundsForScale(bbox, percent));
		map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18, animate: false });
	}

	function setBbox(bbox: TerrainBbox, options: { fit?: boolean; viewPercent?: number } = {}) {
		const bounds = selectionBounds(bbox);
		if (selectionRect) {
			selectionRect.setBounds(bounds);
		} else {
			selectionRect = L.rectangle(bounds, {
				color: '#3b82f6',
				weight: 2,
				fillOpacity: 0.15,
				interactive: false
			}).addTo(map);
		}
		if (options.fit) {
			fitMapView(bbox, options.viewPercent ?? viewPercent);
		}
	}

	setBbox(initialBbox, { fit: true, viewPercent: 100 });

	requestAnimationFrame(() => {
		map.invalidateSize(true);
	});

	return {
		map,
		setBbox,
		flyTo(lat, lon, zoom = 12) {
			map.setView([lat, lon], zoom);
		},
		invalidateSize() {
			map.invalidateSize(true);
		},
		destroy() {
			selectionRect = null;
			map.remove();
		}
	};
}

/** Pixel-space box draw on top of the map without touching Leaflet interaction state. */
export interface DrawOverlayController {
	destroy: () => void;
}

export function attachDrawOverlay(
	overlay: HTMLElement,
	map: Map,
	onComplete: (bbox: TerrainBbox) => void
): DrawOverlayController {
	let startX = 0;
	let startY = 0;
	let dragging = false;
	let boxEl: HTMLDivElement | null = null;

	function latLngFromPoint(x: number, y: number) {
		return map.containerPointToLatLng([x, y]);
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		e.preventDefault();
		const rect = overlay.getBoundingClientRect();
		startX = e.clientX - rect.left;
		startY = e.clientY - rect.top;
		dragging = true;

		boxEl = document.createElement('div');
		boxEl.className = 'pointer-events-none absolute border-2 border-orange-500 bg-orange-500/10';
		boxEl.style.left = `${startX}px`;
		boxEl.style.top = `${startY}px`;
		boxEl.style.width = '0';
		boxEl.style.height = '0';
		overlay.appendChild(boxEl);
	}

	function onMouseMove(e: MouseEvent) {
		if (!dragging || !boxEl) return;
		const rect = overlay.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const left = Math.min(startX, x);
		const top = Math.min(startY, y);
		const width = Math.abs(x - startX);
		const height = Math.abs(y - startY);
		boxEl.style.left = `${left}px`;
		boxEl.style.top = `${top}px`;
		boxEl.style.width = `${width}px`;
		boxEl.style.height = `${height}px`;
	}

	function onMouseUp(e: MouseEvent) {
		if (!dragging) return;
		dragging = false;

		const rect = overlay.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (boxEl) {
			boxEl.remove();
			boxEl = null;
		}

		const sw = latLngFromPoint(Math.min(startX, x), Math.max(startY, y));
		const ne = latLngFromPoint(Math.max(startX, x), Math.min(startY, y));
		onComplete(
			normalizeBbox(sw.lat, ne.lat, sw.lng, ne.lng)
		);
	}

	overlay.addEventListener('mousedown', onMouseDown);
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);

	return {
		destroy() {
			overlay.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			boxEl?.remove();
		}
	};
}

export type { LeafletMouseEvent };
