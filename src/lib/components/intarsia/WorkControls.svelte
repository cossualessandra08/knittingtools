<script lang="ts">
	import { intarsia } from '$lib/copy.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		disabled = false,
		onPrevRow,
		onNextRow,
		onPrevStitch,
		onNextStitch
	}: {
		disabled?: boolean;
		onPrevRow?: () => void;
		onNextRow?: () => void;
		onPrevStitch?: () => void;
		onNextStitch?: () => void;
	} = $props();
</script>

<div class="flex items-center gap-2">
	<Button
		variant="outline"
		size="sm"
		{disabled}
		onclick={onPrevRow}
		class="h-11 shrink-0 text-base md:h-9 md:text-sm"
		aria-label={intarsia.prevRow}
	>
		{intarsia.prevRow}
	</Button>

	<div class="flex gap-1">
		<Button
			variant="outline"
			size="icon"
			{disabled}
			onclick={onPrevStitch}
			class="size-11 shrink-0 text-lg md:size-9 md:text-sm"
			aria-label={intarsia.prevStitch}
		>
			←
		</Button>
		<Button
			variant="outline"
			size="icon"
			{disabled}
			onclick={onNextStitch}
			class="size-11 shrink-0 text-lg md:size-9 md:text-sm"
			aria-label={intarsia.nextStitch}
		>
			→
		</Button>
	</div>

	<Button
		variant="default"
		size="sm"
		{disabled}
		onclick={onNextRow}
		class="h-11 shrink-0 text-base md:h-9 md:text-sm"
		aria-label={intarsia.nextRow}
	>
		{intarsia.nextRow}
	</Button>
</div>
