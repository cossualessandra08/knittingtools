import { describe, expect, it } from 'vitest';
import { patternCellSize } from './preview.js';

describe('patternCellSize', () => {
	it('uses square cells in grid view', () => {
		expect(patternCellSize(4, false, { stitchesPerCm: 4.5, rowsPerCm: 6.4 })).toEqual({
			cellWidth: 4,
			cellHeight: 4
		});
	});

	it('matches physical fabric proportions for a square piece', () => {
		const gauge = { stitchesPerCm: 4.5, rowsPerCm: 6.4 };
		const stitches = 120;
		const rows = Math.round((stitches / gauge.stitchesPerCm) * gauge.rowsPerCm);
		const { cellWidth, cellHeight } = patternCellSize(4, true, gauge);
		const aspect = (stitches * cellWidth) / (rows * cellHeight);
		expect(aspect).toBeCloseTo(1, 1);
	});
});
