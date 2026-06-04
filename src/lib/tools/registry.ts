/**
 * Add a tool: append an entry here, add messages in messages/{en,it}.json,
 * create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
import Ruler from '@lucide/svelte/icons/ruler';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: Ruler,
		titleKey: 'tool_needle_title',
		teaserKey: 'tool_needle_card_teaser',
		porticoKeys: ['tool_needle_portico_1', 'tool_needle_portico_2', 'tool_needle_portico_3']
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
