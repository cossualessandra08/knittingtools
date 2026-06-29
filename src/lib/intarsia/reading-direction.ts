import type { ReadingDirection, ReadingMode, RowSide } from './types.js';

export function readingDirectionForRow(
	row: number,
	mode: ReadingMode,
	manualDirection: ReadingDirection
): ReadingDirection {
	if (mode === 'manual') return manualDirection;
	return row % 2 === 0 ? 'ltr' : 'rtl';
}

export function rowSideForRow(row: number): RowSide {
	return row % 2 === 0 ? 'RS' : 'WS';
}

export function rowStartStitch(direction: ReadingDirection, width: number): number {
	return direction === 'ltr' ? 0 : width - 1;
}
