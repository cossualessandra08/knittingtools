import { describe, expect, it } from 'vitest';
import { voiceAdapter } from './voice.js';
import { audioRowsFromDuration } from '../dimensions.js';
import { createTestAudioBuffer } from '../test-helpers/audio-buffer.js';

describe('voiceAdapter', () => {
	it('estimateRows matches duration formula', () => {
		const buffer = createTestAudioBuffer(15);
		expect(
			voiceAdapter.estimateRows(
				buffer,
				{ sensitivity: 1, smoothing: 0 },
				{ stitches: 10, stitchesPerCm: 4.5, rowsPerCm: 6.4 }
			)
		).toBe(audioRowsFromDuration(15));
	});

	it('analyze returns matrix with non-flat values for tone', async () => {
		const buffer = createTestAudioBuffer(5);
		const matrix = await voiceAdapter.analyze(
			buffer,
			{ sensitivity: 1, smoothing: 0 },
			{ stitches: 8, stitchesPerCm: 4.5, rowsPerCm: 6.4 }
		);
		expect(matrix.width).toBe(8);
		expect(matrix.values.length).toBe(matrix.width * matrix.height);
		const max = Math.max(...matrix.values);
		const min = Math.min(...matrix.values);
		expect(max).toBeGreaterThan(min);
	});
});
