import { AUDIO_SEGMENT_THRESHOLD_SEC, DEFAULT_AUDIO_SEGMENT_SEC } from '../constants.js';
import { audioBufferToMono, rms, sliceAudioBuffer } from '../audio-decode.js';
import { audioRowsFromDuration } from '../dimensions.js';
import { applySensitivity, normalizeMatrix, spatialSmooth } from '../matrix-utils.js';
import type {
	AudioFileConfig,
	SharedConfig,
	SourceAdapter,
	SourceMatrix
} from '../types.js';

export interface AudioFileInput {
	buffer: AudioBuffer;
}

export function effectiveSegment(
	buffer: AudioBuffer,
	segmentStartSec: number,
	segmentEndSec: number
): { start: number; end: number } {
	if (buffer.duration <= AUDIO_SEGMENT_THRESHOLD_SEC) {
		return { start: 0, end: buffer.duration };
	}
	return { start: segmentStartSec, end: segmentEndSec };
}

function buildWaveformMatrix(samples: Float32Array, stitches: number, rows: number): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	const amps = new Float32Array(stitches);
	for (let c = 0; c < stitches; c++) {
		const start = Math.floor((c / stitches) * samples.length);
		const end = Math.floor(((c + 1) / stitches) * samples.length);
		amps[c] = rms(samples.subarray(start, Math.max(start + 1, end)));
	}
	const min = Math.min(...amps);
	const max = Math.max(...amps);
	const span = max - min || 1;
	for (let c = 0; c < stitches; c++) amps[c] = (amps[c] - min) / span;
	for (let c = 0; c < stitches; c++) {
		const targetRow = Math.floor(amps[c] * rows);
		const clamped = Math.min(rows - 1, Math.max(0, targetRow));
		values[clamped * stitches + c] = 1;
	}
	return { width: stitches, height: rows, values };
}

function buildSpectrogramMatrix(samples: Float32Array, stitches: number, rows: number): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	for (let c = 0; c < stitches; c++) {
		const start = Math.floor((c / stitches) * samples.length);
		const end = Math.floor(((c + 1) / stitches) * samples.length);
		const slice = samples.subarray(start, Math.max(start + 1, end));
		for (let r = 0; r < rows; r++) {
			const bandStart = Math.floor((r / rows) * slice.length);
			const bandEnd = Math.floor(((r + 1) / rows) * slice.length);
			let sum = 0;
			for (let i = bandStart; i < bandEnd; i++) sum += slice[i] * slice[i];
			values[r * stitches + c] = Math.sqrt(sum / Math.max(1, bandEnd - bandStart));
		}
	}
	return { width: stitches, height: rows, values };
}

export const audioFileAdapter: SourceAdapter<AudioFileInput, AudioFileConfig> = {
	id: 'audio-file',
	estimateRows(input, config) {
		const seg = effectiveSegment(input.buffer, config.segmentStartSec, config.segmentEndSec);
		return audioRowsFromDuration(seg.end - seg.start);
	},
	async analyze(input, config, shared) {
		const seg = effectiveSegment(input.buffer, config.segmentStartSec, config.segmentEndSec);
		const duration = seg.end - seg.start;
		const sliced = sliceAudioBuffer(input.buffer, seg.start, seg.end);
		const samples = audioBufferToMono(sliced);
		const rows = audioRowsFromDuration(duration);
		const matrix =
			config.analysisMode === 'waveform'
				? buildWaveformMatrix(samples, shared.stitches, rows)
				: buildSpectrogramMatrix(samples, shared.stitches, rows);
		applySensitivity(matrix, config.sensitivity);
		spatialSmooth(matrix, config.smoothing);
		normalizeMatrix(matrix);
		return matrix;
	}
};

export function defaultAudioSegment(buffer: AudioBuffer): { start: number; end: number } {
	if (buffer.duration <= AUDIO_SEGMENT_THRESHOLD_SEC) {
		return { start: 0, end: buffer.duration };
	}
	return { start: 0, end: Math.min(DEFAULT_AUDIO_SEGMENT_SEC, buffer.duration) };
}
