import type { Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

function effectiveUrl(url: URL) {
	if (!base) return url;
	if (url.pathname === base || url.pathname === `${base}/`) {
		url.pathname = '/';
	} else if (url.pathname.startsWith(`${base}/`)) {
		url.pathname = url.pathname.slice(base.length) || '/';
	}
	return url;
}

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(
		event.request,
		({ request, locale }) => {
			event.request = request;

			return resolve(event, {
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			});
		},
		{ effectiveRequestUrl: () => effectiveUrl(new URL(event.url)) }
	);

export const handle: Handle = handleParaglide;
