<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import type { ToolDefinition } from '$lib/tools/types.js';

	let { tool }: { tool: ToolDefinition } = $props();

	const Icon = $derived(tool.icon);
</script>

<a
	href={resolve(`${tool.href}/` as Pathname)}
	class="block h-full border border-border p-6 transition-colors duration-150 hover:bg-hub-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
>
	<div class="flex flex-col gap-3">
		<Icon size={20} weight="regular" class="text-foreground" aria-hidden="true" />
		<h3 class="text-base font-medium text-foreground">{tool.title}</h3>
		<p class="text-sm font-light leading-relaxed text-muted-foreground">{tool.teaser}</p>
	</div>
</a>
