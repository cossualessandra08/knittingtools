<script lang="ts">
	import { cellPixelSize, fabricCellAspect } from '$lib/intarsia/grid-layout.js';
	import type { ColourEntry, PatternMatrix, WorkPosition, ZoomLevel } from '$lib/intarsia/types.js';

	let {
		matrix,
		palette,
		position,
		zoom,
		fabricView,
		stitchesPerCm,
		rowsPerCm,
		cellVersion = 0,
		onStitchTap
	}: {
		matrix: PatternMatrix;
		palette: ColourEntry[];
		position: WorkPosition;
		zoom: ZoomLevel;
		fabricView: boolean;
		stitchesPerCm: number;
		rowsPerCm: number;
		cellVersion?: number;
		onStitchTap?: (row: number, stitch: number) => void;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();

	/** Pixel dimensions of one cell, accounting for zoom and fabric aspect. */
	const cellDims = $derived.by(() => {
		const base = cellPixelSize(zoom);
		if (fabricView) {
			const aspect = fabricCellAspect(stitchesPerCm, rowsPerCm);
			// aspect.width / aspect.height is the stitch-width : row-height ratio
			const norm = Math.max(aspect.width, aspect.height);
			return {
				cellW: (base * aspect.width) / norm,
				cellH: (base * aspect.height) / norm
			};
		}
		return { cellW: base, cellH: base };
	});

	/** Build a hex lookup array indexed by colour id for fast canvas drawing. */
	const paletteHex = $derived.by(() => {
		const map: string[] = [];
		for (const entry of palette) {
			map[entry.id] = entry.hex;
		}
		return map;
	});

	// ── Main draw effect ────────────────────────────────────────────────────────
	$effect(() => {
		if (!canvasEl || !matrix || matrix.width === 0 || matrix.height === 0) return;
		// cellVersion bumps when matrix cells are mutated in place (brush, fill, undo).
		void cellVersion;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const { cellW, cellH } = cellDims;
		const { width: cols, height: rows, cells } = matrix;
		const { row: currentRow, stitch: currentStitch } = position;
		const hex = paletteHex;

		// Size canvas to fit the full pattern
		canvasEl.width = cols * cellW;
		canvasEl.height = rows * cellH;

		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		// ── Draw all cells ──────────────────────────────────────────────────────
		// Internal row 0 maps to the bottom of the canvas (knitting convention).
		// Visual Y for internal row r: visualY = (rows - 1 - r) * cellH
		for (let r = 0; r < rows; r++) {
			const visualY = (rows - 1 - r) * cellH;
			for (let s = 0; s < cols; s++) {
				const colourId = cells[r * cols + s];
				const colour = hex[colourId] ?? '#cccccc';
				const x = s * cellW;

				ctx.fillStyle = colour;
				// Inset by 0.5px each side so the 1px gap between cells is always
				// visible — this prevents adjacent same-colour cells from merging.
				ctx.fillRect(x + 0.5, visualY + 0.5, cellW - 1, cellH - 1);
			}
		}

		// ── Dim overlay for non-current rows ────────────────────────────────────
		// Draw a semi-transparent overlay over every row except the current one.
		ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
		for (let r = 0; r < rows; r++) {
			if (r === currentRow) continue;
			const visualY = (rows - 1 - r) * cellH;
			ctx.fillRect(0, visualY, cols * cellW, cellH);
		}

		// ── Current-row highlight band ───────────────────────────────────────────
		const currentVisualY = (rows - 1 - currentRow) * cellH;
		ctx.strokeStyle = '#3b82f6'; // blue-500
		ctx.lineWidth = 2;
		ctx.strokeRect(1, currentVisualY + 1, cols * cellW - 2, cellH - 2);

		// ── Current-stitch ring ──────────────────────────────────────────────────
		if (currentStitch >= 0 && currentStitch < cols) {
			const sx = currentStitch * cellW;
			ctx.strokeStyle = '#ef4444'; // red-500
			ctx.lineWidth = 2.5;
			ctx.strokeRect(sx + 1.5, currentVisualY + 1.5, cellW - 3, cellH - 3);
		}
	});

	// ── Auto-scroll to keep current row centred ──────────────────────────────
	$effect(() => {
		// Track position.row so this runs whenever the row changes.
		const r = position.row;
		if (!containerEl || !canvasEl) return;

		const { cellH } = cellDims;
		const { height: rows } = matrix;

		// Visual centre Y of the current row on the canvas
		const visualY = (rows - 1 - r) * cellH;
		const rowCentreY = visualY + cellH / 2;

		// Scroll so that rowCentreY is centred in the container
		const scrollTarget = rowCentreY - containerEl.clientHeight / 2;
		containerEl.scrollTo({ top: scrollTarget, behavior: 'smooth' });
	});

	// ── Hit-test click/tap → onStitchTap ────────────────────────────────────
	function handleClick(event: MouseEvent) {
		if (!onStitchTap || !canvasEl) return;

		const rect = canvasEl.getBoundingClientRect();
		const px = event.clientX - rect.left;
		const py = event.clientY - rect.top;

		const { cellW, cellH } = cellDims;
		const { width: cols, height: rows } = matrix;

		const s = Math.floor(px / cellW);
		// Invert Y: visual top = internal bottom
		const r = rows - 1 - Math.floor(py / cellH);

		if (s >= 0 && s < cols && r >= 0 && r < rows) {
			onStitchTap(r, s);
		}
	}
</script>

<!--
  Scrollable wrapper — canvas is placed inside so the grid can be larger than the
  viewport and the auto-scroll $effect can centre the current row.
-->
<div
	bind:this={containerEl}
	class="relative h-full w-full overflow-auto rounded-lg border border-border bg-muted/20"
>
	<canvas
		bind:this={canvasEl}
		class="block"
		style="image-rendering: pixelated;"
		onclick={handleClick}
		aria-label="Pattern grid"
	></canvas>
</div>
