<script lang="ts">
	import type { ColourEntry, ColourRun } from '$lib/intarsia/types.js';

	let {
		runs,
		palette,
		activeSegmentIndex,
		completedThroughIndex
	}: {
		runs: ColourRun[];
		palette: ColourEntry[];
		activeSegmentIndex: number;
		/** Index of the last fully-completed segment (-1 = none). */
		completedThroughIndex: number;
	} = $props();

	const colourMap = $derived.by(() => {
		const m = new Map<number, ColourEntry>();
		for (const c of palette) m.set(c.id, c);
		return m;
	});

	function hex(id: number): string {
		return colourMap.get(id)?.hex ?? '#cccccc';
	}

	/** Width of each block proportional to run length (min 24px). */
	function blockStyle(run: ColourRun): string {
		const minPx = 24;
		const px = Math.max(minPx, run.length * 6);
		return `width: ${px}px; background-color: ${hex(run.colourId)};`;
	}
</script>

<div class="flex items-center gap-1 overflow-x-auto py-1">
	{#each runs as run, i (i)}
		{@const isCompleted = i <= completedThroughIndex}
		{@const isActive = i === activeSegmentIndex}
		<div
			class="relative flex shrink-0 items-center justify-center rounded-sm border transition-all
			{isActive
				? 'border-blue-500 ring-2 ring-blue-400/50'
				: isCompleted
					? 'border-border opacity-60'
					: 'border-border'}"
			style="{blockStyle(run)} height: 2rem;"
			title="{run.length} {colourMap.get(run.colourId)?.name ?? `Colour ${run.colourId}`}"
			aria-label="{run.length} stitches, segment {i + 1}"
		>
			{#if isCompleted}
				<!-- checkmark overlay -->
				<span
					class="pointer-events-none select-none text-xs font-bold drop-shadow"
					style="color: {hex(run.colourId) === '#ffffff' || hex(run.colourId) === '#FFFFFF'
						? '#444'
						: 'white'};"
				>
					✓
				</span>
			{:else if isActive}
				<!-- active triangle -->
				<span
					class="pointer-events-none select-none text-xs font-bold drop-shadow"
					style="color: {hex(run.colourId) === '#ffffff' || hex(run.colourId) === '#FFFFFF'
						? '#444'
						: 'white'};"
				>
					▶
				</span>
			{/if}
		</div>
	{/each}
</div>
