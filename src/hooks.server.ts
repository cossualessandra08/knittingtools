import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { effectiveHref } from '$lib/i18n/effective-url.js';

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
		{ effectiveRequestUrl: () => new URL(effectiveHref(event.url.href)) }
	);

export const handle: Handle = handleParaglide;
