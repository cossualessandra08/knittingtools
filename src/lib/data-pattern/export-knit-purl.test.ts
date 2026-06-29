import { describe, expect, it } from 'vitest';
import { bitmapToSymbolGrid, exportRowForDisplay } from './export-knit-purl.js';

describe('bitmapToSymbolGrid', () => {
	it('maps 1 to knit and 0 to purl', () => {
		const grid = bitmapToSymbolGrid(new Uint8Array([1, 0]), 2, 1);
		expect(grid[0]).toEqual(['|', '-']);
	});
});

describe('exportRowForDisplay', () => {
	it('flips rows so row 0 in memory becomes bottom row', () => {
		const bitmap = new Uint8Array([1, 0, 0, 1]);
		expect(exportRowForDisplay(bitmap, 2, 2, 0)).toEqual([0, 1]);
	});
});
