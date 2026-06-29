import type { PROJECT_FILE_VERSION, ZOOM_LEVELS } from './constants.js';

export type ReadingMode = 'zigzag' | 'manual';
export type ReadingDirection = 'ltr' | 'rtl';
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];
export type RowSide = 'RS' | 'WS';

export interface ColourEntry {
	id: number;
	hex: string;
	name: string;
}

/** Row 0 is the bottom row (knitting row 1). Cells are row-major: index = row * width + stitch. */
export interface PatternMatrix {
	width: number;
	height: number;
	cells: Uint8Array;
}

export interface WorkPosition {
	row: number;
	stitch: number;
}

export interface IntarsiaSettings {
	projectName: string;
	readingMode: ReadingMode;
	manualDirection: ReadingDirection;
	showRsWs: boolean;
	fabricView: boolean;
	stitchesPerCm: number;
	rowsPerCm: number;
	zoom: ZoomLevel;
}

export interface IntarsiaProject {
	version: typeof PROJECT_FILE_VERSION;
	matrix: PatternMatrix;
	palette: ColourEntry[];
	position: WorkPosition;
	settings: IntarsiaSettings;
}

export interface ColourRun {
	colourId: number;
	length: number;
}

export interface RowAnalysis {
	runs: ColourRun[];
	totalsByColour: Map<number, number>;
	totalStitches: number;
}
