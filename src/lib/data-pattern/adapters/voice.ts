import { audioBufferToMono, rms } from '../audio-decode.js';
import { audioRowsFromDuration } from '../dimensions.js';
import { applySensitivity, normalizeMatrix, spatialSmooth } from '../matrix-utils.js';
import type { SharedConfig, SourceAdapter, SourceMatrix, VoiceConfig } from '../types.js';

function buildVoiceMatrix(samples: Float32Array, stitches: number, rows: number): SourceMatrix {
	const values = new Float32Array(stitches * rows);
	const totalSamples = samples.length;
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < stitches; c++) {
			const cell = r * stitches + c;
			const start = Math.floor((cell / (stitches * rows)) * totalSamples);
			const end = Math.floor(((cell + 1) / (stitches * rows)) * totalSamples);
			values[cell] = rms(samples.subarray(start, Math.max(start + 1, end)));
		}
	}
	return { width: stitches, height: rows, values };
}

export const voiceAdapter: SourceAdapter<AudioBuffer, VoiceConfig> = {
	id: 'voice',
	estimateRows(buffer) {
		return audioRowsFromDuration(buffer.duration);
	},
	async analyze(buffer, config, shared) {
		const rows = audioRowsFromDuration(buffer.duration);
		const samples = audioBufferToMono(buffer);
		const matrix = buildVoiceMatrix(samples, shared.stitches, rows);
		applySensitivity(matrix, config.sensitivity);
		spatialSmooth(matrix, config.smoothing);
		normalizeMatrix(matrix);
		return matrix;
	}
};
