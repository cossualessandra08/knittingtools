# Intarsia Work Assistant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the intarsia work assistant per `docs/superpowers/specs/2026-06-29-intarsia-work-assistant-design.md` — pattern import/editor, stitch-by-stitch guidance, row instructions, segment bar, local autosave, and project export/import.

**Architecture:** Pure TypeScript modules in `src/lib/intarsia/` implement the pattern matrix, colour palette, row analysis, work-assistant navigation, image quantisation, grid-editor mutations, and project persistence (Vitest node project). Svelte 5 components in `src/lib/components/intarsia/` provide the grid canvas, sidebar, footer, toolbar, and shell layout. All processing runs client-side; autosave uses `localStorage`. English UI copy in `src/lib/copy.ts`.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), Tailwind 4 + shadcn-svelte (Button, Slider, Label, Input, Dialog), Lucide icons, Canvas API, Vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-06-29-intarsia-work-assistant-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/intarsia/constants.ts` | `MAX_STITCHES`, `MAX_ROWS`, `MAX_COLOURS`, file limits |
| `src/lib/intarsia/types.ts` | `PatternMatrix`, `ColourEntry`, `WorkPosition`, `IntarsiaProject`, settings |
| `src/lib/intarsia/pattern-matrix.ts` | Create, validate, get/set cells (row 0 = bottom) |
| `src/lib/intarsia/pattern-matrix.test.ts` | Matrix tests |
| `src/lib/intarsia/colour-palette.ts` | Add/merge/rename colours, default names |
| `src/lib/intarsia/colour-palette.test.ts` | Palette tests |
| `src/lib/intarsia/row-analysis.ts` | Run-length encoding, per-colour stitch totals |
| `src/lib/intarsia/row-analysis.test.ts` | Row analysis tests |
| `src/lib/intarsia/reading-direction.ts` | Zigzag/manual direction, RS/WS label |
| `src/lib/intarsia/reading-direction.test.ts` | Direction tests |
| `src/lib/intarsia/work-assistant.ts` | Position, stitch/row nav, segment progress |
| `src/lib/intarsia/work-assistant.test.ts` | Navigation tests |
| `src/lib/intarsia/image-quantize.ts` | Resize image data, k-means quantise to N colours |
| `src/lib/intarsia/image-quantize.test.ts` | Quantise tests |
| `src/lib/intarsia/grid-editor.ts` | Brush, fill, selection, line, symmetry, undo stack |
| `src/lib/intarsia/grid-editor.test.ts` | Editor mutation tests |
| `src/lib/intarsia/grid-layout.ts` | Cell pixel size, fabric aspect, zoom levels |
| `src/lib/intarsia/grid-layout.test.ts` | Layout math tests |
| `src/lib/intarsia/project-storage.ts` | Autosave, export/import JSON |
| `src/lib/intarsia/project-storage.test.ts` | Storage round-trip tests |
| `src/lib/components/intarsia/IntarsiaEditor.svelte` | Main shell: state, keyboard, layout |
| `src/lib/components/intarsia/PatternGrid.svelte` | Canvas renderer + stitch tap/hit-test |
| `src/lib/components/intarsia/RowInstructions.svelte` | Sidebar: RLE list + colour totals |
| `src/lib/components/intarsia/SegmentBar.svelte` | Footer segment progress |
| `src/lib/components/intarsia/WorkControls.svelte` | Footer: ← → Prev row Next row |
| `src/lib/components/intarsia/EditorToolbar.svelte` | Draw tools + undo/redo |
| `src/lib/components/intarsia/ColourLegend.svelte` | Renamable swatches |
| `src/lib/components/intarsia/ImageImportPanel.svelte` | Upload + colour-count slider + review |
| `src/lib/components/intarsia/TopBar.svelte` | Project name, zoom, row, direction, RS/WS |
| `src/routes/tools/intarsia-assistant/+page.svelte` | Tool page |
| `src/routes/tools/intarsia-assistant/+page.ts` | `prerender = true` |
| `src/lib/tools/registry.ts` | Add `intarsia-assistant` entry |
| `src/lib/copy.ts` | `intarsia` copy namespace |
| `e2e/intarsia-assistant.e2e.ts` | Navigation + work-mode smoke |

---

## Phase 1 — Core data model

### Task 1: Constants and types

**Files:**
- Create: `src/lib/intarsia/constants.ts`
- Create: `src/lib/intarsia/types.ts`

- [ ] **Step 1: Create constants**

`src/lib/intarsia/constants.ts`:

```ts
export const MAX_STITCHES = 200;
export const MAX_ROWS = 300;
export const MAX_COLOURS = 20;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'] as const;
export const AUTOSAVE_KEY = 'intarsia-assistant-project';
export const PROJECT_FILE_VERSION = 1 as const;
export const ZOOM_LEVELS = [50, 100, 200, 400] as const;
```

- [ ] **Step 2: Create types**

`src/lib/intarsia/types.ts`:

```ts
import type { PROJECT_FILE_VERSION, ZOOM_LEVELS } from './constants.js';

export type ReadingMode = 'zigzag' | 'manual';
export type ReadingDirection = 'ltr' | 'rtl';
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];
export type RowSide = 'RS' | 'WS';

export interface ColourEntry {
	id: number;
	hex: string;
	name: string;
}

/** Row 0 is the bottom row (knitting row 1). Cells are row-major: index = row * width + stitch. */
export interface PatternMatrix {
	width: number;
	height: number;
	cells: Uint8Array;
}

export interface WorkPosition {
	row: number;
	stitch: number;
}

export interface IntarsiaSettings {
	projectName: string;
	readingMode: ReadingMode;
	manualDirection: ReadingDirection;
	showRsWs: boolean;
	fabricView: boolean;
	stitchesPerCm: number;
	rowsPerCm: number;
	zoom: ZoomLevel;
}

export interface IntarsiaProject {
	version: typeof PROJECT_FILE_VERSION;
	matrix: PatternMatrix;
	palette: ColourEntry[];
	position: WorkPosition;
	settings: IntarsiaSettings;
}

export interface ColourRun {
	colourId: number;
	length: number;
}

export interface RowAnalysis {
	runs: ColourRun[];
	totalsByColour: Map<number, number>;
	totalStitches: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/intarsia/constants.ts src/lib/intarsia/types.ts
git commit -m "feat(intarsia): add constants and types"
```

---

### Task 2: Pattern matrix

**Files:**
- Create: `src/lib/intarsia/pattern-matrix.ts`
- Create: `src/lib/intarsia/pattern-matrix.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/intarsia/pattern-matrix.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	createEmptyMatrix,
	getCell,
	setCell,
	validateMatrixDimensions,
	uiRowNumber,
	matrixRowFromUi
} from './pattern-matrix.js';

describe('pattern-matrix', () => {
	it('creates matrix filled with colour 0', () => {
		const m = createEmptyMatrix(5, 3);
		expect(m.width).toBe(5);
		expect(m.height).toBe(3);
		expect(m.cells.length).toBe(15);
		expect(getCell(m, 0, 0)).toBe(0);
	});

	it('maps bottom row to UI row 1', () => {
		expect(uiRowNumber(0)).toBe(1);
		expect(uiRowNumber(4)).toBe(5);
		expect(matrixRowFromUi(5)).toBe(4);
	});

	it('rejects dimensions over limits', () => {
		expect(validateMatrixDimensions(201, 100).ok).toBe(false);
		expect(validateMatrixDimensions(100, 301).ok).toBe(false);
		expect(validateMatrixDimensions(100, 100).ok).toBe(true);
	});

	it('sets and gets cells by row/stitch', () => {
		const m = createEmptyMatrix(4, 2);
		setCell(m, 1, 2, 3);
		expect(getCell(m, 1, 2)).toBe(3);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/intarsia/pattern-matrix.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

`src/lib/intarsia/pattern-matrix.ts`:

```ts
import { MAX_ROWS, MAX_STITCHES } from './constants.js';
import type { PatternMatrix } from './types.js';

export function createEmptyMatrix(width: number, height: number): PatternMatrix {
	const validation = validateMatrixDimensions(width, height);
	if (!validation.ok) throw new Error(validation.message);
	return { width, height, cells: new Uint8Array(width * height) };
}

export function validateMatrixDimensions(
	width: number,
	height: number
): { ok: true } | { ok: false; message: string } {
	if (width < 1 || height < 1) return { ok: false, message: 'Pattern must be at least 1×1.' };
	if (width > MAX_STITCHES) return { ok: false, message: 'Pattern exceeds 200 stitches.' };
	if (height > MAX_ROWS) return { ok: false, message: 'Pattern exceeds 300 rows.' };
	return { ok: true };
}

export function cellIndex(matrix: PatternMatrix, row: number, stitch: number): number {
	return row * matrix.width + stitch;
}

export function getCell(matrix: PatternMatrix, row: number, stitch: number): number {
	return matrix.cells[cellIndex(matrix, row, stitch)]!;
}

export function setCell(
	matrix: PatternMatrix,
	row: number,
	stitch: number,
	colourId: number
): void {
	matrix.cells[cellIndex(matrix, row, stitch)] = colourId;
}

/** Internal row 0 = knitting row 1 (bottom). */
export function uiRowNumber(internalRow: number): number {
	return internalRow + 1;
}

export function matrixRowFromUi(uiRow: number): number {
	return uiRow - 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/intarsia/pattern-matrix.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/pattern-matrix.ts src/lib/intarsia/pattern-matrix.test.ts
git commit -m "feat(intarsia): add pattern matrix helpers"
```

---

### Task 3: Colour palette

**Files:**
- Create: `src/lib/intarsia/colour-palette.ts`
- Create: `src/lib/intarsia/colour-palette.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/intarsia/colour-palette.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	createDefaultPalette,
	addColour,
	mergeColours,
	renameColour,
	defaultColourName
} from './colour-palette.js';
import { createEmptyMatrix, setCell } from './pattern-matrix.js';

describe('colour-palette', () => {
	it('creates default white palette entry', () => {
		const palette = createDefaultPalette();
		expect(palette).toHaveLength(1);
		expect(palette[0]!.hex).toBe('#FFFFFF');
		expect(palette[0]!.name).toBe('Colour 1');
	});

	it('merges two colours and remaps matrix cells', () => {
		const palette = [
			{ id: 0, hex: '#000000', name: 'Black' },
			{ id: 1, hex: '#111111', name: 'Colour 2' }
		];
		const matrix = createEmptyMatrix(2, 1);
		setCell(matrix, 0, 0, 0);
		setCell(matrix, 0, 1, 1);
		const result = mergeColours(matrix, palette, 1, 0);
		expect(result.palette).toHaveLength(1);
		expect(result.matrix.cells[1]).toBe(0);
	});

	it('renames a colour', () => {
		const palette = createDefaultPalette();
		const updated = renameColour(palette, 0, 'Cream');
		expect(updated[0]!.name).toBe('Cream');
	});

	it('formats default names', () => {
		expect(defaultColourName(2)).toBe('Colour 3');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/intarsia/colour-palette.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

`src/lib/intarsia/colour-palette.ts`:

```ts
import { MAX_COLOURS } from './constants.js';
import type { ColourEntry, PatternMatrix } from './types.js';

export function defaultColourName(index: number): string {
	return `Colour ${index + 1}`;
}

export function createDefaultPalette(): ColourEntry[] {
	return [{ id: 0, hex: '#FFFFFF', name: defaultColourName(0) }];
}

export function addColour(palette: ColourEntry[], hex: string): ColourEntry[] {
	if (palette.length >= MAX_COLOURS) {
		throw new Error('Maximum 20 colours.');
	}
	const id = palette.length;
	return [...palette, { id, hex, name: defaultColourName(id) }];
}

export function renameColour(palette: ColourEntry[], id: number, name: string): ColourEntry[] {
	return palette.map((c) => (c.id === id ? { ...c, name } : c));
}

export function mergeColours(
	matrix: PatternMatrix,
	palette: ColourEntry[],
	fromId: number,
	intoId: number
): { matrix: PatternMatrix; palette: ColourEntry[] } {
	const cells = matrix.cells.slice();
	for (let i = 0; i < cells.length; i++) {
		if (cells[i] === fromId) cells[i] = intoId;
		if (cells[i]! > fromId) cells[i] = cells[i]! - 1;
	}
	const nextPalette = palette
		.filter((c) => c.id !== fromId)
		.map((c) => ({
			...c,
			id: c.id > fromId ? c.id - 1 : c.id
		}));
	return { matrix: { ...matrix, cells }, palette: nextPalette };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/intarsia/colour-palette.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/colour-palette.ts src/lib/intarsia/colour-palette.test.ts
git commit -m "feat(intarsia): add colour palette helpers"
```

---

### Task 4: Reading direction and row analysis

**Files:**
- Create: `src/lib/intarsia/reading-direction.ts`
- Create: `src/lib/intarsia/reading-direction.test.ts`
- Create: `src/lib/intarsia/row-analysis.ts`
- Create: `src/lib/intarsia/row-analysis.test.ts`

- [ ] **Step 1: Write failing tests**

`src/lib/intarsia/reading-direction.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readingDirectionForRow, rowSideForRow, rowStartStitch } from './reading-direction.js';

describe('reading-direction', () => {
	it('zigzag: row 0 ltr, row 1 rtl', () => {
		expect(readingDirectionForRow(0, 'zigzag', 'ltr')).toBe('ltr');
		expect(readingDirectionForRow(1, 'zigzag', 'ltr')).toBe('rtl');
	});

	it('manual uses manual direction for every row', () => {
		expect(readingDirectionForRow(3, 'manual', 'rtl')).toBe('rtl');
	});

	it('row 0 is RS, row 1 is WS', () => {
		expect(rowSideForRow(0)).toBe('RS');
		expect(rowSideForRow(1)).toBe('WS');
	});

	it('row start stitch follows direction', () => {
		expect(rowStartStitch('ltr', 10)).toBe(0);
		expect(rowStartStitch('rtl', 10)).toBe(9);
	});
});
```

`src/lib/intarsia/row-analysis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeRow } from './row-analysis.js';
import { createEmptyMatrix, setCell } from './pattern-matrix.js';

describe('row-analysis', () => {
	it('computes runs left-to-right', () => {
		const m = createEmptyMatrix(5, 1);
		setCell(m, 0, 0, 0);
		setCell(m, 0, 1, 0);
		setCell(m, 0, 2, 1);
		setCell(m, 0, 3, 1);
		setCell(m, 0, 4, 0);
		const analysis = analyzeRow(m, 0, 'ltr');
		expect(analysis.runs).toEqual([
			{ colourId: 0, length: 2 },
			{ colourId: 1, length: 2 },
			{ colourId: 0, length: 1 }
		]);
		expect(analysis.totalsByColour.get(0)).toBe(3);
		expect(analysis.totalsByColour.get(1)).toBe(2);
		expect(analysis.totalStitches).toBe(5);
	});

	it('orders runs for rtl reading', () => {
		const m = createEmptyMatrix(3, 1);
		setCell(m, 0, 0, 0);
		setCell(m, 0, 1, 1);
		setCell(m, 0, 2, 0);
		const analysis = analyzeRow(m, 0, 'rtl');
		expect(analysis.runs[0]).toEqual({ colourId: 0, length: 1 });
		expect(analysis.runs[1]).toEqual({ colourId: 1, length: 1 });
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/lib/intarsia/reading-direction.test.ts src/lib/intarsia/row-analysis.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

`src/lib/intarsia/reading-direction.ts`:

```ts
import type { ReadingDirection, ReadingMode, RowSide } from './types.js';

export function readingDirectionForRow(
	row: number,
	mode: ReadingMode,
	manualDirection: ReadingDirection
): ReadingDirection {
	if (mode === 'manual') return manualDirection;
	return row % 2 === 0 ? 'ltr' : 'rtl';
}

export function rowSideForRow(row: number): RowSide {
	return row % 2 === 0 ? 'RS' : 'WS';
}

export function rowStartStitch(direction: ReadingDirection, width: number): number {
	return direction === 'ltr' ? 0 : width - 1;
}
```

`src/lib/intarsia/row-analysis.ts`:

```ts
import { getCell } from './pattern-matrix.js';
import type { ColourRun, PatternMatrix, ReadingDirection, RowAnalysis } from './types.js';

export function analyzeRow(
	matrix: PatternMatrix,
	row: number,
	direction: ReadingDirection
): RowAnalysis {
	const stitches = Array.from({ length: matrix.width }, (_, stitch) =>
		getCell(matrix, row, direction === 'ltr' ? stitch : matrix.width - 1 - stitch)
	);

	const runs: ColourRun[] = [];
	for (const colourId of stitches) {
		const last = runs.at(-1);
		if (last && last.colourId === colourId) last.length += 1;
		else runs.push({ colourId, length: 1 });
	}

	const totalsByColour = new Map<number, number>();
	for (const id of stitches) {
		totalsByColour.set(id, (totalsByColour.get(id) ?? 0) + 1);
	}

	return { runs, totalsByColour, totalStitches: stitches.length };
}

export function stitchIndexInReadingOrder(
	stitch: number,
	width: number,
	direction: ReadingDirection
): number {
	return direction === 'ltr' ? stitch : width - 1 - stitch;
}

export function activeSegmentIndex(
	runs: ColourRun[],
	stitch: number,
	direction: ReadingDirection,
	width: number
): number {
	const indexInOrder = stitchIndexInReadingOrder(stitch, width, direction);
	let cursor = 0;
	for (let i = 0; i < runs.length; i++) {
		const run = runs[i]!;
		if (indexInOrder < cursor + run.length) return i;
		cursor += run.length;
	}
	return Math.max(0, runs.length - 1);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/lib/intarsia/reading-direction.test.ts src/lib/intarsia/row-analysis.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/reading-direction.ts src/lib/intarsia/reading-direction.test.ts src/lib/intarsia/row-analysis.ts src/lib/intarsia/row-analysis.test.ts
git commit -m "feat(intarsia): add reading direction and row analysis"
```

---

### Task 5: Work assistant navigation

**Files:**
- Create: `src/lib/intarsia/work-assistant.ts`
- Create: `src/lib/intarsia/work-assistant.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/intarsia/work-assistant.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	prevStitch,
	nextStitch,
	prevRow,
	nextRow,
	jumpToRow,
	setStitchPosition
} from './work-assistant.js';
import type { IntarsiaSettings } from './types.js';

const settings: IntarsiaSettings = {
	projectName: 'Test',
	readingMode: 'zigzag',
	manualDirection: 'ltr',
	showRsWs: true,
	fabricView: false,
	stitchesPerCm: 4.5,
	rowsPerCm: 6.4,
	zoom: 100
};

describe('work-assistant', () => {
	it('nextStitch moves ltr and stops at row end', () => {
		expect(nextStitch({ row: 0, stitch: 0 }, 5, settings).stitch).toBe(1);
		expect(nextStitch({ row: 0, stitch: 4 }, 5, settings).stitch).toBe(4);
	});

	it('prevStitch moves rtl on row 1', () => {
		const pos = { row: 1, stitch: 3 };
		expect(prevStitch(pos, 5, settings).stitch).toBe(2);
	});

	it('nextRow advances and resets stitch to row start', () => {
		const pos = nextRow({ row: 0, stitch: 4 }, 5, 3, settings);
		expect(pos.row).toBe(1);
		expect(pos.stitch).toBe(4);
	});

	it('jumpToRow resets stitch for reading direction', () => {
		expect(jumpToRow(2, 5, settings).stitch).toBe(0);
	});

	it('setStitchPosition clamps to grid', () => {
		expect(setStitchPosition({ row: 0, stitch: 0 }, 0, 99, 5, 3).stitch).toBe(4);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/intarsia/work-assistant.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

`src/lib/intarsia/work-assistant.ts`:

```ts
import { readingDirectionForRow, rowStartStitch } from './reading-direction.js';
import type { IntarsiaSettings, WorkPosition } from './types.js';

function clampStitch(stitch: number, width: number): number {
	return Math.max(0, Math.min(width - 1, stitch));
}

function clampRow(row: number, height: number): number {
	return Math.max(0, Math.min(height - 1, row));
}

export function setStitchPosition(
	position: WorkPosition,
	row: number,
	stitch: number,
	width: number,
	height: number
): WorkPosition {
	return {
		row: clampRow(row, height),
		stitch: clampStitch(stitch, width)
	};
}

export function prevStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const direction = readingDirectionForRow(position.row, settings.readingMode, settings.manualDirection);
	const delta = direction === 'ltr' ? -1 : 1;
	return { ...position, stitch: clampStitch(position.stitch + delta, width) };
}

export function nextStitch(
	position: WorkPosition,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const direction = readingDirectionForRow(position.row, settings.readingMode, settings.manualDirection);
	const delta = direction === 'ltr' ? 1 : -1;
	return { ...position, stitch: clampStitch(position.stitch + delta, width) };
}

export function prevRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = clampRow(position.row - 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function nextRow(
	position: WorkPosition,
	width: number,
	height: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = clampRow(position.row + 1, height);
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}

export function jumpToRow(
	uiRow: number,
	width: number,
	settings: IntarsiaSettings
): WorkPosition {
	const row = uiRow - 1;
	const direction = readingDirectionForRow(row, settings.readingMode, settings.manualDirection);
	return { row, stitch: rowStartStitch(direction, width) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/intarsia/work-assistant.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/work-assistant.ts src/lib/intarsia/work-assistant.test.ts
git commit -m "feat(intarsia): add work assistant navigation"
```

---

## Phase 2 — Image import and grid editor logic

### Task 6: Image quantisation

**Files:**
- Create: `src/lib/intarsia/image-quantize.ts`
- Create: `src/lib/intarsia/image-quantize.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/intarsia/image-quantize.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { quantizeImageData } from './image-quantize.js';

describe('image-quantize', () => {
	it('reduces pixels to at most N colours', () => {
		const data = new Uint8ClampedArray([
			255, 0, 0, 255, 0, 0, 255, 0,
			0, 0, 255, 255, 0, 0, 255, 255
		]);
		const image = { data, width: 2, height: 2 } as ImageData;
		const result = quantizeImageData(image, 2);
		expect(result.palette.length).toBeLessThanOrEqual(2);
		expect(result.matrix.width).toBe(2);
		expect(result.matrix.height).toBe(2);
	});

	it('stores row 0 as bottom image row', () => {
		const data = new Uint8ClampedArray(16);
		data[0] = 255;
		data[12] = 0;
		const image = { data, width: 2, height: 2 } as ImageData;
		const { matrix } = quantizeImageData(image, 2);
		expect(matrix.cells[0]).not.toBe(matrix.cells[2]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/intarsia/image-quantize.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement k-means quantise**

`src/lib/intarsia/image-quantize.ts` — implement `rgbToHex`, `quantizeImageData(image, colourCount)` with k-means (max 10 iterations), palette building, matrix mapping with **row 0 = bottom image row** (flip Y). Reuse resize approach from `src/lib/jacquard/canvas.ts` for `resizeImageToMatrix`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/intarsia/image-quantize.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/image-quantize.ts src/lib/intarsia/image-quantize.test.ts
git commit -m "feat(intarsia): add image quantisation"
```

---

### Task 7: Grid editor mutations and undo

**Files:**
- Create: `src/lib/intarsia/grid-editor.ts`
- Create: `src/lib/intarsia/grid-editor.test.ts`

- [ ] **Step 1: Write the failing test** (brush, floodFill, drawLine, UndoStack, copyRegion/pasteRegion — see Task 7 tests in spec coverage)

- [ ] **Step 2–4: Implement and verify**

Run: `npm run test:unit -- --run src/lib/intarsia/grid-editor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/grid-editor.ts src/lib/intarsia/grid-editor.test.ts
git commit -m "feat(intarsia): add grid editor mutations and undo"
```

---

### Task 8: Grid layout math and project storage

**Files:**
- Create: `src/lib/intarsia/grid-layout.ts`, `grid-layout.test.ts`
- Create: `src/lib/intarsia/project-storage.ts`, `project-storage.test.ts`

- [ ] **Step 1–4: Implement** `cellPixelSize`, `fabricCellAspect`, `defaultProject`, `serializeProject`, `deserializeProject`, `saveToLocalStorage`, `loadFromLocalStorage`, `downloadProjectFile`, `parseProjectFile`

- [ ] **Step 5: Commit**

```bash
git add src/lib/intarsia/grid-layout.ts src/lib/intarsia/grid-layout.test.ts src/lib/intarsia/project-storage.ts src/lib/intarsia/project-storage.test.ts
git commit -m "feat(intarsia): add grid layout math and project storage"
```

---

## Phase 3 — UI components

### Task 9: Copy strings and registry entry

- [ ] Add `intarsia` namespace to `src/lib/copy.ts` (all English strings from spec error table + UI labels)
- [ ] Add `intarsia-assistant` to `registry.ts` with `Palette` icon from Lucide
- [ ] Update `registry.test.ts` for 3 tools
- [ ] Commit

### Task 10: PatternGrid canvas component

- [ ] Create `PatternGrid.svelte` — individual cell borders, bottom-up rows, row/stitch highlights, `onStitchTap`, zoom, auto-scroll current row
- [ ] Commit

### Task 11: Sidebar and footer components

- [ ] `RowInstructions.svelte`, `SegmentBar.svelte`, `WorkControls.svelte` (Prev row · ← · → · Next row)
- [ ] Commit

### Task 12: Editor panels

- [ ] `TopBar.svelte`, `ColourLegend.svelte`, `EditorToolbar.svelte`, `ImageImportPanel.svelte`
- [ ] Commit

### Task 13: IntarsiaEditor shell and route

- [ ] `IntarsiaEditor.svelte` — wire state, keyboard, autosave, edit-confirm dialog, layout class `intarsia-editor-layout`
- [ ] `+page.svelte` + `+page.ts`
- [ ] Run `npm run check`
- [ ] Commit

---

## Phase 4 — E2E and polish

### Task 14: Playwright smoke tests

- [ ] `e2e/intarsia-assistant.e2e.ts` — catalog navigation, create grid, next row, keyboard stitch move
- [ ] Run `npm run test:e2e -- e2e/intarsia-assistant.e2e.ts`
- [ ] Commit

### Task 15: Final verification

- [ ] `npm run test` and `npm run lint`
- [ ] Manual checklist: import, draw, tap stitch outline, autosave, export/import, tablet layout, individual cell borders at zoom levels
- [ ] Commit polish if needed

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Row 1 at bottom | Task 2, Task 10 |
| Individual stitch cells | Task 10 |
| Layout A sidebar | Task 13 |
| ←/→ stitch, Next row primary | Task 5, Task 11 |
| Tap stitch outline | Task 10 |
| Row analysis + segment bar | Task 4, Task 11 |
| Image import + colour review | Task 6, Task 12 |
| Full grid editor | Task 7, Task 12 |
| Fabric view toggle | Task 8, Task 10 |
| Autosave + export/import | Task 8, Task 13 |
| RS/WS optional | Task 4, Task 12 |
| Edit with confirmation | Task 13 |
| Limits 200×300×20 | Task 1 |
| Browser-only privacy | Client-only, no server routes |
| English UI + renameable colours | Task 9, Task 12 |

---

## Suggested implementation order

1. Tasks 1–5 (pure logic)
2. Tasks 6–8 (import, editor, storage)
3. Task 9 (registry)
4. Tasks 10–12 (components)
5. Task 13 (integration)
6. Tasks 14–15 (e2e + verify)
