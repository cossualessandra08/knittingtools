# Data Pattern Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data pattern generator per `docs/superpowers/specs/2026-06-29-data-pattern-generator-design.md` — voice, audio (waveform/spectrogram), and terrain sources → shared pipeline → bitmap editor → knit/purl or jacquard export.

**Architecture:** Pure TypeScript modules in `src/lib/data-pattern/` implement constants, row math, source adapters, `matrixToBitmap`, bitmap editing with undo, and knit/purl export (Vitest). Svelte 5 components in `src/lib/components/data-pattern/` implement wizard + workspace UI. Voice/audio run fully in-browser (Web Audio API); terrain uses Nominatim + Open-Elevation. Reuse `$lib/jacquard/export-ayab.js` and `export-docs.js` for jacquard exports. English copy in `$lib/copy.ts`.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), Tailwind 4 + shadcn-svelte, Web Audio API, Leaflet (terrain map), jsPDF (knit/purl PDF), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-29-data-pattern-generator-design.md`

**Recommended:** Implement in a git worktree (`using-git-worktrees` skill) on branch `feat/data-pattern`.

---

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/data-pattern/constants.ts` | Limits, `ROWS_PER_SEC`, service URLs |
| `src/lib/data-pattern/types.ts` | `SourceMatrix`, `Bitmap`, adapter configs |
| `src/lib/data-pattern/dimensions.ts` | Audio/terrain row formulas, cm summary |
| `src/lib/data-pattern/dimensions.test.ts` | Row math tests |
| `src/lib/data-pattern/matrix-utils.ts` | `normalizeMatrix`, `spatialSmooth`, `clampRows` |
| `src/lib/data-pattern/matrix-utils.test.ts` | Matrix util tests |
| `src/lib/data-pattern/matrix-to-bitmap.ts` | Float matrix → 1-bit bitmap + refine |
| `src/lib/data-pattern/matrix-to-bitmap.test.ts` | Conversion tests |
| `src/lib/data-pattern/bitmap-utils.ts` | `flipBitmapVertical`, `hasManualEdits`, `cloneBitmap` |
| `src/lib/data-pattern/bitmap-utils.test.ts` | Bitmap util tests |
| `src/lib/data-pattern/bitmap-editor.ts` | Toggle/brush/eraser + undo stack (50) |
| `src/lib/data-pattern/bitmap-editor.test.ts` | Editor tests |
| `src/lib/data-pattern/adapters/voice.ts` | Voice `SourceAdapter` |
| `src/lib/data-pattern/adapters/voice.test.ts` | Voice tests |
| `src/lib/data-pattern/adapters/audio-file.ts` | Waveform + spectrogram adapter |
| `src/lib/data-pattern/adapters/audio-file.test.ts` | Audio tests |
| `src/lib/data-pattern/adapters/elevation-api.ts` | Open-Elevation POST client |
| `src/lib/data-pattern/adapters/elevation-api.test.ts` | Elevation client tests (mocked fetch) |
| `src/lib/data-pattern/adapters/geocoding-api.ts` | Nominatim search client |
| `src/lib/data-pattern/adapters/geocoding-api.test.ts` | Geocoding tests (mocked fetch) |
| `src/lib/data-pattern/adapters/terrain.ts` | Terrain adapter |
| `src/lib/data-pattern/adapters/terrain.test.ts` | Terrain normalisation/posterize tests |
| `src/lib/data-pattern/export-knit-purl.ts` | Symbolic PNG + PDF chart export |
| `src/lib/data-pattern/export-knit-purl.test.ts` | Export flip + symbol mapping tests |
| `src/lib/data-pattern/audio-decode.ts` | `decodeAudioFile`, `sliceAudioBuffer` |
| `src/lib/components/data-pattern/DataPatternEditor.svelte` | Wizard + workspace orchestrator |
| `src/lib/components/data-pattern/SourcePicker.svelte` | Step 1 source cards |
| `src/lib/components/data-pattern/DimensionsGauge.svelte` | Shared stitches/gauge/summary |
| `src/lib/components/data-pattern/VoiceConfig.svelte` | Record + sensitivity/smoothing |
| `src/lib/components/data-pattern/AudioConfig.svelte` | Upload, segment, mode, controls |
| `src/lib/components/data-pattern/TerrainConfig.svelte` | Leaflet map + bbox + mode |
| `src/lib/components/data-pattern/PatternWorkspace.svelte` | Workspace layout |
| `src/lib/components/data-pattern/PatternPreview.svelte` | Canvas preview (symbols/jacquard) |
| `src/lib/components/data-pattern/EditorToolbar.svelte` | Tools + undo/redo |
| `src/lib/components/data-pattern/RefinePanel.svelte` | Contrast/threshold/invert + reset |
| `src/lib/components/data-pattern/ExportPanel.svelte` | Export mode + 4 download buttons |
| `src/routes/tools/data-pattern/+page.svelte` | Tool page |
| `src/routes/tools/data-pattern/+page.ts` | `prerender = true` |
| `src/lib/tools/registry.ts` | Add `data-pattern` entry |
| `src/lib/copy.ts` | `dataPattern` copy namespace |
| `e2e/data-pattern.e2e.ts` | Wizard smoke test |

---

## Phase 1 — Foundation

### Task 1: Constants and types

**Files:**
- Create: `src/lib/data-pattern/constants.ts`
- Create: `src/lib/data-pattern/types.ts`

- [ ] **Step 1: Create constants**

`src/lib/data-pattern/constants.ts`:

```ts
export const MAX_STITCHES_WARN = 200;
export const MAX_ROWS = 300;
export const MIN_ROWS = 10;
export const ROWS_PER_SEC = 4;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_VOICE_DURATION_SEC = 60;
export const DEFAULT_VOICE_DURATION_SEC = 30;
export const MIN_VOICE_DURATION_SEC = 5;
export const AUDIO_SEGMENT_THRESHOLD_SEC = 60;
export const DEFAULT_AUDIO_SEGMENT_SEC = 60;
export const MAX_TERRAIN_BBOX_DEG = 0.5;
export const UNDO_STACK_MAX = 50;
export const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'] as const;
export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
export const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
export const DEFAULT_STITCHES = 120;
export const DEFAULT_STITCHES_PER_CM = 4.5;
export const DEFAULT_ROWS_PER_CM = 6.4;
export const ZOOM_LEVELS = [50, 100, 200] as const;
```

- [ ] **Step 2: Create types**

`src/lib/data-pattern/types.ts`:

```ts
import type { ZOOM_LEVELS } from './constants.js';

export type SourceId = 'voice' | 'audio-file' | 'terrain';
export type AudioAnalysisMode = 'waveform' | 'spectrogram';
export type TerrainMode = 'continuous' | 'posterized';
export type PreviewView = 'symbols' | 'jacquard';
export type ExportMode = 'knit-purl' | 'jacquard';
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

/** Row 0 = top (image order). Values 0.0–1.0. */
export interface SourceMatrix {
	width: number;
	height: number;
	values: Float32Array;
}

/** Row 0 = top. 0 = background, 1 = foreground. */
export type Bitmap = Uint8Array;

export interface SharedConfig {
	stitches: number;
	stitchesPerCm: number;
	rowsPerCm: number;
}

export interface RefineParams {
	contrast: number;
	threshold: number;
	invert: boolean;
}

export interface VoiceConfig {
	sensitivity: number;
	smoothing: number;
}

export interface AudioFileConfig {
	analysisMode: AudioAnalysisMode;
	sensitivity: number;
	smoothing: number;
	segmentStartSec: number;
	segmentEndSec: number;
}

export interface TerrainBbox {
	south: number;
	north: number;
	west: number;
	east: number;
}

export interface TerrainConfig {
	mode: TerrainMode;
	posterizeLevels: number;
	bbox: TerrainBbox;
}

export interface PatternDimensions {
	stitches: number;
	rows: number;
	widthCm: number;
	heightCm: number;
}

export interface SourceAdapter<TInput, TConfig> {
	id: SourceId;
	analyze(input: TInput, config: TConfig & SharedConfig): Promise<SourceMatrix>;
	estimateRows(input: TInput, config: TConfig & SharedConfig): number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data-pattern/constants.ts src/lib/data-pattern/types.ts
git commit -m "feat(data-pattern): add constants and types"
```

---

### Task 2: Dimensions and row math

**Files:**
- Create: `src/lib/data-pattern/dimensions.ts`
- Create: `src/lib/data-pattern/dimensions.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/data-pattern/dimensions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	audioRowsFromDuration,
	terrainRowsFromBbox,
	fabricSummary,
	clampRows
} from './dimensions.js';

describe('audioRowsFromDuration', () => {
	it('maps 15s to 60 rows', () => {
		expect(audioRowsFromDuration(15)).toBe(60);
	});

	it('caps at 300 rows', () => {
		expect(audioRowsFromDuration(75)).toBe(300);
	});

	it('floors at 10 rows', () => {
		expect(audioRowsFromDuration(1)).toBe(10);
	});
});

describe('terrainRowsFromBbox', () => {
	it('computes rows from bbox aspect and gauge', () => {
		const rows = terrainRowsFromBbox(
			{ south: 45, north: 46, west: 10, east: 11 },
			{ stitches: 100, stitchesPerCm: 4.5, rowsPerCm: 6.4 }
		);
		expect(rows).toBeGreaterThanOrEqual(10);
		expect(rows).toBeLessThanOrEqual(300);
	});
});

describe('fabricSummary', () => {
	it('formats stitch and cm summary', () => {
		const text = fabricSummary({ stitches: 120, rows: 60, widthCm: 26.7, heightCm: 9.4 });
		expect(text).toContain('120');
		expect(text).toContain('60');
	});
});

describe('clampRows', () => {
	it('clamps to MIN_ROWS and MAX_ROWS', () => {
		expect(clampRows(5)).toBe(10);
		expect(clampRows(400)).toBe(300);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/dimensions.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

`src/lib/data-pattern/dimensions.ts`:

```ts
import {
	MAX_ROWS,
	MIN_ROWS,
	ROWS_PER_SEC
} from './constants.js';
import type { PatternDimensions, SharedConfig, TerrainBbox } from './types.js';

export function clampRows(rows: number): number {
	return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(rows)));
}

export function audioRowsFromDuration(durationSec: number): number {
	return clampRows(durationSec * ROWS_PER_SEC);
}

export function terrainRowsFromBbox(bbox: TerrainBbox, gauge: SharedConfig): number {
	const latSpan = Math.abs(bbox.north - bbox.south);
	const lngSpan = Math.abs(bbox.east - bbox.west);
	const centerLat = (bbox.north + bbox.south) / 2;
	const bboxAspect = (lngSpan * Math.cos((centerLat * Math.PI) / 180)) / latSpan;
	const widthCm = gauge.stitches / gauge.stitchesPerCm;
	const heightCm = widthCm / bboxAspect;
	return clampRows(heightCm * gauge.rowsPerCm);
}

export function patternDimensions(
	stitches: number,
	rows: number,
	gauge: SharedConfig
): PatternDimensions {
	const widthCm = stitches / gauge.stitchesPerCm;
	const heightCm = rows / gauge.rowsPerCm;
	return { stitches, rows, widthCm, heightCm };
}

export function fabricSummary(dims: PatternDimensions): string {
	return `${dims.stitches} sts × ${dims.rows} rows — approx. ${dims.widthCm.toFixed(1)} × ${dims.heightCm.toFixed(1)} cm on fabric`;
}

export function bboxWithinLimit(bbox: TerrainBbox): boolean {
	const latSpan = Math.abs(bbox.north - bbox.south);
	const lngSpan = Math.abs(bbox.east - bbox.west);
	return latSpan <= 0.5 && lngSpan <= 0.5;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/dimensions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/dimensions.ts src/lib/data-pattern/dimensions.test.ts
git commit -m "feat(data-pattern): add row dimension math"
```

---

### Task 3: Matrix utilities

**Files:**
- Create: `src/lib/data-pattern/matrix-utils.ts`
- Create: `src/lib/data-pattern/matrix-utils.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/data-pattern/matrix-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeMatrix, spatialSmooth, isFlatMatrix } from './matrix-utils.js';
import type { SourceMatrix } from './types.js';

function matrix2x2(values: number[]): SourceMatrix {
	return { width: 2, height: 2, values: new Float32Array(values) };
}

describe('normalizeMatrix', () => {
	it('scales values to 0–1', () => {
		const m = matrix2x2([0, 5, 10, 10]);
		normalizeMatrix(m);
		expect(m.values[0]).toBe(0);
		expect(m.values[3]).toBe(1);
	});
});

describe('spatialSmooth', () => {
	it('blends neighbouring cells', () => {
		const m = matrix2x2([0, 0, 0, 1]);
		spatialSmooth(m, 1);
		expect(m.values[1]).toBeGreaterThan(0);
	});
});

describe('isFlatMatrix', () => {
	it('detects uniform values', () => {
		expect(isFlatMatrix(matrix2x2([0.5, 0.5, 0.5, 0.5]))).toBe(true);
		expect(isFlatMatrix(matrix2x2([0, 1, 0, 1]))).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/matrix-utils.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement**

`src/lib/data-pattern/matrix-utils.ts`:

```ts
import type { SourceMatrix } from './types.js';

export function normalizeMatrix(matrix: SourceMatrix): void {
	let min = Infinity;
	let max = -Infinity;
	for (const v of matrix.values) {
		if (v < min) min = v;
		if (v > max) max = v;
	}
	const span = max - min || 1;
	for (let i = 0; i < matrix.values.length; i++) {
		matrix.values[i] = (matrix.values[i] - min) / span;
	}
}

export function spatialSmooth(matrix: SourceMatrix, amount: number): void {
	if (amount <= 0) return;
	const { width, height, values } = matrix;
	const out = new Float32Array(values.length);
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			let sum = 0;
			let count = 0;
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					const r = row + dr;
					const c = col + dc;
					if (r < 0 || r >= height || c < 0 || c >= width) continue;
					sum += values[r * width + c];
					count++;
				}
			}
			const avg = sum / count;
			const i = row * width + col;
			out[i] = values[i] * (1 - amount) + avg * amount;
		}
	}
	matrix.values.set(out);
}

export function isFlatMatrix(matrix: SourceMatrix): boolean {
	const first = matrix.values[0];
	for (const v of matrix.values) {
		if (v !== first) return false;
	}
	return true;
}

export function applySensitivity(matrix: SourceMatrix, sensitivity: number): void {
	for (let i = 0; i < matrix.values.length; i++) {
		matrix.values[i] *= sensitivity;
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/matrix-utils.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/matrix-utils.ts src/lib/data-pattern/matrix-utils.test.ts
git commit -m "feat(data-pattern): add matrix normalize and smooth utilities"
```

---

## Phase 2 — Bitmap pipeline

### Task 4: matrixToBitmap

**Files:**
- Create: `src/lib/data-pattern/matrix-to-bitmap.ts`
- Create: `src/lib/data-pattern/matrix-to-bitmap.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/data-pattern/matrix-to-bitmap.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { matrixToBitmap } from './matrix-to-bitmap.js';
import type { SourceMatrix } from './types.js';

const matrix: SourceMatrix = {
	width: 2,
	height: 2,
	values: new Float32Array([0, 0.25, 0.75, 1])
};

describe('matrixToBitmap', () => {
	it('thresholds values to 0 or 1', () => {
		const bitmap = matrixToBitmap(matrix, { contrast: 1, threshold: 0.5, invert: false });
		expect(Array.from(bitmap)).toEqual([0, 0, 1, 1]);
	});

	it('inverts foreground and background', () => {
		const bitmap = matrixToBitmap(matrix, { contrast: 1, threshold: 0.5, invert: true });
		expect(Array.from(bitmap)).toEqual([1, 1, 0, 0]);
	});

	it('applies contrast before threshold', () => {
		const flat: SourceMatrix = {
			width: 2,
			height: 1,
			values: new Float32Array([0.4, 0.6])
		};
		const low = matrixToBitmap(flat, { contrast: 0.5, threshold: 0.5, invert: false });
		const high = matrixToBitmap(flat, { contrast: 2, threshold: 0.5, invert: false });
		expect(low[0]).toBe(0);
		expect(high[1]).toBe(1);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/matrix-to-bitmap.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement**

`src/lib/data-pattern/matrix-to-bitmap.ts`:

```ts
import type { Bitmap, RefineParams, SourceMatrix } from './types.js';

function applyContrast(value: number, contrast: number): number {
	const c = Math.max(0, contrast);
	return Math.min(1, Math.max(0, 0.5 + (value - 0.5) * c));
}

export function matrixToBitmap(matrix: SourceMatrix, params: RefineParams): Bitmap {
	const bitmap = new Uint8Array(matrix.values.length);
	for (let i = 0; i < matrix.values.length; i++) {
		const adjusted = applyContrast(matrix.values[i], params.contrast);
		let isForeground = adjusted >= params.threshold;
		if (params.invert) isForeground = !isForeground;
		bitmap[i] = isForeground ? 1 : 0;
	}
	return bitmap;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/matrix-to-bitmap.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/matrix-to-bitmap.ts src/lib/data-pattern/matrix-to-bitmap.test.ts
git commit -m "feat(data-pattern): add matrix to bitmap conversion"
```

---

### Task 5: Bitmap utilities and editor

**Files:**
- Create: `src/lib/data-pattern/bitmap-utils.ts`
- Create: `src/lib/data-pattern/bitmap-utils.test.ts`
- Create: `src/lib/data-pattern/bitmap-editor.ts`
- Create: `src/lib/data-pattern/bitmap-editor.test.ts`

- [ ] **Step 1: Write failing tests**

`src/lib/data-pattern/bitmap-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { flipBitmapVertical, hasManualEdits, cloneBitmap } from './bitmap-utils.js';

describe('flipBitmapVertical', () => {
	it('reverses row order', () => {
		const src = new Uint8Array([1, 0, 0, 1]);
		const flipped = flipBitmapVertical(src, 2, 2);
		expect(Array.from(flipped)).toEqual([0, 1, 1, 0]);
	});
});

describe('hasManualEdits', () => {
	it('returns false when bitmaps match', () => {
		const a = new Uint8Array([1, 0]);
		expect(hasManualEdits(a, new Uint8Array([1, 0]))).toBe(false);
	});
	it('returns true when they differ', () => {
		expect(hasManualEdits(new Uint8Array([1, 0]), new Uint8Array([0, 0]))).toBe(true);
	});
});
```

`src/lib/data-pattern/bitmap-editor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BitmapEditor } from './bitmap-editor.js';

describe('BitmapEditor', () => {
	it('toggles, brushes, and erases', () => {
		const editor = new BitmapEditor(new Uint8Array([0, 0, 0, 0]), 2, 2);
		editor.toggle(0, 0);
		expect(editor.bitmap[0]).toBe(1);
		editor.brush(1, 0);
		expect(editor.bitmap[1]).toBe(1);
		editor.eraser(0, 0);
		expect(editor.bitmap[0]).toBe(0);
	});

	it('supports undo and redo', () => {
		const editor = new BitmapEditor(new Uint8Array([0, 0]), 1, 2);
		editor.toggle(0, 0);
		editor.undo();
		expect(editor.bitmap[0]).toBe(0);
		editor.redo();
		expect(editor.bitmap[0]).toBe(1);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/lib/data-pattern/bitmap-utils.test.ts src/lib/data-pattern/bitmap-editor.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement bitmap-utils**

`src/lib/data-pattern/bitmap-utils.ts`:

```ts
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
```

- [ ] **Step 4: Implement bitmap-editor**

`src/lib/data-pattern/bitmap-editor.ts`:

```ts
import { UNDO_STACK_MAX } from './constants.js';
import { cloneBitmap } from './bitmap-utils.js';
import type { Bitmap } from './types.js';

export class BitmapEditor {
	bitmap: Bitmap;
	readonly width: number;
	readonly height: number;
	private undoStack: Bitmap[] = [];
	private redoStack: Bitmap[] = [];

	constructor(bitmap: Bitmap, width: number, height: number) {
		this.bitmap = cloneBitmap(bitmap);
		this.width = width;
		this.height = height;
	}

	private inBounds(col: number, row: number): boolean {
		return col >= 0 && col < this.width && row >= 0 && row < this.height;
	}

	private pushUndo(): void {
		this.undoStack.push(cloneBitmap(this.bitmap));
		if (this.undoStack.length > UNDO_STACK_MAX) this.undoStack.shift();
		this.redoStack = [];
	}

	toggle(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		const i = row * this.width + col;
		this.bitmap[i] = this.bitmap[i] === 1 ? 0 : 1;
	}

	brush(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		this.bitmap[row * this.width + col] = 1;
	}

	eraser(col: number, row: number): void {
		if (!this.inBounds(col, row)) return;
		this.pushUndo();
		this.bitmap[row * this.width + col] = 0;
	}

	undo(): void {
		const prev = this.undoStack.pop();
		if (!prev) return;
		this.redoStack.push(cloneBitmap(this.bitmap));
		this.bitmap = prev;
	}

	redo(): void {
		const next = this.redoStack.pop();
		if (!next) return;
		this.undoStack.push(cloneBitmap(this.bitmap));
		this.bitmap = next;
	}

	get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	resetTo(bitmap: Bitmap): void {
		this.bitmap = cloneBitmap(bitmap);
		this.undoStack = [];
		this.redoStack = [];
	}
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/lib/data-pattern/bitmap-utils.test.ts src/lib/data-pattern/bitmap-editor.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/data-pattern/bitmap-utils.ts src/lib/data-pattern/bitmap-utils.test.ts src/lib/data-pattern/bitmap-editor.ts src/lib/data-pattern/bitmap-editor.test.ts
git commit -m "feat(data-pattern): add bitmap utils and editor with undo"
```

---

## Phase 3 — Audio adapters

### Task 6: Audio decode helper

**Files:**
- Create: `src/lib/data-pattern/audio-decode.ts`

- [ ] **Step 1: Implement slice helper (tested via adapter tests)**

`src/lib/data-pattern/audio-decode.ts`:

```ts
export function sliceAudioBuffer(
	buffer: AudioBuffer,
	startSec: number,
	endSec: number
): AudioBuffer {
	const sampleRate = buffer.sampleRate;
	const startSample = Math.floor(startSec * sampleRate);
	const endSample = Math.floor(endSec * sampleRate);
	const length = Math.max(0, endSample - startSample);
	const ctx = new OfflineAudioContext(1, length, sampleRate);
	const source = ctx.createBufferSource();
	const sliced = ctx.createBuffer(1, length, sampleRate);
	const channel = buffer.getChannelData(0);
	sliced.copyToChannel(channel.subarray(startSample, endSample), 0);
	source.buffer = sliced;
	source.connect(ctx.destination);
	return sliced;
}

export function audioBufferToMono(buffer: AudioBuffer): Float32Array {
	if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
	const len = buffer.length;
	const out = new Float32Array(len);
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < len; i++) out[i] += data[i] / buffer.numberOfChannels;
	}
	return out;
}

export function rms(samples: Float32Array): number {
	let sum = 0;
	for (const s of samples) sum += s * s;
	return Math.sqrt(sum / samples.length);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/data-pattern/audio-decode.ts
git commit -m "feat(data-pattern): add audio buffer helpers"
```

---

### Task 7: Voice adapter

**Files:**
- Create: `src/lib/data-pattern/adapters/voice.ts`
- Create: `src/lib/data-pattern/adapters/voice.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/data-pattern/adapters/voice.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { voiceAdapter } from './voice.js';
import { audioRowsFromDuration } from '../dimensions.js';

function makeBuffer(durationSec: number, sampleRate = 8000): AudioBuffer {
	const length = durationSec * sampleRate;
	const ctx = new OfflineAudioContext(1, length, sampleRate);
	const buffer = ctx.createBuffer(1, length, sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.sin((i / sampleRate) * 440 * 2 * Math.PI);
	return buffer;
}

describe('voiceAdapter', () => {
	it('estimateRows matches duration formula', () => {
		const buffer = makeBuffer(15);
		expect(voiceAdapter.estimateRows(buffer, { sensitivity: 1, smoothing: 0 }, { stitches: 10, stitchesPerCm: 4.5, rowsPerCm: 6.4 })).toBe(audioRowsFromDuration(15));
	});

	it('analyze returns matrix with non-flat values for tone', async () => {
		const buffer = makeBuffer(5);
		const matrix = await voiceAdapter.analyze(buffer, { sensitivity: 1, smoothing: 0 }, { stitches: 8, stitchesPerCm: 4.5, rowsPerCm: 6.4 });
		expect(matrix.width).toBe(8);
		expect(matrix.values.length).toBe(matrix.width * matrix.height);
		const max = Math.max(...matrix.values);
		const min = Math.min(...matrix.values);
		expect(max).toBeGreaterThan(min);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/voice.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement voice adapter**

`src/lib/data-pattern/adapters/voice.ts`:

```ts
import { audioBufferToMono, rms } from '../audio-decode.js';
import { audioRowsFromDuration } from '../dimensions.js';
import { applySensitivity, normalizeMatrix, spatialSmooth } from '../matrix-utils.js';
import type { SharedConfig, SourceAdapter, SourceMatrix, VoiceConfig } from '../types.js';

function buildVoiceMatrix(
	samples: Float32Array,
	sampleRate: number,
	stitches: number,
	rows: number
): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	const totalSamples = samples.length;
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < stitches; c++) {
			const cell = r * stitches + c;
			const start = Math.floor((cell / (stitches * rows)) * totalSamples);
			const end = Math.floor(((cell + 1) / (stitches * rows)) * totalSamples);
			values[cell] = rms(samples.subarray(start, Math.max(start + 1, end)));
		}
	}
	return { width: stitches, height: rows, values };
}

export const voiceAdapter: SourceAdapter<AudioBuffer, VoiceConfig> = {
	id: 'voice',
	estimateRows(buffer) {
		return audioRowsFromDuration(buffer.duration);
	},
	async analyze(buffer, config, shared) {
		const rows = audioRowsFromDuration(buffer.duration);
		const samples = audioBufferToMono(buffer);
		const matrix = buildVoiceMatrix(samples, buffer.sampleRate, shared.stitches, rows);
		applySensitivity(matrix, config.sensitivity);
		spatialSmooth(matrix, config.smoothing);
		normalizeMatrix(matrix);
		return matrix;
	}
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/voice.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/adapters/voice.ts src/lib/data-pattern/adapters/voice.test.ts
git commit -m "feat(data-pattern): add voice source adapter"
```

---

### Task 8: Audio file adapter (waveform + spectrogram)

**Files:**
- Create: `src/lib/data-pattern/adapters/audio-file.ts`
- Create: `src/lib/data-pattern/adapters/audio-file.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/data-pattern/adapters/audio-file.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { audioFileAdapter, effectiveSegment } from './audio-file.js';

function toneBuffer(durationSec = 2, freq = 440, sampleRate = 8000): AudioBuffer {
	const length = durationSec * sampleRate;
	const ctx = new OfflineAudioContext(1, length, sampleRate);
	const buffer = ctx.createBuffer(1, length, sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.sin((i / sampleRate) * freq * 2 * Math.PI);
	return buffer;
}

describe('effectiveSegment', () => {
	it('uses full file when duration <= 60s', () => {
		const buffer = toneBuffer(30);
		expect(effectiveSegment(buffer, 0, 30)).toEqual({ start: 0, end: 30 });
	});
});

describe('audioFileAdapter', () => {
	it('waveform and spectrogram produce different matrices', async () => {
		const buffer = toneBuffer(5);
		const shared = { stitches: 16, stitchesPerCm: 4.5, rowsPerCm: 6.4 };
		const waveform = await audioFileAdapter.analyze(
			{ buffer },
			{ analysisMode: 'waveform', sensitivity: 1, smoothing: 0, segmentStartSec: 0, segmentEndSec: 5 },
			shared
		);
		const spectrogram = await audioFileAdapter.analyze(
			{ buffer },
			{ analysisMode: 'spectrogram', sensitivity: 1, smoothing: 0, segmentStartSec: 0, segmentEndSec: 5 },
			shared
		);
		expect(Array.from(waveform.values)).not.toEqual(Array.from(spectrogram.values));
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/audio-file.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement audio-file adapter**

`src/lib/data-pattern/adapters/audio-file.ts`:

```ts
import { AUDIO_SEGMENT_THRESHOLD_SEC, DEFAULT_AUDIO_SEGMENT_SEC } from '../constants.js';
import { audioBufferToMono, rms, sliceAudioBuffer } from '../audio-decode.js';
import { audioRowsFromDuration } from '../dimensions.js';
import { applySensitivity, normalizeMatrix, spatialSmooth } from '../matrix-utils.js';
import type {
	AudioFileConfig,
	SharedConfig,
	SourceAdapter,
	SourceMatrix
} from '../types.js';

export interface AudioFileInput {
	buffer: AudioBuffer;
}

export function effectiveSegment(
	buffer: AudioBuffer,
	segmentStartSec: number,
	segmentEndSec: number
): { start: number; end: number } {
	if (buffer.duration <= AUDIO_SEGMENT_THRESHOLD_SEC) {
		return { start: 0, end: buffer.duration };
	}
	return { start: segmentStartSec, end: segmentEndSec };
}

function buildWaveformMatrix(
	samples: Float32Array,
	sampleRate: number,
	stitches: number,
	rows: number
): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	const amps = new Float32Array(stitches);
	for (let c = 0; c < stitches; c++) {
		const start = Math.floor((c / stitches) * samples.length);
		const end = Math.floor(((c + 1) / stitches) * samples.length);
		amps[c] = rms(samples.subarray(start, Math.max(start + 1, end)));
	}
	let min = Math.min(...amps);
	let max = Math.max(...amps);
	const span = max - min || 1;
	for (let c = 0; c < stitches; c++) amps[c] = (amps[c] - min) / span;
	for (let c = 0; c < stitches; c++) {
		const targetRow = Math.floor(amps[c] * rows);
		const clamped = Math.min(rows - 1, Math.max(0, targetRow));
		values[clamped * stitches + c] = 1;
	}
	return { width: stitches, height: rows, values };
}

function buildSpectrogramMatrix(
	samples: Float32Array,
	sampleRate: number,
	stitches: number,
	rows: number
): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	const fftSize = 256;
	for (let c = 0; c < stitches; c++) {
		const start = Math.floor((c / stitches) * samples.length);
		const end = Math.floor(((c + 1) / stitches) * samples.length);
		const slice = samples.subarray(start, Math.max(start + 1, end));
		const bandEnergies = new Float32Array(rows);
		for (let r = 0; r < rows; r++) {
			let sum = 0;
			const bandStart = Math.floor((r / rows) * slice.length);
			const bandEnd = Math.floor(((r + 1) / rows) * slice.length);
			for (let i = bandStart; i < bandEnd; i++) sum += slice[i] * slice[i];
			bandEnergies[r] = Math.sqrt(sum / Math.max(1, bandEnd - bandStart));
		}
		for (let r = 0; r < rows; r++) values[r * stitches + c] = bandEnergies[r];
	}
	return { width: stitches, height: rows, values };
}

export const audioFileAdapter: SourceAdapter<AudioFileInput, AudioFileConfig> = {
	id: 'audio-file',
	estimateRows(input, config) {
		const seg = effectiveSegment(input.buffer, config.segmentStartSec, config.segmentEndSec);
		return audioRowsFromDuration(seg.end - seg.start);
	},
	async analyze(input, config, shared) {
		const seg = effectiveSegment(input.buffer, config.segmentStartSec, config.segmentEndSec);
		const duration = seg.end - seg.start;
		const sliced = sliceAudioBuffer(input.buffer, seg.start, seg.end);
		const samples = audioBufferToMono(sliced);
		const rows = audioRowsFromDuration(duration);
		const matrix =
			config.analysisMode === 'waveform'
				? buildWaveformMatrix(samples, sliced.sampleRate, shared.stitches, rows)
				: buildSpectrogramMatrix(samples, sliced.sampleRate, shared.stitches, rows);
		applySensitivity(matrix, config.sensitivity);
		spatialSmooth(matrix, config.smoothing);
		normalizeMatrix(matrix);
		return matrix;
	}
};

export function defaultAudioSegment(buffer: AudioBuffer): { start: number; end: number } {
	if (buffer.duration <= AUDIO_SEGMENT_THRESHOLD_SEC) {
		return { start: 0, end: buffer.duration };
	}
	return { start: 0, end: Math.min(DEFAULT_AUDIO_SEGMENT_SEC, buffer.duration) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/audio-file.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/adapters/audio-file.ts src/lib/data-pattern/adapters/audio-file.test.ts
git commit -m "feat(data-pattern): add audio file adapter with waveform and spectrogram"
```

---

## Phase 4 — Terrain adapter

### Task 9: Geocoding and elevation API clients

**Files:**
- Create: `src/lib/data-pattern/adapters/geocoding-api.ts`
- Create: `src/lib/data-pattern/adapters/geocoding-api.test.ts`
- Create: `src/lib/data-pattern/adapters/elevation-api.ts`
- Create: `src/lib/data-pattern/adapters/elevation-api.test.ts`

- [ ] **Step 1: Write failing tests with mocked fetch**

`src/lib/data-pattern/adapters/geocoding-api.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchPlace } from './geocoding-api.js';

afterEach(() => vi.restoreAllMocks());

describe('searchPlace', () => {
	it('returns lat/lon from Nominatim response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => [{ lat: '45.0', lon: '9.0', display_name: 'Test' }]
			})
		);
		const result = await searchPlace('Test');
		expect(result).toEqual({ lat: 45, lon: 9, label: 'Test' });
	});
});
```

`src/lib/data-pattern/adapters/elevation-api.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchElevations } from './elevation-api.js';

afterEach(() => vi.restoreAllMocks());

describe('fetchElevations', () => {
	it('POSTs locations and returns elevations', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [{ latitude: 1, longitude: 2, elevation: 100 }]
				})
			})
		);
		const elev = await fetchElevations([{ lat: 1, lng: 2 }]);
		expect(elev).toEqual([100]);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/geocoding-api.test.ts src/lib/data-pattern/adapters/elevation-api.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement clients**

`src/lib/data-pattern/adapters/geocoding-api.ts`:

```ts
import { NOMINATIM_SEARCH_URL } from '../constants.js';

export interface PlaceResult {
	lat: number;
	lon: number;
	label: string;
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
	const url = new URL(NOMINATIM_SEARCH_URL);
	url.searchParams.set('q', query);
	url.searchParams.set('format', 'json');
	url.searchParams.set('limit', '1');
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!res.ok) throw new Error('Geocoding failed');
	const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
	if (!data.length) return null;
	const item = data[0];
	return { lat: Number(item.lat), lon: Number(item.lon), label: item.display_name };
}
```

`src/lib/data-pattern/adapters/elevation-api.ts`:

```ts
import { OPEN_ELEVATION_URL } from '../constants.js';

export interface LatLng {
	lat: number;
	lng: number;
}

export async function fetchElevations(points: LatLng[]): Promise<number[]> {
	const res = await fetch(OPEN_ELEVATION_URL, {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		body: JSON.stringify({
			locations: points.map((p) => ({ latitude: p.lat, longitude: p.lng }))
		})
	});
	if (!res.ok) throw new Error('Elevation fetch failed');
	const data = (await res.json()) as { results: Array<{ elevation: number }> };
	return data.results.map((r) => r.elevation);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/geocoding-api.test.ts src/lib/data-pattern/adapters/elevation-api.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/adapters/geocoding-api.ts src/lib/data-pattern/adapters/geocoding-api.test.ts src/lib/data-pattern/adapters/elevation-api.ts src/lib/data-pattern/adapters/elevation-api.test.ts
git commit -m "feat(data-pattern): add geocoding and elevation API clients"
```

---

### Task 10: Terrain adapter

**Files:**
- Create: `src/lib/data-pattern/adapters/terrain.ts`
- Create: `src/lib/data-pattern/adapters/terrain.test.ts`

- [ ] **Step 1: Write failing test (posterize + normalise without network)**

`src/lib/data-pattern/adapters/terrain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { elevationsToMatrix, posterizeValues } from './terrain.js';

describe('posterizeValues', () => {
	it('quantizes to N distinct levels', () => {
		const values = new Float32Array([0, 0.2, 0.4, 0.6, 0.8, 1]);
		posterizeValues(values, 5);
		const unique = new Set(Array.from(values).map((v) => v.toFixed(2)));
		expect(unique.size).toBeLessThanOrEqual(5);
	});
});

describe('elevationsToMatrix', () => {
	it('normalizes elevation grid to 0–1', () => {
		const matrix = elevationsToMatrix([0, 50, 100], 1, 3, 'continuous', 5);
		expect(matrix.values[0]).toBe(0);
		expect(matrix.values[2]).toBe(1);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/terrain.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement terrain adapter**

`src/lib/data-pattern/adapters/terrain.ts`:

```ts
import { terrainRowsFromBbox } from '../dimensions.js';
import { normalizeMatrix } from '../matrix-utils.js';
import { fetchElevations } from './elevation-api.js';
import type { SharedConfig, SourceAdapter, SourceMatrix, TerrainBbox, TerrainConfig } from '../types.js';

export function posterizeValues(values: Float32Array, levels: number): void {
	for (let i = 0; i < values.length; i++) {
		const step = 1 / (levels - 1);
		const level = Math.round(values[i] / step);
		values[i] = level * step;
	}
}

export function elevationsToMatrix(
	elevations: number[],
	width: number,
	height: number,
	mode: TerrainConfig['mode'],
	posterizeLevels: number
): SourceMatrix {
	const values = new Float32Array(elevations);
	let min = Math.min(...elevations);
	let max = Math.max(...elevations);
	const span = max - min || 1;
	for (let i = 0; i < values.length; i++) values[i] = (elevations[i] - min) / span;
	if (mode === 'posterized') posterizeValues(values, posterizeLevels);
	const matrix: SourceMatrix = { width, height, values };
	normalizeMatrix(matrix);
	return matrix;
}

function gridSamplePoints(bbox: TerrainBbox, width: number, height: number) {
	const points: { lat: number; lng: number }[] = [];
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const lat = bbox.south + ((height - 1 - row) / Math.max(1, height - 1)) * (bbox.north - bbox.south);
			const lng = bbox.west + (col / Math.max(1, width - 1)) * (bbox.east - bbox.west);
			points.push({ lat, lng });
		}
	}
	return points;
}

export const terrainAdapter: SourceAdapter<{ bbox: TerrainBbox }, TerrainConfig> = {
	id: 'terrain',
	estimateRows(_input, config, shared) {
		return terrainRowsFromBbox(config.bbox, shared);
	},
	async analyze(input, config, shared) {
		const rows = terrainRowsFromBbox(config.bbox, shared);
		const points = gridSamplePoints(input.bbox, shared.stitches, rows);
		const elevations = await fetchElevations(points);
		return elevationsToMatrix(
			elevations,
			shared.stitches,
			rows,
			config.mode,
			config.posterizeLevels
		);
	}
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/adapters/terrain.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/adapters/terrain.ts src/lib/data-pattern/adapters/terrain.test.ts
git commit -m "feat(data-pattern): add terrain adapter with posterize"
```

---

## Phase 5 — Knit/purl export

### Task 11: export-knit-purl

**Files:**
- Create: `src/lib/data-pattern/export-knit-purl.ts`
- Create: `src/lib/data-pattern/export-knit-purl.test.ts`

- [ ] **Step 1: Write failing test**

`src/lib/data-pattern/export-knit-purl.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bitmapToSymbolGrid, exportRowForDisplay } from './export-knit-purl.js';

describe('bitmapToSymbolGrid', () => {
	it('maps 1 to knit and 0 to purl', () => {
		const grid = bitmapToSymbolGrid(new Uint8Array([1, 0]), 2, 1);
		expect(grid[0]).toEqual(['|', '-']);
	});
});

describe('exportRowForDisplay', () => {
	it('flips rows so row 0 in memory becomes bottom row', () => {
		const bitmap = new Uint8Array([1, 0, 0, 1]);
		expect(exportRowForDisplay(bitmap, 2, 2, 0)).toEqual([0, 1]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/data-pattern/export-knit-purl.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement export module**

`src/lib/data-pattern/export-knit-purl.ts`:

```ts
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

export function exportRowForDisplay(bitmap: Bitmap, width: number, height: number, displayRow: number): number[] {
	const memoryRow = height - 1 - displayRow;
	const row: number[] = [];
	for (let col = 0; col < width; col++) row.push(bitmap[memoryRow * width + col]);
	return row;
}

export function symbolsForDisplayRow(bitmap: Bitmap, width: number, height: number, displayRow: number): string[] {
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
	const pdf = new jsPDF({ orientation: dims.stitches > dims.rows ? 'landscape' : 'portrait', unit: 'pt' });
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/data-pattern/export-knit-purl.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data-pattern/export-knit-purl.ts src/lib/data-pattern/export-knit-purl.test.ts
git commit -m "feat(data-pattern): add knit/purl symbolic export"
```

---

## Phase 6 — Hub wiring and copy

### Task 12: Copy namespace and registry

**Files:**
- Modify: `src/lib/copy.ts`
- Modify: `src/lib/tools/registry.ts`

- [ ] **Step 1: Add `dataPattern` copy**

Append to `src/lib/copy.ts`:

```ts
export const dataPattern = {
	stepSource: 'Source',
	stepConfigure: 'Configure',
	stepGenerate: 'Generate',
	sourceVoice: 'Record from microphone',
	sourceAudio: 'Upload MP3, WAV, or OGG',
	sourceTerrain: 'Pick a place on the map',
	runsLocally: 'Runs locally',
	usesExternalMap: 'Uses external map data',
	whatIsSent: 'What is sent?',
	continue: 'Continue',
	back: 'Back',
	generatePattern: 'Generate pattern',
	sensitivity: 'Sensitivity',
	smoothing: 'Smoothing',
	analysisMode: 'Analysis mode',
	modeWaveform: 'Waveform',
	modeSpectrogram: 'Spectrogram',
	terrainContinuous: 'Continuous elevation',
	terrainPosterized: 'Posterized relief',
	posterizeLevels: 'Posterize levels',
	stitches: 'Width (stitches)',
	stitchesPerCm: 'Stitches per cm',
	rowsPerCm: 'Rows per cm',
	dimensionsSummary: (p: { stitches: string; rows: string; widthCm: string; heightCm: string }) =>
		`${p.stitches} sts × ${p.rows} rows — approx. ${p.widthCm} × ${p.heightCm} cm on fabric`,
	changeSource: 'Change source',
	resetToGenerated: 'Reset to generated',
	viewSymbols: 'Symbols',
	viewJacquard: 'Jacquard colours',
	exportKnitPurl: 'Knit/purl chart',
	exportJacquard: 'Jacquard (2 colours)',
	downloadPdfChart: 'Download PDF chart',
	downloadSymbolicPng: 'Download symbolic PNG',
	downloadAyabPng: 'Download AYAB PNG',
	downloadAnnotatedPdf: 'Download annotated PDF',
	fabricView: 'As on fabric',
	threshold: 'Black / white balance',
	contrast: 'Contrast',
	invert: 'Invert',
	warnOverStitches: 'This exceeds the 200-stitch machine limit.',
	confirmOverStitches: 'Width is over 200 stitches. Export anyway?',
	warnRowsCapped: 'Pattern capped at 300 rows. Use a shorter clip or smaller area.',
	warnShortPattern: 'Pattern is very short — try a longer recording or wider area.',
	warnFlatInput: 'Input looks uniform — try increasing contrast or sensitivity.',
	confirmChangeSource: 'Your pattern edits will be lost. Continue?',
	confirmRefineDiscard: 'Changing refine settings will discard manual edits. Continue?',
	confirmReset: 'Discard manual edits and restore from source data?',
	errorMicDenied: 'Microphone access denied. Allow access in browser settings to use Voice mode.',
	errorNoWebAudio: "This browser doesn't support audio analysis. Try Chrome or Firefox.",
	errorUnsupportedAudio: 'Unsupported format. Use MP3, WAV, or OGG.',
	errorAudioTooLarge: 'File too large. Try a shorter clip or lower bitrate.',
	errorAudioDecode: 'Could not read this audio file. Try converting to WAV.',
	errorSegmentTooShort: 'Select a segment with at least 1 second of audio.',
	errorPlaceNotFound: 'No location found. Try a different spelling.',
	errorGeocoding: 'Place search is unavailable. Pan the map to your area.',
	errorElevation: 'Could not fetch elevation data. Check your connection and try again.',
	errorBboxTooLarge: 'Selected area is too large. Zoom in or shrink the selection box.',
	retry: 'Retry',
	legendKnit: 'Knit',
	legendPurl: 'Purl'
} as const;
```

- [ ] **Step 2: Add registry entry**

In `src/lib/tools/registry.ts`, import `WaveformIcon` from `phosphor-svelte/lib/WaveformIcon` and append:

```ts
{
	slug: 'data-pattern',
	href: '/tools/data-pattern',
	icon: WaveformIcon,
	title: 'Data pattern generator',
	teaser: 'Turn voice, audio, or terrain into a knitting pattern.',
	portico: [
		'Pick a data source — your voice, an audio file, or a landscape — and generate a stitch pattern.',
		'Refine contrast, edit stitches, then export as a knit/purl chart or a two-colour jacquard file for AYAB.',
		'Voice and audio run locally in your browser. Terrain mode requests elevation data for the map area you select.'
	]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/copy.ts src/lib/tools/registry.ts
git commit -m "feat(data-pattern): add copy strings and hub registry entry"
```

---

### Task 13: Route stub

**Files:**
- Create: `src/routes/tools/data-pattern/+page.ts`
- Create: `src/routes/tools/data-pattern/+page.svelte`

- [ ] **Step 1: Create route files**

`src/routes/tools/data-pattern/+page.ts`:

```ts
export const prerender = true;
```

`src/routes/tools/data-pattern/+page.svelte`:

```svelte
<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import DataPatternEditor from '$lib/components/data-pattern/DataPatternEditor.svelte';
	import { tools } from '$lib/tools/registry.js';

	const tool = tools.find((t) => t.slug === 'data-pattern')!;
</script>

<ToolPageLayout {tool} wide>
	<div class="data-pattern-shell">
		<DataPatternEditor />
	</div>
</ToolPageLayout>

<style>
	.data-pattern-shell {
		min-height: 75dvh;
	}
</style>
```

- [ ] **Step 2: Create minimal `DataPatternEditor.svelte` placeholder**

`src/lib/components/data-pattern/DataPatternEditor.svelte`:

```svelte
<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
</script>

<p class="text-muted-foreground">{dataPattern.stepSource} — implementation in progress</p>
```

- [ ] **Step 3: Verify build**

Run: `npm run check`  
Expected: PASS (or only pre-existing issues)

- [ ] **Step 4: Commit**

```bash
git add src/routes/tools/data-pattern src/lib/components/data-pattern/DataPatternEditor.svelte
git commit -m "feat(data-pattern): add route stub and editor shell"
```

---

## Phase 7 — UI components

### Task 14: Install Leaflet

- [ ] **Step 1: Add dependency**

```bash
npm install leaflet
npm install -D @types/leaflet
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(data-pattern): add leaflet for terrain map"
```

---

### Task 15: Wizard components

**Files:**
- Create: `src/lib/components/data-pattern/SourcePicker.svelte`
- Create: `src/lib/components/data-pattern/DimensionsGauge.svelte`
- Create: `src/lib/components/data-pattern/VoiceConfig.svelte`
- Create: `src/lib/components/data-pattern/AudioConfig.svelte`
- Create: `src/lib/components/data-pattern/TerrainConfig.svelte`

- [ ] **Step 1: Implement SourcePicker**

Three shadcn-style selectable cards (voice / audio-file / terrain) with badges per spec. Props: `selected: SourceId | null`, `onSelect: (id: SourceId) => void`, `micAvailable: boolean`, `webAudioAvailable: boolean`. Disable voice card when mic or Web Audio unavailable.

- [ ] **Step 2: Implement DimensionsGauge**

Bind `stitches`, `stitchesPerCm`, `rowsPerCm`. Show `fabricSummary` from `dimensions.ts` using live `rows` prop from parent. Show warning when `stitches > MAX_STITCHES_WARN`.

- [ ] **Step 3: Implement VoiceConfig**

`MediaRecorder` + `AudioContext` for record/stop, duration slider, live waveform canvas, sensitivity/smoothing sliders. Emit `AudioBuffer` on stop via `ondone` callback.

- [ ] **Step 4: Implement AudioConfig**

File dropzone (validate type + 20 MB), decode via `AudioContext.decodeAudioData`, mini waveform, segment picker when `duration > 60`, analysis mode radio, sensitivity/smoothing.

- [ ] **Step 5: Implement TerrainConfig**

`onMount` dynamic `import('leaflet')` + CSS. Nominatim search via `searchPlace`. Draggable rectangle overlay for bbox. Radio continuous/posterized. Validate `bboxWithinLimit` before emit. Show privacy link text from copy.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/data-pattern/SourcePicker.svelte src/lib/components/data-pattern/DimensionsGauge.svelte src/lib/components/data-pattern/VoiceConfig.svelte src/lib/components/data-pattern/AudioConfig.svelte src/lib/components/data-pattern/TerrainConfig.svelte
git commit -m "feat(data-pattern): add wizard config components"
```

---

### Task 16: Workspace components

**Files:**
- Create: `src/lib/components/data-pattern/PatternPreview.svelte`
- Create: `src/lib/components/data-pattern/EditorToolbar.svelte`
- Create: `src/lib/components/data-pattern/RefinePanel.svelte`
- Create: `src/lib/components/data-pattern/ExportPanel.svelte`
- Create: `src/lib/components/data-pattern/PatternWorkspace.svelte`

- [ ] **Step 1: PatternPreview**

Canvas renderer: accepts `bitmap`, `stitches`, `rows`, `previewView` (`symbols`|`jacquard`), `fabricView`, gauge, `zoom`. Draw with row 1 at bottom. Individual cell borders. Symbol view uses `|` / `-`.

- [ ] **Step 2: EditorToolbar**

Toggle / brush / eraser buttons + undo/redo (disabled when stack empty). Emit `toolchange` and `undo`/`redo`.

- [ ] **Step 3: RefinePanel**

Sliders for contrast (0–2), threshold (0–1), invert checkbox, «Reset to generated» button. On slider change: if `hasManualEdits`, show shadcn Dialog confirm; on cancel revert slider to previous value.

- [ ] **Step 4: ExportPanel**

Radio export mode knit-purl / jacquard. Four buttons wired to:
- `exportKnitPurlPdf` / `exportSymbolicPng` from `export-knit-purl.ts`
- `exportAyabPng` / `exportAnnotatedPdf` from jacquard (pass **flipped** bitmap via `flipBitmapVertical`)
- Confirm dialog when `stitches > 200`

- [ ] **Step 5: PatternWorkspace**

Compose preview + toolbar + refine + export per desktop/mobile layout in spec.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/data-pattern/PatternPreview.svelte src/lib/components/data-pattern/EditorToolbar.svelte src/lib/components/data-pattern/RefinePanel.svelte src/lib/components/data-pattern/ExportPanel.svelte src/lib/components/data-pattern/PatternWorkspace.svelte
git commit -m "feat(data-pattern): add workspace preview and export components"
```

---

### Task 17: DataPatternEditor orchestrator

**Files:**
- Modify: `src/lib/components/data-pattern/DataPatternEditor.svelte`

- [ ] **Step 1: Wire wizard state machine**

States: `'source' | 'configure' | 'generating' | 'workspace'`.

- Source step → SourcePicker + Continue
- Configure step → dynamic config component + DimensionsGauge + Back/Generate
- Generating → call correct adapter `analyze()`, store immutable `sourceMatrix`, compute initial `bitmap` via `matrixToBitmap`, store `generatedBitmap` copy
- On success → workspace; on error → show message + Back to configure

- [ ] **Step 2: Wire workspace state**

- `BitmapEditor` instance on workspace entry
- `refine` params with regenerate on change (with confirm)
- `previewView` toggle independent of export mode
- Change source → confirm if `hasManualEdits`

- [ ] **Step 3: Feature detection on mount**

Check `window.AudioContext` and `navigator.mediaDevices?.getUserMedia` for disabling voice/audio.

- [ ] **Step 4: Run dev smoke**

Run: `npm run dev` — open `/tools/data-pattern`, walk voice → generate → toggle stitch → export PDF.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/data-pattern/DataPatternEditor.svelte
git commit -m "feat(data-pattern): wire wizard and workspace orchestrator"
```

---

## Phase 8 — E2E and verification

### Task 18: E2E smoke test

**Files:**
- Create: `e2e/data-pattern.e2e.ts`

- [ ] **Step 1: Add test**

```ts
import { test, expect } from '@playwright/test';

test('data pattern tool loads and shows source step', async ({ page }) => {
	await page.goto('/tools/data-pattern');
	await expect(page.getByText('Record from microphone')).toBeVisible();
	await expect(page.getByText('Upload MP3, WAV, or OGG')).toBeVisible();
	await expect(page.getByText('Pick a place on the map')).toBeVisible();
});
```

- [ ] **Step 2: Run E2E**

Run: `npm run test:e2e -- e2e/data-pattern.e2e.ts`  
Expected: PASS

- [ ] **Step 3: Run full test suite**

Run: `npm run test`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add e2e/data-pattern.e2e.ts
git commit -m "test(data-pattern): add e2e smoke for source step"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Three sources (voice, audio, terrain) | Tasks 7–10, 15, 17 |
| Waveform + spectrogram | Task 8 |
| Row formulas + caps | Task 2 |
| Bitmap semantics + vertical flip | Tasks 4–5, 11, 16 |
| Refine vs edits confirm | Tasks 5, 16, 17 |
| Wizard + workspace flow | Tasks 15–17 |
| Editor toggle/brush/eraser/undo | Task 5, 16 |
| Four export buttons | Task 11, 16 |
| Nominatim + Open-Elevation | Tasks 9–10, 15 |
| Error messages (copy) | Task 12, wired in 15–17 |
| English copy in copy.ts | Task 12 |
| Registry + route | Tasks 12–13 |
| Vitest pure modules | Tasks 2–11 |
| No preview PNG download | Omitted from ExportPanel |
| stitches > 200 export confirm | Task 16 |

---

## Next step

Plan complete. Choose execution approach (see below).
