<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { searchPlace } from '$lib/data-pattern/adapters/geocoding-api.js';
	import { bboxWithinLimit } from '$lib/data-pattern/dimensions.js';
	import type { TerrainBbox, TerrainMode } from '$lib/data-pattern/types.js';

	let {
		bbox = $bindable<TerrainBbox>({ south: 44.95, north: 45.05, west: 8.95, east: 9.05 }),
		mode = $bindable<TerrainMode>('continuous'),
		posterizeLevels = $bindable(5)
	}: {
		bbox: TerrainBbox;
		mode: TerrainMode;
		posterizeLevels: number;
	} = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let searchQuery = $state('');
	let searchError = $state<string | null>(null);
	let searching = $state(false);
	let drawMode = $state(false);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let rectangle: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let L: any;
	let drawStart: [number, number] | null = null;
	let previewRect: unknown = null;

	const bboxValid = $derived(bboxWithinLimit(bbox));

	onMount(async () => {
		if (!mapContainer) return;
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapContainer).setView([45.0, 9.0], 10);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 18
		}).addTo(map);

		renderRectangle();

		map.on('mousedown', onMapMouseDown);
		map.on('mousemove', onMapMouseMove);
		map.on('mouseup', onMapMouseUp);
	});

	onDestroy(() => {
		map?.remove();
	});

	function renderRectangle() {
		if (!L || !map) return;
		if (rectangle) {
			rectangle.setBounds([
				[bbox.south, bbox.west],
				[bbox.north, bbox.east]
			]);
		} else {
			rectangle = L.rectangle(
				[
					[bbox.south, bbox.west],
					[bbox.north, bbox.east]
				],
				{ color: '#3b82f6', weight: 2, fillOpacity: 0.15 }
			).addTo(map);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function onMapMouseDown(e: any) {
		if (!drawMode) return;
		drawStart = [e.latlng.lat, e.latlng.lng];
		map.dragging.disable();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function onMapMouseMove(e: any) {
		if (!drawMode || !drawStart) return;
		const s = Math.min(drawStart[0], e.latlng.lat);
		const n = Math.max(drawStart[0], e.latlng.lat);
		const w = Math.min(drawStart[1], e.latlng.lng);
		const en = Math.max(drawStart[1], e.latlng.lng);
		if (previewRect) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(previewRect as any).setBounds([
				[s, w],
				[n, en]
			]);
		} else {
			previewRect = L.rectangle(
				[
					[s, w],
					[n, en]
				],
				{ color: '#f97316', weight: 1.5, fillOpacity: 0.1, dashArray: '4' }
			).addTo(map);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function onMapMouseUp(e: any) {
		if (!drawMode || !drawStart) return;
		const s = Math.min(drawStart[0], e.latlng.lat);
		const n = Math.max(drawStart[0], e.latlng.lat);
		const w = Math.min(drawStart[1], e.latlng.lng);
		const en = Math.max(drawStart[1], e.latlng.lng);

		if (previewRect) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(previewRect as any).remove();
			previewRect = null;
		}

		bbox = { south: s, north: n, west: w, east: en };
		renderRectangle();
		drawStart = null;
		drawMode = false;
		map.dragging.enable();
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
			bbox = {
				south: result.lat - span,
				north: result.lat + span,
				west: result.lon - span,
				east: result.lon + span
			};
			map.setView([result.lat, result.lon], 12);
			renderRectangle();
		} catch {
			searchError = dataPattern.errorGeocoding;
		} finally {
			searching = false;
		}
	}

	function toggleDrawMode() {
		drawMode = !drawMode;
		if (!drawMode) {
			map.dragging.enable();
			drawStart = null;
		}
	}

	$effect(() => {
		if (L && map && rectangle) {
			rectangle.setBounds([
				[bbox.south, bbox.west],
				[bbox.north, bbox.east]
			]);
		}
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

	<div class="relative">
		<div
			bind:this={mapContainer}
			class="h-64 w-full rounded-lg border border-border {drawMode ? 'cursor-crosshair' : ''}"
		></div>
		<div class="absolute right-2 top-2 z-[1000] flex gap-1">
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
