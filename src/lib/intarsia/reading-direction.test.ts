import { describe, expect, it } from 'vitest';
import { readingDirectionForRow, rowSideForRow, rowStartStitch } from './reading-direction.js';

describe('reading-direction', () => {
	it('zigzag: row 0 ltr, row 1 rtl', () => {
		expect(readingDirectionForRow(0, 'zigzag', 'ltr')).toBe('ltr');
		expect(readingDirectionForRow(1, 'zigzag', 'ltr')).toBe('rtl');
	});

	it('manual uses manual direction for every row', () => {
		expect(readingDirectionForRow(3, 'manual', 'rtl')).toBe('rtl');
	});

	it('row 0 is RS, row 1 is WS', () => {
		expect(rowSideForRow(0)).toBe('RS');
		expect(rowSideForRow(1)).toBe('WS');
	});

	it('row start stitch follows direction', () => {
		expect(rowStartStitch('ltr', 10)).toBe(0);
		expect(rowStartStitch('rtl', 10)).toBe(9);
	});
});
