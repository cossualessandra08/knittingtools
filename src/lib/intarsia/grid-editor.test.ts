import { describe, expect, it } from 'vitest';
import { createEmptyMatrix, getCell, setCell } from './pattern-matrix.js';
import {
	UndoStack,
	applyBrush,
	applyWithSymmetry,
	copyRegion,
	drawLine,
	floodFill,
	pasteRegion
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

	describe('copyRegion and pasteRegion', () => {
		it('copies a rectangular region', () => {
			const matrix = createEmptyMatrix(4, 2);
			setCell(matrix, 0, 0, 1);
			setCell(matrix, 0, 1, 2);
			setCell(matrix, 1, 0, 3);
			setCell(matrix, 1, 1, 4);
			const clip = copyRegion(matrix, 0, 0, 2, 2);
			expect(clip.width).toBe(2);
			expect(clip.height).toBe(2);
			expect(clip.cells).toEqual(new Uint8Array([1, 2, 3, 4]));
		});

		it('clips copy to matrix bounds', () => {
			const matrix = createEmptyMatrix(3, 2);
			const clip = copyRegion(matrix, 0, 1, 3, 2);
			expect(clip.width).toBe(2);
			expect(clip.height).toBe(2);
		});

		it('pastes a clip at the given origin', () => {
			const matrix = createEmptyMatrix(4, 2);
			const clip = { width: 2, height: 1, cells: new Uint8Array([5, 6]) };
			pasteRegion(matrix, 0, 1, clip);
			expect(getCell(matrix, 0, 1)).toBe(5);
			expect(getCell(matrix, 0, 2)).toBe(6);
		});

		it('clips paste to matrix bounds', () => {
			const matrix = createEmptyMatrix(3, 2);
			const clip = { width: 3, height: 2, cells: new Uint8Array([1, 2, 3, 4, 5, 6]) };
			pasteRegion(matrix, 0, 1, clip);
			expect(getCell(matrix, 0, 1)).toBe(1);
			expect(getCell(matrix, 0, 2)).toBe(2);
			expect(getCell(matrix, 1, 1)).toBe(4);
			expect(getCell(matrix, 1, 2)).toBe(5);
		});
	});

	describe('applyWithSymmetry', () => {
		it('mirrors brush strokes vertically', () => {
			const matrix = createEmptyMatrix(5, 1);
			applyWithSymmetry(matrix, 0, 1, 'vertical', (m, row, stitch) => {
				applyBrush(m, row, stitch, 1);
			});
			expect(getCell(matrix, 0, 1)).toBe(1);
			expect(getCell(matrix, 0, 3)).toBe(1);
		});

		it('mirrors brush strokes horizontally', () => {
			const matrix = createEmptyMatrix(1, 5);
			applyWithSymmetry(matrix, 1, 0, 'horizontal', (m, row, stitch) => {
				applyBrush(m, row, stitch, 2);
			});
			expect(getCell(matrix, 1, 0)).toBe(2);
			expect(getCell(matrix, 3, 0)).toBe(2);
		});
	});

	describe('UndoStack', () => {
		it('restores the previous matrix state', () => {
			const matrix = createEmptyMatrix(3, 1);
			const stack = new UndoStack();
			stack.push(matrix);
			setCell(matrix, 0, 0, 5);
			stack.push(matrix);
			setCell(matrix, 0, 1, 7);
			stack.undo(matrix);
			expect(getCell(matrix, 0, 0)).toBe(5);
			expect(getCell(matrix, 0, 1)).toBe(0);
			stack.undo(matrix);
			expect(getCell(matrix, 0, 0)).toBe(0);
		});

		it('keeps at most 50 entries', () => {
			const matrix = createEmptyMatrix(2, 1);
			const stack = new UndoStack();
			for (let i = 0; i < 55; i++) {
				setCell(matrix, 0, 0, i % 10);
				stack.push(matrix);
			}
			for (let i = 0; i < 50; i++) {
				stack.undo(matrix);
			}
			expect(stack.canUndo()).toBe(false);
		});
	});
});
