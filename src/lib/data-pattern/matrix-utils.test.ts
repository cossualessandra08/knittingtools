import { describe, expect, it } from 'vitest';
import { normalizeMatrix, spatialSmooth, isFlatMatrix } from './matrix-utils.js';
import type { SourceMatrix } from './types.js';

function matrix2x2(values: number[]): SourceMatrix {
	return { width: 2, height: 2, values: new Float32Array(values) };
}

describe('normalizeMatrix', () => {
	it('scales values to 0–1', () => {
		const m = matrix2x2([0, 5, 10, 10]);
		normalizeMatrix(m);
		expect(m.values[0]).toBe(0);
		expect(m.values[3]).toBe(1);
	});
});

describe('spatialSmooth', () => {
	it('blends neighbouring cells', () => {
		const m = matrix2x2([0, 0, 0, 1]);
		spatialSmooth(m, 1);
		expect(m.values[1]).toBeGreaterThan(0);
	});
});

describe('isFlatMatrix', () => {
	it('detects uniform values', () => {
		expect(isFlatMatrix(matrix2x2([0.5, 0.5, 0.5, 0.5]))).toBe(true);
		expect(isFlatMatrix(matrix2x2([0, 1, 0, 1]))).toBe(false);
	});
});
