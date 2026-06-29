# Hub Design System Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply shadcn-svelte preset `b6Ao8pQVes` and restyle the hub shell (home, header, catalog cards, tool portico) to a minimal Zinc/Sera look with Phosphor icons and Lime hover — without structurally changing editor layouts.

**Architecture:** Run preset init to replace global tokens and shadcn primitives, then add hub-specific CSS (`--hub-hover`, `--brand` → Lime). Hub Svelte components (`ToolCard`, `ToolPageLayout`, `SiteHeader`, home) are rewritten to match the spec; `registry.ts` switches hub icons to `phosphor-svelte`. Editors inherit cosmetic token changes only; e2e tests verify no functional regressions.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), Tailwind 4, shadcn-svelte 1.3 (Sera style), phosphor-svelte, Vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-06-29-hub-design-system-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `components.json` | Preset config (Sera, Zinc, Phosphor) |
| `package.json` | Adds `phosphor-svelte`, `@fontsource-variable/manrope` via init |
| `vite.config.ts` | `sveltePhosphorOptimize` plugin for dev compile speed |
| `src/routes/layout.css` | Zinc tokens, `--hub-hover`, `--brand` → Lime, jacquard layout CSS preserved |
| `src/lib/components/ui/*` | shadcn primitives refreshed to Sera |
| `src/lib/tools/registry.ts` | Phosphor hub icons |
| `src/lib/components/tools/ToolCard.svelte` | Minimal bordered catalog card |
| `src/lib/components/tools/ToolPageLayout.svelte` | Portico without icon box |
| `src/lib/components/site/SiteHeader.svelte` | Compact Manrope wordmark |
| `src/routes/+page.svelte` | Title + tagline typography |
| `e2e/hub.e2e.ts` | Hub navigation + tagline visibility |

**Not modified structurally:** `JacquardEditor.svelte`, `IntarsiaEditor.svelte`, and child editor components.

---

### Task 1: Apply shadcn-svelte preset

**Files:**

- Modify: `components.json`
- Modify: `src/routes/layout.css` (overwritten — custom blocks re-added in Task 2)
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Back up custom CSS blocks**

Before init, note these blocks in `src/routes/layout.css` that must survive Task 2:

- `@layer components { .jacquard-editor-layout { ... } }` (lines 137–171)

- [ ] **Step 2: Run preset init**

```bash
cd /Users/alessandracossu/Documents/GitHub/knittingtools
npx shadcn-svelte@latest init --preset b6Ao8pQVes --overwrite
```

Expected: `components.json` shows `"style": "sera"` (or equivalent), `"baseColor": "zinc"`, Phosphor icon library; `layout.css` rewritten with Zinc/Sera tokens; Manrope font import added.

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `phosphor-svelte` and `@fontsource-variable/manrope` appear in `package.json`.

- [ ] **Step 4: Verify build**

```bash
npm run check
```

Expected: succeeds (fix any missing font imports if check fails).

- [ ] **Step 5: Commit**

```bash
git add components.json package.json package-lock.json src/routes/layout.css
git commit -m "chore(ui): apply shadcn-svelte preset b6Ao8pQVes"
```

---

### Task 2: Hub tokens and preserved CSS

**Files:**

- Modify: `src/routes/layout.css`

- [ ] **Step 1: Add hub-hover and brand alias**

In `:root`, after the chart tokens the preset generates, add:

```css
--hub-hover: oklch(0.85 0.15 130 / 0.25);
--brand: var(--chart-1);
--brand-foreground: var(--foreground);
```

In `.dark`, if `--brand` is absent, add the same two lines (Lime accent in dark mode too).

In `@theme inline`, add:

```css
--color-hub-hover: var(--hub-hover);
```

- [ ] **Step 2: Re-add jacquard editor layout CSS**

Append at end of `src/routes/layout.css` (if init removed it):

```css
/* Jacquard editor: controls left, preview right (~1/3 + ~2/3) from 36rem up */
@layer components {
	.jacquard-editor-layout {
		display: grid;
		gap: 2rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 36rem) {
		.jacquard-editor-layout {
			grid-template-columns: minmax(280px, 1fr) minmax(0, 2fr);
		}

		.jacquard-editor-controls {
			order: 1;
		}

		.jacquard-editor-preview {
			order: 2;
			position: sticky;
			top: 1rem;
			align-self: start;
		}
	}

	@media (max-width: 35.99rem) {
		.jacquard-editor-preview {
			order: 1;
		}

		.jacquard-editor-controls {
			order: 2;
		}
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/layout.css
git commit -m "feat(ui): add hub-hover token and preserve jacquard layout CSS"
```

---

### Task 3: Refresh shadcn UI components to Sera

**Files:**

- Modify: `src/lib/components/ui/card/*`, `button/*`, `slider/*`, `label/*`, `input/*`, `tabs/*`

- [ ] **Step 1: Overwrite installed components**

```bash
npx shadcn-svelte@latest add card button slider label input tabs --overwrite --yes
```

Expected: component files updated to Sera style (sharp radius).

- [ ] **Step 2: Verify check passes**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ui/
git commit -m "chore(ui): refresh shadcn components to Sera style"
```

---

### Task 4: Phosphor icons in registry

**Files:**

- Modify: `src/lib/tools/registry.ts`
- Modify: `vite.config.ts`
- Test: `src/lib/tools/registry.test.ts`

- [ ] **Step 1: Add Phosphor Vite optimizer**

Replace `vite.config.ts` plugins line:

```typescript
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';
```

```typescript
plugins: [tailwindcss(), sveltekit(), sveltePhosphorOptimize()],
```

Full top of file:

```typescript
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), sveltePhosphorOptimize()],
	// ... test config unchanged
});
```

- [ ] **Step 2: Replace Lucide imports in registry**

Replace entire `src/lib/tools/registry.ts` imports and icon fields:

```typescript
/**
 * Add a tool: append an entry here and create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
import GridNineIcon from 'phosphor-svelte/lib/GridNineIcon';
import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
import RulerIcon from 'phosphor-svelte/lib/RulerIcon';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: RulerIcon,
		title: 'Needle size chart',
		teaser: 'Look up metric and US knitting needle sizes.',
		portico: [
			'Find the metric (mm) and US label for a knitting needle size.',
			'Useful when you swap needles or read a pattern written for another sizing system.',
			'Pick a metric size below to see the matching US designation.'
		]
	},
	{
		slug: 'jacquard-pattern',
		href: '/tools/jacquard-pattern',
		icon: GridNineIcon,
		title: 'Jacquard pattern converter',
		teaser: 'Turn a photo into a 1-bit jacquard pattern for AYAB.',
		portico: [
			'Upload a photo and convert it to a two-color knitting pattern — one pixel equals one stitch.',
			'Set your needle/row ratio so the motif is not squashed on the fabric, then export a PNG for AYAB or a chart PDF.',
			'Everything runs in your browser; your image never leaves your device.'
		]
	},
	{
		slug: 'intarsia-assistant',
		href: '/tools/intarsia-assistant',
		icon: PaletteIcon,
		title: 'Intarsia work assistant',
		teaser: 'Step-by-step guidance while you knit intarsia — row by row, stitch by stitch.',
		portico: [
			'Import a pattern or draw one on a grid, then work through it with live row highlights, colour-change instructions, and a segment bar.',
			'Navigate stitch by stitch without counting manually — the assistant tracks your position and shows what to knit next.',
			'Everything runs in your browser; your pattern and image never leave your device.'
		]
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
```

- [ ] **Step 3: Run registry tests**

```bash
npm run test:unit -- src/lib/tools/registry.test.ts --run
```

Expected: PASS (3 tools, unique slugs, intarsia present)

- [ ] **Step 4: Commit**

```bash
git add src/lib/tools/registry.ts vite.config.ts
git commit -m "feat(hub): switch catalog icons to Phosphor"
```

---

### Task 5: Redesign ToolCard

**Files:**

- Modify: `src/lib/components/tools/ToolCard.svelte`

- [ ] **Step 1: Replace ToolCard with minimal frame**

Replace file contents:

```svelte
<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import type { ToolDefinition } from '$lib/tools/types.js';

	let { tool }: { tool: ToolDefinition } = $props();

	const Icon = $derived(tool.icon);
</script>

<a
	href={resolve(`${tool.href}/` as Pathname)}
	class="block h-full border border-border p-6 transition-colors duration-150 hover:bg-hub-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
>
	<div class="flex flex-col gap-3">
		<Icon size={20} weight="regular" class="text-foreground" aria-hidden="true" />
		<h3 class="text-base font-medium text-foreground">{tool.title}</h3>
		<p class="text-sm font-light leading-relaxed text-muted-foreground">{tool.teaser}</p>
	</div>
</a>
```

Notes: no shadcn Card, no icon box, no shadow, no rounded corners (radius 0 from preset).

- [ ] **Step 2: Verify check**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/tools/ToolCard.svelte
git commit -m "feat(hub): minimal catalog card with Phosphor icon and lime hover"
```

---

### Task 6: Redesign ToolPageLayout portico

**Files:**

- Modify: `src/lib/components/tools/ToolPageLayout.svelte`

- [ ] **Step 1: Update portico section**

Replace the portico `<section>` and back link. Full file:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { site } from '$lib/copy.js';
	import type { ToolDefinition } from '$lib/tools/types.js';

	let {
		tool,
		wide = false,
		children
	}: {
		tool: ToolDefinition;
		wide?: boolean;
		children: Snippet;
	} = $props();

	const Icon = $derived(tool.icon);
</script>

<section class="space-y-4">
	<Icon size={28} weight="regular" class="text-foreground" aria-hidden="true" />
	<h1 class="font-heading text-3xl font-medium tracking-tight">{tool.title}</h1>
	<div class="max-w-2xl space-y-3 text-base font-light leading-relaxed text-muted-foreground">
		{#each tool.portico as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>

<div class="my-10 border-t border-border"></div>

<section class={wide ? 'w-full' : 'max-w-2xl'}>
	{@render children()}
</section>

<p class="mt-12">
	<a
		href={resolve('/')}
		class="font-medium text-foreground transition-colors hover:bg-hub-hover hover:underline"
	>
		← {site.backToCatalog}
	</a>
</p>
```

If `font-heading` is not generated by the preset, check `layout.css` for the heading font token name (e.g. add `font-[family-name:var(--font-heading)]` on `h1` instead).

- [ ] **Step 2: Verify check**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/tools/ToolPageLayout.svelte
git commit -m "feat(hub): simplify tool portico icon and typography"
```

---

### Task 7: SiteHeader and home typography

**Files:**

- Modify: `src/lib/components/site/SiteHeader.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Update SiteHeader**

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/copy.js';
</script>

<header class="mx-auto w-full max-w-6xl border-b border-border/40 px-6 py-3 md:px-10">
	<a href={resolve('/')} class="font-heading text-lg font-medium tracking-tight text-foreground">
		{site.name}
	</a>
</header>
```

- [ ] **Step 2: Update home intro typography**

Replace `src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import { site } from '$lib/copy.js';
	import ToolCatalogGrid from '$lib/components/tools/ToolCatalogGrid.svelte';
</script>

<section class="mb-12 max-w-2xl space-y-3">
	<h1 class="font-heading text-3xl font-medium tracking-tight md:text-4xl">{site.name}</h1>
	<p class="text-lg font-light leading-relaxed text-muted-foreground">{site.tagline}</p>
</section>

<section class="space-y-6">
	<h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{site.catalogHeading}
	</h2>
	<ToolCatalogGrid />
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/site/SiteHeader.svelte src/routes/+page.svelte
git commit -m "feat(hub): Manrope headings and light tagline on home"
```

---

### Task 8: E2E tests and full verification

**Files:**

- Modify: `e2e/hub.e2e.ts`

- [ ] **Step 1: Extend hub e2e for tagline**

Replace `e2e/hub.e2e.ts`:

```typescript
import { expect, test } from '@playwright/test';

test('home shows intro, catalog, and navigates to needle chart', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Knitting Tools/i);
	await expect(page.getByText(/Free tools for knitting/i)).toBeVisible();
	await page.getByRole('link', { name: /Needle size chart/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Needle size chart/i);
	await expect(page.getByRole('link', { name: /All tools/i })).toBeVisible();
});

test('back link returns to catalog', async ({ page }) => {
	await page.goto('tools/needle-chart/');
	await page.getByRole('link', { name: /All tools/i }).click();
	await expect(page).toHaveURL(/\/knittingtools\/?$/);
	await expect(page.getByRole('heading', { level: 2 })).toContainText(/Tools/i);
});
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all unit and e2e tests PASS (hub, jacquard-pattern, intarsia-assistant).

If any editor e2e fails due to cosmetic-only breakage (e.g. contrast), fix tokens in `layout.css` without changing editor component structure. If structural (control missing), revert the specific breaking change.

- [ ] **Step 3: Manual smoke check**

```bash
npm run dev
```

Verify in browser:

- Home: title + tagline, cards have no icon box, hover shows lime tint
- Tool portico: icon without box, paragraphs visible
- Jacquard: upload → crop step works
- Intarsia: create grid flow works

- [ ] **Step 4: Commit**

```bash
git add e2e/hub.e2e.ts
git commit -m "test(hub): assert tagline visible on home"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Preset `b6Ao8pQVes` | Task 1 |
| `--hub-hover` Lime 20–30% | Task 2 |
| `--brand` → Lime for editors | Task 2 |
| Sera UI components | Task 3 |
| Phosphor hub icons | Task 4 |
| Minimal catalog card | Task 5 |
| Portico icon without box | Task 6 |
| Home title + tagline, light typography | Task 7 |
| Editor e2e regression guard | Task 8 |
| Jacquard layout CSS preserved | Task 2 |
| No editor structural changes | Tasks 1–3 cosmetic only; Task 8 verifies |
