import type { ConversionParams } from './types.js';

const FOREGROUND = { r: 0, g: 0, b: 0 };
const BACKGROUND = { r: 255, g: 255, b: 255 };

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function applyContrast(gray: number, contrast: number): number {
	const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
	return clamp(Math.round(factor * (gray - 128) + 128), 0, 255);
}

function toGrayscale(r: number, g: number, b: number): number {
	return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

export function imageDataToBitmap(data: ImageData, params: ConversionParams): Uint8Array {
	const { width, height } = data;
	const bitmap = new Uint8Array(width * height);
	for (let i = 0; i < width * height; i++) {
		const offset = i * 4;
		const gray = applyContrast(
			toGrayscale(data.data[offset], data.data[offset + 1], data.data[offset + 2]),
			params.contrast
		);
		let isForeground = gray < params.threshold;
		if (params.invert) isForeground = !isForeground;
		bitmap[i] = isForeground ? 1 : 0;
	}
	return bitmap;
}

export function bitmapToRgba(bitmap: Uint8Array): Uint8ClampedArray {
	const data = new Uint8ClampedArray(bitmap.length * 4);
	for (let i = 0; i < bitmap.length; i++) {
		const color = bitmap[i] === 1 ? FOREGROUND : BACKGROUND;
		const offset = i * 4;
		data[offset] = color.r;
		data[offset + 1] = color.g;
		data[offset + 2] = color.b;
		data[offset + 3] = 255;
	}
	return data;
}

export function bitmapToImageData(bitmap: Uint8Array, width: number, height: number): ImageData {
	const rgba = bitmapToRgba(bitmap);
	return new ImageData(new Uint8ClampedArray(rgba), width, height);
}
