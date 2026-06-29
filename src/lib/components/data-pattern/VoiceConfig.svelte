<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		drawAnalyserWaveform,
		drawAudioBufferWaveform
	} from '$lib/data-pattern/waveform-draw.js';

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
	let mediaStream: MediaStream | null = null;

	async function startRecording() {
		error = null;
		audioBuffer = null;
		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(mediaStream);
			analyserNode = audioContext.createAnalyser();
			analyserNode.fftSize = 256;
			source.connect(analyserNode);

			chunks = [];
			mediaRecorder = new MediaRecorder(mediaStream);
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
				mediaStream?.getTracks().forEach((t) => t.stop());
				mediaStream = null;
				stopLiveWaveform();
			};
			mediaRecorder.start();
			recording = true;
			startTime = Date.now();
			timerInterval = setInterval(() => {
				durationSec = (Date.now() - startTime) / 1000;
			}, 100);
			await tick();
			startLiveWaveform();
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

	function startLiveWaveform() {
		stopLiveWaveform();
		const tick = () => {
			if (!recording || !analyserNode || !waveformCanvas) return;
			drawAnalyserWaveform(waveformCanvas, analyserNode);
			animFrameId = requestAnimationFrame(tick);
		};
		tick();
	}

	function stopLiveWaveform() {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}
	}

	$effect(() => {
		if (recording || !audioBuffer || !waveformCanvas) return;
		drawAudioBufferWaveform(waveformCanvas, audioBuffer);
	});

	const formatTime = (s: number) =>
		`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

	onDestroy(() => {
		stopLiveWaveform();
		if (timerInterval) clearInterval(timerInterval);
		mediaStream?.getTracks().forEach((t) => t.stop());
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

	{#if recording || audioBuffer}
		<canvas
			bind:this={waveformCanvas}
			class="text-brand w-full rounded border border-border"
			height={recording ? 60 : 48}
		></canvas>
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
