import { describe, expect, it } from 'vitest';
import { tools } from './registry.js';

describe('tools registry', () => {
	it('has three tools', () => {
		expect(tools.length).toBe(3);
	});

	it('includes intarsia-assistant', () => {
		expect(tools.map((t) => t.slug)).toContain('intarsia-assistant');
	});

	it('has unique slugs', () => {
		const slugs = tools.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('defines href under /tools/', () => {
		for (const tool of tools) {
			expect(tool.href).toMatch(/^\/tools\/[a-z0-9-]+$/);
		}
	});
});
