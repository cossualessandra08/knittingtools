import { describe, expect, it } from 'vitest';
import {
	audioRowsFromDuration,
	terrainRowsFromBbox,
	fabricSummary,
	clampRows
} from './dimensions.js';

describe('audioRowsFromDuration', () => {
	it('maps 15s to 60 rows', () => {
		expect(audioRowsFromDuration(15)).toBe(60);
	});

	it('caps at 300 rows', () => {
		expect(audioRowsFromDuration(75)).toBe(300);
	});

	it('floors at 10 rows', () => {
		expect(audioRowsFromDuration(1)).toBe(10);
	});
});

describe('terrainRowsFromBbox', () => {
	it('computes rows from bbox aspect and gauge', () => {
		const rows = terrainRowsFromBbox(
			{ south: 45, north: 46, west: 10, east: 11 },
			{ stitches: 100, stitchesPerCm: 4.5, rowsPerCm: 6.4 }
		);
		expect(rows).toBeGreaterThanOrEqual(10);
		expect(rows).toBeLessThanOrEqual(300);
	});
});

describe('fabricSummary', () => {
	it('formats stitch and cm summary', () => {
		const text = fabricSummary({ stitches: 120, rows: 60, widthCm: 26.7, heightCm: 9.4 });
		expect(text).toContain('120');
		expect(text).toContain('60');
	});
});

describe('clampRows', () => {
	it('clamps to MIN_ROWS and MAX_ROWS', () => {
		expect(clampRows(5)).toBe(10);
		expect(clampRows(400)).toBe(300);
	});
});
