<script lang="ts">
	import { onDestroy } from 'svelte';
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';

	let {
		sensitivity = $bindable(1),
		smoothing = $bindable(0.3),
		audioBuffer = $bindable<AudioBuffer | null>(null),
		error = $bindable<string | null>(null)
	}: {
		sensitivity: number;
		smoothing: number;
		audioBuffer: AudioBuffer | null;
		error: string | null;
	} = $props();

	let recording = $state(false);
	let durationSec = $state(0);
	let waveformCanvas: HTMLCanvasElement | undefined = $state();

	let mediaRecorder: MediaRecorder | null = null;
	let chunks: Blob[] = [];
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let startTime = 0;
	let analyserNode: AnalyserNode | null = null;
	let animFrameId: number | null = null;
	let audioContext: AudioContext | null = null;

	async function startRecording() {
		error = null;
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			analyserNode = audioContext.createAnalyser();
			analyserNode.fftSize = 256;
			source.connect(analyserNode);

			chunks = [];
			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};
			mediaRecorder.onstop = async () => {
				const blob = new Blob(chunks, { type: 'audio/webm' });
				const arrayBuffer = await blob.arrayBuffer();
				try {
					const ctx = new AudioContext();
					audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				} catch {
					error = dataPattern.errorAudioDecode;
				}
				stream.getTracks().forEach((t) => t.stop());
				stopWaveformDraw();
			};
			mediaRecorder.start();
			recording = true;
			startTime = Date.now();
			timerInterval = setInterval(() => {
				durationSec = (Date.now() - startTime) / 1000;
			}, 100);
			drawWaveform();
		} catch (e) {
			if (e instanceof DOMException && e.name === 'NotAllowedError') {
				error = dataPattern.errorMicDenied;
			} else {
				error = dataPattern.errorMicDenied;
			}
		}
	}

	function stopRecording() {
		mediaRecorder?.stop();
		recording = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function drawWaveform() {
		if (!analyserNode || !waveformCanvas) return;
		const ctx = waveformCanvas.getContext('2d');
		if (!ctx) return;

		const bufferLength = analyserNode.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserNode.getByteTimeDomainData(dataArray);

		waveformCanvas.width = waveformCanvas.offsetWidth || 300;
		waveformCanvas.height = 60;
		ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
		ctx.strokeStyle = 'hsl(var(--brand))';
		ctx.lineWidth = 1.5;
		ctx.beginPath();

		const sliceWidth = waveformCanvas.width / bufferLength;
		let x = 0;
		for (let i = 0; i < bufferLength; i++) {
			const v = dataArray[i] / 128.0;
			const y = (v * waveformCanvas.height) / 2;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
			x += sliceWidth;
		}
		ctx.stroke();

		if (recording) {
			animFrameId = requestAnimationFrame(drawWaveform);
		}
	}

	function stopWaveformDraw() {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}
	}

	const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

	onDestroy(() => {
		stopWaveformDraw();
		if (timerInterval) clearInterval(timerInterval);
		audioContext?.close();
	});
</script>

<div class="space-y-4">
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}

	<div class="flex items-center gap-3">
		{#if recording}
			<Button type="button" variant="destructive" onclick={stopRecording}>
				{dataPattern.stop}
			</Button>
			<span class="font-mono text-sm text-muted-foreground">{formatTime(durationSec)}</span>
		{:else}
			<Button type="button" onclick={startRecording}>
				{dataPattern.record}
			</Button>
			{#if audioBuffer}
				<span class="text-sm text-muted-foreground">{formatTime(audioBuffer.duration)}</span>
			{/if}
		{/if}
	</div>

	{#if recording}
		<canvas bind:this={waveformCanvas} class="w-full rounded border border-border"></canvas>
	{/if}

	<div class="space-y-3">
		<div class="space-y-2">
			<Label>{dataPattern.sensitivity} ({sensitivity.toFixed(1)})</Label>
			<Slider type="single" min={0} max={2} step={0.1} bind:value={sensitivity} />
		</div>
		<div class="space-y-2">
			<Label>{dataPattern.smoothing} ({smoothing.toFixed(1)})</Label>
			<Slider type="single" min={0} max={1} step={0.05} bind:value={smoothing} />
		</div>
	</div>
</div>
