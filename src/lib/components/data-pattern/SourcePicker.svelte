<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import type { SourceId } from '$lib/data-pattern/types.js';

	let {
		selected = $bindable<SourceId | null>(null)
	}: {
		selected: SourceId | null;
	} = $props();

	const sources: Array<{
		id: SourceId;
		label: string;
		badge: string;
		badgeHref?: string;
		icon: string;
	}> = [
		{
			id: 'voice',
			label: dataPattern.sourceVoice,
			badge: dataPattern.runsLocally,
			icon: '🎙️'
		},
		{
			id: 'audio-file',
			label: dataPattern.sourceAudio,
			badge: dataPattern.runsLocally,
			icon: '🎵'
		},
		{
			id: 'terrain',
			label: dataPattern.sourceTerrain,
			badge: dataPattern.usesExternalMap,
			badgeHref: '#terrain-privacy',
			icon: '🗺️'
		}
	];
</script>

<div class="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Data source">
	{#each sources as source (source.id)}
		<button
			type="button"
			role="radio"
			aria-checked={selected === source.id}
			class="flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50 {selected ===
			source.id
				? 'border-brand bg-brand/5'
				: 'border-border bg-background'}"
			onclick={() => (selected = source.id)}
		>
			<span class="text-2xl" aria-hidden="true">{source.icon}</span>
			<span class="text-sm font-medium">{source.label}</span>
			{#if source.badgeHref}
				<span class="text-xs text-amber-700">
					{source.badge}
					— <a
						href={source.badgeHref}
						class="underline"
						onclick={(e) => e.stopPropagation()}
						>{dataPattern.whatIsSent}</a
					>
				</span>
			{:else}
				<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
					{source.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>

<p id="terrain-privacy" class="sr-only">
	Terrain mode sends only the selected map area coordinates (bounding box) to Open-Elevation for
	elevation data. No personal data is sent.
</p>
