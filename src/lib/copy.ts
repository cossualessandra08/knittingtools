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

export const intarsia = {
	projectName: 'Project name',
	newProject: 'New project',
	exportProject: 'Export project',
	importProject: 'Import project',
	uploadImage: 'Upload image',
	createGrid: 'Create grid',
	widthStitches: 'Width (stitches)',
	heightRows: 'Height (rows)',
	colourCount: 'Number of colours',
	confirmColours: 'Confirm colours',
	mergeColours: 'Merge colours',
	rowLabel: (n: number) => `Row ${n}`,
	nextRow: 'Next row',
	prevRow: 'Prev row',
	prevStitch: 'Previous stitch',
	nextStitch: 'Next stitch',
	readingAuto: 'Auto (zigzag)',
	readingManual: 'Manual',
	directionLtr: 'Left to right',
	directionRtl: 'Right to left',
	showRsWs: 'Show RS/WS',
	fabricView: 'As on fabric',
	stitchesPerCm: 'Stitches per cm',
	rowsPerCm: 'Rows per cm',
	zoom: 'Zoom',
	totalStitches: (n: number) => `${n} stitches`,
	editPatternWarning:
		'Editing the pattern may change instructions for the current row. Continue?',
	errorUnsupportedType: 'Unsupported format. Use JPG or PNG.',
	errorFileTooLarge: 'Image too large. Try a smaller file.',
	errorPatternExceedsLimits: 'Pattern exceeds 200 stitches or 300 rows.',
	errorTooManyColours: 'Maximum 20 colours. Merge colours in the review step.',
	errorNoPattern: 'Load or create a pattern to start.',
	errorInvalidProject: 'Could not read project file.',
	confirmNewProject: 'Start a new project? This replaces your current project.',
	hintStart: 'Load or create a pattern to get started.'
} as const;
