import { ACCEPTED_IMAGE_TYPES, MAX_FILE_BYTES } from './constants.js';
import type { CropRect } from './types.js';

export type FileValidationResult =
	| { ok: true }
	| { ok: false; code: 'unsupported_type' | 'file_too_large' };

export function validateImageFile(file: File): FileValidationResult {
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
		return { ok: false, code: 'unsupported_type' };
	}
	if (file.size > MAX_FILE_BYTES) {
		return { ok: false, code: 'file_too_large' };
	}
	return { ok: true };
}

export async function loadImageFromFile(
	file: File
): Promise<{ image: HTMLImageElement; objectUrl: string }> {
	const objectUrl = URL.createObjectURL(file);
	const image = new Image();
	image.decoding = 'async';
	image.src = objectUrl;
	await image.decode();
	return { image, objectUrl };
}

export function cropAndResize(
	source: CanvasImageSource,
	crop: CropRect,
	width: number,
	height: number
): ImageData {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2d context unavailable');
	ctx.imageSmoothingEnabled = true;
	ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
	return ctx.getImageData(0, 0, width, height);
}

export function imageDataToPngBlob(data: ImageData): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = data.width;
	canvas.height = data.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2d context unavailable');
	ctx.putImageData(data, 0, 0);
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) reject(new Error('PNG export failed'));
			else resolve(blob);
		}, 'image/png');
	});
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
