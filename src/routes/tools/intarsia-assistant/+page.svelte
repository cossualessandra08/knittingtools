<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import IntarsiaEditor from '$lib/components/intarsia/IntarsiaEditor.svelte';
	import { tools } from '$lib/tools/registry.js';

	const tool = tools.find((t) => t.slug === 'intarsia-assistant')!;
</script>

<ToolPageLayout {tool} wide>
	<div class="intarsia-page-shell">
		<IntarsiaEditor />
	</div>
</ToolPageLayout>

<style>
	.intarsia-page-shell {
		/* Give the editor a fixed height so the internal grid layout can fill it */
		height: 75dvh;
		min-height: 500px;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.intarsia-page-shell {
			height: auto;
			min-height: 0;
		}
	}
</style>
