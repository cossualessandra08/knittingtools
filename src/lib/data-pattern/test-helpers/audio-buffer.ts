/** Minimal AudioBuffer for Vitest node environment. */
export function createTestAudioBuffer(
	durationSec: number,
	sampleRate = 8000,
	freq = 440
): AudioBuffer {
	const length = Math.floor(durationSec * sampleRate);
	const samples = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		samples[i] = Math.sin((i / sampleRate) * freq * 2 * Math.PI);
	}
	if (typeof globalThis.AudioBuffer !== 'undefined') {
		const buffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
		buffer.copyToChannel(samples, 0);
		return buffer;
	}
	const storage = samples;
	return {
		length,
		duration: durationSec,
		sampleRate,
		numberOfChannels: 1,
		getChannelData: (channel: number) => (channel === 0 ? storage : new Float32Array(0)),
		copyToChannel: (source: Float32Array, channel: number) => {
			if (channel === 0) storage.set(source);
		}
	} as AudioBuffer;
}
