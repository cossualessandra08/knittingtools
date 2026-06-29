/** Pixel size of one grid cell at the given zoom percentage. */
export function cellPixelSize(zoom: number, base = 16): number {
	return (base * zoom) / 100;
}

/** Relative cell aspect on fabric: stitch width vs row height. */
export function fabricCellAspect(
	stitchesPerCm: number,
	rowsPerCm: number
): { width: number; height: number } {
	if (stitchesPerCm <= 0 || rowsPerCm <= 0) {
		return { width: 1, height: 1 };
	}
	return { width: rowsPerCm, height: stitchesPerCm };
}
