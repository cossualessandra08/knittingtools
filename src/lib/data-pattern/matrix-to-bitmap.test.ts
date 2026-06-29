import { describe, expect, it } from 'vitest';
import { matrixToBitmap } from './matrix-to-bitmap.js';
import type { SourceMatrix } from './types.js';

const matrix: SourceMatrix = {
	width: 2,
	height: 2,
	values: new Float32Array([0, 0.25, 0.75, 1])
};

describe('matrixToBitmap', () => {
	it('thresholds values to 0 or 1', () => {
		const bitmap = matrixToBitmap(matrix, { contrast: 1, threshold: 0.5, invert: false });
		expect(Array.from(bitmap)).toEqual([0, 0, 1, 1]);
	});

	it('inverts foreground and background', () => {
		const bitmap = matrixToBitmap(matrix, { contrast: 1, threshold: 0.5, invert: true });
		expect(Array.from(bitmap)).toEqual([1, 1, 0, 0]);
	});

	it('applies contrast before threshold', () => {
		const flat: SourceMatrix = {
			width: 2,
			height: 1,
			values: new Float32Array([0.4, 0.6])
		};
		const low = matrixToBitmap(flat, { contrast: 0.5, threshold: 0.5, invert: false });
		const high = matrixToBitmap(flat, { contrast: 2, threshold: 0.5, invert: false });
		expect(low[0]).toBe(0);
		expect(high[1]).toBe(1);
	});
});
