# Design: Intarsia work assistant

**Date:** 2026-06-29  
**Status:** Approved in brainstorming (sections 1–6)  
**Project:** knittingtools (third tool in the existing hub)

---

## Objective

Web tool that **guides the knitter during intarsia work** — not primarily a pattern designer, but a step-by-step assistant that always shows the correct row, counts stitches per colour, and advances stitch by stitch so the user never has to count manually.

The user prepares a pattern (image import or grid editor), then works through it with a live assistant: row highlight, colour-change instructions, segment bar, and point-by-point navigation.

---

## Product decisions (summary)

| Topic | Decision |
| --- | --- |
| Architecture | **Single UI** + **internal modular pipeline** (same pattern as jacquard tool) |
| Layout | **Classic sidebar (A):** top bar, grid centre, instructions right, segment footer |
| Row orientation | **Row 1 at bottom** — knitting convention (hand and machine) |
| Stitch cells | **One visible square per stitch**, always separated by grid lines/gap — never merged rectangles for same-colour runs |
| Cell shape | **Square** by default; toggle **«As on fabric»** (stitches/cm + rows/cm) |
| Image import | **Auto colour reduction** + **manual merge/rename** before work starts |
| Grid editor | **Full:** brush, eraser, fill, rectangular selection (copy/move), lines/shapes, symmetry, undo/redo |
| Row reading | **Auto zigzag** (odd rows →, even rows ←) or **manual** direction per row |
| Navigation | ←/→ = prev/next stitch; ↑/↓ or Space = prev/next row; tap stitch to mark position; tap row or type row number to jump |
| RS/WS label | **Shown by default**, hideable in settings |
| Edit while working | **Allowed** with warning + confirmation |
| Projects | **One active project** + **export/import** project file |
| Autosave | **Local browser storage** — pattern, row, stitch, zoom, settings |
| UI language | **English**; colour names **user-customisable** in legend |
| Limits v1 | Max **200 stitches** × **300 rows**, max **20 colours** |
| Privacy | **Browser-only processing**, no server upload — same as jacquard tool; image and pattern stay on the user's device while in use |

---

## Position in the hub

- New entry in `registry.ts` (proposed slug: `intarsia-assistant`)
- Page `src/routes/tools/intarsia-assistant/+page.svelte`
- `ToolPageLayout` with `wide={true}` (wider than needle chart, similar to jacquard)
- English copy in `$lib/copy.js` (or dedicated `intarsia` copy namespace)
- Portico: emphasise step-by-step guidance during knitting, browser-only privacy

---

## Page layout

### Desktop

| Top bar | Project name · zoom (50/100/200/400%) · row N · direction (→/←) · RS/WS (optional) |
| --- | --- |
| **Centre (~65%)** | Pattern grid — current row highlighted, others at 25% opacity, current stitch marked |
| **Right sidebar (~35%)** | Row instructions, stitch counts per colour, colour palette, renamable legend |
| **Footer (full width)** | Segment bar · current stitch index · ← / → (stitch) · **Next row** button |

### Tablet / narrow screens

- Grid full width on top
- Sidebar content stacks below the grid
- Large touch buttons: **Prev row** · **←** · **→** · **Next row**
- Pinch zoom supported

### Grid rendering rules

- Every stitch renders as an **individual cell** with a visible border or gap — even when adjacent cells share the same colour.
- Current row: full brightness + prominent border.
- Other rows: 25% opacity overlay.
- Current stitch: **prominent outline** (ring or bold border) within the current row — visible enough to mark a pause point when returning to work.
- **Tap a stitch:** set it as the current position and show the outline highlight (updates instructions and segment bar).
- On row change: **auto-scroll** to centre the current row in the viewport.
- Zoom via mouse wheel, pinch, and +/- buttons.

---

## Work assistant

### Row analysis

For each row, compute consecutive same-colour runs left-to-right (respecting current reading direction for display order).

Example row `BBBBWWWWBBBWWBBBB` (with Black = B, White = W):

```
4 Black · 4 White · 3 Black · 2 White · 4 Black
```

Stitch totals for the row:

```
Black: 11 · White: 6 · Total: 17 stitches
```

Instructions update automatically when the row or position changes.

### Segment bar (footer)

Visualise the row as coloured blocks (each block = one colour run, not merged stitches):

```
✓ ████  ▶ ██  ████  ▒▒▒
```

- Completed segments: checkmark
- Active segment: highlighted
- Upcoming segments: neutral

### Stitch and row navigation

Primary footer action is **Next row** — stitch-by-stitch movement uses arrow keys (or ← / → touch buttons), since colour changes within a row are already guided by the segment bar.

- **← / →:** previous / next stitch in the current reading direction. At the first or last stitch of a row, the marker stops — use **Next row** / **Prev row** to change row (no auto-wrap).
- **Next row** (button, ↓, or Space): advance to the next row; flip direction if zigzag mode.
- **Prev row** (↑ or button): go to previous row.
- **Tap a stitch:** set current position and show outline highlight — useful to mark where you paused.
- **Tap a row** (outside a specific stitch) or **row number input:** jump to that row (stitch resets to row start per reading direction).

Reading modes:

- **Auto (zigzag):** odd rows left-to-right, even rows right-to-left (row 1 = bottom).
- **Manual:** user sets → or ← per row.

| Input | Action |
| --- | --- |
| ← | Previous stitch |
| → | Next stitch |
| ↑ | Previous row |
| ↓ or Space | Next row |
| Tap stitch | Mark current position (outline highlight) |
| Tap row / row number | Jump to row N |
| Touch buttons (tablet) | Prev row · ← · → · Next row |

---

## Pattern preparation

### Image import (PNG/JPG)

1. User uploads image (drag & drop or file picker).
2. App quantises to N colours (slider, default sensible value, max 20).
3. **Review screen:** preview quantised grid (individual cells visible); user can merge similar colours, rename, adjust N.
4. Confirm → pattern matrix ready for work or further editing.

### Grid editor

- Create empty grid (user sets width × height, within limits).
- Tools: brush, eraser, fill bucket, rectangular selection (copy/move), line/shape tools, symmetry, undo/redo.
- Active colour palette (max 20 colours).
- Fabric-view toggle uses stitches/cm and rows/cm (same concept as jacquard tool).

### Colour legend

- Each colour in the pattern listed with swatch and editable name.
- Default names: `Colour 1`, `Colour 2`, … or derived from hex.
- User renames (e.g. `#000000` → `Black`, `#F5F5DC` → `Cream`).
- Names used in row instructions, segment bar labels, and palette.

### Edit while working

If the user edits the pattern during work mode, show a dialog:

> «Editing the pattern may change instructions for the current row. Continue?»

On confirm, apply changes and recalculate row analysis for the current position.

---

## Autosave and projects

### Autosave (local)

Persist to `localStorage` (or `IndexedDB` if pattern + source image exceed localStorage limits):

| Field | Content |
| --- | --- |
| Pattern matrix | Colour index per cell |
| Colour palette | Hex values + user names |
| Position | Current row, current stitch index |
| Zoom | Current zoom level |
| Settings | Reading mode, RS/WS visible, fabric view, gauge values, project name |

On reopen, restore exact state.

### Project export / import

- **Export:** download `{project-name}.intarsia.json` containing pattern, palette, position, settings, and optionally embedded source image (base64).
- **Import:** load a previously exported file.
- **New project:** confirm if an active project exists (replaces autosaved state).

### Out of scope — v1

- User accounts / cloud sync
- Multiple saved projects in a list UI
- PDF / PNG pattern export for printing
- Integration with jacquard converter (manual: user can import an image either way)

---

## Internal modules

| Module | Responsibility |
| --- | --- |
| `pattern-matrix` | 2D colour grid, dimensions, validation |
| `colour-palette` | Unique colours, names, merge/map |
| `image-import` | Load file, quantise, review UI data |
| `grid-editor` | Drawing tools, undo stack, symmetry |
| `row-analysis` | Run-length encoding per row, stitch counts |
| `work-assistant` | Position, direction, segment state, next/prev |
| `grid-renderer` | Canvas/grid draw: cells, highlight, opacity, zoom, scroll |
| `project-storage` | Autosave, export/import JSON |
| `IntarsiaEditor.svelte` | Shell: layout, wires modules, keyboard shortcuts |

---

## Error handling

| Situation | Message (intent) |
| --- | --- |
| Unsupported file format | «Unsupported format. Use JPG or PNG.» |
| File too large | «Image too large. Try a smaller file.» |
| Pattern exceeds limits | «Pattern exceeds 200 stitches or 300 rows.» |
| Too many colours | «Maximum 20 colours. Merge colours in the review step.» |
| No pattern loaded | Work controls disabled; «Load or create a pattern to start.» |
| Import invalid project file | «Could not read project file.» |
| Edit during work (confirm) | Dialog as described above |

All messages in English.

---

## Testing (implementation)

- Row analysis: run-length encoding and per-colour totals
- Zigzag direction: odd/even rows with row 1 at bottom
- Stitch advance: ←/→ stops at row ends; Next row / Prev row change row and flip zigzag direction
- Grid render: adjacent same-colour cells still show individual borders
- Autosave round-trip: position and settings restored
- Export/import: full project restores on another session
- Image quantise + manual colour merge
- Limits enforced at 200 × 300 × 20 colours
- Keyboard: ←/→ stitch, ↑/↓/space row, tap stitch sets position with outline

---

## Next step

After approval of this file: detailed implementation plan (`writing-plans`).
