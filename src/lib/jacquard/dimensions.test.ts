import { describe, expect, it } from 'vitest';
import {
	calculatePatternDimensions,
	patternCropAspectRatio,
	fitCropToPatternAspect
} from './dimensions.js';

describe('calculatePatternDimensions', () => {
	it('calculates rows for square crop with gauge 4.5 × 6.4 and 120 stitches', () => {
		const result = calculatePatternDimensions({
			stitches: 120,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 500,
			cropHeightPx: 500
		});
		expect(result.rows).toBe(171);
		expect(result.widthCm).toBeCloseTo(26.67, 1);
		expect(result.heightCm).toBeCloseTo(26.67, 1);
	});

	it('returns more rows for a tall crop', () => {
		const wide = calculatePatternDimensions({
			stitches: 100,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 400,
			cropHeightPx: 400
		});
		const tall = calculatePatternDimensions({
			stitches: 100,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 200,
			cropHeightPx: 400
		});
		expect(tall.rows).toBeGreaterThan(wide.rows);
	});
});

describe('patternCropAspectRatio', () => {
	it('returns width/height ratio for pattern on fabric', () => {
		const ratio = patternCropAspectRatio({
			stitches: 120,
			rows: 171,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4
		});
		expect(ratio).toBeCloseTo(1, 1);
	});
});

describe('fitCropToPatternAspect', () => {
	it('adjusts crop rect to pattern aspect keeping center', () => {
		const fitted = fitCropToPatternAspect(
			{ x: 10, y: 10, width: 200, height: 100 },
			{
				stitches: 120,
				rows: 171,
				widthCm: 26.67,
				heightCm: 26.67,
				stitchesPerCm: 4.5,
				rowsPerCm: 6.4
			},
			{ imageWidth: 400, imageHeight: 400 }
		);
		const target = patternCropAspectRatio({
			stitches: 120,
			rows: 171,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4
		});
		expect(fitted.width / fitted.height).toBeCloseTo(target, 2);
		expect(fitted.x).toBeGreaterThanOrEqual(0);
		expect(fitted.y).toBeGreaterThanOrEqual(0);
		expect(fitted.x + fitted.width).toBeLessThanOrEqual(400);
		expect(fitted.y + fitted.height).toBeLessThanOrEqual(400);
	});
});
