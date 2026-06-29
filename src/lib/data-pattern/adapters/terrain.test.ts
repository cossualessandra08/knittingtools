import { describe, expect, it } from 'vitest';
import { elevationsToMatrix, posterizeValues, upsampleNormalizedGrid } from './terrain.js';

describe('posterizeValues', () => {
	it('quantizes to N distinct levels', () => {
		const values = new Float32Array([0, 0.2, 0.4, 0.6, 0.8, 1]);
		posterizeValues(values, 5);
		const unique = new Set(Array.from(values).map((v) => v.toFixed(2)));
		expect(unique.size).toBeLessThanOrEqual(5);
	});
});

describe('elevationsToMatrix', () => {
	it('normalizes elevation grid to 0–1', () => {
		const matrix = elevationsToMatrix([0, 50, 100], 1, 3, 'continuous', 5);
		expect(matrix.values[0]).toBe(0);
		expect(matrix.values[2]).toBe(1);
	});

	it('posterizes when mode is posterized', () => {
		const matrix = elevationsToMatrix([0, 25, 50, 75, 100], 5, 1, 'posterized', 3);
		const unique = new Set(Array.from(matrix.values).map((v) => v.toFixed(2)));
		expect(unique.size).toBeLessThanOrEqual(3);
	});
});

describe('upsampleNormalizedGrid', () => {
	it('expands a coarse grid to target dimensions', () => {
		const sample = new Float32Array([0, 1, 0, 1]);
		const upsampled = upsampleNormalizedGrid(sample, 2, 2, 4, 4);
		expect(upsampled.length).toBe(16);
		expect(upsampled[0]).toBeCloseTo(0, 1);
		expect(upsampled[15]).toBeCloseTo(1, 1);
	});
});
