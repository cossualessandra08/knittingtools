<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import PageShell from '$lib/components/site/PageShell.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<SiteHeader />
<PageShell>
	{@render children()}
</PageShell>
