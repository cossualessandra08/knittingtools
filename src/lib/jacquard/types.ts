export type CropRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type GaugeRatio = {
	stitchesPerCm: number;
	rowsPerCm: number;
};

export type PatternDimensions = {
	stitches: number;
	rows: number;
	widthCm: number;
	heightCm: number;
};

export type ConversionParams = {
	threshold: number;
	invert: boolean;
};
