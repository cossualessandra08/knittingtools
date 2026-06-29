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
		class="shrink-0 md:h-9 h-11 md:text-sm text-base"
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
			class="shrink-0 md:size-9 size-11 md:text-sm text-lg"
			aria-label={intarsia.prevStitch}
		>
			←
		</Button>
		<Button
			variant="outline"
			size="icon"
			{disabled}
			onclick={onNextStitch}
			class="shrink-0 md:size-9 size-11 md:text-sm text-lg"
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
		class="shrink-0 md:h-9 h-11 md:text-sm text-base"
		aria-label={intarsia.nextRow}
	>
		{intarsia.nextRow}
	</Button>
</div>
