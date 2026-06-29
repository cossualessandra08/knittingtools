import {
	AUTOSAVE_KEY,
	MAX_COLOURS,
	PROJECT_FILE_VERSION,
	ZOOM_LEVELS
} from './constants.js';
import { createDefaultPalette } from './colour-palette.js';
import { createEmptyMatrix, validateMatrixDimensions } from './pattern-matrix.js';
import type {
	ColourEntry,
	IntarsiaProject,
	IntarsiaSettings,
	WorkPosition,
	ZoomLevel
} from './types.js';

export interface SerializedProject {
	version: typeof PROJECT_FILE_VERSION;
	matrix: { width: number; height: number; cells: number[] };
	palette: ColourEntry[];
	position: WorkPosition;
	settings: IntarsiaSettings;
}

export function defaultProject(width: number, height: number): IntarsiaProject {
	return {
		version: PROJECT_FILE_VERSION,
		matrix: createEmptyMatrix(width, height),
		palette: createDefaultPalette(),
		position: { row: 0, stitch: 0 },
		settings: {
			projectName: 'Untitled',
			readingMode: 'zigzag',
			manualDirection: 'ltr',
			showRsWs: true,
			fabricView: false,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			zoom: 100
		}
	};
}

export function serializeProject(project: IntarsiaProject): SerializedProject {
	return {
		version: project.version,
		matrix: {
			width: project.matrix.width,
			height: project.matrix.height,
			cells: Array.from(project.matrix.cells)
		},
		palette: project.palette,
		position: project.position,
		settings: project.settings
	};
}

function isZoomLevel(value: number): value is ZoomLevel {
	return (ZOOM_LEVELS as readonly number[]).includes(value);
}

function isReadingMode(value: unknown): value is IntarsiaSettings['readingMode'] {
	return value === 'zigzag' || value === 'manual';
}

function isReadingDirection(value: unknown): value is IntarsiaSettings['manualDirection'] {
	return value === 'ltr' || value === 'rtl';
}

function parseSettings(raw: unknown): IntarsiaSettings {
	if (!raw || typeof raw !== 'object') throw new Error('Could not read project file.');
	const s = raw as Record<string, unknown>;
	if (typeof s.projectName !== 'string') throw new Error('Could not read project file.');
	if (!isReadingMode(s.readingMode)) throw new Error('Could not read project file.');
	if (!isReadingDirection(s.manualDirection)) throw new Error('Could not read project file.');
	if (typeof s.showRsWs !== 'boolean') throw new Error('Could not read project file.');
	if (typeof s.fabricView !== 'boolean') throw new Error('Could not read project file.');
	if (typeof s.stitchesPerCm !== 'number' || s.stitchesPerCm <= 0) {
		throw new Error('Could not read project file.');
	}
	if (typeof s.rowsPerCm !== 'number' || s.rowsPerCm <= 0) {
		throw new Error('Could not read project file.');
	}
	if (typeof s.zoom !== 'number' || !isZoomLevel(s.zoom)) {
		throw new Error('Could not read project file.');
	}
	return {
		projectName: s.projectName,
		readingMode: s.readingMode,
		manualDirection: s.manualDirection,
		showRsWs: s.showRsWs,
		fabricView: s.fabricView,
		stitchesPerCm: s.stitchesPerCm,
		rowsPerCm: s.rowsPerCm,
		zoom: s.zoom
	};
}

function parsePalette(raw: unknown): ColourEntry[] {
	if (!Array.isArray(raw)) throw new Error('Could not read project file.');
	if (raw.length < 1 || raw.length > MAX_COLOURS) {
		throw new Error('Could not read project file.');
	}
	return raw.map((entry, index) => {
		if (!entry || typeof entry !== 'object') throw new Error('Could not read project file.');
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'number' || e.id !== index) {
			throw new Error('Could not read project file.');
		}
		if (typeof e.hex !== 'string') throw new Error('Could not read project file.');
		if (typeof e.name !== 'string') throw new Error('Could not read project file.');
		return { id: e.id, hex: e.hex, name: e.name };
	});
}

function parsePosition(raw: unknown, width: number, height: number): WorkPosition {
	if (!raw || typeof raw !== 'object') throw new Error('Could not read project file.');
	const p = raw as Record<string, unknown>;
	if (typeof p.row !== 'number' || typeof p.stitch !== 'number') {
		throw new Error('Could not read project file.');
	}
	if (p.row < 0 || p.row >= height || p.stitch < 0 || p.stitch >= width) {
		throw new Error('Could not read project file.');
	}
	return { row: p.row, stitch: p.stitch };
}

function parseMatrix(raw: unknown): { width: number; height: number; cells: Uint8Array } {
	if (!raw || typeof raw !== 'object') throw new Error('Could not read project file.');
	const m = raw as Record<string, unknown>;
	if (typeof m.width !== 'number' || typeof m.height !== 'number') {
		throw new Error('Could not read project file.');
	}
	const validation = validateMatrixDimensions(m.width, m.height);
	if (!validation.ok) throw new Error('Could not read project file.');
	if (!Array.isArray(m.cells)) throw new Error('Could not read project file.');
	if (m.cells.length !== m.width * m.height) throw new Error('Could not read project file.');
	for (const cell of m.cells) {
		if (typeof cell !== 'number' || cell < 0 || !Number.isInteger(cell)) {
			throw new Error('Could not read project file.');
		}
	}
	return { width: m.width, height: m.height, cells: Uint8Array.from(m.cells) };
}

export function deserializeProject(json: unknown): IntarsiaProject {
	if (!json || typeof json !== 'object') throw new Error('Could not read project file.');
	const data = json as Record<string, unknown>;
	if (data.version !== PROJECT_FILE_VERSION) throw new Error('Could not read project file.');
	const matrix = parseMatrix(data.matrix);
	const palette = parsePalette(data.palette);
	const position = parsePosition(data.position, matrix.width, matrix.height);
	const settings = parseSettings(data.settings);
	for (const cell of matrix.cells) {
		if (cell >= palette.length) throw new Error('Could not read project file.');
	}
	return {
		version: PROJECT_FILE_VERSION,
		matrix,
		palette,
		position,
		settings
	};
}

export function exportProjectJson(project: IntarsiaProject): string {
	return JSON.stringify(serializeProject(project));
}

export function importProjectJson(text: string): IntarsiaProject {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error('Could not read project file.');
	}
	return deserializeProject(parsed);
}

export function saveToLocalStorage(project: IntarsiaProject): void {
	localStorage.setItem(AUTOSAVE_KEY, exportProjectJson(project));
}

export function loadFromLocalStorage(): IntarsiaProject | null {
	const raw = localStorage.getItem(AUTOSAVE_KEY);
	if (!raw) return null;
	return importProjectJson(raw);
}

export function downloadProjectFile(project: IntarsiaProject): void {
	const json = exportProjectJson(project);
	const name = project.settings.projectName.trim() || 'Untitled';
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `${name}.intarsia.json`;
	anchor.click();
	URL.revokeObjectURL(url);
}
