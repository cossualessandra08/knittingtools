import { describe, expect, it } from 'vitest';
import { createEmptyMatrix, getCell, setCell } from './pattern-matrix.js';
import { createDefaultPalette, removeColour } from './colour-palette.js';
import {
	UndoStack,
	applyBrush,
	drawLine,
	floodFill
} from './grid-editor.js';

describe('grid-editor', () => {
	describe('applyBrush', () => {
		it('sets a single cell', () => {
			const matrix = createEmptyMatrix(5, 3);
			applyBrush(matrix, 1, 2, 3);
			expect(getCell(matrix, 1, 2)).toBe(3);
		});

		it('ignores out-of-bounds coordinates', () => {
			const matrix = createEmptyMatrix(3, 2);
			applyBrush(matrix, -1, 0, 1);
			applyBrush(matrix, 0, 5, 1);
			expect(matrix.cells.every((c) => c === 0)).toBe(true);
		});
	});

	describe('floodFill', () => {
		it('fills contiguous same-colour region', () => {
			const matrix = createEmptyMatrix(5, 1);
			setCell(matrix, 0, 0, 0);
			setCell(matrix, 0, 1, 0);
			setCell(matrix, 0, 2, 1);
			setCell(matrix, 0, 3, 1);
			setCell(matrix, 0, 4, 0);
			floodFill(matrix, 0, 0, 2);
			expect(getCell(matrix, 0, 0)).toBe(2);
			expect(getCell(matrix, 0, 1)).toBe(2);
			expect(getCell(matrix, 0, 2)).toBe(1);
			expect(getCell(matrix, 0, 3)).toBe(1);
			expect(getCell(matrix, 0, 4)).toBe(0);
		});

		it('fills connected region in two dimensions', () => {
			const matrix = createEmptyMatrix(3, 3);
			setCell(matrix, 1, 1, 1);
			setCell(matrix, 1, 0, 1);
			setCell(matrix, 1, 2, 1);
			setCell(matrix, 0, 1, 1);
			setCell(matrix, 2, 1, 1);
			floodFill(matrix, 1, 1, 2);
			expect(getCell(matrix, 1, 1)).toBe(2);
			expect(getCell(matrix, 1, 0)).toBe(2);
			expect(getCell(matrix, 0, 0)).toBe(0);
		});
	});

	describe('drawLine', () => {
		it('draws a horizontal line with Bresenham', () => {
			const matrix = createEmptyMatrix(5, 1);
			drawLine(matrix, 0, 0, 0, 4, 1);
			for (let stitch = 0; stitch < 5; stitch++) {
				expect(getCell(matrix, 0, stitch)).toBe(1);
			}
		});

		it('draws a diagonal line', () => {
			const matrix = createEmptyMatrix(5, 5);
			drawLine(matrix, 0, 0, 4, 4, 2);
			for (let i = 0; i < 5; i++) {
				expect(getCell(matrix, i, i)).toBe(2);
			}
		});
	});

	describe('UndoStack', () => {
		it('restores the previous matrix state', () => {
			const matrix = createEmptyMatrix(3, 1);
			const palette = createDefaultPalette();
			const stack = new UndoStack();
			stack.push(matrix, palette);
			setCell(matrix, 0, 0, 5);
			stack.push(matrix, palette);
			setCell(matrix, 0, 1, 7);
			const restoredPalette = stack.undo(matrix, palette);
			expect(restoredPalette).not.toBeNull();
			expect(getCell(matrix, 0, 0)).toBe(5);
			expect(getCell(matrix, 0, 1)).toBe(0);
			stack.undo(matrix, palette);
			expect(getCell(matrix, 0, 0)).toBe(0);
		});

		it('redo restores undone state', () => {
			const matrix = createEmptyMatrix(2, 1);
			const palette = createDefaultPalette();
			const stack = new UndoStack();
			stack.push(matrix, palette);
			setCell(matrix, 0, 0, 3);
			stack.undo(matrix, palette);
			expect(getCell(matrix, 0, 0)).toBe(0);
			stack.redo(matrix, palette);
			expect(getCell(matrix, 0, 0)).toBe(3);
		});

		it('restores palette when undoing colour removal', () => {
			const matrix = createEmptyMatrix(2, 1);
			const palette = createDefaultPalette();
			setCell(matrix, 0, 1, 1);
			const stack = new UndoStack();
			stack.push(matrix, palette);
			const removed = removeColour(matrix, palette, 1, 0);
			matrix.cells.set(removed.matrix.cells);
			const restoredPalette = stack.undo(matrix, removed.palette);
			expect(restoredPalette).toEqual(palette);
			expect(getCell(matrix, 0, 1)).toBe(1);
		});

		it('keeps at most 50 entries', () => {
			const matrix = createEmptyMatrix(2, 1);
			const palette = createDefaultPalette();
			const stack = new UndoStack();
			for (let i = 0; i < 55; i++) {
				setCell(matrix, 0, 0, i % 10);
				stack.push(matrix, palette);
			}
			for (let i = 0; i < 50; i++) {
				stack.undo(matrix, palette);
			}
			expect(stack.canUndo()).toBe(false);
		});
	});
});
