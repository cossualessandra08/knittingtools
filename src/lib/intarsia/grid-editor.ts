import { getCell, setCell } from './pattern-matrix.js';
import type { PatternMatrix } from './types.js';

export interface RegionClip {
	width: number;
	height: number;
	cells: Uint8Array;
}

const MAX_UNDO_ENTRIES = 50;

function inBounds(matrix: PatternMatrix, row: number, stitch: number): boolean {
	return row >= 0 && row < matrix.height && stitch >= 0 && stitch < matrix.width;
}

export function applyBrush(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	colourId: number
): void {
	if (!inBounds(matrix, row, stitch)) return;
	setCell(matrix, row, stitch, colourId);
}

export function floodFill(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	colourId: number
): void {
	if (!inBounds(matrix, row, stitch)) return;

	const targetColour = getCell(matrix, row, stitch);
	if (targetColour === colourId) return;

	const queue: [number, number][] = [[row, stitch]];
	const visited = new Set<number>();

	while (queue.length > 0) {
		const [r, s] = queue.shift()!;
		const index = r * matrix.width + s;
		if (visited.has(index)) continue;
		if (!inBounds(matrix, r, s)) continue;
		if (getCell(matrix, r, s) !== targetColour) continue;

		visited.add(index);
		setCell(matrix, r, s, colourId);
		queue.push([r - 1, s], [r + 1, s], [r, s - 1], [r, s + 1]);
	}
}

export function drawLine(
	matrix: PatternMatrix,
	row0: number,
	stitch0: number,
	row1: number,
	stitch1: number,
	colourId: number
): void {
	let x0 = stitch0;
	let y0 = row0;
	const x1 = stitch1;
	const y1 = row1;
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	while (true) {
		applyBrush(matrix, y0, x0, colourId);
		if (x0 === x1 && y0 === y1) break;
		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x0 += sx;
		}
		if (e2 < dx) {
			err += dx;
			y0 += sy;
		}
	}
}

export function copyRegion(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	width: number,
	height: number
): RegionClip {
	const clipWidth = Math.min(width, matrix.width - stitch);
	const clipHeight = Math.min(height, matrix.height - row);
	const cells = new Uint8Array(Math.max(0, clipWidth) * Math.max(0, clipHeight));

	if (clipWidth <= 0 || clipHeight <= 0) {
		return { width: 0, height: 0, cells };
	}

	for (let r = 0; r < clipHeight; r++) {
		for (let s = 0; s < clipWidth; s++) {
			cells[r * clipWidth + s] = getCell(matrix, row + r, stitch + s);
		}
	}

	return { width: clipWidth, height: clipHeight, cells };
}

export function pasteRegion(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	clip: RegionClip
): void {
	for (let r = 0; r < clip.height; r++) {
		for (let s = 0; s < clip.width; s++) {
			const targetRow = row + r;
			const targetStitch = stitch + s;
			if (!inBounds(matrix, targetRow, targetStitch)) continue;
			setCell(matrix, targetRow, targetStitch, clip.cells[r * clip.width + s]!);
		}
	}
}

export function applyWithSymmetry(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	axis: 'vertical' | 'horizontal',
	fn: (matrix: PatternMatrix, row: number, stitch: number) => void
): void {
	fn(matrix, row, stitch);

	if (axis === 'vertical') {
		const mirroredStitch = matrix.width - 1 - stitch;
		if (mirroredStitch !== stitch) {
			fn(matrix, row, mirroredStitch);
		}
	} else {
		const mirroredRow = matrix.height - 1 - row;
		if (mirroredRow !== row) {
			fn(matrix, mirroredRow, stitch);
		}
	}
}

export class UndoStack {
	private snapshots: Uint8Array[] = [];

	push(matrix: PatternMatrix): void {
		this.snapshots.push(matrix.cells.slice());
		if (this.snapshots.length > MAX_UNDO_ENTRIES) {
			this.snapshots.shift();
		}
	}

	undo(matrix: PatternMatrix): boolean {
		const snapshot = this.snapshots.pop();
		if (!snapshot) return false;
		matrix.cells.set(snapshot);
		return true;
	}

	canUndo(): boolean {
		return this.snapshots.length > 0;
	}

	clear(): void {
		this.snapshots = [];
	}
}
