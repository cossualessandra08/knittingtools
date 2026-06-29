<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { BitmapEditor } from '$lib/data-pattern/bitmap-editor.js';

	type Tool = 'toggle' | 'brush' | 'eraser';

	let {
		editor,
		activeTool = $bindable<Tool>('toggle'),
		zoom = $bindable(100),
		zoomLevels = [50, 100, 200],
		onBackToConfigure,
		onChangeSource
	}: {
		editor: BitmapEditor | null;
		activeTool: Tool;
		zoom: number;
		zoomLevels?: readonly number[];
		onBackToConfigure: () => void;
		onChangeSource: () => void;
	} = $props();

	const tools: Array<{ id: Tool; label: string; icon: string }> = [
		{ id: 'toggle', label: 'Toggle', icon: '✏️' },
		{ id: 'brush', label: 'Brush', icon: '🖌️' },
		{ id: 'eraser', label: 'Eraser', icon: '⬜' }
	];
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-2">
		<Button type="button" variant="outline" size="sm" onclick={onBackToConfigure}>
			← {dataPattern.backToConfigure}
		</Button>
		<Button type="button" variant="ghost" size="sm" onclick={onChangeSource}>
			{dataPattern.changeSource}
		</Button>

		<div class="ml-auto flex items-center gap-1">
			{#each zoomLevels as z (z)}
				<button
					type="button"
					class="rounded px-2 py-1 text-xs font-medium transition-colors {zoom === z
						? 'bg-brand text-brand-foreground'
						: 'text-muted-foreground hover:bg-muted'}"
					onclick={() => (zoom = z)}
				>
					{z}%
				</button>
			{/each}
		</div>
	</div>

	<div class="flex gap-1">
		{#each tools as tool (tool.id)}
			<button
				type="button"
				title={tool.label}
				class="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors {activeTool ===
				tool.id
					? 'border-brand bg-brand/10 text-brand-foreground'
					: 'border-border hover:bg-muted'}"
				onclick={() => (activeTool = tool.id)}
			>
				<span aria-hidden="true">{tool.icon}</span>
				<span class="hidden sm:inline">{tool.label}</span>
			</button>
		{/each}

		<div class="ml-auto flex gap-1">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!editor?.canUndo}
				onclick={() => editor?.undo()}
			>
				↩ Undo
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!editor?.canRedo}
				onclick={() => editor?.redo()}
			>
				Redo ↪
			</Button>
		</div>
	</div>
</div>
