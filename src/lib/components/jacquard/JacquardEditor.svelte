<script lang="ts">
	import { onDestroy } from 'svelte';
	import ImageUploadZone from '$lib/components/jacquard/ImageUploadZone.svelte';
	import CropCanvas from '$lib/components/jacquard/CropCanvas.svelte';
	import PatternPreview from '$lib/components/jacquard/PatternPreview.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import { validateImageFile, loadImageFromFile, cropAndResize } from '$lib/jacquard/canvas.js';
	import {
		MAX_NEEDLES,
		LONG_PATTERN_ROW_WARNING
	} from '$lib/jacquard/constants.js';
	import { imageDataToBitmap } from '$lib/jacquard/convert.js';
	import {
		calculatePatternDimensions,
		defaultCrop,
		fitCropToPatternAspect
	} from '$lib/jacquard/dimensions.js';
	import { exportAyabPng } from '$lib/jacquard/export-ayab.js';
	import { exportDocumentation } from '$lib/jacquard/export-docs.js';
	import type { CropRect } from '$lib/jacquard/types.js';

	type Step = 'image' | 'crop' | 'dimensions' | 'convert' | 'export';

	const STEPS: Step[] = ['image', 'crop', 'dimensions', 'convert', 'export'];

	let image = $state<HTMLImageElement | null>(null);
	let imageObjectUrl = $state<string | null>(null);
	let crop = $state<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
	let stitches = $state(120);
	let stitchesPerCm = $state(4.5);
	let rowsPerCm = $state(6.4);
	let threshold = $state(128);
	let invert = $state(false);
	let fabricView = $state(false);
	let errorMessage = $state<string | null>(null);
	let activeStep = $state<Step>('image');
	let fileInputEl: HTMLInputElement | undefined = $state();

	const gauge = $derived({ stitchesPerCm, rowsPerCm });

	const dimensions = $derived(
		calculatePatternDimensions({
			stitches,
			stitchesPerCm,
			rowsPerCm,
			cropWidthPx: crop.width,
			cropHeightPx: crop.height
		})
	);

	const bitmap = $derived.by(() => {
		if (!image) return null;
		const resized = cropAndResize(image, crop, dimensions.stitches, dimensions.rows);
		return imageDataToBitmap(resized, { threshold, invert });
	});

	const dimensionsSummary = $derived(
		m.tool_jacquard_dimensions_summary({
			stitches: String(dimensions.stitches),
			rows: String(dimensions.rows),
			widthCm: dimensions.widthCm.toFixed(1),
			heightCm: dimensions.heightCm.toFixed(1)
		})
	);

	const stepIndex = $derived(STEPS.indexOf(activeStep));
	const canGoBack = $derived(stepIndex > 0);
	const canGoNext = $derived(stepIndex < STEPS.length - 1);

	function stepLabel(step: Step): string {
		switch (step) {
			case 'image':
				return m.tool_jacquard_section_image();
			case 'crop':
				return m.tool_jacquard_section_crop();
			case 'dimensions':
				return m.tool_jacquard_section_dimensions();
			case 'convert':
				return m.tool_jacquard_section_convert();
			case 'export':
				return m.tool_jacquard_section_export();
		}
	}

	function canAccessStep(step: Step): boolean {
		if (step === 'image') return true;
		return image !== null;
	}

	function goToStep(step: Step) {
		if (canAccessStep(step)) activeStep = step;
	}

	function goBack() {
		if (canGoBack) activeStep = STEPS[stepIndex - 1];
	}

	function goNext() {
		if (!canGoNext) return;
		const next = STEPS[stepIndex + 1];
		if (canAccessStep(next)) activeStep = next;
	}

	function revokeImageUrl() {
		if (imageObjectUrl) {
			URL.revokeObjectURL(imageObjectUrl);
			imageObjectUrl = null;
		}
	}

	function openFilePicker() {
		fileInputEl?.click();
	}

	function onFileInputChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void handleFile(file);
		input.value = '';
	}

	async function handleFile(file: File) {
		errorMessage = null;
		const validation = validateImageFile(file);
		if (!validation.ok) {
			errorMessage =
				validation.code === 'unsupported_type'
					? m.tool_jacquard_error_unsupported_type()
					: m.tool_jacquard_error_file_too_large();
			return;
		}
		revokeImageUrl();
		const { image: loaded, objectUrl } = await loadImageFromFile(file);
		image = loaded;
		imageObjectUrl = objectUrl;
		crop = defaultCrop(loaded.naturalWidth, loaded.naturalHeight);
		activeStep = 'crop';
	}

	function fitProportions() {
		if (!image) return;
		crop = fitCropToPatternAspect(
			crop,
			{ ...dimensions, ...gauge },
			{ imageWidth: image.naturalWidth, imageHeight: image.naturalHeight }
		);
	}

	async function handleAyabExport() {
		if (!bitmap) return;
		if (stitches > MAX_NEEDLES) {
			const ok = confirm(m.tool_jacquard_confirm_over_needles());
			if (!ok) return;
		}
		await exportAyabPng(bitmap, dimensions.stitches, dimensions.rows);
	}

	async function handleDocsExport() {
		if (!bitmap) return;
		if (stitches > MAX_NEEDLES) {
			const ok = confirm(m.tool_jacquard_confirm_over_needles());
			if (!ok) return;
		}
		await exportDocumentation(bitmap, dimensions, gauge, fabricView, {
			background: m.tool_jacquard_legend_background(),
			foreground: m.tool_jacquard_legend_foreground()
		});
	}

	onDestroy(revokeImageUrl);
</script>

<input
	bind:this={fileInputEl}
	type="file"
	accept="image/jpeg,image/png,image/webp"
	class="sr-only"
	aria-hidden="true"
	tabindex="-1"
	onchange={onFileInputChange}
/>

<div class="space-y-6">
	<nav aria-label="Jacquard editor steps" class="flex flex-wrap gap-2 border-b border-border pb-4">
		{#each STEPS as step (step)}
			<button
				type="button"
				disabled={!canAccessStep(step)}
				class="rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 {activeStep ===
				step
					? 'border-brand bg-brand text-brand-foreground'
					: 'border-border bg-muted/50 text-foreground hover:bg-muted'}"
				aria-current={activeStep === step ? 'step' : undefined}
				onclick={() => goToStep(step)}
			>
				{stepLabel(step)}
			</button>
		{/each}
	</nav>

	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)]">
		<div class="min-w-0 space-y-6">
			{#if activeStep === 'image'}
				<div class="space-y-4">
					<ImageUploadZone onFile={handleFile} onBrowse={openFilePicker} />
					{#if image}
						<Button type="button" onclick={() => goToStep('crop')}>
							{m.tool_jacquard_step_next()}
						</Button>
					{/if}
					{#if errorMessage}
						<p class="text-sm text-destructive">{errorMessage}</p>
					{/if}
					{#if !image}
						<p class="text-sm text-muted-foreground">{m.tool_jacquard_hint_upload()}</p>
					{/if}
				</div>
			{:else if activeStep === 'crop'}
				<div class="space-y-4">
					{#if image && imageObjectUrl}
						<CropCanvas
							imageUrl={imageObjectUrl}
							imageWidth={image.naturalWidth}
							imageHeight={image.naturalHeight}
							bind:crop
							onFitProportions={fitProportions}
						/>
					{/if}
				</div>
			{:else if activeStep === 'dimensions'}
				<div class="space-y-6">
					<div class="space-y-3">
						<h3 class="text-sm font-medium">{m.tool_jacquard_section_dimensions()}</h3>
						<div class="space-y-2">
							<Label for="jacquard-stitches">{m.tool_jacquard_stitches()}</Label>
							<Input id="jacquard-stitches" type="number" min="1" bind:value={stitches} />
						</div>
						{#if stitches > MAX_NEEDLES}
							<p class="text-sm text-amber-700">{m.tool_jacquard_warn_over_needles()}</p>
						{/if}
						<p class="text-sm text-muted-foreground">
							{m.tool_jacquard_rows_computed()}: <strong>{dimensions.rows}</strong>
						</p>
						{#if dimensions.rows > LONG_PATTERN_ROW_WARNING}
							<p class="text-sm text-amber-700">{m.tool_jacquard_warn_long_pattern()}</p>
						{/if}
						<p class="text-sm text-muted-foreground">{dimensionsSummary}</p>
					</div>

					<div class="space-y-3">
						<h3 class="text-sm font-medium">{m.tool_jacquard_section_gauge()}</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="jacquard-st-per-cm">{m.tool_jacquard_stitches_per_cm()}</Label>
								<Input
									id="jacquard-st-per-cm"
									type="number"
									min="0.1"
									step="0.1"
									bind:value={stitchesPerCm}
								/>
							</div>
							<div class="space-y-2">
								<Label for="jacquard-rows-per-cm">{m.tool_jacquard_rows_per_cm()}</Label>
								<Input
									id="jacquard-rows-per-cm"
									type="number"
									min="0.1"
									step="0.1"
									bind:value={rowsPerCm}
								/>
							</div>
						</div>
					</div>
				</div>
			{:else if activeStep === 'convert'}
				<div class="space-y-4">
					<div class="space-y-2">
						<Label>{m.tool_jacquard_threshold()}</Label>
						<Slider type="single" min={0} max={255} step={1} bind:value={threshold} />
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={invert} class="rounded border-input" />
						{m.tool_jacquard_invert()}
					</label>
				</div>
			{:else if activeStep === 'export'}
				<div class="space-y-4">
					<div class="flex flex-wrap gap-2">
						<Button type="button" disabled={!bitmap} onclick={handleAyabExport}>
							{m.tool_jacquard_export_ayab()}
						</Button>
						<Button type="button" variant="outline" disabled={!bitmap} onclick={handleDocsExport}>
							{m.tool_jacquard_export_docs()}
						</Button>
					</div>
					{#if !bitmap}
						<p class="text-sm text-muted-foreground">{m.tool_jacquard_hint_upload()}</p>
					{/if}
				</div>
			{/if}

			<div class="flex justify-between border-t border-border pt-4">
				<Button type="button" variant="outline" disabled={!canGoBack} onclick={goBack}>
					{m.tool_jacquard_step_back()}
				</Button>
				<Button
					type="button"
					disabled={!canGoNext || !canAccessStep(STEPS[stepIndex + 1])}
					onclick={goNext}
				>
					{m.tool_jacquard_step_next()}
				</Button>
			</div>
		</div>

		<aside class="min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
					{m.tool_jacquard_preview()}
				</h2>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={fabricView} class="rounded border-input" />
					{m.tool_jacquard_fabric_view()}
				</label>
			</div>
			{#if fabricView}
				<p class="text-xs text-muted-foreground">{m.tool_jacquard_fabric_view_hint()}</p>
			{/if}
			<PatternPreview
				{bitmap}
				stitches={dimensions.stitches}
				rows={dimensions.rows}
				{fabricView}
				{stitchesPerCm}
				{rowsPerCm}
			/>
			{#if bitmap}
				<p class="text-xs text-muted-foreground">{dimensionsSummary}</p>
			{/if}
		</aside>
	</div>
</div>
