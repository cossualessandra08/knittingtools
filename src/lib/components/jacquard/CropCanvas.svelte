<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import type { CropRect } from '$lib/jacquard/types.js';

	let {
		image,
		crop = $bindable(),
		onFitProportions
	}: {
		image: HTMLImageElement;
		crop: CropRect;
		onFitProportions: () => void;
	} = $props();

	const maxDisplayWidth = 480;
	const scale = $derived(Math.min(1, maxDisplayWidth / image.naturalWidth));
	const displayWidth = $derived(image.naturalWidth * scale);
	const displayHeight = $derived(image.naturalHeight * scale);

	const displayCrop = $derived({
		x: crop.x * scale,
		y: crop.y * scale,
		width: crop.width * scale,
		height: crop.height * scale
	});

	let dragMode: 'move' | 'resize' | null = $state(null);
	let dragStart = { x: 0, y: 0 };
	let cropStart: CropRect = crop;

	function toImageCoords(x: number, y: number) {
		return { x: x / scale, y: y / scale };
	}

	function clampCrop(rect: CropRect): CropRect {
		const width = Math.max(1, Math.min(rect.width, image.naturalWidth));
		const height = Math.max(1, Math.min(rect.height, image.naturalHeight));
		const x = Math.max(0, Math.min(rect.x, image.naturalWidth - width));
		const y = Math.max(0, Math.min(rect.y, image.naturalHeight - height));
		return { x, y, width, height };
	}

	function onPointerDown(
		event: PointerEvent,
		mode: 'move' | 'resize'
	) {
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		dragMode = mode;
		dragStart = { x: event.clientX, y: event.clientY };
		cropStart = { ...crop };
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragMode) return;
		const dx = (event.clientX - dragStart.x) / scale;
		const dy = (event.clientY - dragStart.y) / scale;

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
		role="application"
		aria-label="Image crop area"
		class="relative mx-auto overflow-hidden rounded-lg border border-border bg-muted/20"
		style:width="{displayWidth}px"
		style:height="{displayHeight}px"
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<img
			src={image.src}
			alt=""
			class="pointer-events-none block h-full w-full object-contain"
			width={displayWidth}
			height={displayHeight}
		/>
		<div
			role="button"
			tabindex="0"
			aria-label="Crop selection"
			class="absolute border-2 border-brand bg-brand/10"
			style:left="{displayCrop.x}px"
			style:top="{displayCrop.y}px"
			style:width="{displayCrop.width}px"
			style:height="{displayCrop.height}px"
			onpointerdown={(e) => onPointerDown(e, 'move')}
		>
			<div
				role="button"
				tabindex="0"
				aria-label="Resize crop"
				class="absolute right-0 bottom-0 size-4 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border border-brand bg-background"
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
