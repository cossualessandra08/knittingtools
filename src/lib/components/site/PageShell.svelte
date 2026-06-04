<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-12">
	{@render children()}
</div>
