import type { Reroute } from '@sveltejs/kit';
import { base } from '$app/paths';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

function pathnameWithoutBase(pathname: string) {
	if (!base) return pathname;
	if (pathname === base || pathname === `${base}/`) return '/';
	if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
	return pathname;
}

export const reroute: Reroute = (request) => {
	const delocalized = deLocalizeUrl(
		new URL(pathnameWithoutBase(request.url.pathname), request.url)
	).pathname;

	if (!base) return delocalized;

	return `${base}${delocalized === '/' ? '' : delocalized}`;
};
