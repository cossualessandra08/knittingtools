import { readingDirectionForRow, rowStartStitch } from './reading-direction.js';
import type { IntarsiaSettings, WorkPosition } from './types.js';

function clampStitch(stitch: number, width: number): number {
	return Math.max(0, Math.min(width - 1, stitch));
}

function clampRow(row: number, height: number): number {
	return Math.max(0, Math.min(height - 1, row));
}

export function setStitchPosition(
	position: WorkPosition,
	row: number,
	stitch: number,
	width: number,
	height: number
): WorkPosition {
	return {
		row: clampRow(row, height),
		stitch: clampStitch(stitch, width)
	};
}

export function prevStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const direction = readingDirectionForRow(position.row, settings.readingMode, settings.manualDirection);
	const delta = direction === 'ltr' ? -1 : -1;
	return { ...position, stitch: clampStitch(position.stitch + delta, width) };
}

export function nextStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const direction = readingDirectionForRow(position.row, settings.readingMode, settings.manualDirection);
	const delta = direction === 'ltr' ? 1 : -1;
	return { ...position, stitch: clampStitch(position.stitch + delta, width) };
}

export function prevRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = clampRow(position.row - 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function nextRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = clampRow(position.row + 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function jumpToRow(
	uiRow: number,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = uiRow - 1;
	const direction = readingDirectionForRow(uiRow, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}
