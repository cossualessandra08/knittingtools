import { describe, expect, it } from 'vitest';
import {
	createDefaultPalette,
	mergeColours,
	renameColour,
	defaultColourName
} from './colour-palette.js';
import { createEmptyMatrix, setCell } from './pattern-matrix.js';

describe('colour-palette', () => {
	it('creates default white palette entry', () => {
		const palette = createDefaultPalette();
		expect(palette).toHaveLength(1);
		expect(palette[0]!.hex).toBe('#FFFFFF');
		expect(palette[0]!.name).toBe('Colour 1');
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

	it('renames a colour', () => {
		const palette = createDefaultPalette();
		const updated = renameColour(palette, 0, 'Cream');
		expect(updated[0]!.name).toBe('Cream');
	});

	it('formats default names', () => {
		expect(defaultColourName(2)).toBe('Colour 3');
	});
});
