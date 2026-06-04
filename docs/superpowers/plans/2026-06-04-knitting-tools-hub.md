# Knitting Tools Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual knitting-tools hub (home catalog + reusable tool page shell) per `docs/superpowers/specs/2026-06-04-knitting-tools-hub-design.md`, with one real reference tool to prove the pattern.

**Architecture:** Curated tool list in `src/lib/tools/registry.ts` drives the home grid. Each tool is a SvelteKit route under `src/routes/tools/<slug>/` using shared layout components (`SiteHeader`, `ToolPageLayout`). All user-facing copy lives in Paraglide messages (`messages/en.json`, `messages/it.json`). Italian URLs use `/it/` prefix (existing Paraglide config); English at root.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), adapter-static, Tailwind 4 + shadcn-svelte (Card), Paraglide (en/it), Lucide icons, Vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-06-04-knitting-tools-hub-design.md`

---

## File map

| File                                              | Responsibility                                             |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `messages/en.json`, `messages/it.json`            | Site intro, header, catalog copy, tool porticos, UI labels |
| `src/routes/layout.css`                           | Accent color (`--brand`), off-white background tweak       |
| `src/lib/tools/types.ts`                          | `ToolDefinition` type                                      |
| `src/lib/tools/registry.ts`                       | Ordered curated tools (slug, icon, message keys)           |
| `src/lib/tools/registry.test.ts`                  | Registry invariants (unique slugs, non-empty order)        |
| `src/lib/components/site/SiteHeader.svelte`       | Wordmark + IT \| EN switcher                               |
| `src/lib/components/site/PageShell.svelte`        | Max-width + horizontal padding wrapper                     |
| `src/lib/components/tools/ToolCard.svelte`        | Catalog card (icon, title, teaser)                         |
| `src/lib/components/tools/ToolCatalogGrid.svelte` | Responsive grid of `ToolCard`                              |
| `src/lib/components/tools/ToolPageLayout.svelte`  | Portico + slot + back link                                 |
| `src/routes/+layout.svelte`                       | Global shell: `SiteHeader` + `PageShell` wrapping children |
| `src/routes/+page.svelte`                         | Home intro + `ToolCatalogGrid`                             |
| `src/routes/tools/needle-chart/+page.svelte`      | Reference tool UI (static mm ↔ US needle table)            |
| `src/routes/tools/needle-chart/+page.ts`          | `prerender = true`                                         |
| `e2e/hub.e2e.ts`                                  | Home, locale switch, navigation to tool and back           |
| `src/lib/components/ui/card/*`                    | shadcn Card (CLI add)                                      |

**Not in this plan:** Remove `src/routes/demo/**` (optional cleanup; leave unless it conflicts).

---

### Task 1: Paraglide messages (site + catalog + reference tool)

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/it.json`

- [ ] **Step 1: Replace message files with hub copy**

`messages/en.json`:

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"site_name": "Knitting Tools",
	"site_tagline": "Free tools for knitting — pick what you need.",
	"locale_it": "IT",
	"locale_en": "EN",
	"catalog_heading": "Tools",
	"back_to_catalog": "All tools",
	"tool_needle_title": "Needle size chart",
	"tool_needle_card_teaser": "Look up metric and US knitting needle sizes.",
	"tool_needle_portico_1": "Find the metric (mm) and US label for a knitting needle size.",
	"tool_needle_portico_2": "Useful when you swap needles or read a pattern written for another sizing system.",
	"tool_needle_portico_3": "Pick a metric size below to see the matching US designation.",
	"tool_needle_table_mm": "Metric (mm)",
	"tool_needle_table_us": "US"
}
```

`messages/it.json`:

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"site_name": "Strumenti maglieria",
	"site_tagline": "Strumenti gratuiti per la maglieria — scegli quello che ti serve.",
	"locale_it": "IT",
	"locale_en": "EN",
	"catalog_heading": "Strumenti",
	"back_to_catalog": "Tutti gli strumenti",
	"tool_needle_title": "Tabella ferri",
	"tool_needle_card_teaser": "Consulta le misure in mm e la numerazione US dei ferri da maglia.",
	"tool_needle_portico_1": "Trova il valore in millimetri e la sigla US corrispondente per un ferro da maglia.",
	"tool_needle_portico_2": "Utile quando cambi ferro o leggi uno schema scritto con un altro sistema di misure.",
	"tool_needle_portico_3": "Scegli una misura in mm qui sotto per vedere la numerazione US corrispondente.",
	"tool_needle_table_mm": "Metrico (mm)",
	"tool_needle_table_us": "US"
}
```

- [ ] **Step 2: Regenerate Paraglide**

Run: `npm run build`  
Expected: succeeds; `src/lib/paraglide/messages.js` exports new keys.

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/it.json
git commit -m "feat(i18n): add hub and needle chart copy for en and it"
```

---

### Task 2: Brand tokens in global CSS

**Files:**

- Modify: `src/routes/layout.css` (`:root` block and `@theme inline`)

- [ ] **Step 1: Add brand accent and soft background**

In `:root` after `--ring`, add:

```css
--brand: oklch(0.55 0.08 200);
--brand-foreground: oklch(0.985 0 0);
--background: oklch(0.99 0.005 90);
```

In `@theme inline` add:

```css
--color-brand: var(--brand);
--color-brand-foreground: var(--brand-foreground);
```

- [ ] **Step 2: Verify build**

Run: `npm run check`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/layout.css
git commit -m "feat(ui): add brand accent and warm off-white background"
```

---

### Task 3: Add shadcn Card component

**Files:**

- Create: `src/lib/components/ui/card/*` (via CLI)

- [ ] **Step 1: Install Card**

Run: `npx shadcn-svelte@latest add card --yes`  
Expected: creates `src/lib/components/ui/card/`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/ui/card components.json
git commit -m "feat(ui): add shadcn card component"
```

---

### Task 4: Tool registry module

**Files:**

- Create: `src/lib/tools/types.ts`
- Create: `src/lib/tools/registry.ts`
- Create: `src/lib/tools/registry.test.ts`

- [ ] **Step 1: Write failing registry test**

`src/lib/tools/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tools } from './registry.js';

describe('tools registry', () => {
	it('has at least one tool', () => {
		expect(tools.length).toBeGreaterThan(0);
	});

	it('has unique slugs', () => {
		const slugs = tools.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('defines href under /tools/', () => {
		for (const tool of tools) {
			expect(tool.href).toMatch(/^\/tools\/[a-z0-9-]+$/);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/tools/registry.test.ts`  
Expected: FAIL — cannot resolve `./registry.js`

- [ ] **Step 3: Implement types and registry**

`src/lib/tools/types.ts`:

```ts
import type { Component } from 'svelte';
import * as messages from '$lib/paraglide/messages.js';

export type MessageKey = keyof typeof messages;

export type ToolDefinition = {
	slug: string;
	href: `/tools/${string}`;
	icon: Component;
	titleKey: MessageKey;
	teaserKey: MessageKey;
	porticoKeys: [MessageKey, MessageKey, MessageKey];
};
```

`src/lib/tools/registry.ts`:

```ts
import Ruler from '@lucide/svelte/icons/ruler';
import type { ToolDefinition } from './types.js';

export const tools = [
	{
		slug: 'needle-chart',
		href: '/tools/needle-chart',
		icon: Ruler,
		titleKey: 'tool_needle_title',
		teaserKey: 'tool_needle_card_teaser',
		porticoKeys: ['tool_needle_portico_1', 'tool_needle_portico_2', 'tool_needle_portico_3']
	}
] as const satisfies readonly ToolDefinition[];

export type ToolSlug = (typeof tools)[number]['slug'];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/tools/registry.test.ts`  
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tools/types.ts src/lib/tools/registry.ts src/lib/tools/registry.test.ts
git commit -m "feat(tools): add curated registry with needle chart entry"
```

---

### Task 5: SiteHeader with locale switcher

**Files:**

- Create: `src/lib/components/site/SiteHeader.svelte`

- [ ] **Step 1: Implement header**

`src/lib/components/site/SiteHeader.svelte`:

```svelte
<script lang="ts">
	import type { Pathname } from '$app/types';
	import { page } from '$app/state';
	import { resolve } from '$app/path';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';

	const locale = $derived(getLocale());

	function localeHref(target: (typeof locales)[number]) {
		return resolve(localizeHref(page.url.pathname as Pathname, { locale: target }) as Pathname);
	}
</script>

<header class="flex items-center justify-between border-b border-border/60 py-4">
	<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-foreground">
		{m.site_name()}
	</a>
	<nav aria-label="Language" class="flex items-center gap-1 text-sm">
		{#each locales as loc (loc)}
			{#if loc !== locales[0]}
				<span class="text-muted-foreground" aria-hidden="true">|</span>
			{/if}
			<a
				href={localeHref(loc)}
				data-sveltekit-reload
				class="rounded px-2 py-1 transition-colors {locale === loc
					? 'bg-brand font-medium text-brand-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
				aria-current={locale === loc ? 'page' : undefined}
			>
				{loc === 'it' ? m.locale_it() : m.locale_en()}
			</a>
		{/each}
	</nav>
</header>
```

- [ ] **Step 2: Run check**

Run: `npm run check`  
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/site/SiteHeader.svelte
git commit -m "feat(site): add header with paraglide locale switcher"
```

---

### Task 6: PageShell, ToolCard, ToolCatalogGrid

**Files:**

- Create: `src/lib/components/site/PageShell.svelte`
- Create: `src/lib/components/tools/ToolCard.svelte`
- Create: `src/lib/components/tools/ToolCatalogGrid.svelte`

- [ ] **Step 1: PageShell**

`src/lib/components/site/PageShell.svelte`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-12">
	{@render children()}
</div>
```

- [ ] **Step 2: ToolCard**

`src/lib/components/tools/ToolCard.svelte`:

```svelte
<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/path';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ToolDefinition } from '$lib/tools/types.js';
	import * as m from '$lib/paraglide/messages.js';

	let { tool }: { tool: ToolDefinition } = $props();

	const title = $derived(m[tool.titleKey]());
	const teaser = $derived(m[tool.teaserKey]());
	const Icon = $derived(tool.icon);
</script>

<a
	href={resolve(localizeHref(tool.href as Pathname) as Pathname)}
	class="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
>
	<Card.Root
		class="h-full border-border transition-shadow group-hover:border-brand/40 group-hover:shadow-sm"
	>
		<Card.Header class="gap-4">
			<div
				class="flex size-10 items-center justify-center rounded-lg border text-muted-foreground group-hover:text-brand"
			>
				<Icon class="size-5" aria-hidden="true" />
			</div>
			<Card.Title class="text-base font-semibold">{title}</Card.Title>
			<Card.Description class="text-sm leading-relaxed text-muted-foreground">
				{teaser}
			</Card.Description>
		</Card.Header>
	</Card.Root>
</a>
```

- [ ] **Step 3: ToolCatalogGrid**

`src/lib/components/tools/ToolCatalogGrid.svelte`:

```svelte
<script lang="ts">
	import { tools } from '$lib/tools/registry.js';
	import ToolCard from './ToolCard.svelte';
</script>

<ul class="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each tools as tool (tool.slug)}
		<li>
			<ToolCard {tool} />
		</li>
	{/each}
</ul>
```

- [ ] **Step 4: Run check**

Run: `npm run check`  
Expected: PASS (fix `MessageKey` import if `messages.js` exports differently — use `keyof typeof import('$lib/paraglide/messages.js')` if needed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/site/PageShell.svelte src/lib/components/tools/ToolCard.svelte src/lib/components/tools/ToolCatalogGrid.svelte
git commit -m "feat(catalog): add page shell, tool card, and responsive grid"
```

---

### Task 7: ToolPageLayout component

**Files:**

- Create: `src/lib/components/tools/ToolPageLayout.svelte`

- [ ] **Step 1: Implement layout**

`src/lib/components/tools/ToolPageLayout.svelte`:

```svelte
<script lang="ts">
	import type { Pathname } from '$app/types';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/path';
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { ToolDefinition } from '$lib/tools/types.js';

	let {
		tool,
		children
	}: {
		tool: ToolDefinition;
		children: Snippet;
	} = $props();

	const title = $derived(m[tool.titleKey]());
	const portico = $derived(tool.porticoKeys.map((key) => m[key]()));
	const Icon = $derived(tool.icon);
</script>

<section class="space-y-4">
	<div class="flex size-14 items-center justify-center rounded-xl border text-brand">
		<Icon class="size-7" aria-hidden="true" />
	</div>
	<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
	<div class="max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
		{#each portico as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>

<div class="my-10 border-t border-border"></div>

<section class="max-w-2xl">
	{@render children()}
</section>

<p class="mt-12">
	<a
		href={resolve(localizeHref('/' as Pathname) as Pathname)}
		class="font-medium text-brand hover:underline"
	>
		← {m.back_to_catalog()}
	</a>
</p>
```

- [ ] **Step 2: Run check**

Run: `npm run check`  
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/tools/ToolPageLayout.svelte
git commit -m "feat(tools): add tool page layout with portico and back link"
```

---

### Task 8: Wire global layout and home page

**Files:**

- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Update root layout**

Replace body of `src/routes/+layout.svelte` (keep favicon head; remove hidden locale links div — switcher is in header):

```svelte
<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import PageShell from '$lib/components/site/PageShell.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<SiteHeader />
<PageShell>
	{@render children()}
</PageShell>
```

Remove unused imports (`base`, `resolve`, `page`, `locales`, `localizeHref`, `pathnameWithoutBase`).

- [ ] **Step 2: Build home page**

`src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ToolCatalogGrid from '$lib/components/tools/ToolCatalogGrid.svelte';
</script>

<section class="mb-12 max-w-2xl space-y-3">
	<h1 class="text-3xl font-semibold tracking-tight md:text-4xl">{m.site_name()}</h1>
	<p class="text-lg leading-relaxed text-muted-foreground">{m.site_tagline()}</p>
</section>

<section class="space-y-6">
	<h2 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
		{m.catalog_heading()}
	</h2>
	<ToolCatalogGrid />
</section>
```

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev -- --open`  
Expected: home shows intro + one needle chart card; IT/EN switch works; card links to tool route.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte src/routes/+page.svelte
git commit -m "feat(home): add catalog hub with header and locale switcher"
```

---

### Task 9: Reference tool — needle chart

**Files:**

- Create: `src/lib/tools/needle-sizes.ts`
- Create: `src/routes/tools/needle-chart/+page.ts`
- Create: `src/routes/tools/needle-chart/+page.svelte`

- [ ] **Step 1: Static needle data**

`src/lib/tools/needle-sizes.ts`:

```ts
export const needleSizes = [
	{ mm: 2.0, us: '0' },
	{ mm: 2.25, us: '1' },
	{ mm: 2.75, us: '2' },
	{ mm: 3.25, us: '3' },
	{ mm: 3.5, us: '4' },
	{ mm: 3.75, us: '5' },
	{ mm: 4.0, us: '6' },
	{ mm: 4.5, us: '7' },
	{ mm: 5.0, us: '8' },
	{ mm: 5.5, us: '9' },
	{ mm: 6.0, us: '10' },
	{ mm: 6.5, us: '10½' },
	{ mm: 7.0, us: '—' },
	{ mm: 8.0, us: '11' },
	{ mm: 9.0, us: '13' },
	{ mm: 10.0, us: '15' }
] as const;
```

- [ ] **Step 2: Prerender route**

`src/routes/tools/needle-chart/+page.ts`:

```ts
export const prerender = true;
```

- [ ] **Step 3: Tool page UI**

`src/routes/tools/needle-chart/+page.svelte`:

```svelte
<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ToolPageLayout from '$lib/components/tools/ToolPageLayout.svelte';
	import { tools } from '$lib/tools/registry.js';
	import { needleSizes } from '$lib/tools/needle-sizes.js';

	const tool = tools.find((t) => t.slug === 'needle-chart')!;
	let selectedMm = $state<number>(needleSizes[4].mm);

	const selected = $derived(needleSizes.find((row) => row.mm === selectedMm) ?? needleSizes[0]);
</script>

<ToolPageLayout {tool}>
	<label for="needle-mm" class="mb-2 block text-sm font-medium">
		{m.tool_needle_table_mm()}
	</label>
	<select
		id="needle-mm"
		class="mb-6 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
		bind:value={selectedMm}
	>
		{#each needleSizes as row (row.mm)}
			<option value={row.mm}>{row.mm}</option>
		{/each}
	</select>

	<dl class="grid max-w-xs gap-2 text-sm">
		<div class="flex justify-between gap-4 border-b py-2">
			<dt class="text-muted-foreground">{m.tool_needle_table_mm()}</dt>
			<dd class="font-medium">{selected.mm}</dd>
		</div>
		<div class="flex justify-between gap-4 border-b py-2">
			<dt class="text-muted-foreground">{m.tool_needle_table_us()}</dt>
			<dd class="font-medium">{selected.us}</dd>
		</div>
	</dl>
</ToolPageLayout>
```

- [ ] **Step 4: Build static site**

Run: `npm run build`  
Expected: prerenders `/`, `/it/`, `/tools/needle-chart`, `/it/tools/needle-chart`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tools/needle-sizes.ts src/routes/tools/needle-chart/+page.ts src/routes/tools/needle-chart/+page.svelte
git commit -m "feat(tools): add needle size chart reference tool"
```

---

### Task 10: E2E tests for hub flows

**Files:**

- Create: `e2e/hub.e2e.ts`
- Modify: `playwright.config.ts` (only if `baseURL` / `webServer` missing — verify first)

- [ ] **Step 1: Write E2E spec**

`e2e/hub.e2e.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home shows catalog and navigates to needle chart', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Knitting Tools/i);
	await page.getByRole('link', { name: /Needle size chart/i }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Needle size chart/i);
	await expect(page.getByRole('link', { name: /All tools/i })).toBeVisible();
});

test('italian locale shows translated home', async ({ page }) => {
	await page.goto('/it/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Strumenti maglieria/i);
});

test('back link returns to catalog', async ({ page }) => {
	await page.goto('/tools/needle-chart');
	await page.getByRole('link', { name: /All tools/i }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('heading', { name: /Tools/i })).toBeVisible();
});
```

- [ ] **Step 2: Run E2E**

Run: `npm run test:e2e`  
Expected: 3 passed (adjust selectors if Card link accessible name differs).

- [ ] **Step 3: Commit**

```bash
git add e2e/hub.e2e.ts
git commit -m "test(e2e): cover home, locale, and tool navigation"
```

---

### Task 11: Final verification

- [ ] **Step 1: Full test suite**

Run: `npm run test`  
Expected: unit + e2e pass.

- [ ] **Step 2: Lint**

Run: `npm run lint`  
Expected: pass (run `npm run format` if Prettier fails).

- [ ] **Step 3: Document how to add a tool** (short comment in registry)

Add to top of `src/lib/tools/registry.ts`:

```ts
/**
 * Add a tool: append an entry here, add messages in messages/{en,it}.json,
 * create src/routes/tools/<slug>/+page.svelte using ToolPageLayout.
 */
```

- [ ] **Step 4: Commit if registry comment added**

```bash
git add src/lib/tools/registry.ts
git commit -m "docs(tools): document how to register a new tool"
```

---

## Spec coverage checklist

| Spec requirement                          | Task              |
| ----------------------------------------- | ----------------- |
| Home intro + curated grid                 | Task 1, 6, 8      |
| Tool page portico + tool area + back link | Task 7, 9         |
| IT \| EN header switcher                  | Task 5, 8         |
| Coherent icons (Lucide, shared card)      | Task 4, 6         |
| Clean modern layout / spacing             | Task 2, 6, 7, 8   |
| Scalable registry pattern                 | Task 4, 11        |
| No categories/search/placeholders         | Omitted by design |
| Bilingual parity                          | Task 1            |
| One working reference tool                | Task 9            |

---

## Adding the next tool (post-plan)

1. Add message keys to `messages/en.json` and `messages/it.json`.
2. Append to `tools` in `registry.ts` with unique `slug` and `href: '/tools/<slug>'`.
3. Create `src/routes/tools/<slug>/+page.svelte` + `+page.ts` (`prerender = true`).
4. Run `npm run build` and extend `e2e/hub.e2e.ts` if critical path.

Designer can rename `site_name` and swap Lucide icons or custom SVGs in `static/icons/` later without structural changes.
