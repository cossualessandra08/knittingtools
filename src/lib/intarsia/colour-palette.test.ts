import { describe, expect, it } from 'vitest';
import {
	createDefaultPalette,
	colourInUse,
	mergeColours,
	removeColour,
	renameColour,
	defaultColourName
} from './colour-palette.js';
import { createEmptyMatrix, setCell } from './pattern-matrix.js';

describe('colour-palette', () => {
	it('creates default white and black palette entries', () => {
		const palette = createDefaultPalette();
		expect(palette).toHaveLength(2);
		expect(palette[0]!.hex).toBe('#FFFFFF');
		expect(palette[1]!.hex).toBe('#000000');
	});

	it('merges two colours and remaps matrix cells', () => {
		const palette = [
			{ id: 0, hex: '#000000', name: 'Black' },
			{ id: 1, hex: '#111111', name: 'Colour 2' }
		];
		const matrix = createEmptyMatrix(2, 1);
		setCell(matrix, 0, 0, 0);
		setCell(matrix, 0, 1, 1);
		const result = mergeColours(matrix, palette, 1, 0);
		expect(result.palette).toHaveLength(1);
		expect(result.matrix.cells[1]).toBe(0);
	});

	it('removes a colour and remaps cells to white', () => {
		const palette = createDefaultPalette();
		const matrix = createEmptyMatrix(2, 1);
		setCell(matrix, 0, 1, 1);
		const result = removeColour(matrix, palette, 1, 0);
		expect(result.palette).toHaveLength(1);
		expect(result.palette[0]!.id).toBe(0);
		expect(result.matrix.cells[1]).toBe(0);
	});

	it('renames a colour', () => {
		const palette = createDefaultPalette();
		const updated = renameColour(palette, 0, 'Cream');
		expect(updated[0]!.name).toBe('Cream');
	});

	it('formats default names', () => {
		expect(defaultColourName(2)).toBe('Colour 3');
	});

	it('detects when a colour is used on the grid', () => {
		const matrix = createEmptyMatrix(3, 1);
		expect(colourInUse(matrix, 1)).toBe(false);
		setCell(matrix, 0, 1, 1);
		expect(colourInUse(matrix, 1)).toBe(true);
		expect(colourInUse(matrix, 2)).toBe(false);
	});
});
