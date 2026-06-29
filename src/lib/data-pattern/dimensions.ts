import { MAX_ROWS, MIN_ROWS, ROWS_PER_SEC } from './constants.js';
import type { PatternDimensions, SharedConfig, TerrainBbox } from './types.js';

export function clampRows(rows: number): number {
	return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(rows)));
}

export function audioRowsFromDuration(durationSec: number): number {
	return clampRows(durationSec * ROWS_PER_SEC);
}

export function terrainRowsFromBbox(bbox: TerrainBbox, gauge: SharedConfig): number {
	const latSpan = Math.abs(bbox.north - bbox.south);
	const lngSpan = Math.abs(bbox.east - bbox.west);
	const centerLat = (bbox.north + bbox.south) / 2;
	const bboxAspect = (lngSpan * Math.cos((centerLat * Math.PI) / 180)) / latSpan;
	const widthCm = gauge.stitches / gauge.stitchesPerCm;
	const heightCm = widthCm / bboxAspect;
	return clampRows(heightCm * gauge.rowsPerCm);
}

export function patternDimensions(
	stitches: number,
	rows: number,
	gauge: SharedConfig
): PatternDimensions {
	const widthCm = stitches / gauge.stitchesPerCm;
	const heightCm = rows / gauge.rowsPerCm;
	return { stitches, rows, widthCm, heightCm };
}

export function fabricSummary(dims: PatternDimensions): string {
	return `${dims.stitches} sts × ${dims.rows} rows — approx. ${dims.widthCm.toFixed(1)} × ${dims.heightCm.toFixed(1)} cm on fabric`;
}

export function bboxWithinLimit(bbox: TerrainBbox): boolean {
	const latSpan = Math.abs(bbox.north - bbox.south);
	const lngSpan = Math.abs(bbox.east - bbox.west);
	return latSpan <= 0.5 && lngSpan <= 0.5;
}
