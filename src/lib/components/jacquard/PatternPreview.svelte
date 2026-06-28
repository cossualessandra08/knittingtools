<script lang="ts">
	import type { CropRect } from '$lib/jacquard/types.js';

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
	const fabricScale = $derived(rowsPerCm / stitchesPerCm);

	$effect(() => {
		if (!canvasEl || !bitmap) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const cellW = cellSize;
		const cellH = fabricView ? cellSize * fabricScale : cellSize;
		canvasEl.width = stitches * cellW;
		canvasEl.height = rows * cellH;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < stitches; col++) {
				ctx.fillStyle = bitmap[row * stitches + col] === 1 ? '#000000' : '#ffffff';
				ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
			}
		}
	});
</script>

<div class="overflow-auto rounded-lg border border-border bg-muted/20 p-2">
	{#if bitmap}
		<canvas bind:this={canvasEl} class="mx-auto block max-w-full"></canvas>
	{:else}
		<div class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
			—
		</div>
	{/if}
</div>
