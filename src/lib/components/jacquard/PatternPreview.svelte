<script lang="ts">
	import { patternCellSize } from '$lib/jacquard/preview.js';

	let {
		bitmap,
		stitches,
		rows,
		fabricView,
		stitchesPerCm,
		rowsPerCm
	}: {
		bitmap: Uint8Array | null;
		stitches: number;
		rows: number;
		fabricView: boolean;
		stitchesPerCm: number;
		rowsPerCm: number;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();
	const cellSize = 4;
	const gauge = $derived({ stitchesPerCm, rowsPerCm });

	$effect(() => {
		if (!canvasEl || !bitmap) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const { cellWidth, cellHeight } = patternCellSize(cellSize, fabricView, gauge);
		canvasEl.width = stitches * cellWidth;
		canvasEl.height = rows * cellHeight;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < stitches; col++) {
				ctx.fillStyle = bitmap[row * stitches + col] === 1 ? '#000000' : '#ffffff';
				ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
			}
		}
	});
</script>

<div class="overflow-auto rounded-lg border border-border bg-muted/20 p-2">
	{#if bitmap}
		<canvas bind:this={canvasEl} class="mx-auto block max-w-full"></canvas>
	{:else}
		<div class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">—</div>
	{/if}
</div>
