# Design: Data pattern generator

**Date:** 2026-06-29  
**Status:** Approved in brainstorming (sections 1–4); ambiguities resolved  
**Project:** knittingtools (fourth tool in the existing hub)

---

## Objective

Creative web tool that transforms **personal data** — voice, audio files, or terrain elevation — into editable knitting patterns. Not a technical converter: exploration, light editing, and real export for hand or machine knitting.

The user picks a data source, configures dimensions and analysis options, generates a pattern, refines it in a simple editor, and exports as either a **knit/purl chart** or a **two-colour jacquard** bitmap.

---

## Product decisions (summary)

| Topic | Decision |
| --- | --- |
| Architecture | **Single UI** + **internal modular pipeline** (same pattern as jacquard and intarsia tools) |
| Output | **Knit/purl chart** or **jacquard (2 colours)** — user chooses at export |
| Knit/purl | Symbol legend (`\|` knit, `-` purl); point-by-point toggle |
| Sources v1 | **All three:** Voice, Audio file (waveform or spectrogram), Terrain |
| Navigation | **Hybrid:** wizard for source + config → single workspace (editor + export + always-visible preview) |
| Dimensions | Width in stitches + stitches/cm & rows/cm; row count **computed from source** (formulas below) |
| Export v1 | Jacquard AYAB PNG + annotated PDF; knit/purl PDF chart + symbolic PNG |
| Editor v1 | **Basic only:** toggle stitch, brush, eraser, undo/redo (max 50) |
| Terrain v1 | Search + map; modes: continuous elevation **or** posterized relief (radio) |
| UI language | **English only** (like intarsia assistant) |
| Privacy | Transparent notice **for Terrain only** (Nominatim + Open-Elevation); voice & audio fully local |
| Row orientation | **Row 1 at bottom** in preview and all exports |
| Limits v1 | Stitches: warning + export confirm above **200** (same as jacquard). Rows: **hard cap 300** at generation |

---

## Constants and formulas

All magic numbers live in `src/lib/data-pattern/constants.ts` and are tested.

### Shared limits

| Constant | Value | Behaviour |
| --- | --- | --- |
| `MAX_STITCHES_WARN` | 200 | Persistent warning in UI; export confirm if exceeded |
| `MAX_ROWS` | 300 | Hard cap at generation — adapter output is clamped |
| `MIN_ROWS` | 10 | Hard floor at generation — adapter output is clamped |
| `MAX_FILE_BYTES` | 20 MB | Same as jacquard |
| `MAX_VOICE_DURATION_SEC` | 60 | Slider cap |
| `DEFAULT_VOICE_DURATION_SEC` | 30 | Default slider value |
| `MIN_VOICE_DURATION_SEC` | 5 | Slider floor |
| `AUDIO_SEGMENT_THRESHOLD_SEC` | 60 | Segment picker shown only when file duration exceeds this |
| `DEFAULT_AUDIO_SEGMENT_SEC` | 60 | Default segment length when picker is shown |
| `MAX_TERRAIN_BBOX_DEG` | 0.5 | Max lat or lng span of selection box — hard block above this |
| `UNDO_STACK_MAX` | 50 | Editor undo depth |

### Row count (all sources)

Gauge affects **cm summary only**, not row count (except terrain, where bbox aspect uses gauge).

**Voice and audio file:**

```
rows = clamp(round(durationSec × ROWS_PER_SEC), MIN_ROWS, MAX_ROWS)
ROWS_PER_SEC = 4    // 15 s → 60 rows, 30 s → 120 rows, 75 s → 300 rows (capped)
```

`durationSec` = recorded length (voice) or selected segment length (audio file).

**Audio file — cell mapping** (both modes: column `c` = time slice `c / width` … `(c+1) / width` of segment):

| Mode | Cell `(c, r)` value (before sensitivity + smoothing) |
| --- | --- |
| **Waveform** | Let `amp[c]` = RMS of time slice `c`, normalised 0–1 across all columns. Row `r` represents amplitude band `(r + 0.5) / height`. Value = `1` when `floor(amp[c] × height) === r`, else `0`. |
| **Spectrogram** | FFT of time slice `c`; row `r` = frequency band `r` of `height` bands (low → high, row 0 = top). Value = normalised energy in that band. |

After mapping: multiply by `sensitivity`, apply spatial smoothing, then min–max normalise entire matrix.

**Terrain:**

```
bboxAspect = (lngSpan × cos(centerLat)) / latSpan
widthCm    = stitches / stitchesPerCm
heightCm   = widthCm / bboxAspect
rows       = clamp(round(heightCm × rowsPerCm), MIN_ROWS, MAX_ROWS)
```

`latSpan` / `lngSpan` = absolute difference of bbox corners in degrees.

### Bitmap semantics (single definition)

| Value | Jacquard view | Knit/purl symbols | Brush | Eraser | Toggle |
| --- | --- | --- | --- | --- | --- |
| `0` | White (background) | `-` (purl) | — | sets cell to `0` | `0 → 1` |
| `1` | Black (foreground) | `\|` (knit) | sets cell to `1` | — | `1 → 0` |

Internal storage is **row 0 = top** (image order). Preview and export **flip vertically** so row 1 appears at the bottom. Flip happens only in render/export functions, never by mutating the bitmap.

### Refine vs manual edits

- `SourceMatrix` is immutable after generation.
- **Refine** (contrast, threshold, invert) regenerates `Bitmap` from `SourceMatrix`.
- **Editor** mutates `Bitmap` in place.
- Changing any Refine control after the user has edited the bitmap → confirmation dialog: «Changing refine settings will discard manual edits. Continue?» On cancel, slider reverts.
- **«Reset to generated»** → same regeneration as Refine, always with confirmation: «Discard manual edits and restore from source data?»

### External services (Terrain only)

| Service | URL / API | Purpose |
| --- | --- | --- |
| **Nominatim** | `https://nominatim.openstreetmap.org/search` | Place search → map centre |
| **Open-Elevation** | `https://api.open-elevation.com/api/v1/lookup` (POST) | Elevation samples for bbox grid |

No API keys in v1. No Mapbox or other DEM providers in v1.

If Nominatim fails: search field shows error; user can still pan/zoom the map and position the selection box manually. No separate «fallback mode».

---

## Position in the hub

- New entry in `registry.ts` (slug: `data-pattern`)
- Page `src/routes/tools/data-pattern/+page.svelte`
- `ToolPageLayout` with `wide={true}` (similar to jacquard and intarsia)
- English copy in `$lib/copy.js` (namespace `dataPattern`) — not Paraglide
- Portico: emphasise turning voice, music, or landscape into a knitting pattern; note Terrain sends bbox coordinates to Open-Elevation

---

## Page layout and user flow

The tool has **two visual phases**: wizard (source + config) and workspace (edit + export). The step bar is **hidden in the workspace**.

### Phase 1 — Wizard (steps)

```
① Source  →  ② Configure  →  ③ Generate
```

On mobile: compact tabs (`Source` · `Config` · `Go`).

#### Step 1 — Source

Three selectable cards (radio):

| Voice | Audio file | Terrain |
| --- | --- | --- |
| Microphone icon | Wave/file icon | Map/mountain icon |
| «Record from microphone» | «Upload MP3, WAV, or OGG» | «Pick a place on the map» |

- Voice and Audio: **«Runs locally»** badge
- Terrain: **«Uses external map data»** badge + link «What is sent?» (bbox coordinates only)

**Continue** enabled only when a source is selected.

#### Step 2 — Configure

Content **per source** + shared **Dimensions & gauge** at the bottom.

**Voice**

- Record / Stop with timer (WebM/Opus via `MediaRecorder`, decoded with Web Audio API)
- Max duration slider: 5–60 s (default 30 s)
- Live waveform during recording
- Controls: **Sensitivity** (0–2, default 1), **Smoothing** (0–1, default 0.3)

No contrast, threshold, or invert in the wizard — those are workspace Refine only.

**Audio file**

- Drag & drop + file picker (MP3, WAV, OGG; max 20 MB)
- Mini waveform of loaded file
- **Segment picker** shown only when `durationSec > 60`: start/end handles, default first 60 s
- **Analysis mode** radio: **Waveform** (default) | **Spectrogram**
- Controls: **Sensitivity** (0–2, default 1), **Smoothing** (0–1, default 0.3)

No contrast, threshold, or invert in the wizard — those are workspace Refine only.

**Terrain**

- Place search (Nominatim)
- Interactive map (pan/zoom via map library); **one draggable/resizable selection box** defines the bbox
- Mode: **radio** — Continuous elevation **or** Posterized relief (default: Continuous)
- Posterized only: **Posterize levels** slider (3–8, default 5)
- No separate «zoom/area size» slider — area size is controlled only by the selection box

**Dimensions & gauge** (shared)

- Width in stitches (default 120, min 10; no input max — same as jacquard)
- Stitches/cm and Rows/cm (default 4.5 × 6.4)
- Live summary: `120 sts × N rows — approx. W × H cm on fabric`
- `N` from row-count formula above; updates live as source config changes

Buttons: **Back** · **Generate pattern**

#### Step 3 — Generate (transient)

Spinner while `SourceAdapter.analyze()` runs. No cancel button in v1. On success → automatic transition to workspace. On failure → error message and **Back to Configure** button.

### Phase 2 — Workspace

#### Desktop

| Left (~38%) | Right (~62%) |
| --- | --- |
| Editor toolbar | Pattern preview (fixed) |
| Refine: contrast, threshold, invert | «As on fabric» toggle |
| Export section | Symbol legend (Symbols view only) |
| | Dimension summary |

#### Mobile / tablet

Preview on top → toolbar → Refine + Export accordions → legend.

#### Editor toolbar

| Tool | Behaviour |
| --- | --- |
| **Toggle** | Tap cell → flip `0 ↔ 1` |
| **Brush** | Paint foreground (`1`) |
| **Eraser** | Paint background (`0`) |
| **Undo / Redo** | Max 50 snapshots |

Top bar: **← Change source** (confirm: «Your pattern edits will be lost. Continue?») · zoom 50/100/200% · view toggle **Symbols** / **Jacquard colours** (preview only — does not affect export mode).

#### Preview

- **Symbols**: `\|` knit, `-` purl; row 1 at bottom; cell borders always visible
- **Jacquard colours**: white/black; same layout rules
- **«As on fabric»**: cell aspect ratio from gauge

#### Export section

User picks export mode first: **Knit/purl chart** or **Jacquard (2 colours)** — independent of preview toggle.

| Knit/purl | Jacquard |
| --- | --- |
| **Download PDF chart** (symbols + legend + numbering) | **Download AYAB PNG** |
| **Download symbolic PNG** | **Download annotated PDF** |

Four buttons total. No separate «preview PNG» download — the on-screen preview is sufficient.

Export confirm dialog when `stitches > 200` (same pattern as jacquard).

---

## Data pipeline and internal modules

### Core data contract

```typescript
type SourceMatrix = {
  width: number;
  height: number;
  values: Float32Array; // row-major, 0.0–1.0, row 0 = top
};

type Bitmap = Uint8Array; // row-major, 0 | 1, row 0 = top

interface SourceAdapter<TInput, TConfig> {
  id: 'voice' | 'audio-file' | 'terrain';
  analyze(input: TInput, config: TConfig & SharedConfig): Promise<SourceMatrix>;
  estimateRows(input: TInput, config: TConfig & SharedConfig): number;
}

type SharedConfig = {
  stitches: number;
  stitchesPerCm: number;
  rowsPerCm: number;
};
```

### Pipeline (4 phases)

```
SourceAdapter.analyze()  →  SourceMatrix
matrixToBitmap()         →  Bitmap        (Refine params)
PatternEditor              →  Bitmap        (user edits)
ExportRouter               →  files         (vertical flip at render)
```

Preview reads `SourceMatrix` for grayscale background (optional) and `Bitmap` for pattern overlay. No separate `matrixToGrayscale` module.

### Module 1 — Voice adapter

1. Mono PCM from `AudioBuffer`
2. Grid `stitches × rows` (rows from formula)
3. Per cell: **RMS energy** of samples in that time slice (grid divides segment into `width × height` equal windows, row-major)
4. Multiply by `sensitivity`; apply spatial smoothing (`smoothing` controls 3×3 kernel blend)
5. Normalise min–max → `SourceMatrix`

No frequency centroid in v1.

### Module 2 — Audio file adapter

1. Decode file to mono `AudioBuffer`
2. Segment = full file if `durationSec ≤ 60`, else user-selected range (min 1 s)
3. Grid `stitches × rows` (rows from formula)
4. Map cells per **analysis mode** (see table in Constants and formulas)
5. Apply `sensitivity`, spatial smoothing, min–max normalise → `SourceMatrix`

```typescript
type AudioFileConfig = {
  analysisMode: 'waveform' | 'spectrogram'; // default 'waveform'
  sensitivity: number;  // 0–2, default 1
  smoothing: number;    // 0–1, default 0.3
  segmentStartSec: number;
  segmentEndSec: number;
};
```

### Module 3 — Terrain adapter

1. Nominatim search → pan map to result (or user pans manually)
2. Sample elevation grid via Open-Elevation for bbox corners + interpolated grid
3. If posterized: quantise to N levels before normalisation
4. Normalise min–max → `SourceMatrix`

Rows from terrain formula. Reject bbox if `latSpan > 0.5` or `lngSpan > 0.5`.

### Module 4 — `matrixToBitmap`

```typescript
matrixToBitmap(matrix: SourceMatrix, opts: {
  contrast: number;   // 0–2, default 1
  threshold: number;  // 0–1, default 0.5
  invert: boolean;    // default false
}): Bitmap
```

Reuses jacquard contrast/threshold/invert logic adapted for `Float32Array`.

### Module 5 — Pattern editor

Undo stack stores full `Bitmap` snapshots. New edit clears redo branch.

### Module 6 — Export router

| Mode | Button | Module |
| --- | --- | --- |
| `jacquard` | Download AYAB PNG | `$lib/jacquard/export-ayab.js` |
| `jacquard` | Download annotated PDF | `$lib/jacquard/export-docs.js` |
| `knit-purl` | Download PDF chart | `$lib/data-pattern/export-knit-purl.ts` |
| `knit-purl` | Download symbolic PNG | `$lib/data-pattern/export-knit-purl.ts` |

All exports receive a vertically flipped copy of the bitmap (row 1 at bottom).

### File structure

```
src/lib/data-pattern/
  types.ts
  constants.ts
  matrix-to-bitmap.ts
  matrix-to-bitmap.test.ts
  dimensions.ts
  adapters/
    voice.ts
    voice.test.ts
    audio-file.ts
    audio-file.test.ts
    terrain.ts
    terrain.test.ts
  export-knit-purl.ts
  export-knit-purl.test.ts

src/lib/components/data-pattern/
  DataPatternEditor.svelte
  SourcePicker.svelte
  VoiceConfig.svelte
  AudioConfig.svelte
  TerrainConfig.svelte
  PatternWorkspace.svelte
  PatternPreview.svelte
  EditorToolbar.svelte
  ExportPanel.svelte
```

---

## Error handling

All messages in English via `$lib/copy.js` (`dataPattern` namespace).

### Permissions and hardware

| Situation | Behaviour |
| --- | --- |
| Microphone denied | «Microphone access denied. Allow access in browser settings to use Voice mode.» — Voice card disabled |
| Microphone unavailable | Same message; suggest Audio file |
| No Web Audio API | Banner: «This browser doesn't support audio analysis. Try Chrome or Firefox.» — Voice and Audio disabled |

### Audio file

| Situation | Message |
| --- | --- |
| Unsupported format | «Unsupported format. Use MP3, WAV, or OGG.» |
| File > 20 MB | «File too large. Try a shorter clip or lower bitrate.» |
| Decode failed | «Could not read this audio file. Try converting to WAV.» |
| Segment < 1 s | «Select a segment with at least 1 second of audio.» |

### Terrain

| Situation | Behaviour |
| --- | --- |
| Search no results | «No location found. Try a different spelling.» |
| Nominatim unreachable | «Place search is unavailable. Pan the map to your area.» |
| Open-Elevation unreachable | «Could not fetch elevation data. Check your connection and try again.» + **Retry** |
| Bbox > 0.5° | «Selected area is too large. Zoom in or shrink the selection box.» — blocks Generate |
| Flat matrix after fetch | «Input looks uniform — try increasing contrast or pick a different area.» — pattern still generated |

### Generation and workspace

| Situation | Behaviour |
| --- | --- |
| Rows capped at 300 | «Pattern capped at 300 rows. Use a shorter clip or smaller area.» (informational after generate) |
| Stitches > 200 | Persistent warning near field |
| Rows < 10 after clamp | «Pattern is very short — try a longer recording or wider area.» |
| Change source with edits | Confirm dialog |
| Refine change with edits | Confirm dialog (slider reverts on cancel) |
| Reset to generated | Confirm dialog |
| No bitmap loaded | Export buttons disabled |

### Editor

| Situation | Behaviour |
| --- | --- |
| Undo/redo exhausted | Button disabled |
| Tap outside grid | Ignored |

---

## Out of scope — v1

| Feature | Reason |
| --- | --- |
| Contrast / invert in wizard | Refine section in workspace is the single place |
| Preview PNG download button | On-screen preview is enough |
| Frequency centroid in voice adapter | RMS only |
| Mapbox / paid DEM providers | Open-Elevation only |
| Spotify / streaming | API + licensing |
| Beat detection | Spectrogram covers creative use |
| Terrain: contour lines, slope | v2 |
| Editor: fill, mirror, rotate, selection | v2 |
| Project save / import | Not required |
| Autosave localStorage | v2 |
| Multicolour / intarsia | Outside dual export mode |
| Dithering | Consistent with jacquard v1 |
| User accounts / cloud | Hub philosophy |
| Italian UI | English only |
| Generate-step cancel | v2 |
| Other data sources | Adapter architecture ready; future |

---

## Testing (implementation)

Vitest on pure modules only; no E2E in v1.

### Constants and dimensions

- `ROWS_PER_SEC` formula: 15 s → 60 rows, 75 s → 300 (capped)
- Terrain row formula with known bbox and gauge
- `clamp(rows, 10, 300)` applied in all adapters

### Adapters

- `voice`: RMS grid on synthetic sine burst; sensitivity scales output
- `audio-file`: waveform on known amplitude ramp produces single-row silhouette per column; spectrogram on pure tone concentrates energy in one band; modes differ on same buffer; segment start/end honoured; full file when ≤ 60 s
- `terrain`: normalisation; posterize N=5 → exactly 5 distinct levels before bitmap step

### `matrixToBitmap`

- Contrast, threshold, invert on fixed matrix
- Flat matrix → all `0` or all `1` depending on threshold

### Editor

- Brush/eraser/toggle on 3×3 fixture
- Undo/redo: 50 max; redo cleared on new edit
- Reset restores bitmap from matrix + current refine params

### Export

- Vertical flip: row 0 in memory → bottom row in export output
- Knit/purl PDF: `\|` / `-` mapping matches bitmap semantics table
- Jacquard PNG: reuses jacquard tests for dimensions and two colours

### UI logic (unit-testable helpers)

- `hasManualEdits(bitmap, generatedBitmap)` drives refine confirm
- Export confirm flag when `stitches > 200`
- Segment picker visibility when `durationSec > 60`

---

## Next step

After approval of this file: detailed implementation plan (`writing-plans`).
