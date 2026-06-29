<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { intarsia } from '$lib/copy.js';
	import type { ColourEntry } from '$lib/intarsia/types.js';

	type EditorTool = 'brush' | 'eraser' | 'fill' | 'select' | 'line';

	let {
		activeTool = $bindable('brush' as EditorTool),
		activeColourId = $bindable(0),
		palette,
		canUndo = false,
		canRedo = false,
		symmetry = $bindable(false),
		visible = true,
		onUndo,
		onRedo,
		onAddColour
	}: {
		activeTool?: EditorTool;
		activeColourId?: number;
		palette: ColourEntry[];
		canUndo?: boolean;
		canRedo?: boolean;
		symmetry?: boolean;
		visible?: boolean;
		onUndo?: () => void;
		onRedo?: () => void;
		onAddColour?: (hex: string) => void;
	} = $props();

	let newColourHex = $state('#ff0000');

	const tools: { id: EditorTool; label: string; icon: string }[] = [
		{ id: 'brush', label: 'Brush', icon: '✏️' },
		{ id: 'eraser', label: 'Eraser', icon: '⬜' },
		{ id: 'fill', label: 'Fill', icon: '🪣' },
		{ id: 'select', label: 'Select', icon: '⬚' },
		{ id: 'line', label: 'Line', icon: '╱' }
	];

	const activeColour = $derived(palette.find((c) => c.id === activeColourId));
</script>

{#if visible}
	<div
		class="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-2"
	>
		<!-- Drawing tools -->
		<div class="flex items-center gap-0.5">
			{#each tools as tool (tool.id)}
				<Button
					variant={activeTool === tool.id ? 'secondary' : 'ghost'}
					size="icon-sm"
					onclick={() => (activeTool = tool.id)}
					aria-pressed={activeTool === tool.id}
					aria-label={tool.label}
					title={tool.label}
				>
					{tool.icon}
				</Button>
			{/each}
		</div>

		<div class="h-5 w-px bg-border"></div>

		<!-- Active colour picker -->
		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground">Colour</span>
			<div class="flex items-center gap-0.5">
				{#each palette as entry (entry.id)}
					<button
						class="size-5 rounded-sm border transition-all
						{activeColourId === entry.id
							? 'scale-110 border-ring ring-2 ring-ring/50'
							: 'border-border hover:scale-105'}"
						style="background-color: {entry.hex};"
						onclick={() => (activeColourId = entry.id)}
						aria-pressed={activeColourId === entry.id}
						aria-label={entry.name}
						title={entry.name}
					></button>
				{/each}
			</div>
			{#if activeColour}
				<span class="text-xs text-muted-foreground">{activeColour.name}</span>
			{/if}
			{#if onAddColour}
				<label class="flex items-center gap-1 text-xs text-muted-foreground">
					<input type="color" bind:value={newColourHex} class="size-6 cursor-pointer rounded border border-border p-0" />
					<Button
						type="button"
						variant="outline"
						size="xs"
						onclick={() => onAddColour?.(newColourHex)}
					>
						{intarsia.addColour}
					</Button>
				</label>
			{/if}
		</div>

		<div class="h-5 w-px bg-border"></div>

		<!-- Undo / Redo -->
		<div class="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon-sm"
				disabled={!canUndo}
				onclick={onUndo}
				aria-label="Undo"
				title="Undo"
			>
				↩
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				disabled={!canRedo}
				onclick={onRedo}
				aria-label="Redo"
				title="Redo"
			>
				↪
			</Button>
		</div>

		<div class="h-5 w-px bg-border"></div>

		<!-- Symmetry toggle -->
		<Button
			variant={symmetry ? 'secondary' : 'ghost'}
			size="sm"
			onclick={() => (symmetry = !symmetry)}
			aria-pressed={symmetry}
			aria-label="Symmetry"
			title="Symmetry"
		>
			⟺ Symmetry
		</Button>
	</div>
{/if}
