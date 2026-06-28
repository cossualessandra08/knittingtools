import { describe, expect, it } from 'vitest';
import { imageDataToBitmap, bitmapToRgba } from './convert.js';

function makeImageData(width: number, height: number, rgba: number[]): ImageData {
	return {
		width,
		height,
		data: new Uint8ClampedArray(rgba),
		colorSpace: 'srgb'
	} as ImageData;
}

describe('imageDataToBitmap', () => {
	it('maps dark pixels to foreground (1) and light to background (0)', () => {
		const data = makeImageData(2, 1, [0, 0, 0, 255, 255, 255, 255, 255]);
		const bitmap = imageDataToBitmap(data, { threshold: 128, invert: false });
		expect(Array.from(bitmap)).toEqual([1, 0]);
	});

	it('inverts foreground and background', () => {
		const data = makeImageData(1, 1, [0, 0, 0, 255]);
		const bitmap = imageDataToBitmap(data, { threshold: 128, invert: true });
		expect(bitmap[0]).toBe(0);
	});
});

describe('bitmapToRgba', () => {
	it('writes pure black and white pixels', () => {
		const bitmap = new Uint8Array([1, 0]);
		const rgba = bitmapToRgba(bitmap);
		expect(rgba[0]).toBe(0);
		expect(rgba[1]).toBe(0);
		expect(rgba[2]).toBe(0);
		expect(rgba[4]).toBe(255);
	});
});
