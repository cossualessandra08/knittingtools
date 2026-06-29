import { describe, expect, it } from 'vitest';
import { normalizeBbox, selectionBounds, viewBoundsForScale } from './terrain-map.js';

describe('terrain-map helpers', () => {
	it('selectionBounds returns south-west and north-east corners', () => {
		expect(
			selectionBounds({ south: 1, north: 3, west: 4, east: 6 })
		).toEqual([
			[1, 4],
			[3, 6]
		]);
	});

	it('normalizeBbox enforces a minimum span', () => {
		const b = normalizeBbox(45, 45, 9, 9);
		expect(b.north - b.south).toBeCloseTo(0.002, 3);
		expect(b.east - b.west).toBeCloseTo(0.002, 3);
	});

	it('viewBoundsForScale expands visible area at 25%', () => {
		const bbox = { south: 44.9, north: 45.1, west: 8.9, east: 9.1 };
		const wide = viewBoundsForScale(bbox, 25);
		expect(wide.north - wide.south).toBeCloseTo((bbox.north - bbox.south) * 4, 5);
		expect(wide.east - wide.west).toBeCloseTo((bbox.east - bbox.west) * 4, 5);
	});
});
