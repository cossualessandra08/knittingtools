<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/copy.js';
</script>

<header class="mx-auto w-full max-w-6xl border-b border-border/60 px-6 py-4 md:px-10">
	<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-foreground">
		{site.name}
	</a>
</header>
