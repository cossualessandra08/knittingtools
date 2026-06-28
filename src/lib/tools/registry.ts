/**
 * Add a tool: append an entry here, add messages in messages/{en,it}.json,
 * create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
import Ruler from '@lucide/svelte/icons/ruler';
import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: Ruler,
		titleKey: 'tool_needle_title',
		teaserKey: 'tool_needle_card_teaser',
		porticoKeys: ['tool_needle_portico_1', 'tool_needle_portico_2', 'tool_needle_portico_3']
	},
	{
		slug: 'jacquard-pattern',
		href: '/tools/jacquard-pattern',
		icon: Grid3x3,
		titleKey: 'tool_jacquard_title',
		teaserKey: 'tool_jacquard_card_teaser',
		porticoKeys: [
			'tool_jacquard_portico_1',
			'tool_jacquard_portico_2',
			'tool_jacquard_portico_3'
		]
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
