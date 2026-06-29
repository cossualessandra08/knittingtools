import { terrainRowsFromBbox } from '../dimensions.js';
import { normalizeMatrix } from '../matrix-utils.js';
import { fetchElevations } from './elevation-api.js';
import type { SharedConfig, SourceAdapter, SourceMatrix, TerrainBbox, TerrainConfig } from '../types.js';

export function posterizeValues(values: Float32Array, levels: number): void {
	for (let i = 0; i < values.length; i++) {
		const step = 1 / (levels - 1);
		const level = Math.round(values[i] / step);
		values[i] = level * step;
	}
}

export function elevationsToMatrix(
	elevations: number[],
	width: number,
	height: number,
	mode: TerrainConfig['mode'],
	posterizeLevels: number
): SourceMatrix {
	const values = new Float32Array(elevations);
	const min = Math.min(...elevations);
	const max = Math.max(...elevations);
	const span = max - min || 1;
	for (let i = 0; i < values.length; i++) values[i] = (elevations[i] - min) / span;
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
		const rows = terrainRowsFromBbox(config.bbox, shared);
		const points = gridSamplePoints(input.bbox, shared.stitches, rows);
		const elevations = await fetchElevations(points);
		return elevationsToMatrix(
			elevations,
			shared.stitches,
			rows,
			config.mode,
			config.posterizeLevels
		);
	}
};
