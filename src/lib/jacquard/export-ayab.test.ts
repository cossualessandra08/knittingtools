import { describe, expect, it } from 'vitest';
import { ayabFilename, bitmapIsPureBinary } from './export-ayab.js';

describe('ayabFilename', () => {
	it('includes stitch and row counts', () => {
		expect(ayabFilename(120, 171)).toBe('pattern-120x171-ayab.png');
	});
});

describe('bitmapIsPureBinary', () => {
	it('accepts only 0 and 1 values', () => {
		expect(bitmapIsPureBinary(new Uint8Array([0, 1, 1, 0]))).toBe(true);
		expect(bitmapIsPureBinary(new Uint8Array([0, 2]))).toBe(false);
	});
});
