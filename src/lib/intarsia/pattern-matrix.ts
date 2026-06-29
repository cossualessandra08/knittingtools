import { MAX_ROWS, MAX_STITCHES } from './constants.js';
import type { PatternMatrix } from './types.js';

export function createEmptyMatrix(width: number, height: number): PatternMatrix {
	const validation = validateMatrixDimensions(width, height);
	if (!validation.ok) throw new Error(validation.message);
	return { width, height, cells: new Uint8Array(width * height) };
}

export function validateMatrixDimensions(
	width: number,
	height: number
): { ok: true } | { ok: false; message: string } {
	if (width < 1 || height < 1) return { ok: false, message: 'Pattern must be at least 1×1.' };
	if (width > MAX_STITCHES) return { ok: false, message: 'Pattern exceeds 200 stitches.' };
	if (height > MAX_ROWS) return { ok: false, message: 'Pattern exceeds 300 rows.' };
	return { ok: true };
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
