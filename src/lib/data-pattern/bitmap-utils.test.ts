import { describe, expect, it } from 'vitest';
import { flipBitmapVertical, hasManualEdits, cloneBitmap } from './bitmap-utils.js';

describe('flipBitmapVertical', () => {
	it('reverses row order', () => {
		const src = new Uint8Array([1, 0, 0, 1]);
		const flipped = flipBitmapVertical(src, 2, 2);
		expect(Array.from(flipped)).toEqual([0, 1, 1, 0]);
	});
});

describe('hasManualEdits', () => {
	it('returns false when bitmaps match', () => {
		const a = new Uint8Array([1, 0]);
		expect(hasManualEdits(a, cloneBitmap(a))).toBe(false);
	});
	it('returns true when they differ', () => {
		expect(hasManualEdits(new Uint8Array([1, 0]), new Uint8Array([0, 0]))).toBe(true);
	});
});
