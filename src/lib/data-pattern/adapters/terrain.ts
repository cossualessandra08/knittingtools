import { MAX_TERRAIN_SAMPLE_DIM } from '../constants.js';
import { terrainRowsFromBbox } from '../dimensions.js';
import { normalizeMatrix } from '../matrix-utils.js';
import { fetchElevations } from './elevation-api.js';
import type { SharedConfig, SourceAdapter, SourceMatrix, TerrainBbox, TerrainConfig } from '../types.js';

export function posterizeValues(values: Float32Array, levels: number): void {
	const safeLevels = Math.max(2, Math.round(levels));
	for (let i = 0; i < values.length; i++) {
		const step = 1 / (safeLevels - 1);
		const level = Math.round(values[i] / step);
		values[i] = level * step;
	}
}

function minMax(values: ArrayLike<number>): { min: number; max: number } {
	let min = Infinity;
	let max = -Infinity;
	for (let i = 0; i < values.length; i++) {
		const v = values[i];
		if (v < min) min = v;
		if (v > max) max = v;
	}
	return { min, max };
}

function normalizeElevations(elevations: number[]): Float32Array {
	const { min, max } = minMax(elevations);
	const span = max - min || 1;
	const values = new Float32Array(elevations.length);
	for (let i = 0; i < elevations.length; i++) {
		values[i] = (elevations[i] - min) / span;
	}
	return values;
}

/** Bilinear upsample from a coarse elevation sample to the target pattern size. */
export function upsampleNormalizedGrid(
	sampleValues: Float32Array,
	sampleW: number,
	sampleH: number,
	targetW: number,
	targetH: number
): Float32Array {
	const out = new Float32Array(targetW * targetH);
	for (let row = 0; row < targetH; row++) {
		for (let col = 0; col < targetW; col++) {
			const sy = (row / Math.max(1, targetH - 1)) * Math.max(0, sampleH - 1);
			const sx = (col / Math.max(1, targetW - 1)) * Math.max(0, sampleW - 1);
			const y0 = Math.floor(sy);
			const y1 = Math.min(sampleH - 1, y0 + 1);
			const x0 = Math.floor(sx);
			const x1 = Math.min(sampleW - 1, x0 + 1);
			const fy = sy - y0;
			const fx = sx - x0;
			const v00 = sampleValues[y0 * sampleW + x0];
			const v10 = sampleValues[y0 * sampleW + x1];
			const v01 = sampleValues[y1 * sampleW + x0];
			const v11 = sampleValues[y1 * sampleW + x1];
			const v0 = v00 * (1 - fx) + v10 * fx;
			const v1 = v01 * (1 - fx) + v11 * fx;
			out[row * targetW + col] = v0 * (1 - fy) + v1 * fy;
		}
	}
	return out;
}

/** Build matrix from raw elevations at a given grid size (used in tests). */
export function elevationsToMatrix(
	elevations: number[],
	width: number,
	height: number,
	mode: TerrainConfig['mode'],
	posterizeLevels: number
): SourceMatrix {
	const values = normalizeElevations(elevations);
	if (mode === 'posterized') posterizeValues(values, posterizeLevels);
	const matrix: SourceMatrix = { width, height, values };
	normalizeMatrix(matrix);
	return matrix;
}

function gridSamplePoints(bbox: TerrainBbox, width: number, height: number) {
	const points: { lat: number; lng: number }[] = [];
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const lat =
				bbox.south + ((height - 1 - row) / Math.max(1, height - 1)) * (bbox.north - bbox.south);
			const lng = bbox.west + (col / Math.max(1, width - 1)) * (bbox.east - bbox.west);
			points.push({ lat, lng });
		}
	}
	return points;
}

export const terrainAdapter: SourceAdapter<{ bbox: TerrainBbox }, TerrainConfig> = {
	id: 'terrain',
	estimateRows(_input, config, shared) {
		return terrainRowsFromBbox(config.bbox, shared);
	},
	async analyze(input, config, shared) {
		const targetRows = terrainRowsFromBbox(config.bbox, shared);
		const targetW = shared.stitches;
		const targetH = targetRows;
		const sampleW = Math.min(targetW, MAX_TERRAIN_SAMPLE_DIM);
		const sampleH = Math.min(targetH, MAX_TERRAIN_SAMPLE_DIM);
		const points = gridSamplePoints(input.bbox, sampleW, sampleH);
		const sampleElevations = await fetchElevations(points);
		const sampleNorm = normalizeElevations(sampleElevations);
		const fullValues =
			sampleW === targetW && sampleH === targetH
				? new Float32Array(sampleNorm)
				: upsampleNormalizedGrid(sampleNorm, sampleW, sampleH, targetW, targetH);
		if (config.mode === 'posterized') {
			posterizeValues(fullValues, config.posterizeLevels);
		}
		const matrix: SourceMatrix = { width: targetW, height: targetH, values: fullValues };
		normalizeMatrix(matrix);
		return matrix;
	}
};
