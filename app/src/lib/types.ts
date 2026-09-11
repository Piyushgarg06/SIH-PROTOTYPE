// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface Candidate {
  tile: string;
  candidate: number;
  lowres_date: string;
  highres_date: string;
  delta_days: number;
  abs_delta_days: number;
  lat: number;
  lon: number;
  area: number;
  bounds_csv: string;
  width: number;
  height: number;
  bands: number;
  crs: string;
  left: number;
  bottom: number;
  right: number;
  top: number;
  csv_cloud_cover: number;
  valid_pixel_pct: number;
  cloud_mask_pct: number;
  cloud_probability_pct: number | null;
  sun_azimuth_mean: number;
  sun_zenith_mean: number;
  view_azimuth_mean: number;
  view_zenith_mean: number;
  usable: boolean;
  temporal_quality?: number;
  cloud_quality?: number;
  validity_quality?: number;
  ranking_score?: number;
  rank?: number;
  is_top_k?: boolean;
  lr_image_path?: string;
}

export interface RankingBreakdown {
  temporal_quality: number;
  cloud_quality: number;
  validity_quality: number;
  temporal_contribution: number; // 0.60 * temporal
  cloud_contribution: number;   // 0.30 * cloud
  validity_contribution: number; // 0.10 * validity
  ranking_score: number;
}

export interface FilterResult {
  passed: boolean;
  checks: {
    label: string;
    passed: boolean;
    actual: number | null;
    threshold: string;
  }[];
}

export interface TileSummary {
  tile: string;
  lat: number;
  lon: number;
  area: number;
  highres_date: string;
  total_candidates: number;
  usable_candidates: number;
  topk_count: number;
  has_sample_imagery: boolean;
  left: number;
  bottom: number;
  right: number;
  top: number;
}

// ─── Manifest Types ──────────────────────────────────────────────────────────

export interface RasterMeta {
  filepath: string;
  crs: string | null;
  width: number;
  height: number;
  bands: number;
  dtype: string | null;
  nodata: number | null;
  bounds: {
    left: number;
    bottom: number;
    right: number;
    top: number;
  };
  transform: number[];  // [a, b, c, d, e, f]
}

export interface CandidateManifest {
  candidate_number: number;
  rasters: Record<string, RasterMeta>;
  previews: Record<string, string>;
  metadata_json?: {
    cloud_cover: number;
    target_date: string;
    delta: string;
    area: number;
    datetime: string;
  };
}

export interface SceneManifest {
  scene_id: string;
  has_hr: boolean;
  has_lr: boolean;
  hr: {
    scene_id: string;
    type: string;
    rasters: Record<string, RasterMeta>;
    previews: Record<string, string>;
  } | null;
  lr: {
    scene_id: string;
    type: string;
    candidates: Record<string, CandidateManifest>;
  } | null;
}

export interface SceneIndex {
  scenes: string[];
  hr_scenes: string[];
  lr_scenes: string[];
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type BadgeType = 'data' | 'simulated' | 'conceptual' | 'sample';

export type PipelineStageStatus = 'completed' | 'in-progress' | 'planned';

export interface PipelineStage {
  id: string;
  label: string;
  shortLabel: string;
  status: PipelineStageStatus;
  whatEnters: string;
  whatHappens: string;
  whatComesOut: string;
}

export type ViewLayer =
  | 'rgb'
  | 'falsecolor'
  | 'cloud_probability'
  | 'cloud_mask'
  | 'data_mask'
  | 'pan'
  | 'rgb_original'
  | 'ps_rgb';
