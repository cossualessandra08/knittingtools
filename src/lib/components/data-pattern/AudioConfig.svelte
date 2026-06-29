<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		AUDIO_SEGMENT_THRESHOLD_SEC,
		DEFAULT_AUDIO_SEGMENT_SEC,
		MAX_FILE_BYTES,
		ACCEPTED_AUDIO_TYPES
	} from '$lib/data-pattern/constants.js';
	import { defaultAudioSegment } from '$lib/data-pattern/adapters/audio-file.js';
	import type { AudioAnalysisMode } from '$lib/data-pattern/types.js';

	let {
		audioBuffer = $bindable<AudioBuffer | null>(null),
		analysisMode = $bindable<AudioAnalysisMode>('waveform'),
		sensitivity = $bindable(1),
		smoothing = $bindable(0.3),
		segmentStartSec = $bindable(0),
		segmentEndSec = $bindable(60),
		error = $bindable<string | null>(null)
	}: {
		audioBuffer: AudioBuffer | null;
		analysisMode: AudioAnalysisMode;
		sensitivity: number;
		smoothing: number;
		segmentStartSec: number;
		segmentEndSec: number;
		error: string | null;
	} = $props();

	let fileInputEl: HTMLInputElement | undefined = $state();
	let waveformCanvas: HTMLCanvasElement | undefined = $state();
	let draggingOver = $state(false);

	const showSegmentPicker = $derived(
		audioBuffer !== null && audioBuffer.duration > AUDIO_SEGMENT_THRESHOLD_SEC
	);

	const segmentDuration = $derived(segmentEndSec - segmentStartSec);

	function openFilePicker() {
		fileInputEl?.click();
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		draggingOver = true;
	}

	function onDragLeave() {
		draggingOver = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		draggingOver = false;
		const file = e.dataTransfer?.files[0];
		if (file) void handleFile(file);
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void handleFile(file);
		input.value = '';
	}

	async function handleFile(file: File) {
		error = null;
		if (file.size > MAX_FILE_BYTES) {
			error = dataPattern.errorAudioTooLarge;
			return;
		}
		const isAccepted =
			ACCEPTED_AUDIO_TYPES.some((t) => file.type === t) ||
			/\.(mp3|wav|ogg)$/i.test(file.name);
		if (!isAccepted) {
			error = dataPattern.errorUnsupportedAudio;
			return;
		}
		try {
			const arrayBuffer = await file.arrayBuffer();
			const ctx = new AudioContext();
			audioBuffer = await ctx.decodeAudioData(arrayBuffer);
			const seg = defaultAudioSegment(audioBuffer);
			segmentStartSec = seg.start;
			segmentEndSec = seg.end;
			drawMiniWaveform();
		} catch {
			error = dataPattern.errorAudioDecode;
		}
	}

	function drawMiniWaveform() {
		if (!waveformCanvas || !audioBuffer) return;
		const ctx = waveformCanvas.getContext('2d');
		if (!ctx) return;
		const data = audioBuffer.getChannelData(0);
		const w = waveformCanvas.offsetWidth || 300;
		const h = 48;
		waveformCanvas.width = w;
		waveformCanvas.height = h;
		ctx.clearRect(0, 0, w, h);
		ctx.strokeStyle = 'hsl(var(--brand, 220 70% 50%))';
		ctx.lineWidth = 1;
		ctx.beginPath();
		const step = Math.ceil(data.length / w);
		for (let x = 0; x < w; x++) {
			let max = 0;
			for (let i = x * step; i < (x + 1) * step && i < data.length; i++) {
				max = Math.max(max, Math.abs(data[i]));
			}
			const y = (1 - max) * (h / 2);
			if (x === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	const formatTime = (s: number) =>
		`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
</script>

<input
	bind:this={fileInputEl}
	type="file"
	accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
	class="sr-only"
	aria-hidden="true"
	tabindex="-1"
	onchange={onFileChange}
/>

<div class="space-y-4">
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}

	<div
		role="button"
		tabindex="0"
		class="flex min-h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors {draggingOver
			? 'border-brand bg-brand/5'
			: 'border-border hover:border-brand/50 hover:bg-muted/30'}"
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		onclick={openFilePicker}
		onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
	>
		<div class="space-y-1 text-center">
			<p class="text-sm font-medium">
				{audioBuffer ? `✓ Loaded (${formatTime(audioBuffer.duration)})` : 'Drop audio file here or click to browse'}
			</p>
			<p class="text-xs text-muted-foreground">MP3, WAV, OGG · max 20 MB</p>
		</div>
	</div>

	{#if audioBuffer}
		<canvas bind:this={waveformCanvas} class="w-full rounded border border-border" height="48"
		></canvas>

		{#if showSegmentPicker}
			<div class="space-y-2 rounded-lg border border-border p-3">
				<p class="text-xs font-medium text-muted-foreground">
					File is longer than 60s — select segment
				</p>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="space-y-1">
						<Label class="text-xs">Start ({formatTime(segmentStartSec)})</Label>
						<Slider
							type="single"
							min={0}
							max={audioBuffer.duration - 1}
							step={0.5}
							bind:value={segmentStartSec}
						/>
					</div>
					<div class="space-y-1">
						<Label class="text-xs">End ({formatTime(segmentEndSec)})</Label>
						<Slider
							type="single"
							min={segmentStartSec + 1}
							max={audioBuffer.duration}
							step={0.5}
							bind:value={segmentEndSec}
						/>
					</div>
				</div>
				{#if segmentDuration < 1}
					<p class="text-xs text-destructive">{dataPattern.errorSegmentTooShort}</p>
				{/if}
			</div>
		{/if}

		<div class="space-y-2">
			<Label>{dataPattern.analysisMode}</Label>
			<div class="flex gap-4">
				<label class="flex items-center gap-2 text-sm">
					<input type="radio" bind:group={analysisMode} value="waveform" />
					{dataPattern.modeWaveform}
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input type="radio" bind:group={analysisMode} value="spectrogram" />
					{dataPattern.modeSpectrogram}
				</label>
			</div>
		</div>
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
