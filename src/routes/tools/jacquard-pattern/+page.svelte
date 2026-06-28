<script lang="ts">
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import JacquardEditor from '$lib/components/jacquard/JacquardEditor.svelte';
	import { tools } from '$lib/tools/registry.js';

	const tool = tools.find((t) => t.slug === 'jacquard-pattern')!;
</script>

<ToolPageLayout {tool} wide>
	<JacquardEditor />
</ToolPageLayout>
