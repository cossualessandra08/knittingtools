import { getCell } from './pattern-matrix.js';
import type { ColourRun, PatternMatrix, ReadingDirection, RowAnalysis } from './types.js';

export function analyzeRow(
	matrix: PatternMatrix,
	row: number,
	direction: ReadingDirection
): RowAnalysis {
	const stitches = Array.from({ length: matrix.width }, (_, stitch) =>
		getCell(matrix, row, direction === 'ltr' ? stitch : matrix.width - 1 - stitch)
	);

	const runs: ColourRun[] = [];
	for (const colourId of stitches) {
		const last = runs.at(-1);
		if (last && last.colourId === colourId) last.length += 1;
		else runs.push({ colourId, length: 1 });
	}

	const totalsByColour = new Map<number, number>();
	for (const id of stitches) {
		totalsByColour.set(id, (totalsByColour.get(id) ?? 0) + 1);
	}

	return { runs, totalsByColour, totalStitches: stitches.length };
}

export function stitchIndexInReadingOrder(
	stitch: number,
	width: number,
	direction: ReadingDirection
): number {
	return direction === 'ltr' ? stitch : width - 1 - stitch;
}

export function activeSegmentIndex(
	runs: ColourRun[],
	stitch: number,
	direction: ReadingDirection,
	width: number
): number {
	const indexInOrder = stitchIndexInReadingOrder(stitch, width, direction);
	let cursor = 0;
	for (let i = 0; i < runs.length; i++) {
		const run = runs[i]!;
		if (indexInOrder < cursor + run.length) return i;
		cursor += run.length;
	}
	return Math.max(0, runs.length - 1);
}
