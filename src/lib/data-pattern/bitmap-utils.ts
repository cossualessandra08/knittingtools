import type { Bitmap } from './types.js';

export function cloneBitmap(bitmap: Bitmap): Bitmap {
	return new Uint8Array(bitmap);
}

export function flipBitmapVertical(bitmap: Bitmap, width: number, height: number): Bitmap {
	const out = new Uint8Array(bitmap.length);
	for (let row = 0; row < height; row++) {
		const srcRow = height - 1 - row;
		out.set(bitmap.subarray(srcRow * width, srcRow * width + width), row * width);
	}
	return out;
}

export function hasManualEdits(current: Bitmap, generated: Bitmap): boolean {
	if (current.length !== generated.length) return true;
	for (let i = 0; i < current.length; i++) {
		if (current[i] !== generated[i]) return true;
	}
	return false;
}
