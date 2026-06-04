<script lang="ts">
	import type { Pathname } from '$app/types';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';

	const locale = $derived(getLocale());

	function localeHref(target: (typeof locales)[number]) {
		return resolve(localizeHref(page.url.pathname as Pathname, { locale: target }) as Pathname);
	}
</script>

<header
	class="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-border/60 px-6 py-4 md:px-10"
>
	<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-foreground">
		{m.site_name()}
	</a>
	<nav aria-label="Language" class="flex items-center gap-1 text-sm">
		{#each locales as loc, index (loc)}
			{#if index > 0}
				<span class="text-muted-foreground" aria-hidden="true">|</span>
			{/if}
			<a
				href={localeHref(loc)}
				data-sveltekit-reload
				class="rounded px-2 py-1 transition-colors {locale === loc
					? 'bg-brand font-medium text-brand-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
				aria-current={locale === loc ? 'page' : undefined}
			>
				{loc === 'it' ? m.locale_it() : m.locale_en()}
			</a>
		{/each}
	</nav>
</header>
