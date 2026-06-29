import { jsPDF } from 'jspdf';
import { downloadBlob } from '$lib/jacquard/canvas.js';
import { flipBitmapVertical } from './bitmap-utils.js';
import type { Bitmap, PatternDimensions } from './types.js';

export function bitmapToSymbolGrid(bitmap: Bitmap, width: number, height: number): string[][] {
	const grid: string[][] = [];
	for (let row = 0; row < height; row++) {
		const cells: string[] = [];
		for (let col = 0; col < width; col++) {
			cells.push(bitmap[row * width + col] === 1 ? '|' : '-');
		}
		grid.push(cells);
	}
	return grid;
}

export function exportRowForDisplay(
	bitmap: Bitmap,
	width: number,
	height: number,
	displayRow: number
): number[] {
	const memoryRow = height - 1 - displayRow;
	const row: number[] = [];
	for (let col = 0; col < width; col++) row.push(bitmap[memoryRow * width + col]);
	return row;
}

export function symbolsForDisplayRow(
	bitmap: Bitmap,
	width: number,
	height: number,
	displayRow: number
): string[] {
	return exportRowForDisplay(bitmap, width, height, displayRow).map((v) => (v === 1 ? '|' : '-'));
}

export async function exportSymbolicPng(bitmap: Bitmap, dims: PatternDimensions): Promise<void> {
	const flipped = flipBitmapVertical(bitmap, dims.stitches, dims.rows);
	const canvas = document.createElement('canvas');
	const cell = 12;
	canvas.width = dims.stitches * cell;
	canvas.height = dims.rows * cell;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#000000';
	ctx.font = '10px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (let displayRow = 0; displayRow < dims.rows; displayRow++) {
		for (let col = 0; col < dims.stitches; col++) {
			const memoryRow = dims.rows - 1 - displayRow;
			const sym = flipped[memoryRow * dims.stitches + col] === 1 ? '|' : '-';
			ctx.fillText(sym, col * cell + cell / 2, displayRow * cell + cell / 2);
		}
	}
	const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
	downloadBlob(blob, `pattern-${dims.stitches}x${dims.rows}-symbols.png`);
}

export async function exportKnitPurlPdf(bitmap: Bitmap, dims: PatternDimensions): Promise<void> {
	const flipped = flipBitmapVertical(bitmap, dims.stitches, dims.rows);
	const pdf = new jsPDF({
		orientation: dims.stitches > dims.rows ? 'landscape' : 'portrait',
		unit: 'pt'
	});
	const cell = 10;
	const margin = 36;
	pdf.setFont('courier', 'normal');
	for (let displayRow = 0; displayRow < dims.rows; displayRow++) {
		const memoryRow = dims.rows - 1 - displayRow;
		for (let col = 0; col < dims.stitches; col++) {
			const sym = flipped[memoryRow * dims.stitches + col] === 1 ? '|' : '-';
			pdf.text(sym, margin + col * cell, margin + displayRow * cell);
		}
	}
	pdf.text('|= knit  -= purl', margin, margin + dims.rows * cell + 20);
	pdf.save(`pattern-${dims.stitches}x${dims.rows}-chart.pdf`);
}
