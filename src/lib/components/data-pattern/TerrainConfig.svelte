<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { searchPlace } from '$lib/data-pattern/adapters/geocoding-api.js';
	import { bboxWithinLimit } from '$lib/data-pattern/dimensions.js';
	import {
		attachDrawOverlay,
		createTerrainMap,
		TERRAIN_MAP_VIEW_LEVELS,
		type DrawOverlayController,
		type TerrainMapController,
		type TerrainMapViewLevel
	} from '$lib/data-pattern/terrain-map.js';
	import type { TerrainBbox, TerrainMode } from '$lib/data-pattern/types.js';

	let {
		bbox = $bindable<TerrainBbox>({ south: 44.95, north: 45.05, west: 8.95, east: 9.05 }),
		mode = $bindable<TerrainMode>('continuous'),
		posterizeLevels = $bindable(5),
		searchQuery = $bindable('')
	}: {
		bbox: TerrainBbox;
		mode: TerrainMode;
		posterizeLevels: number;
		searchQuery: string;
	} = $props();

	let drawOverlay: HTMLDivElement | undefined = $state();
	let searchError = $state<string | null>(null);
	let searching = $state(false);
	let drawMode = $state(false);
	let mapReady = $state(false);
	let mapView = $state<TerrainMapViewLevel>(100);

	const mapViewLevels = TERRAIN_MAP_VIEW_LEVELS;

	let mapCtrl: TerrainMapController | null = null;
	let drawCtrl: DrawOverlayController | null = null;

	const bboxValid = $derived(bboxWithinLimit(bbox));

	function applyBbox(next: TerrainBbox, fit = false) {
		bbox = next;
		mapCtrl?.setBbox(next, fit ? { fit: true, viewPercent: mapView } : undefined);
	}

	function setMapView(level: TerrainMapViewLevel) {
		mapView = level;
		mapCtrl?.setBbox(bbox, { fit: true, viewPercent: level });
		requestAnimationFrame(() => mapCtrl?.invalidateSize());
	}

	function initMap(node: HTMLDivElement) {
		let destroyed = false;
		void createTerrainMap(node, bbox).then(async (ctrl) => {
			if (destroyed) {
				ctrl.destroy();
				return;
			}
			mapCtrl = ctrl;
			mapReady = true;
			await tick();
			mapCtrl.invalidateSize();
		});

		return {
			destroy() {
				destroyed = true;
				stopDrawOverlay();
				mapCtrl?.destroy();
				mapCtrl = null;
				mapReady = false;
			}
		};
	}

	function stopDrawOverlay() {
		drawCtrl?.destroy();
		drawCtrl = null;
	}

	function startDrawOverlay() {
		if (!drawOverlay || !mapCtrl) return;
		stopDrawOverlay();
		drawCtrl = attachDrawOverlay(drawOverlay, mapCtrl.map, (nextBbox) => {
			stopDrawOverlay();
			drawMode = false;
			applyBbox(nextBbox, false);
			requestAnimationFrame(() => mapCtrl?.invalidateSize());
		});
	}

	async function handleSearch() {
		if (!searchQuery.trim()) return;
		searching = true;
		searchError = null;
		try {
			const result = await searchPlace(searchQuery);
			if (!result) {
				searchError = dataPattern.errorPlaceNotFound;
				return;
			}
			const span = 0.05;
			const next: TerrainBbox = {
				south: result.lat - span,
				north: result.lat + span,
				west: result.lon - span,
				east: result.lon + span
			};
			mapCtrl?.flyTo(result.lat, result.lon, 12);
			applyBbox(next, true);
			await tick();
			mapCtrl?.invalidateSize();
		} catch {
			searchError = dataPattern.errorGeocoding;
		} finally {
			searching = false;
		}
	}

	function toggleDrawMode() {
		drawMode = !drawMode;
		if (!drawMode) stopDrawOverlay();
	}

	$effect(() => {
		if (drawMode && mapReady && drawOverlay && mapCtrl) {
			startDrawOverlay();
		}
	});

	onDestroy(() => {
		stopDrawOverlay();
	});
</script>

<div class="space-y-4">
	<div class="flex gap-2">
		<Input
			type="text"
			placeholder={dataPattern.searchPlace}
			bind:value={searchQuery}
			onkeydown={(e) => e.key === 'Enter' && handleSearch()}
			class="flex-1"
		/>
		<Button type="button" variant="outline" onclick={handleSearch} disabled={searching}>
			{searching ? '…' : '🔍'}
		</Button>
	</div>
	{#if searchError}
		<p class="text-sm text-destructive">{searchError}</p>
	{/if}

	<div class="relative isolate h-64 w-full overflow-hidden rounded-lg border border-border">
		<div class="absolute inset-0 z-0" use:initMap></div>
		{#if !mapReady}
			<div
				class="absolute inset-0 z-10 flex items-center justify-center bg-muted/30 text-sm text-muted-foreground"
			>
				Loading map…
			</div>
		{/if}
		{#if drawMode}
			<div
				bind:this={drawOverlay}
				class="absolute inset-0 z-20 cursor-crosshair touch-none"
				role="presentation"
				aria-hidden="true"
			></div>
		{/if}
		<div class="pointer-events-none absolute inset-0 z-30">
			<div class="pointer-events-auto absolute left-2 top-2 flex gap-1 rounded bg-background/90 p-0.5 shadow">
				{#each mapViewLevels as level (level)}
					<button
						type="button"
						class="rounded px-2 py-1 text-xs font-medium transition-colors {mapView === level
							? 'bg-brand text-brand-foreground'
							: 'text-muted-foreground hover:bg-muted'}"
						onclick={() => setMapView(level)}
					>
						{level}%
					</button>
				{/each}
			</div>
			<div class="pointer-events-auto absolute right-2 top-2">
				<Button
					type="button"
					size="sm"
					variant={drawMode ? 'default' : 'outline'}
					class="text-xs shadow"
					onclick={toggleDrawMode}
				>
					{drawMode ? 'Cancel draw' : 'Draw selection'}
				</Button>
			</div>
		</div>
	</div>

	{#if !bboxValid}
		<p class="text-sm text-destructive">{dataPattern.errorBboxTooLarge}</p>
	{/if}

	<p class="text-xs text-muted-foreground">
		Bbox: {bbox.south.toFixed(4)}°S {bbox.north.toFixed(4)}°N {bbox.west.toFixed(4)}°W {bbox.east.toFixed(
			4
		)}°E
	</p>

	<div class="space-y-3">
		<Label>{dataPattern.analysisMode}</Label>
		<div class="flex gap-4">
			<label class="flex items-center gap-2 text-sm">
				<input type="radio" bind:group={mode} value="continuous" />
				{dataPattern.terrainContinuous}
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input type="radio" bind:group={mode} value="posterized" />
				{dataPattern.terrainPosterized}
			</label>
		</div>
		{#if mode === 'posterized'}
			<div class="space-y-2">
				<Label>{dataPattern.posterizeLevels} ({posterizeLevels})</Label>
				<Slider type="single" min={3} max={8} step={1} bind:value={posterizeLevels} />
			</div>
		{/if}
	</div>

	<p class="text-xs text-muted-foreground">
		<strong>Privacy:</strong> Only the selected bounding box coordinates are sent to Open-Elevation.
		No personal data is transmitted.
	</p>
</div>

<style>
	:global(.leaflet-container) {
		height: 100%;
		width: 100%;
		font-family: inherit;
	}
</style>
