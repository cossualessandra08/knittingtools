<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import SourcePicker from './SourcePicker.svelte';
	import DimensionsGauge from './DimensionsGauge.svelte';
	import VoiceConfig from './VoiceConfig.svelte';
	import AudioConfig from './AudioConfig.svelte';
	import TerrainConfig from './TerrainConfig.svelte';
	import PatternWorkspace from './PatternWorkspace.svelte';

	import { voiceAdapter } from '$lib/data-pattern/adapters/voice.js';
	import { audioFileAdapter } from '$lib/data-pattern/adapters/audio-file.js';
	import { terrainAdapter } from '$lib/data-pattern/adapters/terrain.js';
	import { matrixToBitmap } from '$lib/data-pattern/matrix-to-bitmap.js';
	import { BitmapEditor } from '$lib/data-pattern/bitmap-editor.js';
	import { flipBitmapVertical, hasManualEdits } from '$lib/data-pattern/bitmap-utils.js';
	import { audioRowsFromDuration, terrainRowsFromBbox } from '$lib/data-pattern/dimensions.js';
	import { effectiveSegment } from '$lib/data-pattern/adapters/audio-file.js';
	import { bboxWithinLimit } from '$lib/data-pattern/dimensions.js';
	import { exportKnitPurlPdf, exportSymbolicPng } from '$lib/data-pattern/export-knit-purl.js';
	import { exportAyabPng } from '$lib/jacquard/export-ayab.js';
	import { exportDocumentation } from '$lib/jacquard/export-docs.js';
	import {
		DEFAULT_STITCHES,
		DEFAULT_STITCHES_PER_CM,
		DEFAULT_ROWS_PER_CM,
		DEFAULT_VOICE_DURATION_SEC,
		MIN_ROWS,
		MAX_ROWS
	} from '$lib/data-pattern/constants.js';
	import type {
		SourceId,
		SourceMatrix,
		Bitmap,
		VoiceConfig as VoiceConfigType,
		AudioFileConfig,
		TerrainConfig as TerrainConfigType,
		TerrainBbox,
		TerrainMode,
		AudioAnalysisMode,
		SharedConfig
	} from '$lib/data-pattern/types.js';

	type Phase = 'wizard' | 'workspace';
	type WizardStep = 'source' | 'configure' | 'generate';
	type ActiveTool = 'toggle' | 'brush' | 'eraser';

	// ── Phase & wizard ─────────────────────────────────────────────
	let phase = $state<Phase>('wizard');
	let wizardStep = $state<WizardStep>('source');

	// ── Source ──────────────────────────────────────────────────────
	let selectedSource = $state<SourceId | null>(null);

	// ── Shared config ───────────────────────────────────────────────
	let stitches = $state(DEFAULT_STITCHES);
	let stitchesPerCm = $state(DEFAULT_STITCHES_PER_CM);
	let rowsPerCm = $state(DEFAULT_ROWS_PER_CM);

	// ── Voice config ────────────────────────────────────────────────
	let voiceBuffer = $state<AudioBuffer | null>(null);
	let voiceSensitivity = $state(1);
	let voiceSmoothing = $state(0.3);
	let voiceError = $state<string | null>(null);

	// ── Audio file config ───────────────────────────────────────────
	let audioBuffer = $state<AudioBuffer | null>(null);
	let audioAnalysisMode = $state<AudioAnalysisMode>('waveform');
	let audioSensitivity = $state(1);
	let audioSmoothing = $state(0.3);
	let audioSegmentStart = $state(0);
	let audioSegmentEnd = $state(60);
	let audioError = $state<string | null>(null);

	// ── Terrain config ──────────────────────────────────────────────
	let terrainBbox = $state<TerrainBbox>({ south: 44.95, north: 45.05, west: 8.95, east: 9.05 });
	let terrainMode = $state<TerrainMode>('continuous');
	let terrainPosterizeLevels = $state(5);

	// ── Generation state ────────────────────────────────────────────
	let generating = $state(false);
	let generateError = $state<string | null>(null);
	let sourceMatrix = $state<SourceMatrix | null>(null);

	// ── Workspace state ─────────────────────────────────────────────
	let editor = $state<BitmapEditor | null>(null);
	let currentBitmap = $state<Bitmap | null>(null);
	let generatedBitmap = $state<Bitmap | null>(null);
	let refineContrast = $state(1);
	let refineThreshold = $state(0.5);
	let refineInvert = $state(false);
	let rowsCapped = $state(false);

	// ── Derived ─────────────────────────────────────────────────────
	const sharedConfig = $derived<SharedConfig>({ stitches, stitchesPerCm, rowsPerCm });

	const estimatedRows = $derived.by(() => {
		switch (selectedSource) {
			case 'voice':
				return audioRowsFromDuration(voiceBuffer?.duration ?? DEFAULT_VOICE_DURATION_SEC);
			case 'audio-file': {
				if (!audioBuffer) return MIN_ROWS;
				const seg = effectiveSegment(audioBuffer, audioSegmentStart, audioSegmentEnd);
				return audioRowsFromDuration(seg.end - seg.start);
			}
			case 'terrain':
				return terrainRowsFromBbox(terrainBbox, sharedConfig);
			default:
				return MIN_ROWS;
		}
	});

	const hasEdits = $derived(
		currentBitmap !== null &&
			generatedBitmap !== null &&
			hasManualEdits(currentBitmap, generatedBitmap)
	);

	const canGenerate = $derived.by(() => {
		switch (selectedSource) {
			case 'voice':
				return voiceBuffer !== null;
			case 'audio-file':
				return audioBuffer !== null && audioSegmentEnd - audioSegmentStart >= 1;
			case 'terrain':
				return bboxWithinLimit(terrainBbox);
			default:
				return false;
		}
	});

	// ── Wizard navigation ───────────────────────────────────────────
	function goToStep(step: WizardStep) {
		wizardStep = step;
	}

	function handleContinueFromSource() {
		if (!selectedSource) return;
		wizardStep = 'configure';
	}

	// ── Generate ────────────────────────────────────────────────────
	async function handleGenerate() {
		if (!canGenerate) return;
		generating = true;
		generateError = null;
		wizardStep = 'generate';
		rowsCapped = false;

		try {
			let matrix: SourceMatrix;

			switch (selectedSource) {
				case 'voice': {
					const analyze = voiceAdapter.analyze as (
						b: AudioBuffer,
						c: VoiceConfigType,
						s: SharedConfig
					) => Promise<SourceMatrix>;
					matrix = await analyze(
						voiceBuffer!,
						{ sensitivity: voiceSensitivity, smoothing: voiceSmoothing },
						sharedConfig
					);
					break;
				}
				case 'audio-file': {
					const analyze = audioFileAdapter.analyze as (
						i: { buffer: AudioBuffer },
						c: AudioFileConfig,
						s: SharedConfig
					) => Promise<SourceMatrix>;
					matrix = await analyze(
						{ buffer: audioBuffer! },
						{
							analysisMode: audioAnalysisMode,
							sensitivity: audioSensitivity,
							smoothing: audioSmoothing,
							segmentStartSec: audioSegmentStart,
							segmentEndSec: audioSegmentEnd
						},
						sharedConfig
					);
					break;
				}
				case 'terrain': {
					const analyze = terrainAdapter.analyze as (
						i: { bbox: TerrainBbox },
						c: TerrainConfigType,
						s: SharedConfig
					) => Promise<SourceMatrix>;
					matrix = await analyze(
						{ bbox: terrainBbox },
						{ mode: terrainMode, posterizeLevels: terrainPosterizeLevels, bbox: terrainBbox },
						sharedConfig
					);
					break;
				}
				default:
					throw new Error('Unknown source');
			}

			if (matrix.height >= MAX_ROWS) rowsCapped = true;

			sourceMatrix = matrix;
			const bmp = matrixToBitmap(matrix, {
				contrast: refineContrast,
				threshold: refineThreshold,
				invert: refineInvert
			});
			generatedBitmap = new Uint8Array(bmp);
			editor = new BitmapEditor(bmp, stitches, matrix.height);
			currentBitmap = new Uint8Array(editor.bitmap);

			phase = 'workspace';
		} catch (e) {
			generateError = e instanceof Error ? e.message : dataPattern.generationFailed;
			wizardStep = 'configure';
		} finally {
			generating = false;
		}
	}

	// ── Workspace actions ───────────────────────────────────────────
	function applyRefine(contrast: number, threshold: number, inv: boolean) {
		if (!sourceMatrix) return;
		refineContrast = contrast;
		refineThreshold = threshold;
		refineInvert = inv;
		const bmp = matrixToBitmap(sourceMatrix, { contrast, threshold, invert: inv });
		generatedBitmap = new Uint8Array(bmp);
		editor = new BitmapEditor(bmp, stitches, sourceMatrix.height);
		currentBitmap = new Uint8Array(editor.bitmap);
	}

	function handleReset() {
		if (!confirm(dataPattern.confirmReset)) return;
		applyRefine(refineContrast, refineThreshold, refineInvert);
	}

	function handleChangeSource() {
		if (hasEdits) {
			if (!confirm(dataPattern.confirmChangeSource)) return;
		}
		phase = 'wizard';
		wizardStep = 'source';
		editor = null;
		currentBitmap = null;
		generatedBitmap = null;
		sourceMatrix = null;
	}

	function handleCellInteract(col: number, row: number) {
		if (!editor) return;
		const tool = currentActiveTool;
		if (tool === 'toggle') editor.toggle(col, row);
		else if (tool === 'brush') editor.brush(col, row);
		else editor.eraser(col, row);
		currentBitmap = new Uint8Array(editor.bitmap);
	}

	// Active tool — owned here, bound into PatternWorkspace
	let currentActiveTool = $state<ActiveTool>('toggle');

	// ── Exports ─────────────────────────────────────────────────────
	function currentDims() {
		const rows = editor?.height ?? estimatedRows;
		return {
			stitches,
			rows,
			widthCm: stitches / stitchesPerCm,
			heightCm: rows / rowsPerCm
		};
	}

	async function handleDownloadPdfChart() {
		if (!currentBitmap) return;
		await exportKnitPurlPdf(currentBitmap, currentDims());
	}

	async function handleDownloadSymbolicPng() {
		if (!currentBitmap) return;
		await exportSymbolicPng(currentBitmap, currentDims());
	}

	async function handleDownloadAyabPng() {
		if (!currentBitmap || !editor) return;
		const flipped = flipBitmapVertical(currentBitmap, stitches, editor.height);
		await exportAyabPng(flipped, stitches, editor.height);
	}

	async function handleDownloadAnnotatedPdf() {
		if (!currentBitmap || !editor) return;
		const flipped = flipBitmapVertical(currentBitmap, stitches, editor.height);
		const dims = currentDims();
		await exportDocumentation(flipped, dims, { stitchesPerCm, rowsPerCm }, false, {
			background: 'Background',
			foreground: 'Foreground'
		});
	}

	// Forward active tool from workspace toolbar
	function handleWorkspaceCellInteract(col: number, row: number) {
		handleCellInteract(col, row);
	}
</script>

{#if phase === 'wizard'}
	<div class="space-y-6">
		<!-- Step bar -->
		{#if wizardStep !== 'generate'}
			<nav
				aria-label="Data pattern steps"
				class="grid grid-cols-3 gap-1 border-b border-border pb-4 sm:gap-2"
			>
				{#each (['source', 'configure', 'generate'] as const) as step (step)}
					<button
						type="button"
						disabled={step === 'generate' || (step === 'configure' && !selectedSource)}
						class="min-w-0 truncate rounded-md border px-1.5 py-2 text-center text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-2 sm:text-sm {wizardStep ===
						step
							? 'border-brand bg-brand text-brand-foreground'
							: 'border-border bg-muted/50 text-foreground hover:bg-muted'}"
						aria-current={wizardStep === step ? 'step' : undefined}
						onclick={() => {
							if (step === 'source') goToStep('source');
							else if (step === 'configure' && selectedSource) goToStep('configure');
						}}
					>
						{step === 'source'
							? dataPattern.stepSource
							: step === 'configure'
								? dataPattern.stepConfigure
								: dataPattern.stepGenerate}
					</button>
				{/each}
			</nav>
		{/if}

		<!-- Step 1: Source -->
		{#if wizardStep === 'source'}
			<div class="space-y-4">
				<SourcePicker bind:selected={selectedSource} />
				<div class="flex justify-end">
					<Button
						type="button"
						disabled={!selectedSource}
						onclick={handleContinueFromSource}
					>
						{dataPattern.continue}
					</Button>
				</div>
			</div>

		<!-- Step 2: Configure -->
		{:else if wizardStep === 'configure'}
			<div class="space-y-6">
				{#if selectedSource === 'voice'}
					<VoiceConfig
						bind:sensitivity={voiceSensitivity}
						bind:smoothing={voiceSmoothing}
						bind:audioBuffer={voiceBuffer}
						bind:error={voiceError}
					/>
				{:else if selectedSource === 'audio-file'}
					<AudioConfig
						bind:audioBuffer
						bind:analysisMode={audioAnalysisMode}
						bind:sensitivity={audioSensitivity}
						bind:smoothing={audioSmoothing}
						bind:segmentStartSec={audioSegmentStart}
						bind:segmentEndSec={audioSegmentEnd}
						bind:error={audioError}
					/>
				{:else if selectedSource === 'terrain'}
					<TerrainConfig
						bind:bbox={terrainBbox}
						bind:mode={terrainMode}
						bind:posterizeLevels={terrainPosterizeLevels}
					/>
				{/if}

				<div class="border-t border-border pt-4">
					<DimensionsGauge
						bind:stitches
						bind:stitchesPerCm
						bind:rowsPerCm
						estimatedRows={estimatedRows}
					/>
				</div>

				{#if generateError}
					<p class="text-sm text-destructive">{generateError}</p>
				{/if}

				<div class="flex justify-between border-t border-border pt-4">
					<Button type="button" variant="outline" onclick={() => goToStep('source')}>
						{dataPattern.back}
					</Button>
					<Button type="button" disabled={!canGenerate} onclick={handleGenerate}>
						{dataPattern.generatePattern}
					</Button>
				</div>
			</div>

		<!-- Step 3: Generating -->
		{:else if wizardStep === 'generate'}
			<div class="flex min-h-40 flex-col items-center justify-center gap-4">
				{#if generating}
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"
					></div>
					<p class="text-sm text-muted-foreground">{dataPattern.generating}</p>
				{:else if generateError}
					<p class="text-sm text-destructive">{generateError}</p>
					<Button type="button" variant="outline" onclick={() => goToStep('configure')}>
						{dataPattern.backToConfigure}
					</Button>
				{/if}
			</div>
		{/if}
	</div>

{:else}
	<!-- Workspace phase -->
	<div class="space-y-4">
		{#if rowsCapped}
			<p class="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
				{dataPattern.warnRowsCapped}
			</p>
		{/if}

		<PatternWorkspace
			{editor}
			bitmap={currentBitmap}
			{stitches}
			rows={editor?.height ?? estimatedRows}
			{stitchesPerCm}
			{rowsPerCm}
			contrast={refineContrast}
			threshold={refineThreshold}
			invert={refineInvert}
			bind:activeTool={currentActiveTool}
			{hasEdits}
			onReset={handleReset}
			onRefineApply={applyRefine}
			onChangeSource={handleChangeSource}
			onCellInteract={handleWorkspaceCellInteract}
			onDownloadPdfChart={handleDownloadPdfChart}
			onDownloadSymbolicPng={handleDownloadSymbolicPng}
			onDownloadAyabPng={handleDownloadAyabPng}
			onDownloadAnnotatedPdf={handleDownloadAnnotatedPdf}
		/>
	</div>
{/if}
