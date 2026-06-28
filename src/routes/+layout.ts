import type { LoadEvent } from '@sveltejs/kit';
import { localeFromHref } from '$lib/i18n/locale-from-url.js';
import { assertIsLocale, setLocale } from '$lib/paraglide/runtime';

export const prerender = true;
/** GitHub Pages serves locale roots as directories (`it/index.html`), not `it.html`. */
export const trailingSlash = 'always';

export function load({ url }: LoadEvent) {
	setLocale(assertIsLocale(localeFromHref(url.href)), { reload: false });
	return {};
}
