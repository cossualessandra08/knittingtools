<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import DataPatternEditor from '$lib/components/data-pattern/DataPatternEditor.svelte';
	import { tools } from '$lib/tools/registry.js';

	const tool = tools.find((t) => t.slug === 'data-pattern')!;
</script>

<ToolPageLayout {tool} wide>
	<DataPatternEditor />
</ToolPageLayout>
