import { effectiveHref } from '$lib/i18n/effective-url.js';
import type { Locale } from '$lib/paraglide/runtime';

/** First path segment after stripping `paths.base` — `it` or default `en`. */
export function localeFromHref(href: string): Locale {
	const segment = new URL(effectiveHref(href)).pathname.split('/').filter(Boolean)[0];
	return segment === 'it' ? 'it' : 'en';
}
