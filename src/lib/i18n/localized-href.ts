import type { Pathname } from '$app/types';
import { base, resolve } from '$app/paths';
import { deLocalizeUrl, localizeHref, type Locale } from '$lib/paraglide/runtime';

function pathnameWithoutBase(pathname: string) {
	if (!base) return pathname;
	if (pathname === base || pathname === `${base}/`) return '/';
	if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
	return pathname;
}

/** Match SvelteKit `trailingSlash: 'always'` for GitHub Pages directory URLs. */
function withTrailingSlash(path: string): string {
	if (path === '/' || path.endsWith('/')) return path;
	return `${path}/`;
}

function delocalizedPathname(pathname: string, origin = 'http://local') {
	return deLocalizeUrl(new URL(pathnameWithoutBase(pathname), origin)).pathname;
}

export function localizedHref(pathname: string, locale?: Locale): string {
	const delocalized = delocalizedPathname(pathname);
	const localized = locale
		? localizeHref(delocalized as Pathname, { locale })
		: localizeHref(delocalized as Pathname);
	return resolve(withTrailingSlash(localized) as Pathname);
}

export function localizedHrefFromPageUrl(url: URL, locale: Locale): string {
	const delocalized = delocalizedPathname(url.pathname, url.origin);
	return resolve(
		withTrailingSlash(localizeHref(delocalized as Pathname, { locale })) as Pathname
	);
}
