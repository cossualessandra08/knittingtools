import { getCell, setCell } from './pattern-matrix.js';
import type { ColourEntry, PatternMatrix } from './types.js';

export interface EditorSnapshot {
	cells: Uint8Array;
	palette: ColourEntry[];
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

function clonePalette(palette: ColourEntry[]): ColourEntry[] {
	return palette.map((entry) => ({ ...entry }));
}

function snapshotEditor(matrix: PatternMatrix, palette: ColourEntry[]): EditorSnapshot {
	return { cells: matrix.cells.slice(), palette: clonePalette(palette) };
}

export class UndoStack {
	private undoSnapshots: EditorSnapshot[] = [];
	private redoSnapshots: EditorSnapshot[] = [];

	push(matrix: PatternMatrix, palette: ColourEntry[]): void {
		this.undoSnapshots.push(snapshotEditor(matrix, palette));
		this.redoSnapshots = [];
		if (this.undoSnapshots.length > MAX_UNDO_ENTRIES) {
			this.undoSnapshots.shift();
		}
	}

	undo(matrix: PatternMatrix, palette: ColourEntry[]): ColourEntry[] | null {
		const snapshot = this.undoSnapshots.pop();
		if (!snapshot) return null;
		this.redoSnapshots.push(snapshotEditor(matrix, palette));
		matrix.cells.set(snapshot.cells);
		return clonePalette(snapshot.palette);
	}

	redo(matrix: PatternMatrix, palette: ColourEntry[]): ColourEntry[] | null {
		const snapshot = this.redoSnapshots.pop();
		if (!snapshot) return null;
		this.undoSnapshots.push(snapshotEditor(matrix, palette));
		matrix.cells.set(snapshot.cells);
		return clonePalette(snapshot.palette);
	}

	canUndo(): boolean {
		return this.undoSnapshots.length > 0;
	}

	canRedo(): boolean {
		return this.redoSnapshots.length > 0;
	}

	clear(): void {
		this.undoSnapshots = [];
		this.redoSnapshots = [];
	}
}
