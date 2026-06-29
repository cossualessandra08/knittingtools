<script lang="ts">
	import { intarsia } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ColourEntry } from '$lib/intarsia/types.js';

	let {
		palette = $bindable([]),
		onRename,
		onMerge,
		onHexChange,
		onAddColour
	}: {
		palette?: ColourEntry[];
		onRename?: (id: number, name: string) => void;
		onMerge?: (fromId: number, intoId: number) => void;
		onHexChange?: (id: number, hex: string) => void;
		onAddColour?: (hex: string) => void;
	} = $props();

	let mergeFrom = $state<number | ''>('');
	let mergeInto = $state<number | ''>('');
	let newColourHex = $state('#ff0000');

	function handleRename(id: number, value: string) {
		onRename?.(id, value);
	}

	function handleMerge() {
		if (mergeFrom === '' || mergeInto === '' || mergeFrom === mergeInto) return;
		onMerge?.(mergeFrom, mergeInto);
		mergeFrom = '';
		mergeInto = '';
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Colour swatches with editable names -->
	<ul class="flex flex-col gap-2">
		{#each palette as entry (entry.id)}
			<li class="flex items-center gap-2">
				<label class="sr-only" for="colour-hex-{entry.id}">Colour for {entry.name}</label>
				<input
					id="colour-hex-{entry.id}"
					type="color"
					value={entry.hex}
					class="size-5 shrink-0 cursor-pointer rounded-sm border border-border p-0"
					oninput={(e) => onHexChange?.(entry.id, (e.currentTarget as HTMLInputElement).value)}
					aria-label="Change colour for {entry.name}"
				/>
				<Label for="colour-name-{entry.id}" class="sr-only">Colour name for {entry.hex}</Label>
				<Input
					id="colour-name-{entry.id}"
					value={entry.name}
					oninput={(e) => handleRename(entry.id, (e.currentTarget as HTMLInputElement).value)}
					class="h-7 text-xs"
					aria-label="Name for {entry.hex}"
				/>
			</li>
		{/each}
	</ul>

	{#if onAddColour}
		<div class="flex items-center gap-2">
			<input
				type="color"
				bind:value={newColourHex}
				class="size-8 cursor-pointer rounded border border-border p-0"
				aria-label="New colour"
			/>
			<Button type="button" variant="outline" size="sm" onclick={() => onAddColour(newColourHex)}>
				{intarsia.addColour}
			</Button>
		</div>
	{/if}

	<!-- Merge UI -->
	{#if palette.length >= 2}
		<div class="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
			<span class="text-xs font-medium text-muted-foreground">{intarsia.mergeColours}</span>
			<div class="flex items-center gap-2">
				<select
					bind:value={mergeFrom}
					class="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring"
					aria-label="Merge from colour"
				>
					<option value="">From…</option>
					{#each palette as entry (entry.id)}
						<option value={entry.id}>{entry.name}</option>
					{/each}
				</select>
				<span class="text-xs text-muted-foreground">→</span>
				<select
					bind:value={mergeInto}
					class="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring"
					aria-label="Merge into colour"
				>
					<option value="">Into…</option>
					{#each palette.filter((e) => e.id !== mergeFrom) as entry (entry.id)}
						<option value={entry.id}>{entry.name}</option>
					{/each}
				</select>
				<Button
					size="xs"
					variant="outline"
					disabled={mergeFrom === '' || mergeInto === '' || mergeFrom === mergeInto}
					onclick={handleMerge}
				>
					{intarsia.mergeColours}
				</Button>
			</div>
		</div>
	{/if}
</div>
