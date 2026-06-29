<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';

	let {
		contrast,
		threshold,
		invert,
		hasEdits,
		onReset,
		onApply
	}: {
		contrast: number;
		threshold: number;
		invert: boolean;
		hasEdits: boolean;
		onReset: () => void;
		onApply: (contrast: number, threshold: number, invert: boolean) => void;
	} = $props();

	// Local slider state — default values match DataPatternEditor initial state
	// (synced from props via $effect below whenever the parent reverts)
	let localContrast = $state(1);
	let localThreshold = $state(0.5);
	let localInvert = $state(false);

	$effect(() => {
		localContrast = contrast;
	});
	$effect(() => {
		localThreshold = threshold;
	});
	$effect(() => {
		localInvert = invert;
	});

	function tryApply() {
		if (hasEdits) {
			if (!confirm(dataPattern.confirmRefineDiscard)) {
				// revert local state
				localContrast = contrast;
				localThreshold = threshold;
				localInvert = invert;
				return;
			}
		}
		onApply(localContrast, localThreshold, localInvert);
	}

	function handleInvertChange(checked: boolean) {
		localInvert = checked;
		tryApply();
	}
</script>

<div class="space-y-4">
	<h3 class="text-sm font-medium">Refine</h3>

	<div class="space-y-2">
		<Label>{dataPattern.contrast} ({localContrast.toFixed(1)})</Label>
		<Slider
			type="single"
			min={0}
			max={2}
			step={0.05}
			bind:value={localContrast}
			onValueCommit={() => tryApply()}
		/>
	</div>

	<div class="space-y-2">
		<Label>{dataPattern.threshold} ({localThreshold.toFixed(2)})</Label>
		<Slider
			type="single"
			min={0}
			max={1}
			step={0.01}
			bind:value={localThreshold}
			onValueCommit={() => tryApply()}
		/>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<input
			type="checkbox"
			checked={localInvert}
			class="rounded border-input"
			onchange={(e) => handleInvertChange((e.currentTarget as HTMLInputElement).checked)}
		/>
		{dataPattern.invert}
	</label>

	<Button type="button" variant="outline" size="sm" onclick={onReset}>
		{dataPattern.resetToGenerated}
	</Button>
</div>
