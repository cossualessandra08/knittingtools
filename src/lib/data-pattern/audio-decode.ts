export function sliceAudioBuffer(
	buffer: AudioBuffer,
	startSec: number,
	endSec: number
): AudioBuffer {
	const sampleRate = buffer.sampleRate;
	const startSample = Math.floor(startSec * sampleRate);
	const endSample = Math.floor(endSec * sampleRate);
	const samples = buffer.getChannelData(0).subarray(startSample, endSample);
	if (typeof globalThis.AudioBuffer !== 'undefined') {
		const sliced = new AudioBuffer({
			length: samples.length,
			numberOfChannels: 1,
			sampleRate
		});
		sliced.copyToChannel(samples, 0);
		return sliced;
	}
	const storage = new Float32Array(samples);
	return {
		length: storage.length,
		duration: storage.length / sampleRate,
		sampleRate,
		numberOfChannels: 1,
		getChannelData: (channel: number) => (channel === 0 ? storage : new Float32Array(0)),
		copyToChannel: (source: Float32Array, channel: number) => {
			if (channel === 0) storage.set(source);
		}
	} as AudioBuffer;
}

export function audioBufferToMono(buffer: AudioBuffer): Float32Array {
	if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
	const len = buffer.length;
	const out = new Float32Array(len);
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < len; i++) out[i] += data[i] / buffer.numberOfChannels;
	}
	return out;
}

export function rms(samples: Float32Array): number {
	if (samples.length === 0) return 0;
	let sum = 0;
	for (const s of samples) sum += s * s;
	return Math.sqrt(sum / samples.length);
}
