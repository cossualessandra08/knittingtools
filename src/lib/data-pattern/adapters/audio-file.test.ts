import { describe, expect, it } from 'vitest';
import { audioFileAdapter, effectiveSegment } from './audio-file.js';
import { createTestAudioBuffer } from '../test-helpers/audio-buffer.js';

describe('effectiveSegment', () => {
	it('uses full file when duration <= 60s', () => {
		const buffer = createTestAudioBuffer(30);
		expect(effectiveSegment(buffer, 0, 30)).toEqual({ start: 0, end: 30 });
	});
});

describe('audioFileAdapter', () => {
	it('waveform and spectrogram produce different matrices', async () => {
		const buffer = createTestAudioBuffer(5);
		const shared = { stitches: 16, stitchesPerCm: 4.5, rowsPerCm: 6.4 };
		const waveform = await audioFileAdapter.analyze(
			{ buffer },
			{
				analysisMode: 'waveform',
				sensitivity: 1,
				smoothing: 0,
				segmentStartSec: 0,
				segmentEndSec: 5
			},
			shared
		);
		const spectrogram = await audioFileAdapter.analyze(
			{ buffer },
			{
				analysisMode: 'spectrogram',
				sensitivity: 1,
				smoothing: 0,
				segmentStartSec: 0,
				segmentEndSec: 5
			},
			shared
		);
		expect(Array.from(waveform.values)).not.toEqual(Array.from(spectrogram.values));
	});
});
