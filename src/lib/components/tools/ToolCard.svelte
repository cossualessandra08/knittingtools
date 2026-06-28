<script lang="ts">
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ToolDefinition } from '$lib/tools/types.js';
	import { getMessage } from '$lib/i18n/get-message.js';

	let { tool }: { tool: ToolDefinition } = $props();

	const title = $derived(getMessage(tool.titleKey));
	const teaser = $derived(getMessage(tool.teaserKey));
	const Icon = $derived(tool.icon);
</script>

<a
	href={localizedHref(tool.href)}
	data-sveltekit-reload
	class="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
>
	<Card.Root
		class="h-full border-border transition-shadow group-hover:border-brand/40 group-hover:shadow-sm"
	>
		<Card.Header class="gap-4">
			<div
				class="flex size-10 items-center justify-center rounded-lg border text-muted-foreground group-hover:text-brand"
			>
				<Icon class="size-5" aria-hidden="true" />
			</div>
			<Card.Title class="text-base font-semibold">{title}</Card.Title>
			<Card.Description class="text-sm leading-relaxed text-muted-foreground">
				{teaser}
			</Card.Description>
		</Card.Header>
	</Card.Root>
</a>
