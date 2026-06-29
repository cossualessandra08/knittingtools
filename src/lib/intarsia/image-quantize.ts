import { defaultColourName } from './colour-palette.js';
import type { ColourEntry, PatternMatrix } from './types.js';

const MAX_KMEANS_ITERATIONS = 10;

interface Rgb {
	r: number;
	g: number;
	b: number;
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (channel: number) =>
		Math.max(0, Math.min(255, Math.round(channel)))
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function extractPixels(image: ImageData): Rgb[] {
	const pixels: Rgb[] = [];
	const { data, width, height } = image;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			pixels.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
		}
	}
	return pixels;
}

function rgbKey(pixel: Rgb): string {
	return `${pixel.r},${pixel.g},${pixel.b}`;
}

function squaredDistance(a: Rgb, b: Rgb): number {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return dr * dr + dg * dg + db * db;
}

function meanRgb(pixels: Rgb[]): Rgb {
	let r = 0;
	let g = 0;
	let b = 0;
	for (const pixel of pixels) {
		r += pixel.r;
		g += pixel.g;
		b += pixel.b;
	}
	const count = pixels.length;
	return { r: r / count, g: g / count, b: b / count };
}

function initializeCentroids(pixels: Rgb[], k: number): Rgb[] {
	const unique: Rgb[] = [];
	const seen = new Set<string>();
	for (const pixel of pixels) {
		const key = rgbKey(pixel);
		if (!seen.has(key)) {
			seen.add(key);
			unique.push({ ...pixel });
		}
		if (unique.length >= k) break;
	}

	const centroids = unique.slice(0, k);
	while (centroids.length < k) {
		centroids.push({ ...pixels[centroids.length % pixels.length]! });
	}
	return centroids;
}

function kMeansCluster(
	pixels: Rgb[],
	colourCount: number
): { centroids: Rgb[]; assignments: number[] } {
	const k = Math.min(colourCount, pixels.length);
	const centroids = initializeCentroids(pixels, k);
	const assignments = new Array<number>(pixels.length).fill(0);

	for (let iter = 0; iter < MAX_KMEANS_ITERATIONS; iter++) {
		let changed = false;
		for (let i = 0; i < pixels.length; i++) {
			const pixel = pixels[i]!;
			let bestCluster = 0;
			let bestDistance = squaredDistance(pixel, centroids[0]!);
			for (let c = 1; c < k; c++) {
				const distance = squaredDistance(pixel, centroids[c]!);
				if (distance < bestDistance) {
					bestDistance = distance;
					bestCluster = c;
				}
			}
			if (assignments[i] !== bestCluster) {
				assignments[i] = bestCluster;
				changed = true;
			}
		}

		const clusters: Rgb[][] = Array.from({ length: k }, () => []);
		for (let i = 0; i < pixels.length; i++) {
			clusters[assignments[i]!]!.push(pixels[i]!);
		}

		for (let c = 0; c < k; c++) {
			const cluster = clusters[c]!;
			if (cluster.length > 0) {
				centroids[c] = meanRgb(cluster);
			}
		}

		if (!changed) break;
	}

	return { centroids, assignments };
}

function buildPalette(centroids: Rgb[]): ColourEntry[] {
	return centroids.map((centroid, id) => ({
		id,
		hex: rgbToHex(centroid.r, centroid.g, centroid.b),
		name: defaultColourName(id)
	}));
}

function buildMatrix(
	image: ImageData,
	assignments: number[]
): PatternMatrix {
	const { width, height } = image;
	const cells = new Uint8Array(width * height);

	for (let imageY = 0; imageY < height; imageY++) {
		const matrixRow = height - 1 - imageY;
		for (let x = 0; x < width; x++) {
			const pixelIndex = imageY * width + x;
			const matrixIndex = matrixRow * width + x;
			cells[matrixIndex] = assignments[pixelIndex]!;
		}
	}

	return { width, height, cells };
}

export function quantizeImageData(
	image: ImageData,
	colourCount: number
): { matrix: PatternMatrix; palette: ColourEntry[] } {
	const pixels = extractPixels(image);
	const k = Math.max(1, Math.min(colourCount, pixels.length));
	const { centroids, assignments } = kMeansCluster(pixels, k);
	const palette = buildPalette(centroids);
	const matrix = buildMatrix(image, assignments);
	return { matrix, palette };
}

export function resizeImageData(image: ImageData, width: number, height: number): ImageData {
	const { data: source, width: sourceWidth, height: sourceHeight } = image;
	const resized = new Uint8ClampedArray(width * height * 4);

	for (let y = 0; y < height; y++) {
		const sourceY = Math.min(sourceHeight - 1, Math.floor((y * sourceHeight) / height));
		for (let x = 0; x < width; x++) {
			const sourceX = Math.min(sourceWidth - 1, Math.floor((x * sourceWidth) / width));
			const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;
			const targetIndex = (y * width + x) * 4;
			resized[targetIndex] = source[sourceIndex]!;
			resized[targetIndex + 1] = source[sourceIndex + 1]!;
			resized[targetIndex + 2] = source[sourceIndex + 2]!;
			resized[targetIndex + 3] = source[sourceIndex + 3]!;
		}
	}

	return { data: resized, width, height } as ImageData;
}
