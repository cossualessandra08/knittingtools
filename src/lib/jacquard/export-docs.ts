import { jsPDF } from 'jspdf';
import { downloadBlob, imageDataToPngBlob } from './canvas.js';
import type { GaugeRatio, PatternDimensions } from './types.js';

const CELL_PX = 8;
const GRID_MAJOR = 10;

export function docsFilename(stitches: number, rows: number, ext: 'png' | 'pdf'): string {
	return `pattern-${stitches}x${rows}-docs.${ext}`;
}

export function computeAnnotationLayout(stitches: number, rows: number, fabricView: boolean) {
	const cellHeight = fabricView ? CELL_PX * 0.7 : CELL_PX;
	const marginLeft = 36;
	const marginTop = 28;
	const legendHeight = 48;
	return {
		cellWidth: CELL_PX,
		cellHeight,
		marginLeft,
		marginTop,
		patternWidth: stitches * CELL_PX,
		patternHeight: rows * cellHeight,
		canvasWidth: marginLeft + stitches * CELL_PX + 16,
		canvasHeight: marginTop + rows * cellHeight + legendHeight + 16,
		legendHeight
	};
}

function drawPatternCells(
	ctx: CanvasRenderingContext2D,
	bitmap: Uint8Array,
	stitches: number,
	rows: number,
	layout: ReturnType<typeof computeAnnotationLayout>
) {
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < stitches; col++) {
			const value = bitmap[row * stitches + col];
			ctx.fillStyle = value === 1 ? '#000000' : '#FFFFFF';
			ctx.fillRect(
				layout.marginLeft + col * layout.cellWidth,
				layout.marginTop + row * layout.cellHeight,
				layout.cellWidth,
				layout.cellHeight
			);
		}
	}
}

function drawGrid(
	ctx: CanvasRenderingContext2D,
	stitches: number,
	rows: number,
	layout: ReturnType<typeof computeAnnotationLayout>
) {
	ctx.strokeStyle = '#cccccc';
	ctx.lineWidth = 0.5;
	for (let col = 0; col <= stitches; col++) {
		const x = layout.marginLeft + col * layout.cellWidth;
		ctx.beginPath();
		ctx.moveTo(x, layout.marginTop);
		ctx.lineTo(x, layout.marginTop + rows * layout.cellHeight);
		ctx.stroke();
	}
	for (let row = 0; row <= rows; row++) {
		const y = layout.marginTop + row * layout.cellHeight;
		ctx.beginPath();
		ctx.moveTo(layout.marginLeft, y);
		ctx.lineTo(layout.marginLeft + stitches * layout.cellWidth, y);
		ctx.stroke();
	}
}

function drawLabels(
	ctx: CanvasRenderingContext2D,
	stitches: number,
	rows: number,
	layout: ReturnType<typeof computeAnnotationLayout>
) {
	ctx.fillStyle = '#333333';
	ctx.font = '10px Inter, sans-serif';
	for (let col = GRID_MAJOR; col <= stitches; col += GRID_MAJOR) {
		const x = layout.marginLeft + col * layout.cellWidth;
		ctx.fillText(String(col), x - 6, layout.marginTop - 8);
	}
	for (let row = GRID_MAJOR; row <= rows; row += GRID_MAJOR) {
		const y = layout.marginTop + row * layout.cellHeight;
		ctx.fillText(String(row), 8, y + 3);
	}
}

function drawLegend(
	ctx: CanvasRenderingContext2D,
	layout: ReturnType<typeof computeAnnotationLayout>,
	labels: { background: string; foreground: string },
	meta: string
) {
	const y = layout.marginTop + layout.patternHeight + 20;
	ctx.fillStyle = '#333333';
	ctx.font = '10px Inter, sans-serif';
	ctx.fillText(meta, layout.marginLeft, y);
	ctx.fillStyle = '#FFFFFF';
	ctx.strokeStyle = '#333333';
	ctx.fillRect(layout.marginLeft, y + 8, 12, 12);
	ctx.strokeRect(layout.marginLeft, y + 8, 12, 12);
	ctx.fillStyle = '#333333';
	ctx.fillText(labels.background, layout.marginLeft + 18, y + 18);
	ctx.fillStyle = '#000000';
	ctx.fillRect(layout.marginLeft + 120, y + 8, 12, 12);
	ctx.fillStyle = '#333333';
	ctx.fillText(labels.foreground, layout.marginLeft + 138, y + 18);
}

export function renderDocumentationCanvas(
	bitmap: Uint8Array,
	dims: PatternDimensions,
	gauge: GaugeRatio,
	fabricView: boolean,
	labels: { background: string; foreground: string }
): HTMLCanvasElement {
	const layout = computeAnnotationLayout(dims.stitches, dims.rows, fabricView);
	const canvas = document.createElement('canvas');
	canvas.width = layout.canvasWidth;
	canvas.height = layout.canvasHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2d context unavailable');
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawPatternCells(ctx, bitmap, dims.stitches, dims.rows, layout);
	drawGrid(ctx, dims.stitches, dims.rows, layout);
	drawLabels(ctx, dims.stitches, dims.rows, layout);
	const meta = `${dims.stitches} × ${dims.rows} — ${dims.widthCm.toFixed(1)} × ${dims.heightCm.toFixed(1)} cm — ${gauge.stitchesPerCm} st/cm · ${gauge.rowsPerCm} rows/cm`;
	drawLegend(ctx, layout, labels, meta);
	return canvas;
}

export async function exportDocumentation(
	bitmap: Uint8Array,
	dims: PatternDimensions,
	gauge: GaugeRatio,
	fabricView: boolean,
	labels: { background: string; foreground: string }
): Promise<void> {
	const canvas = renderDocumentationCanvas(bitmap, dims, gauge, fabricView, labels);
	const pngBlob = await imageDataToPngBlob(
		canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
	);
	downloadBlob(pngBlob, docsFilename(dims.stitches, dims.rows, 'png'));

	const pdf = new jsPDF({
		orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
		unit: 'px',
		format: [canvas.width, canvas.height]
	});
	pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
	pdf.save(docsFilename(dims.stitches, dims.rows, 'pdf'));
}
