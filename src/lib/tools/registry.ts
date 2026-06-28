/**
 * Add a tool: append an entry here and create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
import Ruler from '@lucide/svelte/icons/ruler';
import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: Ruler,
		title: 'Needle size chart',
		teaser: 'Look up metric and US knitting needle sizes.',
		portico: [
			'Find the metric (mm) and US label for a knitting needle size.',
			'Useful when you swap needles or read a pattern written for another sizing system.',
			'Pick a metric size below to see the matching US designation.'
		]
	},
	{
		slug: 'jacquard-pattern',
		href: '/tools/jacquard-pattern',
		icon: Grid3x3,
		title: 'Jacquard pattern converter',
		teaser: 'Turn a photo into a 1-bit jacquard pattern for AYAB.',
		portico: [
			'Upload a photo and convert it to a two-color knitting pattern — one pixel equals one stitch.',
			'Set your needle/row ratio so the motif is not squashed on the fabric, then export a PNG for AYAB or a chart PDF.',
			'Everything runs in your browser; your image never leaves your device.'
		]
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
