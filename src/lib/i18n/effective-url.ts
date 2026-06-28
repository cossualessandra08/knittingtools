import { base } from '$app/paths';

/** Strip SvelteKit `paths.base` so Paraglide URL patterns match on GitHub Pages. */
export function effectiveHref(href: string, origin = 'http://local'): string {
	const url = new URL(href, origin);
	if (!base) return url.href;
	if (url.pathname === base || url.pathname === `${base}/`) {
		url.pathname = '/';
	} else if (url.pathname.startsWith(`${base}/`)) {
		url.pathname = url.pathname.slice(base.length) || '/';
	}
	return url.href;
}
