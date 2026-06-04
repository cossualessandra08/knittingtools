import type { Component } from 'svelte';
import * as messageFns from '$lib/paraglide/messages/_index.js';

export type MessageKey = keyof typeof messageFns;

export type ToolDefinition = {
	slug: string;
	href: `/tools/${string}`;
	icon: Component;
	titleKey: MessageKey;
	teaserKey: MessageKey;
	porticoKeys: [MessageKey, MessageKey, MessageKey];
};
