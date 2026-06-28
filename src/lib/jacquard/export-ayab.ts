import { bitmapToImageData } from './convert.js';
import { downloadBlob, imageDataToPngBlob } from './canvas.js';

export function ayabFilename(stitches: number, rows: number): string {
	return `pattern-${stitches}x${rows}-ayab.png`;
}

export function bitmapIsPureBinary(bitmap: Uint8Array): boolean {
	return bitmap.every((value) => value === 0 || value === 1);
}

export async function exportAyabPng(
	bitmap: Uint8Array,
	stitches: number,
	rows: number
): Promise<void> {
	if (!bitmapIsPureBinary(bitmap)) {
		throw new Error('Bitmap must be 1-bit');
	}
	const image = bitmapToImageData(bitmap, stitches, rows);
	const blob = await imageDataToPngBlob(image);
	downloadBlob(blob, ayabFilename(stitches, rows));
}
