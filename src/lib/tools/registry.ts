/**
 * Add a tool: append an entry here and create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
import GridNineIcon from 'phosphor-svelte/lib/GridNineIcon';
import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
import RulerIcon from 'phosphor-svelte/lib/RulerIcon';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: RulerIcon,
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
		icon: GridNineIcon,
		title: 'Jacquard pattern converter',
		teaser: 'Turn a photo into a 1-bit jacquard pattern for AYAB.',
		portico: [
			'Upload a photo and convert it to a two-color knitting pattern — one pixel equals one stitch.',
			'Set your needle/row ratio so the motif is not squashed on the fabric, then export a PNG for AYAB or a chart PDF.',
			'Everything runs in your browser; your image never leaves your device.'
		]
	},
	{
		slug: 'intarsia-assistant',
		href: '/tools/intarsia-assistant',
		icon: PaletteIcon,
		title: 'Intarsia work assistant',
		teaser: 'Step-by-step guidance while you knit intarsia — row by row, stitch by stitch.',
		portico: [
			'Import a pattern or draw one on a grid, then work through it with live row highlights, colour-change instructions, and a segment bar.',
			'Navigate stitch by stitch without counting manually — the assistant tracks your position and shows what to knit next.',
			'Everything runs in your browser; your pattern and image never leave your device.'
		]
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
