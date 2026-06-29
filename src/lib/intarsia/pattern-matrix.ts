import { MAX_ROWS, MAX_STITCHES } from './constants.js';
import type { PatternMatrix } from './types.js';

export function createEmptyMatrix(width: number, height: number): PatternMatrix {
	const w = Math.round(width);
	const h = Math.round(height);
	const validation = validateMatrixDimensions(w, h);
	if (!validation.ok) throw new Error(validation.message);
	return { width: w, height: h, cells: new Uint8Array(w * h) };
}

export function validateMatrixDimensions(
	width: number,
	height: number
): { ok: true } | { ok: false; message: string } {
	if (!Number.isFinite(width) || !Number.isFinite(height)) {
		return { ok: false, message: 'Pattern dimensions must be valid numbers.' };
	}
	const w = Math.round(width);
	const h = Math.round(height);
	if (w < 1 || h < 1) return { ok: false, message: 'Pattern must be at least 1×1.' };
	if (w > MAX_STITCHES) return { ok: false, message: 'Pattern exceeds 200 stitches.' };
	if (h > MAX_ROWS) return { ok: false, message: 'Pattern exceeds 300 rows.' };
	return { ok: true };
}

export function normalizeDimension(value: number | string, max: number): number | null {
	const n = Math.round(Number(value));
	if (!Number.isFinite(n) || n < 1 || n > max) return null;
	return n;
}

export function cellIndex(matrix: PatternMatrix, row: number, stitch: number): number {
	return row * matrix.width + stitch;
}

export function getCell(matrix: PatternMatrix, row: number, stitch: number): number {
	return matrix.cells[cellIndex(matrix, row, stitch)]!;
}

export function setCell(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	colourId: number
): void {
	matrix.cells[cellIndex(matrix, row, stitch)] = colourId;
}

export function uiRowNumber(internalRow: number): number {
	return internalRow + 1;
}

export function matrixRowFromUi(uiRow: number): number {
	return uiRow - 1;
}
