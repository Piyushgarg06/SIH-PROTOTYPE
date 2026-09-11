import Papa from 'papaparse';
import type {
  Candidate,
  RankingBreakdown,
  FilterResult,
  TileSummary,
  SceneManifest,
  SceneIndex,
} from './types';

// ─── CSV Data Cache ──────────────────────────────────────────────────────────

let allCandidatesCache: Candidate[] | null = null;
let rankedCandidatesCache: Candidate[] | null = null;
let topkCandidatesCache: Candidate[] | null = null;
let manifestCache: Map<string, SceneManifest> = new Map();
let sceneIndexCache: SceneIndex | null = null;

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parseNumber(val: string | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseBool(val: string | undefined | null): boolean {
  if (!val) return false;
  return val.toLowerCase() === 'true';
}

function rowToCandidate(row: Record<string, string>): Candidate {
  return {
    tile: row.tile || '',
    candidate: parseNumber(row.candidate) ?? 0,
    lowres_date: row.lowres_date || '',
    highres_date: row.highres_date || '',
    delta_days: parseNumber(row.delta_days) ?? 0,
    abs_delta_days: parseNumber(row.abs_delta_days) ?? 0,
    lat: parseNumber(row.lat) ?? 0,
    lon: parseNumber(row.lon) ?? 0,
    area: parseNumber(row.area) ?? 0,
    bounds_csv: row.bounds_csv || '',
    width: parseNumber(row.width) ?? 0,
    height: parseNumber(row.height) ?? 0,
    bands: parseNumber(row.bands) ?? 0,
    crs: row.crs || '',
    left: parseNumber(row.left) ?? 0,
    bottom: parseNumber(row.bottom) ?? 0,
    right: parseNumber(row.right) ?? 0,
    top: parseNumber(row.top) ?? 0,
    csv_cloud_cover: parseNumber(row.csv_cloud_cover) ?? 0,
    valid_pixel_pct: parseNumber(row.valid_pixel_pct) ?? 0,
    cloud_mask_pct: parseNumber(row.cloud_mask_pct) ?? 0,
    cloud_probability_pct: parseNumber(row.cloud_probability_pct),
    sun_azimuth_mean: parseNumber(row.sun_azimuth_mean) ?? 0,
    sun_zenith_mean: parseNumber(row.sun_zenith_mean) ?? 0,
    view_azimuth_mean: parseNumber(row.view_azimuth_mean) ?? 0,
    view_zenith_mean: parseNumber(row.view_zenith_mean) ?? 0,
    usable: parseBool(row.usable),
    temporal_quality: parseNumber(row.temporal_quality) ?? undefined,
    cloud_quality: parseNumber(row.cloud_quality) ?? undefined,
    validity_quality: parseNumber(row.validity_quality) ?? undefined,
    ranking_score: parseNumber(row.ranking_score) ?? undefined,
    rank: parseNumber(row.rank) ?? undefined,
    is_top_k: row.is_top_k !== undefined ? parseBool(row.is_top_k) : undefined,
    lr_image_path: row.lr_image_path || undefined,
  };
}

async function fetchAndParseCsv(url: string): Promise<Candidate[]> {
  const response = await fetch(url);
  const text = await response.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data.map(rowToCandidate);
}

// ─── Data Loading ────────────────────────────────────────────────────────────

export async function loadAllCandidates(): Promise<Candidate[]> {
  if (allCandidatesCache) return allCandidatesCache;
  allCandidatesCache = await fetchAndParseCsv('/data/lr_quality_features_all.csv');
  return allCandidatesCache;
}

export async function loadRankedCandidates(): Promise<Candidate[]> {
  if (rankedCandidatesCache) return rankedCandidatesCache;
  rankedCandidatesCache = await fetchAndParseCsv('/data/lr_candidates_ranked.csv');
  return rankedCandidatesCache;
}

export async function loadTopKCandidates(): Promise<Candidate[]> {
  if (topkCandidatesCache) return topkCandidatesCache;
  topkCandidatesCache = await fetchAndParseCsv('/data/topk_candidates.csv');
  return topkCandidatesCache;
}

export async function loadSceneIndex(): Promise<SceneIndex> {
  if (sceneIndexCache) return sceneIndexCache;
  const response = await fetch('/data/processed/index.json');
  sceneIndexCache = await response.json();
  return sceneIndexCache!;
}

export async function loadSceneManifest(sceneId: string): Promise<SceneManifest | null> {
  if (manifestCache.has(sceneId)) return manifestCache.get(sceneId)!;
  try {
    const response = await fetch(`/data/processed/${encodeURIComponent(sceneId)}.json`);
    if (!response.ok) return null;
    const manifest: SceneManifest = await response.json();
    manifestCache.set(sceneId, manifest);
    return manifest;
  } catch {
    return null;
  }
}

// ─── Data Access Functions ───────────────────────────────────────────────────

export async function getTiles(): Promise<TileSummary[]> {
  const [all, ranked, topk, sceneIndex] = await Promise.all([
    loadAllCandidates(),
    loadRankedCandidates(),
    loadTopKCandidates(),
    loadSceneIndex(),
  ]);

  const tileMap = new Map<string, TileSummary>();

  for (const c of all) {
    if (!tileMap.has(c.tile)) {
      tileMap.set(c.tile, {
        tile: c.tile,
        lat: c.lat,
        lon: c.lon,
        area: c.area,
        highres_date: c.highres_date,
        total_candidates: 0,
        usable_candidates: 0,
        topk_count: 0,
        has_sample_imagery: sceneIndex.scenes.includes(c.tile),
        left: c.left,
        bottom: c.bottom,
        right: c.right,
        top: c.top,
      });
    }
    tileMap.get(c.tile)!.total_candidates++;
  }

  for (const c of ranked) {
    const t = tileMap.get(c.tile);
    if (t) t.usable_candidates++;
  }

  for (const c of topk) {
    const t = tileMap.get(c.tile);
    if (t) t.topk_count++;
  }

  return Array.from(tileMap.values());
}

export async function getCandidatesForTile(tile: string): Promise<Candidate[]> {
  const all = await loadAllCandidates();
  return all.filter(c => c.tile === tile);
}

export async function getRankedCandidatesForTile(tile: string): Promise<Candidate[]> {
  const ranked = await loadRankedCandidates();
  return ranked.filter(c => c.tile === tile).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

export async function getTopKForTile(tile: string): Promise<Candidate[]> {
  const topk = await loadTopKCandidates();
  return topk.filter(c => c.tile === tile).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

// ─── Ranking Formula ─────────────────────────────────────────────────────────
// temporal_quality  = exp(-abs_delta_days / 90)
// cloud_quality     = 0.5 * cloud_probability_quality + 0.5 * cloud_mask_quality
// validity_quality  = valid_pixel_pct / 100
// ranking_score = 0.60 * temporal_quality + 0.30 * cloud_quality + 0.10 * validity_quality

export function computeRankingBreakdown(candidate: Candidate): RankingBreakdown {
  const temporal_quality = Math.exp(-candidate.abs_delta_days / 90);

  // cloud_probability_quality = 1 - (cloud_probability_pct / 100)
  const cloud_prob_quality = candidate.cloud_probability_pct !== null
    ? 1 - (candidate.cloud_probability_pct / 100)
    : 1; // missing cloud probability allowed

  // cloud_mask_quality = 1 - (cloud_mask_pct / 100)
  const cloud_mask_quality = 1 - (candidate.cloud_mask_pct / 100);

  const cloud_quality = 0.5 * cloud_prob_quality + 0.5 * cloud_mask_quality;

  const validity_quality = candidate.valid_pixel_pct / 100;

  const temporal_contribution = 0.60 * temporal_quality;
  const cloud_contribution = 0.30 * cloud_quality;
  const validity_contribution = 0.10 * validity_quality;

  const ranking_score = temporal_contribution + cloud_contribution + validity_contribution;

  return {
    temporal_quality,
    cloud_quality,
    validity_quality,
    temporal_contribution,
    cloud_contribution,
    validity_contribution,
    ranking_score,
  };
}

export function checkFilterThresholds(candidate: Candidate): FilterResult {
  const checks = [
    {
      label: 'Valid Pixel Coverage ≥ 90%',
      passed: candidate.valid_pixel_pct >= 90,
      actual: candidate.valid_pixel_pct,
      threshold: '≥ 90%',
    },
    {
      label: 'Cloud Mask ≤ 20%',
      passed: candidate.cloud_mask_pct <= 20,
      actual: candidate.cloud_mask_pct,
      threshold: '≤ 20%',
    },
    {
      label: 'Cloud Probability ≤ 50%',
      passed: candidate.cloud_probability_pct === null || candidate.cloud_probability_pct <= 50,
      actual: candidate.cloud_probability_pct,
      threshold: '≤ 50% (missing allowed)',
    },
  ];

  return {
    passed: checks.every(c => c.passed),
    checks,
  };
}

// ─── Preview URL Helpers ─────────────────────────────────────────────────────

export function getPreviewUrl(sceneId: string, candidateNum: number, layer: string): string {
  return `/data/processed/${encodeURIComponent(sceneId)}/candidate_${candidateNum}/lr_${layer}.png`;
}

export function getHrPreviewUrl(sceneId: string, type: string): string {
  if (type === 'rgb' || type === 'ps_rgb') {
    return `/data/processed/${encodeURIComponent(sceneId)}/hr_ps_rgb.png`;
  }
  if (type === 'rgb_original') {
    return `/data/processed/${encodeURIComponent(sceneId)}/hr_rgb_original.png`;
  }
  if (type === 'falsecolor' || type === 'rgbn_falsecolor') {
    return `/data/processed/${encodeURIComponent(sceneId)}/hr_rgbn_falsecolor.png`;
  }
  if (type === 'pan') {
    return `/data/processed/${encodeURIComponent(sceneId)}/hr_pan.png`;
  }
  return `/data/processed/${encodeURIComponent(sceneId)}/hr_${type}.png`;
}

// ─── Coordinate Helpers ──────────────────────────────────────────────────────

export function pixelToGeo(
  pixelX: number,
  pixelY: number,
  transform: number[],
): { lon: number; lat: number } {
  // Affine transform: [a, b, c, d, e, f]
  // x_geo = a * pixelX + b * pixelY + c
  // y_geo = d * pixelX + e * pixelY + f
  const [a, b, c, d, e, f] = transform;
  return {
    lon: a * pixelX + b * pixelY + c,
    lat: d * pixelX + e * pixelY + f,
  };
}

export function geoToPixel(
  lon: number,
  lat: number,
  transform: number[],
): { x: number; y: number } {
  const [a, b, c, d, e, f] = transform;
  // Inverse of 2x2 matrix [[a, b], [d, e]]
  const det = a * e - b * d;
  if (Math.abs(det) < 1e-12) return { x: 0, y: 0 };
  const x = (e * (lon - c) - b * (lat - f)) / det;
  const y = (-d * (lon - c) + a * (lat - f)) / det;
  return { x, y };
}

// ─── Simulated Data Generators ───────────────────────────────────────────────

export function generateSimulatedAttentionWeights(candidates: Candidate[]): number[] {
  // Deterministic: higher ranking_score → higher weight, sum to 1
  const scores = candidates.map(c => c.ranking_score ?? 0);
  const total = scores.reduce((a, b) => a + b, 0);
  if (total === 0) return candidates.map(() => 1 / candidates.length);
  return scores.map(s => s / total);
}

export const SIMULATED_METRICS = {
  bicubic: { psnr: 24.3, ssim: 0.672, sam: 8.41 },
  sisr: { psnr: 27.8, ssim: 0.784, sam: 5.92 },
  unranked_misr: { psnr: 29.1, ssim: 0.821, sam: 4.67 },
  topk_misr: { psnr: 31.4, ssim: 0.879, sam: 3.21 },
};

// ─── Sample Scene Detection ──────────────────────────────────────────────────

export const SAMPLE_SCENES = ['ASMSpotter-1-1-1', 'Amnesty POI-1-1-1', 'Landcover-8379'];
export const DEFAULT_SCENE = 'Amnesty POI-1-1-1';
