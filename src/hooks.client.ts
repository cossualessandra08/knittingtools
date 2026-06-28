import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { localeFromHref } from '$lib/i18n/locale-from-url.js';

overwriteGetLocale(() => localeFromHref(window.location.href));
