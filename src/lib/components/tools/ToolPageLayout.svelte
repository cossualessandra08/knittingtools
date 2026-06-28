<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Pathname } from '$app/types';
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
	<div class="flex size-14 items-center justify-center rounded-xl border text-brand">
		<Icon class="size-7" aria-hidden="true" />
	</div>
	<h1 class="text-3xl font-semibold tracking-tight">{tool.title}</h1>
	<div class="max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
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
	<a href={resolve('/')} class="font-medium text-brand hover:underline">
		← {site.backToCatalog}
	</a>
</p>
