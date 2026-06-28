import { describe, expect, it } from 'vitest';
import { docsFilename, computeAnnotationLayout } from './export-docs.js';

describe('docsFilename', () => {
	it('builds documentation png name', () => {
		expect(docsFilename(80, 120, 'png')).toBe('pattern-80x120-docs.png');
	});
});

describe('computeAnnotationLayout', () => {
	it('allocates margin for row and column labels', () => {
		const gauge = { stitchesPerCm: 4.5, rowsPerCm: 6.4 };
		const layout = computeAnnotationLayout(100, 200, false, gauge);
		expect(layout.marginLeft).toBeGreaterThan(20);
		expect(layout.marginTop).toBeGreaterThan(10);
		expect(layout.patternWidth).toBe(100 * 8);
	});
});
