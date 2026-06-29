import type { ZOOM_LEVELS } from './constants.js';

export type SourceId = 'voice' | 'audio-file' | 'terrain';
export type AudioAnalysisMode = 'waveform' | 'spectrogram';
export type TerrainMode = 'continuous' | 'posterized';
export type PreviewView = 'symbols' | 'jacquard';
export type ExportMode = 'knit-purl' | 'jacquard';
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

/** Row 0 = top (image order). Values 0.0–1.0. */
export interface SourceMatrix {
	width: number;
	height: number;
	values: Float32Array;
}

/** Row 0 = top. 0 = background, 1 = foreground. */
export type Bitmap = Uint8Array;

export interface SharedConfig {
	stitches: number;
	stitchesPerCm: number;
	rowsPerCm: number;
}

export interface RefineParams {
	contrast: number;
	threshold: number;
	invert: boolean;
}

export interface VoiceConfig {
	sensitivity: number;
	smoothing: number;
}

export interface AudioFileConfig {
	analysisMode: AudioAnalysisMode;
	sensitivity: number;
	smoothing: number;
	segmentStartSec: number;
	segmentEndSec: number;
}

export interface TerrainBbox {
	south: number;
	north: number;
	west: number;
	east: number;
}

export interface TerrainConfig {
	mode: TerrainMode;
	posterizeLevels: number;
	bbox: TerrainBbox;
}

export interface PatternDimensions {
	stitches: number;
	rows: number;
	widthCm: number;
	heightCm: number;
}

export interface SourceAdapter<TInput, TConfig> {
	id: SourceId;
	analyze(input: TInput, config: TConfig, shared: SharedConfig): Promise<SourceMatrix>;
	estimateRows(input: TInput, config: TConfig, shared: SharedConfig): number;
}

