# BUILD PROMPT (FINAL): Quality-Aware Top-K Multi-Image Super-Resolution — Research Demo Website

You are building a **prototype research/demo website** for an SIH/internal-round presentation. It must feel like an early, honest version of the FINAL PRODUCT — not a slideshow of disconnected charts. Read this entire prompt before writing any code. This file supersedes any earlier draft of this prompt.

---

## 0. NON-NEGOTIABLE GROUND RULES

1. **Do NOT build or train any ML model.** No PyTorch, no training loop, no inference server.
2. **Do NOT invent dataset statistics or benchmark numbers.** Anything not derived from real CSVs/rasters must be visually and textually labeled `SIMULATED` / `CONCEPTUAL`.
3. **Do NOT alter the ranking formula** (given in §2). Only display/recompute it transparently from real rows.
4. **Real data always wins over simulated data.** If a real HR raster, LR raster, mask, band, or geotransform exists for the selected scene, use it. Only fall back to a simulated/procedural placeholder when the real asset genuinely doesn't exist — and label that fallback explicitly.
5. Every screen must make it obvious which numbers are **REAL** vs **SIMULATED**, via one shared badge component used consistently everywhere (not a buried disclaimer).
6. The site must separate **"what has already been built"** from **"what the completed system will do"** — see §6 (Status Layer). Never imply planned ML functionality already exists.
7. Aesthetic: serious remote-sensing instrument panel. Not a generic AI SaaS dashboard, not a marketing landing page.

---

## 1. DATA — TWO TIERS

### Tier A — Full metadata (CSV, at project root)
```
data/topk_candidates.csv
data/lr_candidates_ranked.csv
data/lr_quality_features_all.csv
```
Parse these with `papaparse`. Don't hardcode row counts or exact column names — inspect headers at load time and degrade gracefully (`DATA UNAVAILABLE`) if an expected field is missing. Likely columns: `tile`, candidate number, `bounds`, `lowres_date`, `highres_date`, `area`, `cloud_cover`, `delta`, `lon`, `lat`, `LCCS`, `SMOD`, `IPCC Class`, `LCCS class`, `SMOD Class`, `source`, `joint_class`, plus ranking-stage fields (`valid_pixel_pct`, `cloud_mask_pct`, `cloud_probability_pct`, ranking score, rank, LR TIFF path).

This tier covers the **entire candidate/ranking dataset** (thousands of scenes) but has **no pixel imagery** — it drives every chart, table, timeline, scatter, and map footprint.

### Tier B — Real sample rasters (2–3 scenes only)
```
data/HR/<scene-id>/...    (actual HR TIFFs — inspect what's there, don't assume filenames)
data/LR/<scene-id>/...    (actual LR candidate TIFFs, masks, angle rasters, metadata)
```
These are **real, representative sample scenes**, not the full dataset. They provide actual pixels + actual geospatial metadata (CRS, affine transform, bounds, width/height, band count) for the handful of scenes selected as demo defaults.

**Do not require the full dataset to run the site.** Only these 2–3 sample scenes need working imagery; every other tile in the CSVs still populates charts/tables/map footprints from metadata alone, with imagery panels showing a labeled placeholder for tiles that lack a sample raster.

### Preprocessing pipeline (build this first, as a script — not at page-render time)

Browser-side GeoTIFF parsing of large multi-band rasters is unnecessarily complex for a demo. Instead:

1. Write a preprocessing script (Python + `rasterio`/`numpy`, or Node + `geotiff.js` — your choice, pick whichever is more reliable in this environment) that runs **once** over `data/HR/` and `data/LR/`.
2. For each raster, extract: CRS, affine transform, bounds (in lon/lat), width, height, band count/names (if resolvable — otherwise `Band 1`, `Band 2`, ... never invent Sentinel band names when uncertain), nodata value.
3. Generate browser-friendly preview images (PNG/WebP) for available representations: RGB composite, false-color/NIR composite if bands allow, cloud probability, cloud mask, data mask — whichever actually exist in the source files. Skip (mark `DATA UNAVAILABLE`) any layer that can't be genuinely derived.
4. Write one JSON manifest per scene, e.g. `data/processed/<scene-id>.json`, containing: raster metadata (CRS/transform/bounds/dimensions/bands) + generated preview file paths + a join key (`tile`) to match against the CSV ranking rows.
5. The frontend reads only these manifests + the CSVs — never parses raw TIFFs at runtime.
6. Design this manifest schema so dropping additional `data/HR/<scene>` / `data/LR/<scene>` folders in later and re-running the script adds scenes without any app code changes.

### Ranking formula (replicate exactly, do not modify)
```
temporal_quality  = exp(-abs_delta_days / 90)
cloud_quality     = 0.5 * cloud_probability_quality + 0.5 * cloud_mask_quality
validity_quality  = valid_pixel_pct / 100
ranking_score = 0.60 * temporal_quality + 0.30 * cloud_quality + 0.10 * validity_quality
```
Filter thresholds already applied upstream (reflect in UI copy, don't re-derive): `valid_pixel_pct >= 90`, `cloud_mask_pct <= 20`, `cloud_probability_pct <= 50` (missing cloud probability allowed).

---

## 2. TECH STACK

- Next.js (App Router) + TypeScript
- Tailwind CSS with a fully custom theme (see §3) — no default Tailwind blue/indigo anywhere
- Recharts (ranking bars, timeline, scatter)
- MapLibre GL JS with a custom dark basemap style (not default blue) for the geospatial view
- `papaparse` for CSV parsing
- Raster preprocessing script (Python/rasterio or Node/geotiff.js) run offline, output consumed as static JSON + images
- Static/SSG deployable, no runtime backend/DB required beyond the dev server reading local files

---

## 3. DESIGN SYSTEM — "INK-BLACK MISSION CONTROL"

Banned: default Tailwind blue/indigo/violet gradients, glassmorphism blur cards, floating `rounded-3xl` shadowed panels, emoji-as-icons, generic AI-sparkle iconography, centered gradient-text hero sections.

**Palette (define as theme tokens, never raw Tailwind blue):**
- Background: `#0B0C0E` / `#111214`
- Panel surface: `#17181B` with 1px hairline borders `#2A2C30` — depth via borders/insets, not drop shadows
- Primary accent: terracotta `#D97840` (secondary: amber `#E8A33D`, used sparingly)
- Selected/olive: `#7A9B6E` · Rejected/brick: `#B5544A` (both desaturated, not neon)
- Text: off-white `#E7E5E1` primary, warm gray `#8C8A85` secondary
- Grid/divider lines: `#232529`

**Typography:** monospace (JetBrains Mono / IBM Plex Mono) for all numeric/telemetry — coordinates, scores, band values, dates. Grotesk sans (Inter / IBM Plex Sans / Space Grotesk) for headings/labels.

**Layout language:** sharp-to-minimal corners (max `rounded-md`), dense instrument-panel information density (not sparse marketing whitespace), thin-border grid segmentation instead of floating cards, recurring uppercase monospace section labels (e.g. `RANKING · TILE_00482`), fast functional 150–200ms transitions, no bounce/spring easing, no particle/glow effects. `DATA` badge = olive outline; `SIMULATED`/`CONCEPTUAL` badge = terracotta outline with a subtle hatch/dotted texture.

Produce a small internal `theme.md`/Tailwind-config comment documenting these tokens before building screens.

---

## 4. INFORMATION ARCHITECTURE

Single-page workspace, in-page sections (not separate routes), so the pipeline stays contiguous:

```
/ (Scene Analysis Workspace)
 ├─ Final Product Overview / Dashboard   [§7]
 ├─ Scene Explorer (search/select)       [real]
 ├─ Roadmap / Build-Status Layer         [§6]
 ├─ Candidate Timeline + Quality/Temporal Scatter   [real]
 ├─ Candidate Panel (ranked table/cards) + K Selector   [real]
 │    ├─ "Why selected?" drawer          [real]
 │    └─ "Why rejected?" drawer          [real]
 ├─ Geospatial Map View                  [real footprints]
 ├─ Image Inspector (real raster where available)
 │    ├─ Cursor telemetry (lat/lon/pixel/bands)   [real]
 │    └─ Synchronized crosshair (LR ↔ HR)         [real coords]
 ├─ Alignment View (before/after)        [simulated]
 ├─ Feature Alignment View               [simulated/conceptual]
 ├─ Fusion View (attention weights)      [simulated]
 ├─ Reconstruction View (LR/pred/ref/diff)  [simulated]
 ├─ Metrics Panel (PSNR/SSIM/SAM, baselines)  [simulated]
 ├─ Pipeline Diagram (clickable stages)
 ├─ Research Contribution Panel
 ├─ Final System Architecture Diagram
 └─ Demo Mode ("Analyze Scene" guided walkthrough)
```

---

## 5. COMPONENT SPEC

- `SceneSelector` — real: tile, HR date, lat/lon, area, land-cover class, total/usable candidates, current K, and whether this tile has a real sample raster (`SAMPLE IMAGERY AVAILABLE` badge) or metadata-only.
- `FinalProductOverview` — at-a-glance dashboard: current scene, observations (16 available / X usable / K selected), quality averages (mean cloud probability, mean temporal distance, valid coverage), Top-K list, and a compact pipeline-status ticker (✓ Data, ✓ Ranking, ✓ Top-K, → Alignment, → MISR, → Reconstruction, → Evaluation).
- `RoadmapPanel` — Completed / In Progress / Planned, structured as phases (Data Foundation → Quality-Aware Selection → Spatial Alignment → MISR Core → Training & Evaluation → Final System), visually distinguishing completed (solid/olive) from planned (outlined/muted). Content per §6 below — do not editorialize, just state it plainly.
- `CandidateTimeline` — real dates; HR acquisition marked distinctly; Top-K filled/olive, non-selected outlined, rejected muted/brick; hover shows candidate #, date, Δdays, cloud probability, rank.
- `QualityTemporalScatter` — X = |Δdays|, Y = cloud probability; Top-K highlighted, rejected visually muted (not hidden); hover shows full telemetry.
- `CandidateTable` / `CandidateCard` — real per-candidate row (date, Δdays, cloud probability, cloud mask %, valid pixel %, score, rank, status).
- `WhySelectedDrawer` — clicking a selected candidate shows its score breakdown computed live from the real formula: temporal/cloud/validity contributions as bars + final score, framed as answering "why did the system choose this image?"
- `WhyRejectedDrawer` — clicking a filtered-out candidate shows which threshold(s) it failed (cloud mask / cloud probability / valid pixels), each shown as an explicit ✕ with actual value vs threshold. Never just hide rejected candidates from the data — they're part of the story.
- `TopKSelector` — K=1..4 (or up to however many are usable); live-updates highlighting, map, image inspector, fusion view; shows real `"Selected {K} of {N} observations"`; if fewer than K usable candidates exist, shows the true count, never pads with fake ones. Include one-line copy: "K=1 → single-observation reconstruction (SISR-like). K>1 → multi-image reconstruction."
- `GeoMap` (MapLibre, dark custom style) — real HR/LR footprints from bounds/lat-lon; Top-K visually distinct; click a footprint to open its candidate card.
- `ImageInspector` — renders the real preprocessed raster preview (RGB/false-color/cloud mask/cloud probability/data mask, whichever genuinely exist — else `DATA UNAVAILABLE`, never fabricated); cursor telemetry panel shows LAT/LON/PIXEL X/PIXEL Y/CRS computed from the real geotransform, plus real band values at that pixel if resolvable (else `Band 1`, `Band 2`... not invented names).
- `SynchronizedCrosshair` — two panels (e.g. LR candidate vs HR reference) sharing a geographic coordinate; moving the cursor over one updates the corresponding location marker + lat/lon readout on the other, using real bounds/transforms. This is a headline interaction — implement it carefully.
- `AlignmentViewer` — before/after registration, side-by-side or opacity-slider, using the real sample rasters where available (only the *registration itself* is simulated); label: `PROTOTYPE VISUALIZATION — REGISTRATION STAGE SIMULATED`.
- `FeatureMapViewer` — heatmap-style illustrative feature maps per candidate; label `CONCEPTUAL / SIMULATED FEATURE ALIGNMENT`.
- `FusionViewer` — per-candidate attention-weight bars (sum to 1), generated deterministically so they correlate with real ranking_score (higher-ranked candidates get higher illustrative weight) but clearly labeled `SIMULATED — NOT MODEL OUTPUT`.
- `ReconstructionViewer` — three-panel LR inputs / prediction placeholder / real HR reference (if sample exists), plus diff-map and a prediction↔reference comparison slider; label prediction/diff as simulated.
- `MetricsPanel` — PSNR/SSIM/SAM (+ optional LPIPS) across Bicubic / SISR / Unranked MISR / Quality-Aware Top-K MISR, all marked `DEMO / SIMULATED` unless a real value is actually computed.
- `PipelineDiagram` — clickable stage chain (16 LR → Quality Filter → Ranking → Top-K → Geo Alignment → Encoder → Fine Alignment → Attention Fusion → Reconstruction → HR); each stage opens a drawer with WHAT ENTERS / WHAT HAPPENS / WHAT COMES OUT.
- `ResearchContributionPanel` — Existing approach (single-image SR) vs proposed approach (quality-aware selection → alignment → learned feature alignment → attention fusion → reconstruction), key line: *"Not every observation is equally useful."* Do not claim MISR itself is novel — the quality-aware selection/fusion framing is the contribution.
- `FinalSystemArchitectureDiagram` — the full vertical stage diagram from raw multi-temporal data down to evaluation/output (see §23 structure in source spec) as one of the strongest static visuals on the site.
- `DemoMode` — single "Analyze Scene" trigger stepping quickly (no artificial multi-second progress bars) through: Load Observations → Quality Assessment → Filter → Rank → Top-K → Align → Encode → Fine Align → Fuse → Reconstruct → Evaluate, focusing/scrolling to each already-built view as it goes, marking simulated stages (06–11) explicitly.

---

## 6. STATUS LAYER — "WHAT WE HAVE BUILT" VS "WHAT WE ARE BUILDING"

Surface this honestly and accessibly from the main workspace (e.g. a Roadmap tab/section), using exactly this real project state — do not upgrade "in progress" items to "completed":

**COMPLETED:** dataset exploration · HR/LR scene organization · LR candidate extraction · quality feature extraction · temporal distance calculation · cloud probability analysis · cloud-mask analysis · valid-pixel analysis · quality filtering · quality-aware candidate ranking · Top-K candidate extraction · candidate manifest generation · multi-candidate LR loading/inspection.

**IN PROGRESS / NEXT:** geographic alignment · MISR dataset construction · feature extraction · learned feature alignment · multi-image fusion · HR reconstruction · training/evaluation.

**PLANNED:** full MISR model · ablation studies (K=1/2/4/8/16) · baseline comparison · PSNR/SSIM/SAM evaluation · robust variable-K handling · final deployment.

Present as phases (Data Foundation ✓ → Quality-Aware Selection ✓ → Spatial Alignment [next] → MISR Core [planned] → Training & Evaluation [planned] → Final System [planned]), visually distinguishing completed from future phases (e.g. solid/olive fill vs outlined/muted).

---

## 7. REAL vs SIMULATED — FULL POLICY

**REAL (must come from actual data, never fabricated):** scene metadata, candidate metadata, ranking scores and their breakdown, quality measurements, dates, coordinates, raster bounds/dimensions/CRS/transform, the sample imagery itself, actual masks/probability layers when the sample provides them, filter pass/fail reasons.

**SIMULATED / CONCEPTUAL (must be labeled):** geographic registration process itself (even if shown over real imagery), learned feature maps, neural attention weights, fused feature representation, reconstructed HR output, any neural-network metric not actually computed.

When both a real and simulated value could apply to the same element, **always show the real one** and only simulate what genuinely doesn't exist yet (e.g. real HR raster + simulated "prediction" placeholder, or real cloud-mask layer + simulated fine-alignment feature map).

Don't require the full 3,928-scene dataset to be functional — the 2–3 sample scenes carry the real-imagery experience; every other tile still works for metadata/ranking/map/chart purposes, with imagery panels showing "Sample imagery not available for this tile" rather than a fabricated image.

---

## 8. JUDGE DEMO FLOW (design the UI so this sequence is natural, ~2–3 min)

1. Open workspace → Final Product Overview.
2. Select a real sample scene → "16 observations available."
3. Timeline → hover a few candidates.
4. Scatter plot → show it isn't just "closest date wins."
5. Click a candidate → "Why selected?" drawer.
6. Show a rejected candidate → "Why rejected?" drawer.
7. Set K=4 → selected set updates on map + candidate list.
8. Open Image Inspector → move cursor → real lat/lon/pixel/band readout.
9. Synchronized crosshair between an LR candidate and the HR reference.
10. Alignment view → before/after (simulated stage, labeled).
11. Feature Alignment → conceptual feature maps (labeled).
12. Fusion → simulated attention bars (labeled).
13. Reconstruction → LR inputs / prediction / reference / diff (labeled).
14. Roadmap panel → what's built vs planned.
15. End on Final System Architecture diagram.

Pick the default demo scene deliberately: one with several usable candidates (ideally a full K=4), meaningful spread in temporal distance, and varied cloud quality — derived from the real CSVs, not hardcoded fake stats.

---

## 9. BUILD ORDER

1. Theme tokens (§3) + style-guide sanity page.
2. Raster preprocessing script → manifests + preview images for the 2–3 sample scenes.
3. CSV parsing/data-access layer (tile list, candidate-per-tile, live ranking-breakdown function).
4. Final Product Overview + Scene Explorer (metadata only, real data, no imagery yet).
5. Candidate Panel + Timeline + Scatter + K Selector + Why-Selected/Why-Rejected drawers.
6. Geospatial Map with real footprints.
7. Image Inspector + cursor telemetry + Synchronized Crosshair (real rasters, this is the hardest/most valuable piece — budget real time for it).
8. Roadmap/Status panel, Pipeline Diagram, Research Contribution panel, Final System Architecture diagram (mostly static, high narrative value, low risk — safe to parallelize with #7).
9. Alignment / Feature Alignment / Fusion / Reconstruction / Metrics views (simulated, clearly labeled).
10. Demo Mode walkthrough tying everything together.

---

## 10. SUCCESS CRITERIA

A judge with zero prior explanation should, in 2–3 minutes, come away understanding: we have multiple real satellite observations of the same place; they differ in quality and temporal relevance; the system filters and ranks them rather than blindly using everything; the best K are selected and would be spatially aligned; a learned model would align their features more finely, fuse them with attention, and reconstruct a sharper image; the prototype demonstrates this with real data and real imagery wherever possible; and every part that isn't real yet is honestly and clearly marked as simulated — while also seeing, via the roadmap, exactly how much of this pipeline already exists today versus what's still ahead.
