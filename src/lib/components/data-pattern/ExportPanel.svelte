<script lang="ts">
	import { dataPattern } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { MAX_STITCHES_WARN } from '$lib/data-pattern/constants.js';
	import type { ExportMode } from '$lib/data-pattern/types.js';

	let {
		exportMode = $bindable<ExportMode>('knit-purl'),
		stitches,
		hasBitmap,
		onDownloadPdfChart,
		onDownloadSymbolicPng,
		onDownloadAyabPng,
		onDownloadAnnotatedPdf
	}: {
		exportMode: ExportMode;
		stitches: number;
		hasBitmap: boolean;
		onDownloadPdfChart: () => Promise<void>;
		onDownloadSymbolicPng: () => Promise<void>;
		onDownloadAyabPng: () => Promise<void>;
		onDownloadAnnotatedPdf: () => Promise<void>;
	} = $props();

	let busy = $state(false);

	function confirmIfNeeded(): boolean {
		if (stitches > MAX_STITCHES_WARN) {
			return confirm(dataPattern.confirmOverStitches);
		}
		return true;
	}

	async function handleAction(fn: () => Promise<void>) {
		if (!confirmIfNeeded()) return;
		busy = true;
		try {
			await fn();
		} finally {
			busy = false;
		}
	}
</script>

<div class="space-y-4">
	<h3 class="text-sm font-medium">Export</h3>

	<div class="flex gap-4">
		<label class="flex items-center gap-2 text-sm">
			<input type="radio" bind:group={exportMode} value="knit-purl" />
			{dataPattern.exportKnitPurl}
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="radio" bind:group={exportMode} value="jacquard" />
			{dataPattern.exportJacquard}
		</label>
	</div>

	<div class="flex flex-wrap gap-2">
		{#if exportMode === 'knit-purl'}
			<Button
				type="button"
				size="sm"
				disabled={!hasBitmap || busy}
				onclick={() => handleAction(onDownloadPdfChart)}
			>
				{dataPattern.downloadPdfChart}
			</Button>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={!hasBitmap || busy}
				onclick={() => handleAction(onDownloadSymbolicPng)}
			>
				{dataPattern.downloadSymbolicPng}
			</Button>
		{:else}
			<Button
				type="button"
				size="sm"
				disabled={!hasBitmap || busy}
				onclick={() => handleAction(onDownloadAyabPng)}
			>
				{dataPattern.downloadAyabPng}
			</Button>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={!hasBitmap || busy}
				onclick={() => handleAction(onDownloadAnnotatedPdf)}
			>
				{dataPattern.downloadAnnotatedPdf}
			</Button>
		{/if}
	</div>
</div>
