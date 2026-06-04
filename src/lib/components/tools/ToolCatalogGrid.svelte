<script lang="ts">
	import { tools } from '$lib/tools/registry.js';
	import ToolCard from './ToolCard.svelte';
</script>

<ul class="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each tools as tool (tool.slug)}
		<li>
			<ToolCard {tool} />
		</li>
	{/each}
</ul>
