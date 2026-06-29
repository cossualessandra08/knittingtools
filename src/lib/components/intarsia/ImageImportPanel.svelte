<script lang="ts">
	import { intarsia } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		ACCEPTED_IMAGE_TYPES,
		MAX_COLOURS,
		MAX_FILE_BYTES,
		MAX_STITCHES,
		MAX_ROWS
	} from '$lib/intarsia/constants.js';

	let {
		onConfirm
	}: {
		onConfirm?: (opts: { file: File; width: number; height: number; colourCount: number }) => void;
	} = $props();

	let file = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let width = $state(40);
	let height = $state(50);
	let colourCount = $state(8);
	let error = $state<string | null>(null);
	let dragging = $state(false);

	let fileInputEl: HTMLInputElement | undefined = $state();

	function handleFile(f: File) {
		if (!ACCEPTED_IMAGE_TYPES.includes(f.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
			error = intarsia.errorUnsupportedType;
			return;
		}
		if (f.size > MAX_FILE_BYTES) {
			error = intarsia.errorFileTooLarge;
			return;
		}
		error = null;
		file = f;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = URL.createObjectURL(f);
	}

	function handleInputChange(e: Event) {
		const files = (e.currentTarget as HTMLInputElement).files;
		if (files?.[0]) handleFile(files[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) handleFile(f);
	}

	function handleConfirm() {
		if (!file) return;
		const w = Math.round(Number(width));
		const h = Math.round(Number(height));
		const colours = Array.isArray(colourCount) ? colourCount[0]! : Math.round(Number(colourCount));
		onConfirm?.({ file, width: w, height: h, colourCount: colours });
	}

	const canConfirm = $derived(
		file !== null &&
			Number.isFinite(Number(width)) &&
			Math.round(Number(width)) >= 1 &&
			Math.round(Number(width)) <= MAX_STITCHES &&
			Number.isFinite(Number(height)) &&
			Math.round(Number(height)) >= 1 &&
			Math.round(Number(height)) <= MAX_ROWS &&
			error === null
	);
</script>

<div class="flex flex-col gap-4">
	<!-- Drop zone -->
	<div
		role="button"
		tabindex="0"
		class="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors
		{dragging ? 'border-primary bg-primary/5' : 'hover:border-primary/60'}"
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={handleDrop}
		onclick={() => fileInputEl?.click()}
		onkeydown={(e) => e.key === 'Enter' && fileInputEl?.click()}
		aria-label={intarsia.uploadImage}
	>
		{#if previewUrl}
			<img src={previewUrl} alt="Preview" class="mb-2 max-h-28 max-w-full rounded object-contain" />
			<span class="text-xs">{file?.name}</span>
		{:else}
			<p>{intarsia.uploadImage}</p>
		{/if}
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInputEl}
		type="file"
		accept={ACCEPTED_IMAGE_TYPES.join(',')}
		class="sr-only"
		onchange={handleInputChange}
	/>

	{#if error}
		<p class="text-xs text-destructive" role="alert">{error}</p>
	{/if}

	<!-- Width / height inputs -->
	<div class="grid grid-cols-2 gap-3">
		<div class="flex flex-col gap-1.5">
			<Label for="import-width" class="text-xs">{intarsia.widthStitches}</Label>
			<Input
				id="import-width"
				type="number"
				bind:value={width}
				min={1}
				max={MAX_STITCHES}
				class="h-8 text-sm"
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="import-height" class="text-xs">{intarsia.heightRows}</Label>
			<Input
				id="import-height"
				type="number"
				bind:value={height}
				min={1}
				max={MAX_ROWS}
				class="h-8 text-sm"
			/>
		</div>
	</div>

	<!-- Colour count slider -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<Label class="text-xs">{intarsia.colourCount}</Label>
			<span class="text-xs font-medium tabular-nums">{colourCount}</span>
		</div>
		<Slider type="single" bind:value={colourCount} min={2} max={MAX_COLOURS} step={1} />
	</div>

	<!-- Confirm button -->
	<Button disabled={!canConfirm} onclick={handleConfirm} class="w-full">
		{intarsia.confirmColours}
	</Button>
</div>
