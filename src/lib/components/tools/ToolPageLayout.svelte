<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { site } from '$lib/copy.js';
	import type { ToolDefinition } from '$lib/tools/types.js';

	let {
		tool,
		wide = false,
		children
	}: {
		tool: ToolDefinition;
		wide?: boolean;
		children: Snippet;
	} = $props();

	const Icon = $derived(tool.icon);
</script>

<section class="space-y-4">
	<Icon size={28} weight="regular" class="text-foreground" aria-hidden="true" />
	<h1 class="font-heading text-3xl font-medium tracking-tight">{tool.title}</h1>
	<div class="max-w-2xl space-y-3 text-base font-light leading-relaxed text-muted-foreground">
		{#each tool.portico as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>

<div class="my-10 border-t border-border"></div>

<section class={wide ? 'w-full' : 'max-w-2xl'}>
	{@render children()}
</section>

<p class="mt-12">
	<a
		href={resolve('/')}
		class="font-medium text-foreground transition-colors hover:bg-hub-hover hover:underline"
	>
		← {site.backToCatalog}
	</a>
</p>
