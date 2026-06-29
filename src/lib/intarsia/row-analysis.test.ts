import { describe, expect, it } from 'vitest';
import { analyzeRow } from './row-analysis.js';
import { createEmptyMatrix, setCell } from './pattern-matrix.js';

describe('row-analysis', () => {
	it('computes runs left-to-right', () => {
		const m = createEmptyMatrix(5, 1);
		setCell(m, 0, 0, 0);
		setCell(m, 0, 1, 0);
		setCell(m, 0, 2, 1);
		setCell(m, 0, 3, 1);
		setCell(m, 0, 4, 0);
		const analysis = analyzeRow(m, 0, 'ltr');
		expect(analysis.runs).toEqual([
			{ colourId: 0, length: 2 },
			{ colourId: 1, length: 2 },
			{ colourId: 0, length: 1 }
		]);
		expect(analysis.totalsByColour.get(0)).toBe(3);
		expect(analysis.totalsByColour.get(1)).toBe(2);
		expect(analysis.totalStitches).toBe(5);
	});

	it('orders runs for rtl reading', () => {
		const m = createEmptyMatrix(3, 1);
		setCell(m, 0, 0, 0);
		setCell(m, 0, 1, 1);
		setCell(m, 0, 2, 0);
		const analysis = analyzeRow(m, 0, 'rtl');
		expect(analysis.runs[0]).toEqual({ colourId: 0, length: 1 });
		expect(analysis.runs[1]).toEqual({ colourId: 1, length: 1 });
	});
});
