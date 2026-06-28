import * as messageFns from '$lib/paraglide/messages/_index.js';
import type { MessageKey } from '$lib/tools/types.js';

export function getMessage(key: MessageKey): string {
	const fn = messageFns[key] as () => string;
	return fn();
}
