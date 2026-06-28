import type { Component } from 'svelte';

export type ToolDefinition = {
	slug: string;
	href: `/tools/${string}`;
	icon: Component;
	title: string;
	teaser: string;
	portico: [string, string, string];
};
