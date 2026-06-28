import type { CropRect, GaugeRatio, PatternDimensions } from './types.js';

export function calculatePatternDimensions(
	input: {
		stitches: number;
		cropWidthPx: number;
		cropHeightPx: number;
	} & GaugeRatio
): PatternDimensions {
	const cropAspect = input.cropWidthPx / input.cropHeightPx;
	const widthCm = input.stitches / input.stitchesPerCm;
	const heightCm = widthCm / cropAspect;
	const rows = Math.round(heightCm * input.rowsPerCm);
	return {
		stitches: input.stitches,
		rows: Math.max(1, rows),
		widthCm,
		heightCm
	};
}

export function patternCropAspectRatio(
	input: {
		stitches: number;
		rows: number;
	} & GaugeRatio
): number {
	return (input.stitches * input.rowsPerCm) / (input.rows * input.stitchesPerCm);
}

function clampCrop(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
	const width = Math.max(1, Math.min(rect.width, imageWidth));
	const height = Math.max(1, Math.min(rect.height, imageHeight));
	const x = Math.max(0, Math.min(rect.x, imageWidth - width));
	const y = Math.max(0, Math.min(rect.y, imageHeight - height));
	return { x, y, width, height };
}

export function fitCropToPatternAspect(
	crop: CropRect,
	dims: PatternDimensions & GaugeRatio,
	image: { imageWidth: number; imageHeight: number }
): CropRect {
	const targetAspect = patternCropAspectRatio(dims);
	const centerX = crop.x + crop.width / 2;
	const centerY = crop.y + crop.height / 2;

	let width = crop.width;
	let height = crop.height;

	if (width / height > targetAspect) {
		width = height * targetAspect;
	} else {
		height = width / targetAspect;
	}

	const x = centerX - width / 2;
	const y = centerY - height / 2;

	return clampCrop({ x, y, width, height }, image.imageWidth, image.imageHeight);
}

export function defaultCrop(imageWidth: number, imageHeight: number): CropRect {
	return { x: 0, y: 0, width: imageWidth, height: imageHeight };
}
