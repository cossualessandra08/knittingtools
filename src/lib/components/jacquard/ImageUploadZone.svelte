<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let {
		disabled = false,
		onFile,
		onBrowse
	}: {
		disabled?: boolean;
		onFile: (file: File) => void;
		onBrowse: () => void;
	} = $props();

	let dragging = $state(false);

	function handleFiles(files: FileList | null) {
		const file = files?.[0];
		if (file) onFile(file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		if (!disabled) handleFiles(event.dataTransfer?.files ?? null);
	}
</script>

<div
	role="button"
	tabindex="0"
	class="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors {dragging
		? 'border-brand bg-brand/5'
		: ''} {disabled ? 'pointer-events-none opacity-50' : 'hover:border-brand/60'}"
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={onDrop}
	onclick={onBrowse}
	onkeydown={(e) => e.key === 'Enter' && onBrowse()}
>
	<p>{m.tool_jacquard_upload()}</p>
</div>
