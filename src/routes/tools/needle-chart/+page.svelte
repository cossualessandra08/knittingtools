<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import { tools } from '$lib/tools/registry.js';
	import { needleSizes } from '$lib/tools/needle-sizes.js';

	const tool = tools.find((t) => t.slug === 'needle-chart')!;
	let selectedMm = $state<number>(needleSizes[4].mm);

	const selected = $derived(needleSizes.find((row) => row.mm === selectedMm) ?? needleSizes[0]);
</script>

<ToolPageLayout {tool}>
	<label for="needle-mm" class="mb-2 block text-sm font-medium">Metric (mm)</label>
	<select
		id="needle-mm"
		class="mb-6 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
		bind:value={selectedMm}
	>
		{#each needleSizes as row (row.mm)}
			<option value={row.mm}>{row.mm}</option>
		{/each}
	</select>

	<dl class="grid max-w-xs gap-2 text-sm">
		<div class="flex justify-between gap-4 border-b py-2">
			<dt class="text-muted-foreground">Metric (mm)</dt>
			<dd class="font-medium">{selected.mm}</dd>
		</div>
		<div class="flex justify-between gap-4 border-b py-2">
			<dt class="text-muted-foreground">US</dt>
			<dd class="font-medium">{selected.us}</dd>
		</div>
	</dl>
</ToolPageLayout>
