import { describe, expect, it } from 'vitest';
import { cellPixelSize, fabricCellAspect } from './grid-layout.js';

describe('grid-layout', () => {
	describe('cellPixelSize', () => {
		it('returns base size at 100% zoom', () => {
			expect(cellPixelSize(100)).toBe(16);
			expect(cellPixelSize(100, 20)).toBe(20);
		});

		it('scales with zoom percentage', () => {
			expect(cellPixelSize(50)).toBe(8);
			expect(cellPixelSize(200)).toBe(32);
			expect(cellPixelSize(400)).toBe(64);
		});
	});

	describe('fabricCellAspect', () => {
		it('returns width greater than height for typical gauge', () => {
			const aspect = fabricCellAspect(4.5, 6.4);
			expect(aspect.width).toBeGreaterThan(aspect.height);
		});

		it('uses square aspect when gauge is invalid', () => {
			expect(fabricCellAspect(0, 6.4)).toEqual({ width: 1, height: 1 });
			expect(fabricCellAspect(4.5, 0)).toEqual({ width: 1, height: 1 });
		});
	});
});
