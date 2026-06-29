import { describe, expect, it } from 'vitest';
import { elevationsToMatrix, posterizeValues } from './terrain.js';

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
});
