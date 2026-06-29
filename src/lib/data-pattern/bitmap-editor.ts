import { UNDO_STACK_MAX } from './constants.js';
import { cloneBitmap } from './bitmap-utils.js';
import type { Bitmap } from './types.js';

export class BitmapEditor {
	bitmap: Bitmap;
	readonly width: number;
	readonly height: number;
	private undoStack: Bitmap[] = [];
	private redoStack: Bitmap[] = [];

	constructor(bitmap: Bitmap, width: number, height: number) {
		this.bitmap = cloneBitmap(bitmap);
		this.width = width;
		this.height = height;
	}

	private inBounds(col: number, row: number): boolean {
		return col >= 0 && col < this.width && row >= 0 && row < this.height;
	}

	private pushUndo(): void {
		this.undoStack.push(cloneBitmap(this.bitmap));
		if (this.undoStack.length > UNDO_STACK_MAX) this.undoStack.shift();
		this.redoStack = [];
	}

	toggle(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		const i = row * this.width + col;
		this.bitmap[i] = this.bitmap[i] === 1 ? 0 : 1;
	}

	brush(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		this.bitmap[row * this.width + col] = 1;
	}

	eraser(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		this.bitmap[row * this.width + col] = 0;
	}

	undo(): void {
		const prev = this.undoStack.pop();
		if (!prev) return;
		this.redoStack.push(cloneBitmap(this.bitmap));
		this.bitmap = prev;
	}

	redo(): void {
		const next = this.redoStack.pop();
		if (!next) return;
		this.undoStack.push(cloneBitmap(this.bitmap));
		this.bitmap = next;
	}

	get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	resetTo(bitmap: Bitmap): void {
		this.bitmap = cloneBitmap(bitmap);
		this.undoStack = [];
		this.redoStack = [];
	}
}
