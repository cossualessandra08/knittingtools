<script lang="ts">
	import PatternPreview from './PatternPreview.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import RefinePanel from './RefinePanel.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import type { BitmapEditor } from '$lib/data-pattern/bitmap-editor.js';
	import type { ExportMode, PreviewView, Bitmap } from '$lib/data-pattern/types.js';

	type ActiveTool = 'toggle' | 'brush' | 'eraser';

	let {
		editor,
		bitmap,
		stitches,
		rows,
		stitchesPerCm,
		rowsPerCm,
		contrast,
		threshold,
		invert,
		activeTool = $bindable<ActiveTool>('toggle'),
		hasEdits,
		onReset,
		onRefineApply,
		onChangeSource,
		onCellInteract,
		onDownloadPdfChart,
		onDownloadSymbolicPng,
		onDownloadAyabPng,
		onDownloadAnnotatedPdf
	}: {
		editor: BitmapEditor | null;
		bitmap: Bitmap | null;
		stitches: number;
		rows: number;
		stitchesPerCm: number;
		rowsPerCm: number;
		contrast: number;
		threshold: number;
		invert: boolean;
		activeTool: ActiveTool;
		hasEdits: boolean;
		onReset: () => void;
		onRefineApply: (contrast: number, threshold: number, invert: boolean) => void;
		onChangeSource: () => void;
		onCellInteract: (col: number, row: number) => void;
		onDownloadPdfChart: () => Promise<void>;
		onDownloadSymbolicPng: () => Promise<void>;
		onDownloadAyabPng: () => Promise<void>;
		onDownloadAnnotatedPdf: () => Promise<void>;
	} = $props();
	let zoom = $state(100);
	let view = $state<PreviewView>('symbols');
	let fabricView = $state(false);
	let exportMode = $state<ExportMode>('knit-purl');

	function handleCellInteract(col: number, row: number) {
		onCellInteract(col, row);
	}
</script>

<div class="data-pattern-workspace">
	<div class="workspace-controls min-w-0 space-y-6">
		<EditorToolbar {editor} bind:activeTool bind:zoom {onChangeSource} />

		<div class="border-t border-border pt-4">
			<RefinePanel
				{contrast}
				{threshold}
				{invert}
				{hasEdits}
				{onReset}
				onApply={onRefineApply}
			/>
		</div>

		<div class="border-t border-border pt-4">
			<ExportPanel
				bind:exportMode
				{stitches}
				hasBitmap={bitmap !== null}
				{onDownloadPdfChart}
				{onDownloadSymbolicPng}
				{onDownloadAyabPng}
				{onDownloadAnnotatedPdf}
			/>
		</div>
	</div>

	<div class="workspace-preview min-w-0">
		<PatternPreview
			{bitmap}
			{stitches}
			{rows}
			bind:view
			bind:fabricView
			{stitchesPerCm}
			{rowsPerCm}
			{zoom}
			onCellInteract={handleCellInteract}
		/>
	</div>
</div>

<style>
	.data-pattern-workspace {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.data-pattern-workspace {
			grid-template-columns: 38% 1fr;
			align-items: start;
		}
	}
</style>
