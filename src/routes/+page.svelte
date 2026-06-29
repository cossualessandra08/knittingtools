<script lang="ts">
	import { site } from '$lib/copy.js';
	import ToolCatalogGrid from '$lib/components/tools/ToolCatalogGrid.svelte';
</script>

<section class="mb-12 max-w-2xl space-y-3">
	<h1 class="font-heading text-3xl font-medium tracking-tight md:text-4xl">{site.name}</h1>
	<p class="text-lg font-light leading-relaxed text-muted-foreground">{site.tagline}</p>
</section>

<section class="space-y-6">
	<h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{site.catalogHeading}
	</h2>
	<ToolCatalogGrid />
</section>
