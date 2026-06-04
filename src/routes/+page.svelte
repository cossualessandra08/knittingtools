<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ToolCatalogGrid from '$lib/components/tools/ToolCatalogGrid.svelte';
</script>

<section class="mb-12 max-w-2xl space-y-3">
	<h1 class="text-3xl font-semibold tracking-tight md:text-4xl">{m.site_name()}</h1>
	<p class="text-lg leading-relaxed text-muted-foreground">{m.site_tagline()}</p>
</section>

<section class="space-y-6">
	<h2 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
		{m.catalog_heading()}
	</h2>
	<ToolCatalogGrid />
</section>
