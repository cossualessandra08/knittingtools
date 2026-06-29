import { describe, expect, it } from 'vitest';
import {
	createEmptyMatrix,
	getCell,
	setCell,
	validateMatrixDimensions,
	uiRowNumber,
	matrixRowFromUi
} from './pattern-matrix.js';

describe('pattern-matrix', () => {
	it('creates matrix filled with colour 0', () => {
		const m = createEmptyMatrix(5, 3);
		expect(m.width).toBe(5);
		expect(m.height).toBe(3);
		expect(m.cells.length).toBe(15);
		expect(getCell(m, 0, 0)).toBe(0);
	});

	it('maps bottom row to UI row 1', () => {
		expect(uiRowNumber(0)).toBe(1);
		expect(uiRowNumber(4)).toBe(5);
		expect(matrixRowFromUi(5)).toBe(4);
	});

	it('rejects dimensions over limits', () => {
		expect(validateMatrixDimensions(201, 100).ok).toBe(false);
		expect(validateMatrixDimensions(100, 301).ok).toBe(false);
		expect(validateMatrixDimensions(100, 100).ok).toBe(true);
	});

	it('rejects non-finite dimensions', () => {
		expect(validateMatrixDimensions(Number.NaN, 10).ok).toBe(false);
		expect(validateMatrixDimensions(10, Number.NaN).ok).toBe(false);
	});

	it('sets and gets cells by row/stitch', () => {
		const m = createEmptyMatrix(4, 2);
		setCell(m, 1, 2, 3);
		expect(getCell(m, 1, 2)).toBe(3);
	});
});
