<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { MAX_STITCHES_WARN } from '$lib/data-pattern/constants.js';
	import { patternDimensions } from '$lib/data-pattern/dimensions.js';

	let {
		stitches = $bindable(120),
		stitchesPerCm = $bindable(4.5),
		rowsPerCm = $bindable(6.4),
		estimatedRows
	}: {
		stitches: number;
		stitchesPerCm: number;
		rowsPerCm: number;
		estimatedRows: number;
	} = $props();

	const dims = $derived(
		patternDimensions(stitches, estimatedRows, { stitches, stitchesPerCm, rowsPerCm })
	);

	const summary = $derived(
		dataPattern.dimensionsSummary({
			stitches: String(stitches),
			rows: String(estimatedRows),
			widthCm: dims.widthCm.toFixed(1),
			heightCm: dims.heightCm.toFixed(1)
		})
	);
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<Label for="dp-stitches">{dataPattern.stitches}</Label>
		<Input id="dp-stitches" type="number" min="10" step="1" bind:value={stitches} />
		{#if stitches > MAX_STITCHES_WARN}
			<p class="text-sm text-amber-700">{dataPattern.warnOverStitches}</p>
		{/if}
	</div>
	<div class="grid gap-3 sm:grid-cols-2">
		<div class="space-y-2">
			<Label for="dp-st-per-cm">{dataPattern.stitchesPerCm}</Label>
			<Input id="dp-st-per-cm" type="number" min="0.1" step="0.1" bind:value={stitchesPerCm} />
		</div>
		<div class="space-y-2">
			<Label for="dp-rows-per-cm">{dataPattern.rowsPerCm}</Label>
			<Input id="dp-rows-per-cm" type="number" min="0.1" step="0.1" bind:value={rowsPerCm} />
		</div>
	</div>
	<p class="text-sm text-muted-foreground">{summary}</p>
</div>
