import type { Pathname } from '$app/types';
import { resolve } from '$app/paths';
import { effectiveHref } from '$lib/i18n/effective-url.js';
import { deLocalizeUrl, localizeHref, type Locale } from '$lib/paraglide/runtime';

/** Match SvelteKit `trailingSlash: 'always'` for GitHub Pages directory URLs. */
function withTrailingSlash(path: string): string {
	if (path === '/' || path.endsWith('/')) return path;
	return `${path}/`;
}

function delocalizedPathname(href: string) {
	return deLocalizeUrl(new URL(effectiveHref(href))).pathname;
}

export function localizedHref(pathname: string, locale?: Locale): string {
	const delocalized = delocalizedPathname(pathname);
	const localized = locale
		? localizeHref(delocalized as Pathname, { locale })
		: localizeHref(delocalized as Pathname);
	return resolve(withTrailingSlash(localized) as Pathname);
}

export function localizedHrefFromPageUrl(url: URL, locale: Locale): string {
	const delocalized = deLocalizeUrl(new URL(effectiveHref(url.href))).pathname;
	return resolve(
		withTrailingSlash(localizeHref(delocalized as Pathname, { locale })) as Pathname
	);
}
