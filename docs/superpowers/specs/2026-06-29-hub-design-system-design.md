# Design: Hub design system refresh

**Date:** 2026-06-29  
**Status:** Approved in brainstorming (sections 1–3)  
**Project:** knittingtools (existing hub shell — home, catalog, tool portico pages)

---

## Objective

Refresh the **access shell** of knittingtools — the interface users see before and around the tools (home, header, catalog grid, tool portico pages) — with a minimal visual identity driven by a shadcn-svelte preset. **Editor internals** (jacquard, intarsia, needle chart UI layout and behaviour) stay structurally unchanged.

---

## Product decisions (summary)

| Topic | Decision |
| --- | --- |
| Primary goal | Visual identity (A) + light layout refinement (B) on the hub shell only |
| Preset | `b6Ao8pQVes` — Sera style, Zinc base, Manrope headings, Inter body, Phosphor icons, radius none, Lime chart colour |
| Approach | **#1 — Full preset init** + hub component redesign; catalog cards as simple bordered frames (not decorative shadcn Card chrome) |
| Minimal aesthetic | No emoji, no decorative elements; simple clickable frames; light typography |
| Catalog card | Title + one-line description; **Phosphor icon, black, no surrounding box** |
| Card hover | Background Lime at **20–30% opacity** (`--hub-hover`, default ~25%) |
| Tool portico pages | Same icon treatment as catalog; **intro paragraphs stay** (copy to be replaced later by author) |
| Home intro | Site title + **tagline** (tagline uses `font-light`) |
| Editor scope | **No structural changes.** Cosmetic token/component updates from the preset are allowed only if they do not break tool usage (layout, controls, canvas, navigation) |
| Locale switcher | Out of scope for this redesign |
| Dark mode toggle | Out of scope (preset dark tokens exist; no UI switch) |
| Copy rewrite | Out of scope (portico and tagline text unchanged for now) |

---

## Preset specification (`b6Ao8pQVes`)

| Token | Current | After preset |
| --- | --- | --- |
| Component style | Vega | **Sera** |
| Base colour | Neutral | **Zinc** |
| Theme | — | **Zinc** |
| Chart / accent | — | **Lime** |
| Heading font | Inter | **Manrope** |
| Body font | Inter | Inter |
| Icon library (hub) | Lucide | **Phosphor** |
| Border radius | 0.625rem | **0** (sharp corners) |
| Menu | — | Default / Translucent, subtle accent |

**CLI command:**

```bash
npx shadcn-svelte init --preset b6Ao8pQVes --overwrite
```

---

## Architecture

### In scope (hub shell)

| Unit | Role |
| --- | --- |
| `components.json` | Preset-driven shadcn-svelte configuration |
| `src/routes/layout.css` | Global design tokens (Zinc palette, fonts, `--hub-hover`, `--brand` → Lime) |
| `src/lib/components/site/SiteHeader.svelte` | Minimal wordmark header |
| `src/lib/components/site/PageShell.svelte` | Max-width content wrapper (spacing unchanged) |
| `src/routes/+page.svelte` | Home: title + tagline + catalog |
| `src/lib/components/tools/ToolCard.svelte` | Catalog card (simple frame, hover, Phosphor icon) |
| `src/lib/components/tools/ToolCatalogGrid.svelte` | Responsive grid (structure unchanged) |
| `src/lib/components/tools/ToolPageLayout.svelte` | Portico + tool slot + back link |
| `src/lib/tools/registry.ts` | Phosphor icon imports for hub |
| `src/lib/components/ui/*` | shadcn primitives refreshed to Sera via CLI |

### Out of scope (editors)

| Area | Constraint |
| --- | --- |
| `JacquardEditor`, `IntarsiaEditor`, and child components | **No layout or behaviour changes** |
| Editor toolbars, grids, canvases, sidebars | Unchanged structure |
| Editor-specific CSS (e.g. `.intarsia-page-shell`, `.jacquard-editor-layout`) | Unchanged |

### Editor side effects (allowed with care)

Global preset application may cosmetically affect editors (e.g. zinc neutrals, radius 0 on buttons, Lime accent via `--brand`). These are **acceptable** if verified:

- All controls remain visible and operable
- Canvas/crop/upload zones still function
- Tab navigation and step flow unchanged
- No overflow or clipping regressions on mobile

If a preset-driven change breaks any editor, **revert that specific override** rather than restructuring the editor.

---

## Section 1: Foundation (tokens)

### Migration steps

1. Run `npx shadcn-svelte init --preset b6Ao8pQVes --overwrite`
2. Refresh installed UI components: `npx shadcn-svelte add card button slider label input tabs --overwrite`
3. Add hub-specific token after init:

```css
:root {
  --hub-hover: oklch(0.85 0.15 130 / 0.25); /* Lime ~25%; tunable 20–30% */
}
```

Map in `@theme inline`:

```css
--color-hub-hover: var(--hub-hover);
```

### `--brand` token

The current teal `--brand` is removed. Remap `--brand` to the preset **Lime** chart colour so existing editor references (`border-brand`, `text-brand`, focus rings) pick up the new accent without code changes in editor files — **provided** visual regression tests pass.

Hub components **do not** use `--brand`; they use `--hub-hover` for card hover and `text-foreground` for links.

### Global side effects

- `body` inherits Zinc background and Manrope/Inter font stack site-wide
- Editors inherit base typography and neutrals; internal layout components are untouched

---

## Section 2: Layout and hub components

### Header (`SiteHeader`)

- Wordmark only: site name, Manrope `font-medium`, link to home
- Subtle bottom border (`border-border/40`)
- Compact vertical padding (`py-3`)
- No logo, icons, or locale switcher

### Page shell (`PageShell`)

- Unchanged: `max-w-6xl`, `px-6 py-8 md:px-10 md:py-12`

### Home (`+page.svelte`)

```
[SiteHeader]
[PageShell]
  ├─ h1 — site name (Manrope, font-medium, text-3xl md:text-4xl)
  ├─ p  — tagline (Inter, font-light, text-muted-foreground)
  └─ ToolCatalogGrid
       └─ optional h2 "Tools" (uppercase, muted, text-xs)
```

Generous whitespace between intro and grid (`mb-12`).

### Catalog card (`ToolCard`)

Visual structure:

```
┌─────────────────────────────────┐
│  [Phosphor icon, 20px, black]   │
│  Title (font-medium)            │
│  Description (font-light, muted)│
└─────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Container | `<a>` block-level, full card clickable |
| Border | `1px solid border` (zinc) |
| Radius | `0` |
| Shadow | None |
| Padding | `p-5` or `p-6` |
| Icon | Phosphor, `size-5`, `text-foreground`, **no wrapper box** |
| Title | `text-base font-medium` |
| Description | `text-sm font-light text-muted-foreground` |
| Hover | `bg-hub-hover` (Lime 20–30% opacity) |
| Focus | Visible outline/ring for keyboard users |
| Transition | `transition-colors duration-150` |

**Excluded:** emoji, decorative badges, icon boxes, card shadows, category tags.

### Catalog grid (`ToolCatalogGrid`)

- Unchanged breakpoints: 1 → 2 → 3 columns, `gap-6`
- Intentional whitespace with few tools

### Tool page (`ToolPageLayout`)

Portico (top section):

```
[Phosphor icon, size-7, text-foreground, no box]
[h1 title — Manrope, font-medium, text-3xl]
[2–3 paragraphs — Inter, font-light, text-muted-foreground]
──────────────── border-t 1px ────────────────
[tool content slot — unchanged]
[link "← All tools" — text-foreground, hover underline or subtle lime]
```

- Remove the `size-14 rounded-xl border` icon container
- Keep `wide` prop behaviour for intarsia (editor container unchanged)
- Separator between portico and tool: `border-t` only

### Icons (`registry.ts`)

Replace Lucide hub imports with Phosphor equivalents:

| Tool | Phosphor icon |
| --- | --- |
| Needle size chart | `Ruler` |
| Jacquard pattern converter | `GridNine` |
| Intarsia work assistant | `Palette` |

Lucide remains in editor-internal components only.

---

## Section 3: Migration, testing, risks

### File map

| File | Action |
| --- | --- |
| `components.json` | Overwritten by preset init |
| `src/routes/layout.css` | Sera/Zinc tokens + `--hub-hover` + `--brand` → Lime |
| `src/lib/components/site/*` | Typography refresh |
| `src/lib/components/tools/ToolCard.svelte` | Visual rewrite |
| `src/lib/components/tools/ToolPageLayout.svelte` | Portico icon + link styling |
| `src/lib/tools/registry.ts` | Phosphor icons |
| `src/lib/components/ui/*` | Sera refresh via CLI |
| Editor components | **No structural edits**; verify after global token change |

### Tests

| Test | Verifies |
| --- | --- |
| `e2e/hub.e2e.ts` | Home title + navigation to tool + back link |
| `e2e/jacquard-pattern.e2e.ts` | Jacquard flow still works after token refresh |
| `e2e/intarsia-assistant.e2e.ts` | Intarsia flow still works after token refresh |
| `src/lib/tools/registry.test.ts` | Registry invariants (unique slugs) |
| Manual | Card hover lime, keyboard focus, icon without box on catalog and portico |

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| `init --overwrite` removes custom CSS | Re-add `--hub-hover` after init |
| Radius 0 breaks editor control hit targets | Verify in e2e; restore min touch targets if needed without changing layout |
| `--brand` → Lime changes editor accent colour | Acceptable cosmetic change; revert token mapping if contrast fails |
| Phosphor icon import mismatch | Verify icon names at implementation time |
| Preset breaks shadcn component APIs | Run existing unit/e2e tests; pin component versions if needed |

### Out of scope (v1)

- IT/EN locale switcher in header
- Dark mode UI toggle
- Portico/tagline copy rewrite
- Editor layout redesign
- Emoji or decorative symbols

---

## Visual language (hub)

### Colour

- Background: Zinc off-white (`--background`)
- Text: Zinc near-black (`--foreground`); muted body (`--muted-foreground`)
- Interactive accent: Lime (`--hub-hover` on cards; `--brand` aliased to Lime for legacy editor refs)
- No gradients; no craft-kit aesthetic

### Typography

- Headings: Manrope, `font-medium` (not heavy bold)
- Body and descriptions: Inter, `font-light` where specified
- Generous line-height on intro copy

### Space

- Wide horizontal margins on desktop (via `PageShell`)
- Generous card padding
- Fixed portico/tool separator (consistent across tool pages)

### Accessibility

- Text/background contrast meets readable defaults (Zinc preset)
- Keyboard focus visible on catalog cards and navigation links
- Icons decorative where accompanied by visible text labels

---

## Relationship to existing hub spec

This document **supersedes** the visual language sections of `2026-06-04-knitting-tools-hub-design.md` for colour, typography, icons, and card styling. Hub information architecture (catalog → portico → tool → back link) is unchanged.

---

## Next step

After approval of this file: implementation plan via `writing-plans`.
