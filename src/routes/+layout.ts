import type { LoadEvent } from '@sveltejs/kit';
import { effectiveHref } from '$lib/i18n/effective-url.js';
import { assertIsLocale, setLocale, type Locale } from '$lib/paraglide/runtime';

export const prerender = true;
/** GitHub Pages serves locale roots as directories (`it/index.html`), not `it.html`. */
export const trailingSlash = 'always';

function localeFromHref(href: string): Locale {
	const segment = new URL(effectiveHref(href)).pathname.split('/').filter(Boolean)[0];
	return segment === 'it' ? 'it' : 'en';
}

export function load({ url }: LoadEvent) {
	setLocale(assertIsLocale(localeFromHref(url.href)));
	return {};
}
