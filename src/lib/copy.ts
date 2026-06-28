export const site = {
	name: 'Knitting Tools',
	tagline: 'Free tools for knitting — pick what you need.',
	catalogHeading: 'Tools',
	backToCatalog: 'All tools'
} as const;

export const jacquard = {
	sectionImage: 'Image',
	sectionCrop: 'Crop',
	sectionDimensions: 'Dimensions',
	sectionGauge: 'Needle/row ratio',
	sectionConvert: 'Conversion',
	sectionExport: 'Export',
	upload: 'Drop an image here or click to browse',
	fitProportions: 'Fit proportions',
	stitches: 'Width (stitches)',
	stitchesPerCm: 'Stitches per cm',
	rowsPerCm: 'Rows per cm',
	rowsComputed: 'Rows (computed)',
	dimensionsSummary: (p: {
		stitches: string;
		rows: string;
		widthCm: string;
		heightCm: string;
	}) =>
		`${p.stitches} stitches × ${p.rows} rows — about ${p.widthCm} × ${p.heightCm} cm on fabric`,
	threshold: 'Black / white balance',
	invert: 'Invert colors',
	fabricView: 'As on fabric',
	exportAyab: 'Export for AYAB',
	exportDocs: 'Export documentation',
	legendBackground: 'Background',
	legendForeground: 'Foreground',
	warnOverNeedles: 'This exceeds the 200-needle machine limit.',
	warnLongPattern: 'Very long pattern — check row count before knitting.',
	confirmOverNeedles: 'Width is over 200 stitches. Export anyway?',
	errorUnsupportedType: 'Unsupported format. Use JPG, PNG, or WebP.',
	errorFileTooLarge: 'Image is too large. Try a smaller file.',
	hintUpload: 'Upload an image to get started.',
	stepBack: 'Back',
	stepNext: 'Next',
	preview: 'Preview',
	fabricViewHint: 'Shows how the pattern will look on fabric, using your needle/row ratio.'
} as const;
