<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import type { CropRect } from '$lib/jacquard/types.js';

	let {
		imageUrl,
		imageWidth,
		imageHeight,
		crop = $bindable(),
		onFitProportions
	}: {
		imageUrl: string;
		imageWidth: number;
		imageHeight: number;
		crop: CropRect;
		onFitProportions: () => void;
	} = $props();

	const maxDisplayWidth = 480;

	const cropPercent = $derived({
		left: (crop.x / imageWidth) * 100,
		top: (crop.y / imageHeight) * 100,
		width: (crop.width / imageWidth) * 100,
		height: (crop.height / imageHeight) * 100
	});

	let containerEl: HTMLDivElement | undefined = $state();
	let dragMode: 'move' | 'resize' | null = $state(null);
	let dragStart = { x: 0, y: 0 };
	let cropStart: CropRect = crop;

	function clampCrop(rect: CropRect): CropRect {
		const width = Math.max(1, Math.min(rect.width, imageWidth));
		const height = Math.max(1, Math.min(rect.height, imageHeight));
		const x = Math.max(0, Math.min(rect.x, imageWidth - width));
		const y = Math.max(0, Math.min(rect.y, imageHeight - height));
		return { x, y, width, height };
	}

	function pointerDeltaToImageCoords(dxPx: number, dyPx: number) {
		if (!containerEl) return { dx: 0, dy: 0 };
		const rect = containerEl.getBoundingClientRect();
		return {
			dx: (dxPx / rect.width) * imageWidth,
			dy: (dyPx / rect.height) * imageHeight
		};
	}

	function onPointerDown(event: PointerEvent, mode: 'move' | 'resize') {
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		dragMode = mode;
		dragStart = { x: event.clientX, y: event.clientY };
		cropStart = { ...crop };
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragMode) return;
		const { dx, dy } = pointerDeltaToImageCoords(
			event.clientX - dragStart.x,
			event.clientY - dragStart.y
		);

		if (dragMode === 'move') {
			crop = clampCrop({
				...cropStart,
				x: cropStart.x + dx,
				y: cropStart.y + dy
			});
		} else {
			crop = clampCrop({
				...cropStart,
				width: cropStart.width + dx,
				height: cropStart.height + dy
			});
		}
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragMode) return;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		dragMode = null;
	}
</script>

<div class="space-y-3">
	<div
		bind:this={containerEl}
		role="application"
		aria-label="Image crop area"
		class="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-muted/20"
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<img
			src={imageUrl}
			alt=""
			class="pointer-events-none block h-auto w-full select-none"
			width={imageWidth}
			height={imageHeight}
		/>
		<div
			role="button"
			tabindex="0"
			aria-label="Crop selection"
			class="absolute border-2 border-brand bg-brand/10"
			style:left="{cropPercent.left}%"
			style:top="{cropPercent.top}%"
			style:width="{cropPercent.width}%"
			style:height="{cropPercent.height}%"
			onpointerdown={(e) => onPointerDown(e, 'move')}
		>
			<div
				role="button"
				tabindex="0"
				aria-label="Resize crop"
				class="absolute right-0 bottom-0 size-4 cursor-se-resize rounded-sm border border-brand bg-background"
				style:transform="translate(50%, 50%)"
				onpointerdown={(e) => {
					e.stopPropagation();
					onPointerDown(e, 'resize');
				}}
			></div>
		</div>
	</div>
	<Button type="button" variant="outline" onclick={onFitProportions}>
		{m.tool_jacquard_fit_proportions()}
	</Button>
</div>
