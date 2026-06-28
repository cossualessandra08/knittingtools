<script lang="ts">
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

	let image = $state<HTMLImageElement | null>(null);
	let crop = $state<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
	let stitches = $state(120);
	let stitchesPerCm = $state(4.5);
	let rowsPerCm = $state(6.4);
	let contrast = $state(0);
	let threshold = $state(128);
	let invert = $state(false);
	let fabricView = $state(false);
	let errorMessage = $state<string | null>(null);

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
		return imageDataToBitmap(resized, {
			contrast,
			threshold,
			invert
		});
	});

	const dimensionsSummary = $derived(
		m.tool_jacquard_dimensions_summary({
			stitches: String(dimensions.stitches),
			rows: String(dimensions.rows),
			widthCm: dimensions.widthCm.toFixed(1),
			heightCm: dimensions.heightCm.toFixed(1)
		})
	);

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
		const loaded = await loadImageFromFile(file);
		image = loaded;
		crop = defaultCrop(loaded.naturalWidth, loaded.naturalHeight);
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
</script>

<div class="grid gap-8 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
	<div class="space-y-8">
		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{m.tool_jacquard_section_image()}
			</h2>
			{#if !image}
				<ImageUploadZone onFile={handleFile} />
			{:else}
				<Button type="button" variant="outline" onclick={() => (image = null)}>
					{m.tool_jacquard_replace_image()}
				</Button>
			{/if}
			{#if errorMessage}
				<p class="text-sm text-destructive">{errorMessage}</p>
			{/if}
		</section>

		{#if image}
			<section class="space-y-3">
				<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
					{m.tool_jacquard_section_crop()}
				</h2>
				<CropCanvas {image} bind:crop onFitProportions={fitProportions} />
			</section>
		{/if}

		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{m.tool_jacquard_section_dimensions()}
			</h2>
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
		</section>

		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{m.tool_jacquard_section_gauge()}
			</h2>
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
		</section>

		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{m.tool_jacquard_section_convert()}
			</h2>
			<div class="space-y-2">
				<Label>{m.tool_jacquard_contrast()}</Label>
				<Slider type="single" min={-100} max={100} step={1} bind:value={contrast} />
			</div>
			<div class="space-y-2">
				<Label>{m.tool_jacquard_threshold()}</Label>
				<Slider type="single" min={0} max={255} step={1} bind:value={threshold} />
			</div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={invert} class="rounded border-input" />
				{m.tool_jacquard_invert()}
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={fabricView} class="rounded border-input" />
				{m.tool_jacquard_fabric_view()}
			</label>
		</section>

		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{m.tool_jacquard_section_export()}
			</h2>
			<div class="flex flex-wrap gap-2">
				<Button type="button" disabled={!bitmap} onclick={handleAyabExport}>
					{m.tool_jacquard_export_ayab()}
				</Button>
				<Button type="button" variant="outline" disabled={!bitmap} onclick={handleDocsExport}>
					{m.tool_jacquard_export_docs()}
				</Button>
			</div>
			{#if !image}
				<p class="text-sm text-muted-foreground">{m.tool_jacquard_hint_upload()}</p>
			{/if}
		</section>
	</div>

	<div class="space-y-3">
		<h2 class="text-sm font-semibold tracking-wide text-foreground uppercase">Preview</h2>
		<PatternPreview
			{bitmap}
			stitches={dimensions.stitches}
			rows={dimensions.rows}
			{fabricView}
			{stitchesPerCm}
			{rowsPerCm}
		/>
	</div>
</div>
