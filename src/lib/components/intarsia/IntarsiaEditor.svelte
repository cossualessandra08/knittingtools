<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { intarsia } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	import PatternGrid from './PatternGrid.svelte';
	import TopBar from './TopBar.svelte';
	import RowInstructions from './RowInstructions.svelte';
	import ColourLegend from './ColourLegend.svelte';
	import SegmentBar from './SegmentBar.svelte';
	import WorkControls from './WorkControls.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import ImageImportPanel from './ImageImportPanel.svelte';

	import { UndoStack, applyBrush, floodFill } from '$lib/intarsia/grid-editor.js';
	import { analyzeRow, activeSegmentIndex as calcActiveSegIdx } from '$lib/intarsia/row-analysis.js';
	import { readingDirectionForRow, rowSideForRow } from '$lib/intarsia/reading-direction.js';
	import {
		prevStitch as doPrevStitch,
		nextStitch as doNextStitch,
		prevRow as doPrevRow,
		nextRow as doNextRow,
		setStitchPosition
	} from '$lib/intarsia/work-assistant.js';
	import {
		defaultProject,
		loadFromLocalStorage,
		saveToLocalStorage,
		downloadProjectFile,
		importProjectJson
	} from '$lib/intarsia/project-storage.js';
	import { uiRowNumber } from '$lib/intarsia/pattern-matrix.js';
	import { renameColour, mergeColours } from '$lib/intarsia/colour-palette.js';
	import { quantizeImageData } from '$lib/intarsia/image-quantize.js';
	import { AUTOSAVE_KEY } from '$lib/intarsia/constants.js';
	import type { IntarsiaProject } from '$lib/intarsia/types.js';

	type EditorTool = 'brush' | 'eraser' | 'fill' | 'select' | 'line';

	// ─── Core state ──────────────────────────────────────────────────────────
	let project = $state<IntarsiaProject>(defaultProject(20, 30));
	let phase = $state<'setup' | 'work'>('setup');
	let editing = $state(false);
	let editorTool = $state<EditorTool>('brush');
	let activeColourId = $state(0);
	const undoStack = new UndoStack();
	let errorMessage = $state<string | null>(null);
	let showEditConfirm = $state(false);
	let showNewProjectConfirm = $state(false);
	/** Incremented on every cell mutation so $effects track editing changes. */
	let cellVersion = $state(0);

	// Setup sub-phase
	let setupMode = $state<'choose' | 'blank' | 'import'>('choose');
	let blankWidth = $state(40);
	let blankHeight = $state(50);

	// ─── Derived ──────────────────────────────────────────────────────────────
	const direction = $derived(
		readingDirectionForRow(
			project.position.row,
			project.settings.readingMode,
			project.settings.manualDirection
		)
	);
	const rowSide = $derived(rowSideForRow(project.position.row));
	const currentUiRow = $derived(uiRowNumber(project.position.row));
	const rowAnalysis = $derived(analyzeRow(project.matrix, project.position.row, direction));
	const activeSegIdx = $derived(
		calcActiveSegIdx(rowAnalysis.runs, project.position.stitch, direction, project.matrix.width)
	);
	const completedSegIdx = $derived(activeSegIdx - 1);

	// ─── Mount: restore autosave ──────────────────────────────────────────────
	onMount(() => {
		try {
			const saved = loadFromLocalStorage();
			if (saved) {
				project = saved;
				phase = 'work';
			}
		} catch {
			// ignore corrupted storage — start fresh
		}
	});

	// ─── Autosave (debounced) ─────────────────────────────────────────────────
	$effect(() => {
		// Track changes that warrant a save
		void project.position.row;
		void project.position.stitch;
		void project.settings.projectName;
		void project.settings.zoom;
		void project.settings.readingMode;
		void project.settings.showRsWs;
		void project.settings.fabricView;
		void cellVersion;

		if (!browser || phase !== 'work') return;

		const timer = setTimeout(() => {
			try {
				saveToLocalStorage(project);
			} catch {
				// localStorage full — ignore
			}
		}, 500);

		return () => clearTimeout(timer);
	});

	// ─── Navigation ───────────────────────────────────────────────────────────
	function handlePrevStitch() {
		project.position = doPrevStitch(project.position, project.matrix.width, project.settings);
	}

	function handleNextStitch() {
		project.position = doNextStitch(project.position, project.matrix.width, project.settings);
	}

	function handlePrevRow() {
		project.position = doPrevRow(
			project.position,
			project.matrix.width,
			project.matrix.height,
			project.settings
		);
	}

	function handleNextRow() {
		project.position = doNextRow(
			project.position,
			project.matrix.width,
			project.matrix.height,
			project.settings
		);
	}

	// ─── Grid tap ─────────────────────────────────────────────────────────────
	function handleGridTap(row: number, stitch: number) {
		if (editing && phase === 'work') {
			if (editorTool === 'brush' || editorTool === 'eraser') {
				undoStack.push(project.matrix);
				applyBrush(project.matrix, row, stitch, editorTool === 'eraser' ? 0 : activeColourId);
				cellVersion++;
			} else if (editorTool === 'fill') {
				undoStack.push(project.matrix);
				floodFill(project.matrix, row, stitch, activeColourId);
				cellVersion++;
			} else {
				// select / line: tap sets navigation position
				project.position = setStitchPosition(
					project.position,
					row,
					stitch,
					project.matrix.width,
					project.matrix.height
				);
			}
		} else {
			project.position = setStitchPosition(
				project.position,
				row,
				stitch,
				project.matrix.width,
				project.matrix.height
			);
		}
	}

	// ─── Undo ─────────────────────────────────────────────────────────────────
	function handleUndo() {
		if (undoStack.undo(project.matrix)) {
			cellVersion++;
		}
	}

	// ─── Keyboard shortcuts ───────────────────────────────────────────────────
	function handleKeydown(event: KeyboardEvent) {
		if (phase !== 'work') return;
		// Don't capture keyboard events when typing in form fields
		const target = event.target as Element | null;
		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement
		)
			return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				handlePrevStitch();
				break;
			case 'ArrowRight':
				event.preventDefault();
				handleNextStitch();
				break;
			case 'ArrowUp':
				event.preventDefault();
				handlePrevRow();
				break;
			case 'ArrowDown':
			case ' ':
				event.preventDefault();
				handleNextRow();
				break;
		}
	}

	// ─── Setup: blank grid ────────────────────────────────────────────────────
	function createBlankGrid() {
		try {
			project = defaultProject(blankWidth, blankHeight);
			phase = 'work';
			editing = true;
			errorMessage = null;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Could not create grid.';
		}
	}

	// ─── Setup: image import ──────────────────────────────────────────────────
	async function handleImageImport({
		file,
		width,
		height,
		colourCount
	}: {
		file: File;
		width: number;
		height: number;
		colourCount: number;
	}) {
		errorMessage = null;
		try {
			const imageData = await loadImageAsData(file, width, height);
			const { matrix, palette } = quantizeImageData(imageData, colourCount);
			const base = defaultProject(width, height);
			project = { ...base, matrix, palette };
			phase = 'work';
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Could not process image.';
		}
	}

	async function loadImageAsData(file: File, w: number, h: number): Promise<ImageData> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);
				const canvas = document.createElement('canvas');
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Canvas not available'));
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				resolve(ctx.getImageData(0, 0, w, h));
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Could not load image.'));
			};
			img.src = url;
		});
	}

	// ─── New project ──────────────────────────────────────────────────────────
	function handleNewProject() {
		if (phase === 'work') {
			showNewProjectConfirm = true;
		} else {
			resetToSetup();
		}
	}

	function resetToSetup() {
		project = defaultProject(20, 30);
		phase = 'setup';
		setupMode = 'choose';
		editing = false;
		errorMessage = null;
		showNewProjectConfirm = false;
		if (browser) {
			try {
				localStorage.removeItem(AUTOSAVE_KEY);
			} catch {
				// ignore
			}
		}
	}

	// ─── Export / import project file ─────────────────────────────────────────
	function handleExport() {
		downloadProjectFile(project);
	}

	function handleImportFile() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				project = importProjectJson(text);
				phase = 'work';
				errorMessage = null;
			} catch {
				errorMessage = intarsia.errorInvalidProject;
			}
		};
		input.click();
	}

	// ─── Edit mode toggle ─────────────────────────────────────────────────────
	function requestEditMode() {
		if (editing) {
			editing = false;
		} else {
			showEditConfirm = true;
		}
	}

	// ─── Colour operations ────────────────────────────────────────────────────
	function handleRename(id: number, name: string) {
		project.palette = renameColour(project.palette, id, name);
	}

	function handleMerge(fromId: number, intoId: number) {
		const result = mergeColours(project.matrix, project.palette, fromId, intoId);
		project.matrix = result.matrix;
		project.palette = result.palette;
		cellVersion++;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- ─── Edit pattern confirm dialog ───────────────────────────────────────── -->
{#if showEditConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
			<p class="mb-4 text-sm">{intarsia.editPatternWarning}</p>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={() => (showEditConfirm = false)}>Cancel</Button>
				<Button
					onclick={() => {
						editing = true;
						showEditConfirm = false;
					}}>Continue</Button
				>
			</div>
		</div>
	</div>
{/if}

<!-- ─── New project confirm dialog ────────────────────────────────────────── -->
{#if showNewProjectConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
			<p class="mb-4 text-sm">{intarsia.confirmNewProject}</p>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={() => (showNewProjectConfirm = false)}>Cancel</Button>
				<Button variant="destructive" onclick={resetToSetup}>Start new</Button>
			</div>
		</div>
	</div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     SETUP PHASE
════════════════════════════════════════════════════════════════════════════ -->
{#if phase === 'setup'}
	<div class="mx-auto max-w-lg px-4 py-10">
		<div class="mb-6 flex items-center gap-3">
			{#if setupMode !== 'choose'}
				<Button variant="ghost" size="sm" onclick={() => (setupMode = 'choose')}>← Back</Button>
			{/if}
			<h2 class="text-xl font-semibold">
				{setupMode === 'choose' ? intarsia.hintStart : setupMode === 'blank' ? intarsia.createGrid : intarsia.uploadImage}
			</h2>
		</div>

		{#if errorMessage}
			<p class="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
				{errorMessage}
			</p>
		{/if}

		{#if setupMode === 'choose'}
			<div class="flex flex-col gap-3">
				<button
					class="flex h-16 w-full items-center gap-4 rounded-lg border border-border bg-card px-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
					onclick={() => (setupMode = 'blank')}
				>
					<span class="text-2xl" aria-hidden="true">⬛</span>
					<div>
						<div class="font-medium">{intarsia.createGrid}</div>
						<div class="text-xs text-muted-foreground">Start with an empty grid</div>
					</div>
				</button>

				<button
					class="flex h-16 w-full items-center gap-4 rounded-lg border border-border bg-card px-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
					onclick={() => (setupMode = 'import')}
				>
					<span class="text-2xl" aria-hidden="true">🖼</span>
					<div>
						<div class="font-medium">{intarsia.uploadImage}</div>
						<div class="text-xs text-muted-foreground">Import a photo and convert to a pattern</div>
					</div>
				</button>

				<button
					class="flex h-16 w-full items-center gap-4 rounded-lg border border-border bg-card px-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
					onclick={handleImportFile}
				>
					<span class="text-2xl" aria-hidden="true">📂</span>
					<div>
						<div class="font-medium">{intarsia.importProject}</div>
						<div class="text-xs text-muted-foreground">Load a saved .intarsia.json file</div>
					</div>
				</button>
			</div>

		{:else if setupMode === 'blank'}
			<div class="flex flex-col gap-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<Label for="blank-width" class="text-sm">{intarsia.widthStitches}</Label>
						<Input
							id="blank-width"
							type="number"
							bind:value={blankWidth}
							min={1}
							max={200}
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="blank-height" class="text-sm">{intarsia.heightRows}</Label>
						<Input
							id="blank-height"
							type="number"
							bind:value={blankHeight}
							min={1}
							max={300}
							class="h-9"
						/>
					</div>
				</div>
				<Button onclick={createBlankGrid} class="w-full">{intarsia.createGrid}</Button>
			</div>

		{:else if setupMode === 'import'}
			<ImageImportPanel onConfirm={handleImageImport} />
		{/if}
	</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     WORK PHASE
════════════════════════════════════════════════════════════════════════════ -->
{:else}
	<div class="intarsia-editor-layout">
		<!-- ── Top bar ──────────────────────────────────────────────────────── -->
		<div class="topbar-area flex items-stretch overflow-hidden border-b border-border">
			<div class="min-w-0 flex-1">
				<TopBar
					bind:projectName={project.settings.projectName}
					bind:zoom={project.settings.zoom}
					uiRowNumber={currentUiRow}
					{direction}
					rowSide={project.settings.showRsWs ? rowSide : null}
					bind:showRsWs={project.settings.showRsWs}
					bind:fabricView={project.settings.fabricView}
					bind:readingMode={project.settings.readingMode}
				/>
			</div>
			<div class="flex shrink-0 items-center gap-1 border-l border-border px-2">
				<Button variant="ghost" size="xs" onclick={handleNewProject}>{intarsia.newProject}</Button>
				<Button variant="ghost" size="xs" onclick={handleExport}>{intarsia.exportProject}</Button>
				<Button variant="ghost" size="xs" onclick={handleImportFile}
					>{intarsia.importProject}</Button
				>
				<Button
					variant={editing ? 'secondary' : 'outline'}
					size="xs"
					onclick={requestEditMode}
					aria-pressed={editing}
				>
					{editing ? 'Done editing' : 'Edit pattern'}
				</Button>
			</div>
		</div>

		<!-- ── Editor toolbar (visible when editing) ──────────────────────── -->
		{#if editing}
			<div class="toolbar-area border-b border-border px-2 py-1">
				<EditorToolbar
					bind:activeTool={editorTool}
					bind:activeColourId
					palette={project.palette}
					canUndo={undoStack.canUndo()}
					onUndo={handleUndo}
				/>
			</div>
		{/if}

		<!-- ── Centre: pattern grid ────────────────────────────────────────── -->
		<div class="centre-area min-h-0">
			{#if errorMessage}
				<p class="px-3 py-2 text-sm text-destructive" role="alert">{errorMessage}</p>
			{/if}
			<PatternGrid
				matrix={project.matrix}
				palette={project.palette}
				position={project.position}
				zoom={project.settings.zoom}
				fabricView={project.settings.fabricView}
				stitchesPerCm={project.settings.stitchesPerCm}
				rowsPerCm={project.settings.rowsPerCm}
				onStitchTap={handleGridTap}
			/>
		</div>

		<!-- ── Right sidebar ───────────────────────────────────────────────── -->
		<aside class="sidebar-area flex flex-col gap-6 overflow-y-auto border-l border-border p-3">
			<RowInstructions
				analysis={rowAnalysis}
				palette={project.palette}
				uiRowNumber={currentUiRow}
				{direction}
				{rowSide}
				showRsWs={project.settings.showRsWs}
			/>
			<div class="border-t border-border pt-4">
				<p class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Colour legend
				</p>
				<ColourLegend
					bind:palette={project.palette}
					onRename={handleRename}
					onMerge={handleMerge}
				/>
			</div>
		</aside>

		<!-- ── Footer: segment bar + navigation ───────────────────────────── -->
		<footer class="footer-area flex flex-col gap-2 border-t border-border p-2">
			<SegmentBar
				runs={rowAnalysis.runs}
				palette={project.palette}
				activeSegmentIndex={activeSegIdx}
				completedThroughIndex={completedSegIdx}
			/>
			<div class="flex items-center justify-center">
				<WorkControls
					onPrevRow={handlePrevRow}
					onNextRow={handleNextRow}
					onPrevStitch={handlePrevStitch}
					onNextStitch={handleNextStitch}
				/>
			</div>
		</footer>
	</div>
{/if}

<style>
	.intarsia-editor-layout {
		display: grid;
		grid-template-areas:
			'topbar  topbar'
			'toolbar toolbar'
			'centre  sidebar'
			'footer  footer';
		grid-template-columns: 1fr 280px;
		/* rows: topbar(auto) toolbar(auto) centre(fills remaining) footer(auto) */
		grid-template-rows: auto auto 1fr auto;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.topbar-area {
		grid-area: topbar;
	}
	.toolbar-area {
		grid-area: toolbar;
	}
	.centre-area {
		grid-area: centre;
		overflow: hidden;
	}
	.sidebar-area {
		grid-area: sidebar;
	}
	.footer-area {
		grid-area: footer;
	}

	@media (max-width: 768px) {
		.intarsia-editor-layout {
			grid-template-areas:
				'topbar'
				'toolbar'
				'centre'
				'sidebar'
				'footer';
			grid-template-columns: 1fr;
			grid-template-rows: auto auto minmax(300px, 50dvh) auto auto;
			height: auto;
			overflow: visible;
		}

		.centre-area {
			overflow: hidden;
		}

		.sidebar-area {
			border-left: none;
			border-top: 1px solid var(--border);
		}
	}
</style>
