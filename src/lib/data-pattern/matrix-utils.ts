import type { SourceMatrix } from './types.js';

export function normalizeMatrix(matrix: SourceMatrix): void {
	let min = Infinity;
	let max = -Infinity;
	for (const v of matrix.values) {
		if (v < min) min = v;
		if (v > max) max = v;
	}
	const span = max - min || 1;
	for (let i = 0; i < matrix.values.length; i++) {
		matrix.values[i] = (matrix.values[i] - min) / span;
	}
}

export function spatialSmooth(matrix: SourceMatrix, amount: number): void {
	if (amount <= 0) return;
	const { width, height, values } = matrix;
	const out = new Float32Array(values.length);
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			let sum = 0;
			let count = 0;
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					const r = row + dr;
					const c = col + dc;
					if (r < 0 || r >= height || c < 0 || c >= width) continue;
					sum += values[r * width + c];
					count++;
				}
			}
			const avg = sum / count;
			const i = row * width + col;
			out[i] = values[i] * (1 - amount) + avg * amount;
		}
	}
	matrix.values.set(out);
}

export function isFlatMatrix(matrix: SourceMatrix): boolean {
	const first = matrix.values[0];
	for (const v of matrix.values) {
		if (v !== first) return false;
	}
	return true;
}

export function applySensitivity(matrix: SourceMatrix, sensitivity: number): void {
	for (let i = 0; i < matrix.values.length; i++) {
		matrix.values[i] *= sensitivity;
	}
}
