import { MAX_COLOURS } from './constants.js';
import type { ColourEntry, PatternMatrix } from './types.js';

export function defaultColourName(index: number): string {
	return `Colour ${index + 1}`;
}

/** White background + black for drawing on blank grids. */
export function createDefaultPalette(): ColourEntry[] {
	return [
		{ id: 0, hex: '#FFFFFF', name: 'White' },
		{ id: 1, hex: '#000000', name: 'Black' }
	];
}

export function addColour(palette: ColourEntry[], hex: string): ColourEntry[] {
	if (palette.length >= MAX_COLOURS) {
		throw new Error('Maximum 20 colours.');
	}
	const id = palette.length;
	return [...palette, { id, hex, name: defaultColourName(id) }];
}

export function renameColour(palette: ColourEntry[], id: number, name: string): ColourEntry[] {
	return palette.map((c) => (c.id === id ? { ...c, name } : c));
}

export function updateColourHex(palette: ColourEntry[], id: number, hex: string): ColourEntry[] {
	return palette.map((c) => (c.id === id ? { ...c, hex } : c));
}

export function colourInUse(matrix: PatternMatrix, colourId: number): boolean {
	return matrix.cells.includes(colourId);
}

export function removeColour(
	matrix: PatternMatrix,
	palette: ColourEntry[],
	id: number,
	remapToId = 0
): { matrix: PatternMatrix; palette: ColourEntry[] } {
	if (palette.length <= 1) {
		throw new Error('Cannot remove the last colour.');
	}
	if (!palette.some((c) => c.id === id)) {
		throw new Error('Colour not found.');
	}
	if (id === remapToId) {
		throw new Error('Cannot remove colour into itself.');
	}
	return mergeColours(matrix, palette, id, remapToId);
}

export function mergeColours(
	matrix: PatternMatrix,
	palette: ColourEntry[],
	fromId: number,
	intoId: number
): { matrix: PatternMatrix; palette: ColourEntry[] } {
	const cells = matrix.cells.slice();
	for (let i = 0; i < cells.length; i++) {
		if (cells[i] === fromId) cells[i] = intoId;
		if (cells[i]! > fromId) cells[i] = cells[i]! - 1;
	}
	const nextPalette = palette
		.filter((c) => c.id !== fromId)
		.map((c) => ({
			...c,
			id: c.id > fromId ? c.id - 1 : c.id
		}));
	return { matrix: { ...matrix, cells }, palette: nextPalette };
}
