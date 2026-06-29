<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { patternCellSize } from '$lib/jacquard/preview.js';
	import { flipBitmapVertical } from '$lib/data-pattern/bitmap-utils.js';
	import type { Bitmap, PreviewView } from '$lib/data-pattern/types.js';

	let {
		bitmap,
		stitches,
		rows,
		view = $bindable<PreviewView>('symbols'),
		fabricView = $bindable(false),
		stitchesPerCm,
		rowsPerCm,
		zoom = 100,
		onCellInteract
	}: {
		bitmap: Bitmap | null;
		stitches: number;
		rows: number;
		view: PreviewView;
		fabricView: boolean;
		stitchesPerCm: number;
		rowsPerCm: number;
		zoom: number;
		onCellInteract?: (col: number, row: number) => void;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let painting = $state(false);

	const baseCell = $derived(Math.round(12 * (zoom / 100)));
	const gauge = $derived({ stitchesPerCm, rowsPerCm });

	$effect(() => {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		if (!bitmap) {
			canvasEl.width = 200;
			canvasEl.height = 80;
			ctx.fillStyle = '#f4f4f5';
			ctx.fillRect(0, 0, 200, 80);
			ctx.fillStyle = '#a1a1aa';
			ctx.font = '13px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('—', 100, 40);
			return;
		}

		const { cellWidth, cellHeight } = patternCellSize(baseCell, fabricView, gauge);
		canvasEl.width = stitches * cellWidth;
		canvasEl.height = rows * cellHeight;

		// Display with row 1 at bottom: flip bitmap vertically for render
		const flipped = flipBitmapVertical(bitmap, stitches, rows);

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < stitches; col++) {
				const val = flipped[row * stitches + col];
				const x = col * cellWidth;
				const y = row * cellHeight;

				if (view === 'jacquard') {
					ctx.fillStyle = val === 1 ? '#1a1a1a' : '#f8f8f8';
					ctx.fillRect(x, y, cellWidth, cellHeight);
				} else {
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(x, y, cellWidth, cellHeight);
					ctx.strokeStyle = '#d4d4d8';
					ctx.lineWidth = 0.5;
					ctx.strokeRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
					ctx.fillStyle = '#18181b';
					ctx.font = `${Math.max(8, baseCell - 3)}px monospace`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(val === 1 ? '|' : '-', x + cellWidth / 2, y + cellHeight / 2);
				}
			}
		}

		// Row numbers
		if (baseCell >= 10 && rows <= 100) {
			ctx.fillStyle = '#71717a';
			ctx.font = `${Math.max(7, baseCell - 4)}px sans-serif`;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			for (let row = 0; row < rows; row++) {
				const displayRowNum = rows - row;
				if (displayRowNum % 5 === 0 || displayRowNum === 1) {
					ctx.fillText(String(displayRowNum), canvasEl.width - 2, row * cellHeight + cellHeight / 2);
				}
			}
		}
	});

	function hitCell(e: MouseEvent): { col: number; row: number } | null {
		if (!canvasEl || !bitmap) return null;
		const rect = canvasEl.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const { cellWidth, cellHeight } = patternCellSize(baseCell, fabricView, gauge);
		const col = Math.floor(x / cellWidth);
		const displayRow = Math.floor(y / cellHeight);
		// Undo the vertical flip to get memory row
		const memRow = rows - 1 - displayRow;
		if (col < 0 || col >= stitches || memRow < 0 || memRow >= rows) return null;
		return { col, row: memRow };
	}

	function onMouseDown(e: MouseEvent) {
		if (!onCellInteract) return;
		painting = true;
		const cell = hitCell(e);
		if (cell) onCellInteract(cell.col, cell.row);
	}

	function onMouseMove(e: MouseEvent) {
		if (!onCellInteract || !painting) return;
		const cell = hitCell(e);
		if (cell) onCellInteract(cell.col, cell.row);
	}

	function onMouseUp() {
		painting = false;
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex rounded-md border border-border">
			<button
				type="button"
				class="rounded-l-md px-3 py-1.5 text-xs font-medium transition-colors {view === 'symbols'
					? 'bg-brand text-brand-foreground'
					: 'text-foreground hover:bg-muted'}"
				onclick={() => (view = 'symbols')}
			>
				{dataPattern.viewSymbols}
			</button>
			<button
				type="button"
				class="rounded-r-md border-l border-border px-3 py-1.5 text-xs font-medium transition-colors {view ===
				'jacquard'
					? 'bg-brand text-brand-foreground'
					: 'text-foreground hover:bg-muted'}"
				onclick={() => (view = 'jacquard')}
			>
				{dataPattern.viewJacquard}
			</button>
		</div>

		<label class="flex items-center gap-2 text-xs">
			<input type="checkbox" bind:checked={fabricView} class="rounded border-input" />
			{dataPattern.fabricView}
		</label>
	</div>

	<div class="overflow-auto rounded-lg border border-border bg-muted/20 p-2">
		<canvas
			bind:this={canvasEl}
			class="mx-auto block max-w-none {onCellInteract ? 'cursor-crosshair' : ''}"
			onmousedown={onMouseDown}
			onmousemove={onMouseMove}
			onmouseup={onMouseUp}
			onmouseleave={onMouseUp}
		></canvas>
	</div>

	{#if view === 'symbols' && bitmap}
		<div class="flex gap-4 text-xs text-muted-foreground">
			<span><strong>|</strong> {dataPattern.legendKnit}</span>
			<span><strong>-</strong> {dataPattern.legendPurl}</span>
		</div>
	{/if}
</div>
