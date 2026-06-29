/** Resolve a canvas stroke color from theme (supports oklch/hsl CSS variables). */
export function canvasStrokeColor(canvas: HTMLCanvasElement): string {
	const { color } = getComputedStyle(canvas);
	return color && color !== 'rgba(0, 0, 0, 0)' ? color : 'currentColor';
}

/** Static mini-waveform from decoded audio (matches AudioConfig style). */
export function drawAudioBufferWaveform(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer): void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const data = audioBuffer.getChannelData(0);
	const w = canvas.offsetWidth || 300;
	const h = canvas.height || 48;
	canvas.width = w;
	ctx.clearRect(0, 0, w, h);
	ctx.strokeStyle = canvasStrokeColor(canvas);
	ctx.lineWidth = 1.5;
	ctx.beginPath();

	const step = Math.max(1, Math.ceil(data.length / w));
	const mid = h / 2;
	for (let x = 0; x < w; x++) {
		let min = 0;
		let max = 0;
		const start = x * step;
		const end = Math.min(data.length, (x + 1) * step);
		for (let i = start; i < end; i++) {
			const v = data[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}
		const yTop = mid - max * mid;
		const yBot = mid - min * mid;
		if (x === 0) ctx.moveTo(x, yTop);
		else ctx.lineTo(x, yTop);
		ctx.lineTo(x, yBot);
	}
	ctx.stroke();
}

/** Live waveform frame from an AnalyserNode while recording. */
export function drawAnalyserWaveform(canvas: HTMLCanvasElement, analyser: AnalyserNode): void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	analyser.getByteTimeDomainData(dataArray);

	const w = canvas.offsetWidth || 300;
	const h = canvas.height || 60;
	canvas.width = w;
	ctx.clearRect(0, 0, w, h);
	ctx.strokeStyle = canvasStrokeColor(canvas);
	ctx.lineWidth = 1.5;
	ctx.beginPath();

	const sliceWidth = w / bufferLength;
	let x = 0;
	for (let i = 0; i < bufferLength; i++) {
		const v = dataArray[i] / 128;
		const y = (v * h) / 2;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
		x += sliceWidth;
	}
	ctx.stroke();
}
