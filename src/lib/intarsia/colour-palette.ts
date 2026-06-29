import { MAX_COLOURS } from './constants.js';
import type { ColourEntry, PatternMatrix } from './types.js';

export function defaultColourName(index: number): string {
	return `Colour ${index + 1}`;
}

export function createDefaultPalette(): ColourEntry[] {
	return [{ id: 0, hex: '#FFFFFF', name: defaultColourName(0) }];
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
