import type { GaugeRatio } from './types.js';

/** Pixel size per stitch/row cell in on-screen preview and documentation. */
export function patternCellSize(
	baseSize: number,
	fabricView: boolean,
	gauge: GaugeRatio
): { cellWidth: number; cellHeight: number } {
	if (!fabricView || gauge.stitchesPerCm <= 0 || gauge.rowsPerCm <= 0) {
		return { cellWidth: baseSize, cellHeight: baseSize };
	}
	// Each stitch is wider on fabric than each row is tall (when rows/cm > stitches/cm).
	return {
		cellWidth: baseSize,
		cellHeight: baseSize * (gauge.stitchesPerCm / gauge.rowsPerCm)
	};
}
