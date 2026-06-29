<script lang="ts">
	import { intarsia } from '$lib/copy.js';
	import type { ColourEntry, RowAnalysis } from '$lib/intarsia/types.js';

	let {
		analysis,
		palette,
		uiRowNumber,
		direction,
		rowSide = null,
		showRsWs = true
	}: {
		analysis: RowAnalysis;
		palette: ColourEntry[];
		uiRowNumber: number;
		direction: 'ltr' | 'rtl';
		rowSide?: 'RS' | 'WS' | null;
		showRsWs?: boolean;
	} = $props();

	const colourMap = $derived.by(() => {
		const m: Record<number, ColourEntry> = {};
		for (const c of palette) m[c.id] = c;
		return m;
	});

	const directionArrow = $derived(direction === 'ltr' ? '→' : '←');

	function colourName(id: number): string {
		return colourMap[id]?.name ?? `Colour ${id}`;
	}

	function colourHex(id: number): string {
		return colourMap[id]?.hex ?? '#cccccc';
	}
</script>

<div class="flex flex-col gap-3 text-sm">
	<!-- Row header -->
	<div class="flex items-center gap-2 font-semibold">
		<span>{intarsia.rowLabel(uiRowNumber)}</span>
		<span class="text-muted-foreground">{directionArrow}</span>
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
	</div>

	<!-- Run list -->
	<ol class="flex flex-col gap-1">
		{#each analysis.runs as run, i (i)}
			<li class="flex items-center gap-2">
				<span
					class="inline-block size-3.5 shrink-0 rounded-sm border border-border"
					style="background-color: {colourHex(run.colourId)};"
				></span>
				<span class="tabular-nums">{run.length}</span>
				<span class="text-muted-foreground">{colourName(run.colourId)}</span>
			</li>
		{/each}
	</ol>

	<!-- Colour totals -->
	{#if analysis.totalsByColour.size > 0}
		<div class="border-t border-border pt-2">
			<ul class="flex flex-col gap-0.5 text-xs text-muted-foreground">
				{#each [...analysis.totalsByColour.entries()] as [id, count] (id)}
					<li class="flex items-center gap-1.5">
						<span
							class="inline-block size-2.5 shrink-0 rounded-sm border border-border"
							style="background-color: {colourHex(id)};"
						></span>
						<span>{colourName(id)}:</span>
						<span class="font-medium text-foreground tabular-nums">{count}</span>
					</li>
				{/each}
				<li class="mt-1 font-medium text-foreground">
					{intarsia.totalStitches(analysis.totalStitches)}
				</li>
			</ul>
		</div>
	{/if}
</div>
