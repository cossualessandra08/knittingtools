<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { getMessage } from '$lib/i18n/get-message.js';
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

	const title = $derived(getMessage(tool.titleKey));
	const portico = $derived(tool.porticoKeys.map((key) => getMessage(key)));
	const Icon = $derived(tool.icon);
</script>

<section class="space-y-4">
	<div class="flex size-14 items-center justify-center rounded-xl border text-brand">
		<Icon class="size-7" aria-hidden="true" />
	</div>
	<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
	<div class="max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
		{#each portico as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>

<div class="my-10 border-t border-border"></div>

<section class={wide ? 'max-w-6xl' : 'max-w-2xl'}>
	{@render children()}
</section>

<p class="mt-12">
	<a
		href={localizedHref('/')}
		data-sveltekit-reload
		class="font-medium text-brand hover:underline"
	>
		← {m.back_to_catalog()}
	</a>
</p>
