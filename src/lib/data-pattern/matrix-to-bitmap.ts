import type { Bitmap, RefineParams, SourceMatrix } from './types.js';

function applyContrast(value: number, contrast: number): number {
	const c = Math.max(0, contrast);
	return Math.min(1, Math.max(0, 0.5 + (value - 0.5) * c));
}

export function matrixToBitmap(matrix: SourceMatrix, params: RefineParams): Bitmap {
	const bitmap = new Uint8Array(matrix.values.length);
	for (let i = 0; i < matrix.values.length; i++) {
		const adjusted = applyContrast(matrix.values[i], params.contrast);
		let isForeground = adjusted >= params.threshold;
		if (params.invert) isForeground = !isForeground;
		bitmap[i] = isForeground ? 1 : 0;
	}
	return bitmap;
}
