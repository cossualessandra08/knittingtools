<script lang="ts">
	import type { Pathname } from '$app/types';
	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';

	function pathnameWithoutBase(pathname: string) {
		if (!base) return pathname;
		if (pathname === base || pathname === `${base}/`) return '/';
		if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
		return pathname;
	}
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a
			href={resolve(
				localizeHref(pathnameWithoutBase(page.url.pathname), { locale }) as Pathname
			)}
			data-sveltekit-reload
		>
			{locale}
		</a>
	{/each}
</div>
