import { describe, expect, it } from 'vitest';
import { quantizeImageData, rgbToHex } from './image-quantize.js';

describe('image-quantize', () => {
	it('reduces pixels to at most N colours', () => {
		const data = new Uint8ClampedArray([
			255, 0, 0, 255, 0, 0, 255, 0,
			0, 0, 255, 255, 0, 0, 255, 255
		]);
		const image = { data, width: 2, height: 2 } as ImageData;
		const result = quantizeImageData(image, 2);
		expect(result.palette.length).toBeLessThanOrEqual(2);
		expect(result.matrix.width).toBe(2);
		expect(result.matrix.height).toBe(2);
	});

	it('stores row 0 as bottom image row', () => {
		const data = new Uint8ClampedArray(16);
		data[0] = 255;
		data[12] = 0;
		const image = { data, width: 2, height: 2 } as ImageData;
		const { matrix } = quantizeImageData(image, 2);
		expect(matrix.cells[0]).not.toBe(matrix.cells[2]);
	});

	it('rgbToHex formats channel values as hex', () => {
		expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
		expect(rgbToHex(0, 128, 255)).toBe('#0080ff');
	});
});
