<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/copy.js';
</script>

<header class="mx-auto w-full max-w-6xl border-b border-border/40 px-6 py-3 md:px-10">
	<a href={resolve('/')} class="font-heading text-lg font-medium tracking-tight text-foreground">
		{site.name}
	</a>
</header>
