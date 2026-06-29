<script lang="ts">
	import { intarsia } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { ZOOM_LEVELS } from '$lib/intarsia/constants.js';
	import type { ZoomLevel } from '$lib/intarsia/types.js';

	let {
		projectName = $bindable(''),
		zoom = $bindable(100 as ZoomLevel),
		uiRowNumber,
		direction,
		rowSide = null,
		showRsWs = $bindable(true),
		fabricView = $bindable(false),
		readingMode = $bindable('zigzag' as 'zigzag' | 'manual'),
		disabled = false
	}: {
		projectName?: string;
		zoom?: ZoomLevel;
		uiRowNumber?: number;
		direction?: 'ltr' | 'rtl';
		rowSide?: 'RS' | 'WS' | null;
		showRsWs?: boolean;
		fabricView?: boolean;
		readingMode?: 'zigzag' | 'manual';
		disabled?: boolean;
	} = $props();

	const directionArrow = $derived(direction === 'ltr' ? '→' : '←');
</script>

<header class="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2">
	<!-- Project name -->
	<Input
		bind:value={projectName}
		placeholder={intarsia.projectName}
		class="h-8 w-40 min-w-0 text-sm"
		aria-label={intarsia.projectName}
	/>

	<div class="h-5 w-px bg-border"></div>

	<!-- Zoom buttons -->
	<div class="flex items-center gap-1">
		<span class="text-xs text-muted-foreground">{intarsia.zoom}</span>
		{#each ZOOM_LEVELS as level (level)}
			<Button
				variant={zoom === level ? 'default' : 'outline'}
				size="xs"
				onclick={() => (zoom = level)}
				{disabled}
				aria-pressed={zoom === level}
				aria-label="{level}%"
			>
				{level}%
			</Button>
		{/each}
	</div>

	<div class="h-5 w-px bg-border"></div>

	<!-- Row / direction display -->
	{#if uiRowNumber !== undefined}
		<span class="text-sm font-medium tabular-nums">
			{intarsia.rowLabel(uiRowNumber)}
		</span>
	{/if}
	{#if direction !== undefined}
		<span class="text-base text-muted-foreground" aria-label={direction === 'ltr' ? intarsia.directionLtr : intarsia.directionRtl}>
			{directionArrow}
		</span>
	{/if}

	<!-- RS/WS badge -->
	{#if showRsWs && rowSide}
		<span
			class="rounded-sm px-1.5 py-0.5 text-xs font-medium
			{rowSide === 'RS'
				? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
				: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}"
		>
			{rowSide}
		</span>
	{/if}

	<div class="ml-auto flex items-center gap-1.5 flex-wrap">
		<!-- RS/WS toggle -->
		<Button
			variant={showRsWs ? 'secondary' : 'outline'}
			size="xs"
			onclick={() => (showRsWs = !showRsWs)}
			aria-pressed={showRsWs}
		>
			{intarsia.showRsWs}
		</Button>

		<!-- Fabric view toggle -->
		<Button
			variant={fabricView ? 'secondary' : 'outline'}
			size="xs"
			onclick={() => (fabricView = !fabricView)}
			{disabled}
			aria-pressed={fabricView}
		>
			{intarsia.fabricView}
		</Button>

		<!-- Reading mode toggle -->
		<Button
			variant="outline"
			size="xs"
			onclick={() => (readingMode = readingMode === 'zigzag' ? 'manual' : 'zigzag')}
			aria-label={readingMode === 'zigzag' ? intarsia.readingAuto : intarsia.readingManual}
		>
			{readingMode === 'zigzag' ? intarsia.readingAuto : intarsia.readingManual}
		</Button>
	</div>
</header>
