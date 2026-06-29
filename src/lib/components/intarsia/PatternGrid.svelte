<script lang="ts">
	import { cellPixelSize, fabricCellAspect } from '$lib/intarsia/grid-layout.js';
	import type { ColourEntry, PatternMatrix, ZoomLevel } from '$lib/intarsia/types.js';

	const TAP_THRESHOLD_PX = 8;

	export interface GridPoint {
		row: number;
		stitch: number;
	}

	let {
		matrix,
		palette,
		positionRow,
		positionStitch,
		positionVersion = 0,
		zoom,
		fabricView,
		stitchesPerCm,
		rowsPerCm,
		cellVersion = 0,
		scrollToRowTrigger = 0,
		editing = false,
		editorTool = 'brush' as 'brush' | 'eraser' | 'fill' | 'line',
		lineStart = null,
		onStitchTap,
		onStitchPaint
	}: {
		matrix: PatternMatrix;
		palette: ColourEntry[];
		positionRow: number;
		positionStitch: number;
		positionVersion?: number;
		zoom: ZoomLevel;
		fabricView: boolean;
		stitchesPerCm: number;
		rowsPerCm: number;
		cellVersion?: number;
		scrollToRowTrigger?: number;
		editing?: boolean;
		editorTool?: 'brush' | 'eraser' | 'fill' | 'line';
		lineStart?: GridPoint | null;
		onStitchTap?: (row: number, stitch: number) => void;
		onStitchPaint?: (row: number, stitch: number, opts: { strokeStart: boolean }) => void;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();
	let painting = $state(false);
	let lastPainted: { row: number; stitch: number } | null = $state(null);
	let pointerStart: { x: number; y: number } | null = $state(null);
	let pointerMoved = $state(false);

	const paintingEnabled = $derived(
		editing && (editorTool === 'brush' || editorTool === 'eraser')
	);
	/** Fire onStitchTap on pointer down (fill, line). */
	const instantTap = $derived(editing && (editorTool === 'fill' || editorTool === 'line'));

	const canvasTouchAction = $derived(paintingEnabled ? 'none' : 'pan-y');

	const cellDims = $derived.by(() => {
		const base = cellPixelSize(zoom);
		if (fabricView) {
			const aspect = fabricCellAspect(stitchesPerCm, rowsPerCm);
			const norm = Math.max(aspect.width, aspect.height);
			return {
				cellW: (base * aspect.width) / norm,
				cellH: (base * aspect.height) / norm
			};
		}
		return { cellW: base, cellH: base };
	});

	const canvasSize = $derived.by(() => ({
		width: matrix.width * cellDims.cellW,
		height: matrix.height * cellDims.cellH
	}));

	const paletteHex = $derived.by(() => {
		const map: string[] = [];
		for (const entry of palette) {
			map[entry.id] = entry.hex;
		}
		return map;
	});

	function visualY(row: number, rows: number, cellH: number): number {
		return (rows - 1 - row) * cellH;
	}

	$effect(() => {
		if (!canvasEl || !matrix || matrix.width === 0 || matrix.height === 0) return;
		void cellVersion;
		void positionVersion;
		const currentRow = positionRow;
		const currentStitch = positionStitch;
		const lineAnchor = lineStart;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const { cellW, cellH } = cellDims;
		const { width: cols, height: rows, cells } = matrix;
		const hex = paletteHex;
		const { width: canvasW, height: canvasH } = canvasSize;

		if (canvasEl.width !== canvasW) canvasEl.width = canvasW;
		if (canvasEl.height !== canvasH) canvasEl.height = canvasH;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvasW, canvasH);

		for (let r = 0; r < rows; r++) {
			const vy = visualY(r, rows, cellH);
			for (let s = 0; s < cols; s++) {
				const colourId = cells[r * cols + s];
				ctx.fillStyle = hex[colourId] ?? '#ffffff';
				ctx.fillRect(s * cellW, vy, cellW, cellH);
			}
		}

		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let s = 0; s <= cols; s++) {
			const x = s * cellW + 0.5;
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvasH);
		}
		for (let vr = 0; vr <= rows; vr++) {
			const y = vr * cellH + 0.5;
			ctx.moveTo(0, y);
			ctx.lineTo(canvasW, y);
		}
		ctx.stroke();

		ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
		for (let r = 0; r < rows; r++) {
			if (r === currentRow) continue;
			const vy = visualY(r, rows, cellH);
			ctx.fillRect(0, vy, canvasW, cellH);
		}

		if (lineAnchor) {
			const lx = lineAnchor.stitch * cellW;
			const ly = visualY(lineAnchor.row, rows, cellH);
			ctx.fillStyle = '#f59e0b';
			ctx.fillRect(lx + 2, ly + 2, cellW - 4, cellH - 4);
		}

		const currentVisualY = visualY(currentRow, rows, cellH);
		ctx.strokeStyle = '#3b82f6';
		ctx.lineWidth = 2;
		ctx.strokeRect(1, currentVisualY + 1, canvasW - 2, cellH - 2);

		if (currentStitch >= 0 && currentStitch < cols) {
			const sx = currentStitch * cellW;
			ctx.strokeStyle = '#ef4444';
			ctx.lineWidth = 2.5;
			ctx.strokeRect(sx + 1.5, currentVisualY + 1.5, cellW - 3, cellH - 3);
		}
	});

	$effect(() => {
		void scrollToRowTrigger;
		const r = positionRow;
		if (!containerEl || !canvasEl) return;

		const { cellH } = cellDims;
		const { height: rows } = matrix;

		const vy = visualY(r, rows, cellH);
		const rowCentreY = vy + cellH / 2;
		const scrollTarget = rowCentreY - containerEl.clientHeight / 2;
		containerEl.scrollTo({ top: scrollTarget, behavior: 'auto' });
	});

	function hitTest(event: PointerEvent): GridPoint | null {
		if (!canvasEl) return null;

		const rect = canvasEl.getBoundingClientRect();
		const scaleX = canvasEl.width / rect.width;
		const scaleY = canvasEl.height / rect.height;
		const px = (event.clientX - rect.left) * scaleX;
		const py = (event.clientY - rect.top) * scaleY;

		const { cellW, cellH } = cellDims;
		const { width: cols, height: rows } = matrix;

		const s = Math.floor(px / cellW);
		const r = rows - 1 - Math.floor(py / cellH);

		if (s >= 0 && s < cols && r >= 0 && r < rows) {
			return { row: r, stitch: s };
		}
		return null;
	}

	function paintCell(row: number, stitch: number, strokeStart: boolean) {
		onStitchPaint?.(row, stitch, { strokeStart });
	}

	function fireTap(cell: GridPoint) {
		onStitchTap?.(cell.row, cell.stitch);
	}

	function handlePointerDown(event: PointerEvent) {
		pointerStart = { x: event.clientX, y: event.clientY };
		pointerMoved = false;

		const cell = hitTest(event);
		if (!cell) return;

		if (instantTap && onStitchTap) {
			event.preventDefault();
			fireTap(cell);
			return;
		}

		if (paintingEnabled && onStitchPaint) {
			event.preventDefault();
			painting = true;
			lastPainted = cell;
			canvasEl?.setPointerCapture(event.pointerId);
			paintCell(cell.row, cell.stitch, true);
		}
	}

	function handlePointerMove(event: PointerEvent) {
		if (pointerStart) {
			const dx = event.clientX - pointerStart.x;
			const dy = event.clientY - pointerStart.y;
			if (dx * dx + dy * dy > TAP_THRESHOLD_PX * TAP_THRESHOLD_PX) {
				pointerMoved = true;
			}
		}

		if (!painting || !paintingEnabled || !onStitchPaint) return;

		const cell = hitTest(event);
		if (!cell) return;
		if (lastPainted?.row === cell.row && lastPainted?.stitch === cell.stitch) return;

		lastPainted = cell;
		paintCell(cell.row, cell.stitch, false);
	}

	function handlePointerUp(event: PointerEvent) {
		if (painting) {
			painting = false;
			lastPainted = null;
			if (canvasEl?.hasPointerCapture(event.pointerId)) {
				canvasEl.releasePointerCapture(event.pointerId);
			}
		} else if (pointerStart && !pointerMoved && onStitchTap && !instantTap) {
			const cell = hitTest(event);
			if (cell) fireTap(cell);
		}

		pointerStart = null;
		pointerMoved = false;
	}

	function handlePointerCancel(event: PointerEvent) {
		if (canvasEl?.hasPointerCapture(event.pointerId)) {
			canvasEl.releasePointerCapture(event.pointerId);
		}
		painting = false;
		lastPainted = null;
		pointerStart = null;
		pointerMoved = false;
	}
</script>

<div
	bind:this={containerEl}
	class="relative h-full w-full overflow-auto rounded-lg border border-border bg-white"
>
	<canvas
		bind:this={canvasEl}
		class="block"
		style="image-rendering: pixelated; touch-action: {canvasTouchAction};"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
		aria-label="Pattern grid"
	></canvas>
</div>
