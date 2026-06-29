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

	import { UndoStack, applyBrush, floodFill, drawLine } from '$lib/intarsia/grid-editor.js';

	import {
		analyzeRow,
		activeSegmentIndex as calcActiveSegIdx
	} from '$lib/intarsia/row-analysis.js';
	import { readingDirectionForRow, rowSideForRow } from '$lib/intarsia/reading-direction.js';
	import {
		prevStitch as doPrevStitch,
		nextStitch as doNextStitch,
		prevRow as doPrevRow,
		nextRow as doNextRow,
		setStitchPosition,
		jumpToRow as doJumpToRow,
		sanitizePosition
	} from '$lib/intarsia/work-assistant.js';
	import {
		defaultProject,
		loadFromLocalStorage,
		saveToLocalStorage,
		downloadProjectFile,
		importProjectJson
	} from '$lib/intarsia/project-storage.js';
	import { uiRowNumber, normalizeDimension, getCell } from '$lib/intarsia/pattern-matrix.js';
	import { renameColour, mergeColours, addColour, updateColourHex, removeColour, colourInUse } from '$lib/intarsia/colour-palette.js';
	import { quantizeImageData } from '$lib/intarsia/image-quantize.js';
	import { AUTOSAVE_KEY, MAX_ROWS, MAX_STITCHES } from '$lib/intarsia/constants.js';
	import type { IntarsiaProject, WorkPosition } from '$lib/intarsia/types.js';

	type EditorTool = 'brush' | 'eraser' | 'fill' | 'line';

	// ─── Core state ──────────────────────────────────────────────────────────
	let project = $state<IntarsiaProject>(defaultProject(20, 30));
	let phase = $state<'setup' | 'work'>('setup');
	let editing = $state(false);
	let editorTool = $state<EditorTool>('brush');
	let activeColourId = $state(0);
	const undoStack = new UndoStack();
	/** Bumps when undo/redo stack changes so toolbar buttons stay in sync. */
	let undoRevision = $state(0);
	const canUndo = $derived.by(() => {
		void undoRevision;
		return undoStack.canUndo();
	});
	const canRedo = $derived.by(() => {
		void undoRevision;
		return undoStack.canRedo();
	});
	function touchUndoStack() {
		undoRevision++;
	}
	let errorMessage = $state<string | null>(null);
	let showEditConfirm = $state(false);
	let showNewProjectConfirm = $state(false);
	let pendingRemoveColourId = $state<number | null>(null);
	/** Incremented on every cell mutation so $effects track editing changes. */
	let cellVersion = $state(0);
	/** Bump to scroll grid to current row after button/keyboard row navigation. */
	let scrollToRowTrigger = $state(0);
	/** Bumps on every work-position change so UI and canvas stay in sync. */
	let positionVersion = $state(0);

	function requestScrollToRow() {
		scrollToRowTrigger++;
	}

	function setWorkPosition(next: WorkPosition, scroll = false) {
		const position = sanitizePosition(
			next,
			project.matrix.width,
			project.matrix.height
		);
		project = { ...project, position };
		positionVersion++;
		if (scroll) requestScrollToRow();
	}

	// Setup sub-phase
	let setupMode = $state<'choose' | 'blank' | 'import'>('choose');
	let blankWidth = $state(40);
	let blankHeight = $state(50);

	/** First endpoint when drawing a line. */
	let lineStart = $state<{ row: number; stitch: number } | null>(null);

	// ─── Derived ──────────────────────────────────────────────────────────────
	const workRow = $derived.by(() => {
		void positionVersion;
		return project.position.row;
	});
	const workStitch = $derived.by(() => {
		void positionVersion;
		return project.position.stitch;
	});
	const direction = $derived(
		readingDirectionForRow(
			workRow,
			project.settings.readingMode,
			project.settings.manualDirection
		)
	);
	const rowSide = $derived(rowSideForRow(workRow));
	const currentUiRow = $derived(uiRowNumber(workRow));
	const rowAnalysis = $derived(analyzeRow(project.matrix, workRow, direction));
	const activeSegIdx = $derived(
		calcActiveSegIdx(rowAnalysis.runs, workStitch, direction, project.matrix.width)
	);
	const completedSegIdx = $derived(activeSegIdx - 1);
	const pendingRemoveColour = $derived(
		pendingRemoveColourId === null
			? null
			: (project.palette.find((entry) => entry.id === pendingRemoveColourId) ?? null)
	);

	// ─── Mount: restore autosave ──────────────────────────────────────────────
	onMount(() => {
		try {
			const saved = loadFromLocalStorage();
			if (saved) {
				const position = sanitizePosition(
					saved.position,
					saved.matrix.width,
					saved.matrix.height
				);
				project = { ...saved, position };
				positionVersion++;
				phase = 'work';
				requestScrollToRow();
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
		void positionVersion;
		void project.settings.projectName;
		void project.settings.zoom;
		void project.settings.readingMode;
		void project.settings.showRsWs;
		void project.settings.fabricView;
		void cellVersion;
		void editing;

		if (!browser || phase !== 'work') return;

		const timer = setTimeout(() => {
			try {
				saveToLocalStorage(project);
			} catch {
				// localStorage full — ignore
			}
		}, editing ? 1500 : 500);

		return () => clearTimeout(timer);
	});

	// ─── Navigation ───────────────────────────────────────────────────────────
	function handlePrevStitch() {
		setWorkPosition(doPrevStitch(project.position, project.matrix.width, project.settings));
	}

	function handleNextStitch() {
		setWorkPosition(doNextStitch(project.position, project.matrix.width, project.settings));
	}

	function handlePrevRow() {
		setWorkPosition(
			doPrevRow(
				project.position,
				project.matrix.width,
				project.matrix.height,
				project.settings
			),
			true
		);
	}

	function handleNextRow() {
		setWorkPosition(
			doNextRow(
				project.position,
				project.matrix.width,
				project.matrix.height,
				project.settings
			),
			true
		);
	}

	function handleJumpToRow(uiRow: number) {
		setWorkPosition(
			doJumpToRow(
				uiRow,
				project.matrix.width,
				project.matrix.height,
				project.settings
			),
			true
		);
	}

	// ─── Grid interaction ───────────────────────────────────────────────────
	function paintColourId(): number {
		return editorTool === 'eraser' ? 0 : activeColourId;
	}

	function handleGridTap(row: number, stitch: number) {
		if (editing && phase === 'work') {
			if (editorTool === 'fill') {
				undoStack.push(project.matrix, project.palette);
				touchUndoStack();
				floodFill(project.matrix, row, stitch, activeColourId);
				cellVersion++;
			} else if (editorTool === 'line') {
				if (!lineStart) {
					lineStart = { row, stitch };
				} else {
					undoStack.push(project.matrix, project.palette);
					touchUndoStack();
					drawLine(
						project.matrix,
						lineStart.row,
						lineStart.stitch,
						row,
						stitch,
						activeColourId
					);
					lineStart = null;
					cellVersion++;
				}
			} else if (editorTool === 'brush' || editorTool === 'eraser') {
				undoStack.push(project.matrix, project.palette);
				touchUndoStack();
				applyBrush(project.matrix, row, stitch, paintColourId());
				cellVersion++;
			}
		} else {
			setWorkPosition(
				setStitchPosition(
					project.position,
					row,
					stitch,
					project.matrix.width,
					project.matrix.height
				)
			);
		}
	}

	function clearLineStart() {
		lineStart = null;
	}

	function handleGridPaint(row: number, stitch: number, { strokeStart }: { strokeStart: boolean }) {
		if (!editing || phase !== 'work') return;
		if (editorTool !== 'brush' && editorTool !== 'eraser') return;

		if (strokeStart) {
			undoStack.push(project.matrix, project.palette);
			touchUndoStack();
		}

		const colourId = paintColourId();
		if (getCell(project.matrix, row, stitch) === colourId) return;

		applyBrush(project.matrix, row, stitch, colourId);
		cellVersion++;
	}

	$effect(() => {
		void editorTool;
		if (editorTool !== 'line') clearLineStart();
	});

	// ─── Undo / Redo ──────────────────────────────────────────────────────────
	function syncActiveColour() {
		if (!project.palette.some((entry) => entry.id === activeColourId)) {
			activeColourId = project.palette[0]?.id ?? 0;
		}
	}

	function handleUndo() {
		const palette = undoStack.undo(project.matrix, project.palette);
		if (palette) {
			project = { ...project, palette };
			syncActiveColour();
			cellVersion++;
			touchUndoStack();
		}
	}

	function handleRedo() {
		const palette = undoStack.redo(project.matrix, project.palette);
		if (palette) {
			project = { ...project, palette };
			syncActiveColour();
			cellVersion++;
			touchUndoStack();
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

		const mod = event.metaKey || event.ctrlKey;
		if (editing && mod && event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			handleUndo();
			return;
		}
		if (editing && mod && (event.key === 'Z' || (event.key === 'z' && event.shiftKey))) {
			event.preventDefault();
			handleRedo();
			return;
		}
		if (editing && event.key === 'Escape') {
			clearLineStart();
			return;
		}

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
				// Visual up on screen = higher row number
				event.preventDefault();
				handleNextRow();
				break;
			case 'ArrowDown':
				event.preventDefault();
				handlePrevRow();
				break;
			case ' ':
				event.preventDefault();
				handleNextRow();
				break;
		}
	}

	// ─── Setup: blank grid ────────────────────────────────────────────────────
	function createBlankGrid() {
		const w = normalizeDimension(blankWidth, MAX_STITCHES);
		const h = normalizeDimension(blankHeight, MAX_ROWS);
		if (w === null || h === null) {
			errorMessage = intarsia.errorPatternExceedsLimits;
			return;
		}
		try {
			project = defaultProject(w, h);
			setWorkPosition({ row: 0, stitch: 0 }, true);
			phase = 'work';
			editing = true;
			activeColourId = 1;
			undoStack.clear();
			touchUndoStack();
			errorMessage = null;
			if (browser) saveToLocalStorage(project);
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
		const w = normalizeDimension(width, MAX_STITCHES);
		const h = normalizeDimension(height, MAX_ROWS);
		const colours = Math.round(Number(colourCount));
		if (w === null || h === null) {
			errorMessage = intarsia.errorPatternExceedsLimits;
			return;
		}
		if (!Number.isFinite(colours) || colours < 1) {
			errorMessage = intarsia.errorTooManyColours;
			return;
		}
		try {
			const imageData = await loadImageAsData(file, w, h);
			const { matrix, palette } = quantizeImageData(imageData, colours);
			const base = defaultProject(w, h);
			project = { ...base, matrix, palette };
			setWorkPosition({ row: 0, stitch: 0 }, true);
			phase = 'work';
			editing = false;
			undoStack.clear();
			touchUndoStack();
			if (browser) saveToLocalStorage(project);
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

	function adjustActiveColourAfterRemoval(removedId: number, remapToId: number) {
		if (activeColourId === removedId) activeColourId = remapToId;
		else if (activeColourId > removedId) activeColourId--;
	}

	function handleMerge(fromId: number, intoId: number) {
		const result = mergeColours(project.matrix, project.palette, fromId, intoId);
		project = { ...project, matrix: result.matrix, palette: result.palette };
		adjustActiveColourAfterRemoval(fromId, intoId);
		cellVersion++;
	}

	function handleAddColour(hex: string) {
		try {
			project.palette = addColour(project.palette, hex);
			activeColourId = project.palette[project.palette.length - 1]!.id;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : intarsia.errorTooManyColours;
		}
	}

	function handleRemoveColour(id: number) {
		if (colourInUse(project.matrix, id)) {
			pendingRemoveColourId = id;
			return;
		}
		applyRemoveColour(id);
	}

	function cancelRemoveColour() {
		pendingRemoveColourId = null;
	}

	function confirmRemoveColour() {
		if (pendingRemoveColourId === null) return;
		applyRemoveColour(pendingRemoveColourId);
		pendingRemoveColourId = null;
	}

	function applyRemoveColour(id: number) {
		try {
			undoStack.push(project.matrix, project.palette);
			touchUndoStack();
			const result = removeColour(project.matrix, project.palette, id, 0);
			project = { ...project, matrix: result.matrix, palette: result.palette };
			adjustActiveColourAfterRemoval(id, 0);
			syncActiveColour();
			cellVersion++;
			errorMessage = null;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : intarsia.errorCannotRemoveColour;
		}
	}

	function handleColourHexChange(id: number, hex: string) {
		project.palette = updateColourHex(project.palette, id, hex);
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
						if (activeColourId === 0 && project.palette.length > 1) {
							activeColourId = project.palette[1]!.id;
						}
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

{#if pendingRemoveColour}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
			<p class="mb-4 text-sm">{intarsia.confirmRemoveColourInUse(pendingRemoveColour.name)}</p>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={cancelRemoveColour}>Cancel</Button>
				<Button variant="destructive" onclick={confirmRemoveColour}>{intarsia.removeColour}</Button>
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
				{setupMode === 'choose'
					? intarsia.hintStart
					: setupMode === 'blank'
						? intarsia.createGrid
						: intarsia.uploadImage}
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
					maxRows={project.matrix.height}
					{direction}
					rowSide={project.settings.showRsWs ? rowSide : null}
					bind:showRsWs={project.settings.showRsWs}
					bind:fabricView={project.settings.fabricView}
					bind:readingMode={project.settings.readingMode}
					onJumpToRow={handleJumpToRow}
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
					{canUndo}
					{canRedo}
					onUndo={handleUndo}
					onRedo={handleRedo}
					onAddColour={handleAddColour}
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
				positionRow={workRow}
				positionStitch={workStitch}
				{positionVersion}
				zoom={project.settings.zoom}
				fabricView={project.settings.fabricView}
				stitchesPerCm={project.settings.stitchesPerCm}
				rowsPerCm={project.settings.rowsPerCm}
				{cellVersion}
				{scrollToRowTrigger}
				{editing}
				{editorTool}
				{lineStart}
				onStitchTap={handleGridTap}
				onStitchPaint={handleGridPaint}
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
				<p class="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Colour legend
				</p>
				<ColourLegend
					bind:palette={project.palette}
					onRename={handleRename}
					onMerge={handleMerge}
					onHexChange={handleColourHexChange}
					onAddColour={handleAddColour}
					onRemove={handleRemoveColour}
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
