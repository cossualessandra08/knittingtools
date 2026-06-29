import { readingDirectionForRow, rowStartStitch } from './reading-direction.js';
import type { IntarsiaSettings, WorkPosition } from './types.js';

function toInt(value: unknown): number {
	const n = Number(value);
	return Number.isFinite(n) ? Math.floor(n) : 0;
}

function clampStitch(stitch: number, width: number): number {
	return Math.max(0, Math.min(width - 1, toInt(stitch)));
}

function clampRow(row: number, height: number): number {
	return Math.max(0, Math.min(height - 1, toInt(row)));
}

function normalizePosition(position: WorkPosition): WorkPosition {
	return { row: toInt(position.row), stitch: toInt(position.stitch) };
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

export function sanitizePosition(
	position: WorkPosition,
	width: number,
	height: number
): WorkPosition {
	return setStitchPosition(position, toInt(position.row), toInt(position.stitch), width, height);
}

export function prevStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const pos = normalizePosition(position);
	const direction = readingDirectionForRow(
		pos.row,
		settings.readingMode,
		settings.manualDirection
	);
	const delta = direction === 'ltr' ? -1 : 1;
	return { ...pos, stitch: clampStitch(pos.stitch + delta, width) };
}

export function nextStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const pos = normalizePosition(position);
	const direction = readingDirectionForRow(
		pos.row,
		settings.readingMode,
		settings.manualDirection
	);
	const delta = direction === 'ltr' ? 1 : -1;
	return { ...pos, stitch: clampStitch(pos.stitch + delta, width) };
}

export function prevRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const pos = normalizePosition(position);
	const row = clampRow(pos.row - 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function nextRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const pos = normalizePosition(position);
	const row = clampRow(pos.row + 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function jumpToRow(
	uiRow: number,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = clampRow(toInt(uiRow) - 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}
