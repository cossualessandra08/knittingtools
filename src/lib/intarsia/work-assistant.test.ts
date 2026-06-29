import { describe, expect, it } from 'vitest';
import {
	prevStitch,
	nextStitch,
	prevRow,
	nextRow,
	jumpToRow,
	setStitchPosition
} from './work-assistant.js';
import type { IntarsiaSettings } from './types.js';

const settings: IntarsiaSettings = {
	projectName: 'Test',
	readingMode: 'zigzag',
	manualDirection: 'ltr',
	showRsWs: true,
	fabricView: false,
	stitchesPerCm: 4.5,
	rowsPerCm: 6.4,
	zoom: 100
};

describe('work-assistant', () => {
	it('nextStitch moves ltr and stops at row end', () => {
		expect(nextStitch({ row: 0, stitch: 0 }, 5, settings).stitch).toBe(1);
		expect(nextStitch({ row: 0, stitch: 4 }, 5, settings).stitch).toBe(4);
	});

	it('prevStitch moves rtl on row 1', () => {
		const pos = { row: 1, stitch: 3 };
		expect(prevStitch(pos, 5, settings).stitch).toBe(2);
	});

	it('nextRow advances and resets stitch to row start', () => {
		const pos = nextRow({ row: 0, stitch: 4 }, 5, 3, settings);
		expect(pos.row).toBe(1);
		expect(pos.stitch).toBe(4);
	});

	it('jumpToRow resets stitch for reading direction', () => {
		expect(jumpToRow(2, 5, settings).stitch).toBe(0);
	});

	it('setStitchPosition clamps to grid', () => {
		expect(setStitchPosition({ row: 0, stitch: 0 }, 0, 99, 5, 3).stitch).toBe(4);
	});
});
