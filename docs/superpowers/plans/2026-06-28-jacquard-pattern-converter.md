# Jacquard Pattern Converter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual jacquard pattern converter tool per `docs/superpowers/specs/2026-06-28-jacquard-pattern-converter-design.md` — photo → 1-bit pattern with gauge correction, AYAB PNG export, and annotated PNG/PDF export.

**Architecture:** Pure TypeScript modules in `src/lib/jacquard/` implement dimension math, bitmap conversion, and export (tested with Vitest node project). Svelte 5 components in `src/lib/components/jacquard/` provide upload, crop canvas, controls, and preview. The tool page composes them in a wide two-column layout. All processing runs client-side via Canvas API; no server uploads.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), Tailwind 4 + shadcn-svelte (Button, Slider, Label, Input), Paraglide (en/it), Lucide icons, Canvas API, `jspdf` for PDF export, Vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-06-28-jacquard-pattern-converter-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/jacquard/constants.ts` | `MAX_NEEDLES`, `MAX_FILE_BYTES`, accepted MIME types |
| `src/lib/jacquard/types.ts` | `CropRect`, `GaugeRatio`, `PatternDimensions`, `ConversionParams` |
| `src/lib/jacquard/dimensions.ts` | Row count, physical cm, crop aspect ratio |
| `src/lib/jacquard/dimensions.test.ts` | Dimension math tests |
| `src/lib/jacquard/convert.ts` | Grayscale, contrast, threshold, invert → `Uint8Array` bitmap |
| `src/lib/jacquard/convert.test.ts` | Conversion pipeline tests |
| `src/lib/jacquard/canvas.ts` | Crop+resize, bitmap→ImageData, load file helpers |
| `src/lib/jacquard/canvas.test.ts` | Canvas helpers (browser vitest) |
| `src/lib/jacquard/export-ayab.ts` | Raw 1-bit PNG download |
| `src/lib/jacquard/export-ayab.test.ts` | AYAB export dimension/color tests |
| `src/lib/jacquard/export-docs.ts` | Annotated PNG + PDF with grid, numbers, legend |
| `src/lib/jacquard/export-docs.test.ts` | Documentation export smoke tests |
| `src/lib/components/jacquard/JacquardEditor.svelte` | Main editor: state, pipeline orchestration, layout |
| `src/lib/components/jacquard/ImageUploadZone.svelte` | Drag & drop + file picker |
| `src/lib/components/jacquard/CropCanvas.svelte` | Draggable crop rect + fit-proportions button |
| `src/lib/components/jacquard/PatternPreview.svelte` | Bitmap preview, fabric toggle, zoom |
| `src/lib/components/tools/ToolPageLayout.svelte` | Add optional `wide` variant |
| `src/routes/tools/jacquard-pattern/+page.svelte` | Tool page |
| `src/routes/tools/jacquard-pattern/+page.ts` | `prerender = true` |
| `src/lib/tools/registry.ts` | Add jacquard-pattern entry |
| `messages/en.json`, `messages/it.json` | Tool copy + UI strings |
| `e2e/jacquard-pattern.e2e.ts` | Navigation + basic interaction smoke |

---

### Task 1: Types, constants, and dimension math

**Files:**

- Create: `src/lib/jacquard/constants.ts`
- Create: `src/lib/jacquard/types.ts`
- Create: `src/lib/jacquard/dimensions.ts`
- Create: `src/lib/jacquard/dimensions.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/jacquard/dimensions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	calculatePatternDimensions,
	patternCropAspectRatio,
	fitCropToPatternAspect
} from './dimensions.js';

describe('calculatePatternDimensions', () => {
	it('calculates rows for square crop with gauge 4.5 × 6.4 and 120 stitches', () => {
		const result = calculatePatternDimensions({
			stitches: 120,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 500,
			cropHeightPx: 500
		});
		expect(result.rows).toBe(171);
		expect(result.widthCm).toBeCloseTo(26.67, 1);
		expect(result.heightCm).toBeCloseTo(26.67, 1);
	});

	it('returns more rows for a tall crop', () => {
		const wide = calculatePatternDimensions({
			stitches: 100,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 400,
			cropHeightPx: 400
		});
		const tall = calculatePatternDimensions({
			stitches: 100,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4,
			cropWidthPx: 200,
			cropHeightPx: 400
		});
		expect(tall.rows).toBeGreaterThan(wide.rows);
	});
});

describe('patternCropAspectRatio', () => {
	it('returns width/height ratio for pattern on fabric', () => {
		const ratio = patternCropAspectRatio({
			stitches: 120,
			rows: 171,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4
		});
		expect(ratio).toBeCloseTo(1, 1);
	});
});

describe('fitCropToPatternAspect', () => {
	it('adjusts crop rect to pattern aspect keeping center', () => {
		const fitted = fitCropToPatternAspect(
			{ x: 10, y: 10, width: 200, height: 100 },
			{ stitches: 120, rows: 171, stitchesPerCm: 4.5, rowsPerCm: 6.4 },
			{ imageWidth: 400, imageHeight: 400 }
		);
		const target = patternCropAspectRatio({
			stitches: 120,
			rows: 171,
			stitchesPerCm: 4.5,
			rowsPerCm: 6.4
		});
		expect(fitted.width / fitted.height).toBeCloseTo(target, 2);
		expect(fitted.x).toBeGreaterThanOrEqual(0);
		expect(fitted.y).toBeGreaterThanOrEqual(0);
		expect(fitted.x + fitted.width).toBeLessThanOrEqual(400);
		expect(fitted.y + fitted.height).toBeLessThanOrEqual(400);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/jacquard/dimensions.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

`src/lib/jacquard/constants.ts`:

```ts
export const MAX_NEEDLES = 200;
export const LONG_PATTERN_ROW_WARNING = 500;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
```

`src/lib/jacquard/types.ts`:

```ts
export type CropRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type GaugeRatio = {
	stitchesPerCm: number;
	rowsPerCm: number;
};

export type PatternDimensions = {
	stitches: number;
	rows: number;
	widthCm: number;
	heightCm: number;
};

export type ConversionParams = {
	contrast: number;
	threshold: number;
	invert: boolean;
};
```

`src/lib/jacquard/dimensions.ts`:

```ts
import type { CropRect, GaugeRatio, PatternDimensions } from './types.js';

export function calculatePatternDimensions(input: {
	stitches: number;
	cropWidthPx: number;
	cropHeightPx: number;
} & GaugeRatio): PatternDimensions {
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

export function patternCropAspectRatio(input: {
	stitches: number;
	rows: number;
} & GaugeRatio): number {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/jacquard/dimensions.test.ts`  
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/jacquard/constants.ts src/lib/jacquard/types.ts src/lib/jacquard/dimensions.ts src/lib/jacquard/dimensions.test.ts
git commit -m "feat(jacquard): add dimension math for stitch and row calculation"
```

---

### Task 2: Bitmap conversion pipeline

**Files:**

- Create: `src/lib/jacquard/convert.ts`
- Create: `src/lib/jacquard/convert.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/jacquard/convert.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyContrast, imageDataToBitmap, bitmapToImageData } from './convert.js';

describe('applyContrast', () => {
	it('returns mid gray unchanged at zero contrast', () => {
		expect(applyContrast(128, 0)).toBe(128);
	});

	it('darkens below midpoint at negative contrast', () => {
		expect(applyContrast(64, -50)).toBeLessThan(64);
	});
});

describe('imageDataToBitmap', () => {
	it('maps dark pixels to foreground (1) and light to background (0)', () => {
		const data = new ImageData(2, 1);
		data.data.set([
			0, 0, 0, 255,
			255, 255, 255, 255
		]);
		const bitmap = imageDataToBitmap(data, { contrast: 0, threshold: 128, invert: false });
		expect(Array.from(bitmap)).toEqual([1, 0]);
	});

	it('inverts foreground and background', () => {
		const data = new ImageData(1, 1);
		data.data.set([0, 0, 0, 255]);
		const bitmap = imageDataToBitmap(data, { contrast: 0, threshold: 128, invert: true });
		expect(bitmap[0]).toBe(0);
	});
});

describe('bitmapToImageData', () => {
	it('writes pure black and white pixels', () => {
		const bitmap = new Uint8Array([1, 0]);
		const image = bitmapToImageData(bitmap, 2, 1);
		expect(image.data[0]).toBe(0);
		expect(image.data[1]).toBe(0);
		expect(image.data[2]).toBe(0);
		expect(image.data[4]).toBe(255);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/jacquard/convert.test.ts`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

`src/lib/jacquard/convert.ts`:

```ts
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

export function bitmapToImageData(bitmap: Uint8Array, width: number, height: number): ImageData {
	const image = new ImageData(width, height);
	for (let i = 0; i < bitmap.length; i++) {
		const color = bitmap[i] === 1 ? FOREGROUND : BACKGROUND;
		const offset = i * 4;
		image.data[offset] = color.r;
		image.data[offset + 1] = color.g;
		image.data[offset + 2] = color.b;
		image.data[offset + 3] = 255;
	}
	return image;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/jacquard/convert.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/jacquard/convert.ts src/lib/jacquard/convert.test.ts
git commit -m "feat(jacquard): add grayscale threshold conversion pipeline"
```

---

### Task 3: Canvas helpers (crop, resize, file load)

**Files:**

- Create: `src/lib/jacquard/canvas.ts`
- Create: `src/lib/jacquard/canvas.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/jacquard/canvas.test.ts` (browser project — name file to run in browser or test pure helpers only):

Split pure validation into testable node function; canvas ops tested via browser.

Add to `src/lib/jacquard/canvas.ts` a pure `validateImageFile` and test in node:

`src/lib/jacquard/canvas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateImageFile } from './canvas.js';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_BYTES } from './constants.js';

describe('validateImageFile', () => {
	it('accepts a small png file', () => {
		const file = new File([new Uint8Array(100)], 'test.png', { type: 'image/png' });
		expect(validateImageFile(file)).toEqual({ ok: true });
	});

	it('rejects unsupported type', () => {
		const file = new File([new Uint8Array(100)], 'test.gif', { type: 'image/gif' });
		expect(validateImageFile(file)).toEqual({ ok: false, code: 'unsupported_type' });
	});

	it('rejects oversized file', () => {
		const file = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.png', {
			type: 'image/png'
		});
		expect(validateImageFile(file)).toEqual({ ok: false, code: 'file_too_large' });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/jacquard/canvas.test.ts`  
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/lib/jacquard/canvas.ts`:

```ts
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

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	const url = URL.createObjectURL(file);
	try {
		const image = new Image();
		image.decoding = 'async';
		image.src = url;
		await image.decode();
		return image;
	} finally {
		URL.revokeObjectURL(url);
	}
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/jacquard/canvas.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/jacquard/canvas.ts src/lib/jacquard/canvas.test.ts
git commit -m "feat(jacquard): add canvas helpers and file validation"
```

---

### Task 4: AYAB PNG export

**Files:**

- Create: `src/lib/jacquard/export-ayab.ts`
- Create: `src/lib/jacquard/export-ayab.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/jacquard/export-ayab.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ayabFilename, bitmapIsPureBinary } from './export-ayab.js';

describe('ayabFilename', () => {
	it('includes stitch and row counts', () => {
		expect(ayabFilename(120, 171)).toBe('pattern-120x171-ayab.png');
	});
});

describe('bitmapIsPureBinary', () => {
	it('accepts only 0 and 1 values', () => {
		expect(bitmapIsPureBinary(new Uint8Array([0, 1, 1, 0]))).toBe(true);
		expect(bitmapIsPureBinary(new Uint8Array([0, 2]))).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/jacquard/export-ayab.test.ts`  
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/lib/jacquard/export-ayab.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/jacquard/export-ayab.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/jacquard/export-ayab.ts src/lib/jacquard/export-ayab.test.ts
git commit -m "feat(jacquard): add AYAB PNG export"
```

---

### Task 5: Documentation export (annotated PNG + PDF)

**Files:**

- Modify: `package.json` (add `jspdf`)
- Create: `src/lib/jacquard/export-docs.ts`
- Create: `src/lib/jacquard/export-docs.test.ts`

- [ ] **Step 1: Install jspdf**

Run: `npm install jspdf`

- [ ] **Step 2: Write the failing test**

`src/lib/jacquard/export-docs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { docsFilename, computeAnnotationLayout } from './export-docs.js';

describe('docsFilename', () => {
	it('builds documentation png name', () => {
		expect(docsFilename(80, 120, 'png')).toBe('pattern-80x120-docs.png');
	});
});

describe('computeAnnotationLayout', () => {
	it('allocates margin for row and column labels', () => {
		const layout = computeAnnotationLayout(100, 200, false);
		expect(layout.marginLeft).toBeGreaterThan(20);
		expect(layout.marginTop).toBeGreaterThan(10);
		expect(layout.patternWidth).toBe(100);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/jacquard/export-docs.test.ts`  
Expected: FAIL

- [ ] **Step 4: Write implementation**

`src/lib/jacquard/export-docs.ts`:

```ts
import { jsPDF } from 'jspdf';
import { bitmapToImageData } from './convert.js';
import type { GaugeRatio, PatternDimensions } from './types.js';
import { downloadBlob, imageDataToPngBlob } from './canvas.js';

const CELL_PX = 8;
const GRID_MAJOR = 10;
const GRID_MINOR = 5;

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
```

**Fix typo before commit:** `ctx.font '10px` → `ctx.font = '10px` in `drawLegend`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/jacquard/export-docs.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/jacquard/export-docs.ts src/lib/jacquard/export-docs.test.ts
git commit -m "feat(jacquard): add annotated PNG and PDF documentation export"
```

---

### Task 6: i18n messages, registry, wide layout

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/it.json`
- Modify: `src/lib/tools/registry.ts`
- Modify: `src/lib/components/tools/ToolPageLayout.svelte`

- [ ] **Step 1: Add messages**

Append to `messages/en.json`:

```json
"tool_jacquard_title": "Jacquard pattern converter",
"tool_jacquard_card_teaser": "Turn a photo into a 1-bit jacquard pattern for AYAB.",
"tool_jacquard_portico_1": "Upload a photo and convert it to a two-color knitting pattern — one pixel equals one stitch.",
"tool_jacquard_portico_2": "Set your needle/row ratio so the motif is not squashed on the fabric, then export a PNG for AYAB or a chart PDF.",
"tool_jacquard_portico_3": "Everything runs in your browser; your image never leaves your device.",
"tool_jacquard_section_image": "Image",
"tool_jacquard_section_crop": "Crop",
"tool_jacquard_section_dimensions": "Dimensions",
"tool_jacquard_section_gauge": "Needle/row ratio",
"tool_jacquard_section_convert": "Conversion",
"tool_jacquard_section_export": "Export",
"tool_jacquard_upload": "Drop an image here or click to browse",
"tool_jacquard_replace_image": "Replace image",
"tool_jacquard_fit_proportions": "Fit proportions",
"tool_jacquard_stitches": "Width (stitches)",
"tool_jacquard_stitches_per_cm": "Stitches per cm",
"tool_jacquard_rows_per_cm": "Rows per cm",
"tool_jacquard_rows_computed": "Rows (computed)",
"tool_jacquard_dimensions_summary": "{stitches} stitches × {rows} rows — about {widthCm} × {heightCm} cm on fabric",
"tool_jacquard_contrast": "Contrast",
"tool_jacquard_threshold": "Black / white balance",
"tool_jacquard_invert": "Invert colors",
"tool_jacquard_fabric_view": "As on fabric",
"tool_jacquard_export_ayab": "Export for AYAB",
"tool_jacquard_export_docs": "Export documentation",
"tool_jacquard_legend_background": "Background",
"tool_jacquard_legend_foreground": "Foreground",
"tool_jacquard_warn_over_needles": "This exceeds the 200-needle machine limit.",
"tool_jacquard_warn_long_pattern": "Very long pattern — check row count before knitting.",
"tool_jacquard_confirm_over_needles": "Width is over 200 stitches. Export anyway?",
"tool_jacquard_error_unsupported_type": "Unsupported format. Use JPG, PNG, or WebP.",
"tool_jacquard_error_file_too_large": "Image is too large. Try a smaller file.",
"tool_jacquard_hint_upload": "Upload an image to get started."
```

Append to `messages/it.json` (Italian equivalents):

```json
"tool_jacquard_title": "Convertitore pattern jacquard",
"tool_jacquard_card_teaser": "Trasforma una foto in un pattern jacquard 1 bit per AYAB.",
"tool_jacquard_portico_1": "Carica una foto e convertila in un pattern a due colori — un pixel corrisponde a una maglia.",
"tool_jacquard_portico_2": "Imposta il rapporto aghi/corse per evitare che il motivo risulti schiacciato sul tessuto, poi esporta il PNG per AYAB o il PDF con la griglia.",
"tool_jacquard_portico_3": "Tutto avviene nel browser; l'immagine non lascia il tuo dispositivo.",
"tool_jacquard_section_image": "Immagine",
"tool_jacquard_section_crop": "Ritaglio",
"tool_jacquard_section_dimensions": "Dimensioni",
"tool_jacquard_section_gauge": "Rapporto aghi/corse",
"tool_jacquard_section_convert": "Conversione",
"tool_jacquard_section_export": "Export",
"tool_jacquard_upload": "Trascina un'immagine qui o clicca per sfogliare",
"tool_jacquard_replace_image": "Sostituisci immagine",
"tool_jacquard_fit_proportions": "Adatta proporzioni",
"tool_jacquard_stitches": "Larghezza (maglie)",
"tool_jacquard_stitches_per_cm": "Maglie per cm",
"tool_jacquard_rows_per_cm": "Corse per cm",
"tool_jacquard_rows_computed": "Corse (calcolate)",
"tool_jacquard_dimensions_summary": "{stitches} maglie × {rows} corse — circa {widthCm} × {heightCm} cm sul tessuto",
"tool_jacquard_contrast": "Contrasto",
"tool_jacquard_threshold": "Bilanciamento bianco/nero",
"tool_jacquard_invert": "Inverti colori",
"tool_jacquard_fabric_view": "Come sul tessuto",
"tool_jacquard_export_ayab": "Esporta per AYAB",
"tool_jacquard_export_docs": "Esporta documentazione",
"tool_jacquard_legend_background": "Background",
"tool_jacquard_legend_foreground": "Foreground",
"tool_jacquard_warn_over_needles": "Supera il limite di 200 aghi della macchina.",
"tool_jacquard_warn_long_pattern": "Pattern molto lungo — controlla il numero di corse prima di lavorare.",
"tool_jacquard_confirm_over_needles": "La larghezza supera 200 maglie. Esportare comunque?",
"tool_jacquard_error_unsupported_type": "Formato non supportato. Usa JPG, PNG o WebP.",
"tool_jacquard_error_file_too_large": "Immagine troppo grande. Prova con un file più leggero.",
"tool_jacquard_hint_upload": "Carica un'immagine per iniziare."
```

- [ ] **Step 2: Register tool**

In `src/lib/tools/registry.ts`, import `Grid3x3` from `@lucide/svelte/icons/grid-3x3` and append:

```ts
{
	slug: 'jacquard-pattern',
	href: '/tools/jacquard-pattern',
	icon: Grid3x3,
	titleKey: 'tool_jacquard_title',
	teaserKey: 'tool_jacquard_card_teaser',
	porticoKeys: [
		'tool_jacquard_portico_1',
		'tool_jacquard_portico_2',
		'tool_jacquard_portico_3'
	]
}
```

- [ ] **Step 3: Add wide variant to ToolPageLayout**

In `ToolPageLayout.svelte`, add prop `wide = false` and change tool section class:

```svelte
let { tool, wide = false, children }: { tool: ToolDefinition; wide?: boolean; children: Snippet } = $props();
```

```svelte
<section class={wide ? 'max-w-6xl' : 'max-w-2xl'}>
```

- [ ] **Step 4: Regenerate Paraglide and run registry test**

Run: `npm run build`  
Run: `npm run test:unit -- --run src/lib/tools/registry.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/it.json src/lib/tools/registry.ts src/lib/components/tools/ToolPageLayout.svelte
git commit -m "feat(jacquard): add i18n, registry entry, and wide tool layout"
```

---

### Task 7: shadcn UI primitives

**Files:**

- Create via CLI: `src/lib/components/ui/button`, `slider`, `label`, `input`

- [ ] **Step 1: Add components**

Run:

```bash
npx shadcn-svelte@latest add button slider label input --yes
```

- [ ] **Step 2: Verify check passes**

Run: `npm run check`  
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ui/button src/lib/components/ui/slider src/lib/components/ui/label src/lib/components/ui/input components.json
git commit -m "chore(ui): add shadcn button slider label input for jacquard tool"
```

---

### Task 8: Jacquard UI components

**Files:**

- Create: `src/lib/components/jacquard/ImageUploadZone.svelte`
- Create: `src/lib/components/jacquard/CropCanvas.svelte`
- Create: `src/lib/components/jacquard/PatternPreview.svelte`
- Create: `src/lib/components/jacquard/JacquardEditor.svelte`

- [ ] **Step 1: ImageUploadZone**

`ImageUploadZone.svelte` — props: `onFile(file: File)`, `disabled`. Handles dragenter/leave/drop, hidden `<input type="file" accept="image/jpeg,image/png,image/webp">`, shows `m.tool_jacquard_upload()`.

- [ ] **Step 2: CropCanvas**

`CropCanvas.svelte` — props: `image: HTMLImageElement`, `crop: CropRect`, `onCropChange`, `onFitProportions`. Renders image on canvas; crop rect with drag handles (move + resize from corner); dispatches updated `CropRect` clamped to image bounds. Button calls parent `onFitProportions`.

- [ ] **Step 3: PatternPreview**

`PatternPreview.svelte` — props: `bitmap`, `stitches`, `rows`, `fabricView`, `gauge`. Renders `<canvas>` with square or fabric aspect cells; optional zoom via CSS `transform: scale()` and `overflow: auto` wrapper.

- [ ] **Step 4: JacquardEditor (orchestration)**

`JacquardEditor.svelte` — `$state` for: `image`, `crop`, `stitches` (default 120), `stitchesPerCm` (4.5), `rowsPerCm` (6.4), `contrast` (0), `threshold` (128), `invert`, `fabricView`, `errorMessage`.

`$derived` chain:

1. `dimensions = calculatePatternDimensions(...)`
2. `resized = cropAndResize(image, crop, dimensions.stitches, dimensions.rows)` when image present
3. `bitmap = imageDataToBitmap(resized, { contrast, threshold, invert })`

Layout: `grid lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)] gap-8`

Left column sections with headings from messages; right column `PatternPreview`.

Warnings: show `tool_jacquard_warn_over_needles` when `stitches > 200`; `tool_jacquard_warn_long_pattern` when `dimensions.rows > 500`.

Export buttons disabled without image. On AYAB export with `stitches > 200`, `confirm(m.tool_jacquard_confirm_over_needles())` before `exportAyabPng`. Docs export calls `exportDocumentation` with `m.tool_jacquard_legend_background()` / `foreground()`.

- [ ] **Step 5: Run check**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/jacquard/
git commit -m "feat(jacquard): add editor UI with upload crop preview and controls"
```

---

### Task 9: Tool page route

**Files:**

- Create: `src/routes/tools/jacquard-pattern/+page.svelte`
- Create: `src/routes/tools/jacquard-pattern/+page.ts`

- [ ] **Step 1: Page route**

`+page.ts`:

```ts
export const prerender = true;
```

`+page.svelte`:

```svelte
<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import JacquardEditor from '$lib/components/jacquard/JacquardEditor.svelte';
	import { tools } from '$lib/tools/registry.js';

	const tool = tools.find((t) => t.slug === 'jacquard-pattern')!;
</script>

<ToolPageLayout {tool} wide>
	<JacquardEditor />
</ToolPageLayout>
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`  
Open: `http://localhost:5173/tools/jacquard-pattern`  
Upload test image, adjust threshold, export AYAB PNG — verify file is `stitches × rows` px and only black/white.

- [ ] **Step 3: Commit**

```bash
git add src/routes/tools/jacquard-pattern/
git commit -m "feat(jacquard): add jacquard pattern converter tool page"
```

---

### Task 10: E2E tests

**Files:**

- Create: `e2e/jacquard-pattern.e2e.ts`
- Modify: `e2e/hub.e2e.ts` (optional: assert catalog shows jacquard card)

- [ ] **Step 1: Write e2e spec**

`e2e/jacquard-pattern.e2e.ts`:

```ts
import { expect, test } from '@playwright/test';
import path from 'node:path';

test('jacquard tool page loads from catalog', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /Jacquard pattern converter/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Jacquard pattern converter/i);
	await expect(page.getByText(/Export for AYAB/i)).toBeVisible();
});

test('upload shows preview and enables export', async ({ page }) => {
	await page.goto('/tools/jacquard-pattern');
	const fixture = path.join(process.cwd(), 'e2e/fixtures/checker.png');
	await page.locator('input[type="file"]').setInputFiles(fixture);
	await expect(page.getByText(/Rows \(computed\)/i)).toBeVisible();
	await expect(page.getByRole('button', { name: /Export for AYAB/i })).toBeEnabled();
});
```

- [ ] **Step 2: Add fixture image**

Create `e2e/fixtures/checker.png` — 32×32 checkerboard PNG (generate once with a tiny script or commit a minimal binary).

- [ ] **Step 3: Run e2e**

Run: `npm run test:e2e -- e2e/jacquard-pattern.e2e.ts`  
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `npm run test`  
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add e2e/jacquard-pattern.e2e.ts e2e/fixtures/checker.png
git commit -m "test(e2e): add jacquard pattern converter smoke tests"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Width in stitches, rows computed | Task 1 |
| Max 200 needles warning + confirm export | Task 8 |
| Rapporto aghi/corse fields | Task 6, 8 |
| Manual crop + fit proportions | Task 8 |
| Threshold, contrast, invert, no dithering | Task 2, 8 |
| Background white / foreground black | Task 2, 5 |
| Square preview + fabric toggle | Task 8 |
| Export for AYAB PNG | Task 4, 8 |
| Export documentation PNG + PDF | Task 5, 8 |
| Single-page editor layout | Task 8, 9 |
| Client-side only | All canvas modules |
| IT/EN copy | Task 6 |
| Hub integration | Task 6, 9 |
| Row/col numbering every 10, tick every 5 | Task 5 |
| Error messages | Task 3, 6, 8 |

---

## Out of scope (do not implement in this plan)

- Dithering / multi-color
- Gauge presets
- Native AYAB file format
- Smart auto-crop / subject detection
