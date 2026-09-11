'use client';

import React from 'react';
import type { Candidate, TileSummary } from '@/lib/types';
import { PIPELINE_STAGES } from '@/lib/constants';
import StatusBadge from './StatusBadge';

interface FinalProductOverviewProps {
  tile: TileSummary | null;
  allCandidates: Candidate[];
  rankedCandidates: Candidate[];
  topkCandidates: Candidate[];
  currentK: number;
}

export default function FinalProductOverview({
  tile,
  allCandidates,
  rankedCandidates,
  topkCandidates,
  currentK,
}: FinalProductOverviewProps) {
  if (!tile) return null;

  const meanCloudProb = rankedCandidates.length > 0
    ? rankedCandidates.reduce((sum, c) => sum + (c.cloud_probability_pct ?? 0), 0) / rankedCandidates.length
    : 0;

  const meanDelta = rankedCandidates.length > 0
    ? rankedCandidates.reduce((sum, c) => sum + c.abs_delta_days, 0) / rankedCandidates.length
    : 0;

  const meanValid = rankedCandidates.length > 0
    ? rankedCandidates.reduce((sum, c) => sum + c.valid_pixel_pct, 0) / rankedCandidates.length
    : 0;

  return (
    <div id="overview" className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">MISSION OVERVIEW</div>
        <StatusBadge type="data" />
      </div>

      {/* Scene identifier */}
      <div className="panel-inset p-3 mb-4">
        <div className="text-xs text-text-secondary mb-1">CURRENT SCENE</div>
        <div className="mono text-lg font-semibold text-text-primary">{tile.tile}</div>
        <div className="mono text-xs text-text-secondary mt-1">
          {tile.lat.toFixed(4)}°N, {tile.lon.toFixed(4)}°E · HR: {tile.highres_date}
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricBox label="Available" value={allCandidates.length.toString()} sub="observations" />
        <MetricBox label="Usable" value={rankedCandidates.length.toString()} sub="passed filters" color="olive" />
        <MetricBox label="Selected" value={`${Math.min(currentK, rankedCandidates.length)}`} sub={`K=${currentK}`} color="accent" />
        <MetricBox label="Rejected" value={(allCandidates.length - rankedCandidates.length).toString()} sub="filtered out" color="brick" />
      </div>

      {/* Quality averages */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="panel-inset p-2.5">
          <div className="text-[10px] text-text-dim uppercase tracking-wider">Mean Cloud Prob</div>
          <div className="mono text-sm font-medium text-text-primary mt-0.5">{meanCloudProb.toFixed(1)}%</div>
        </div>
        <div className="panel-inset p-2.5">
          <div className="text-[10px] text-text-dim uppercase tracking-wider">Mean Δ Days</div>
          <div className="mono text-sm font-medium text-text-primary mt-0.5">{meanDelta.toFixed(0)}</div>
        </div>
        <div className="panel-inset p-2.5">
          <div className="text-[10px] text-text-dim uppercase tracking-wider">Mean Valid Pix</div>
          <div className="mono text-sm font-medium text-text-primary mt-0.5">{meanValid.toFixed(1)}%</div>
        </div>
      </div>

      {/* Top-K list */}
      <div className="mb-4">
        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">TOP-K SELECTION</div>
        <div className="space-y-1">
          {topkCandidates.slice(0, currentK).map(c => (
            <div key={c.candidate} className="flex items-center justify-between panel-inset px-3 py-1.5">
              <span className="mono text-xs text-olive">#{c.rank}</span>
              <span className="mono text-xs text-text-primary">Candidate {c.candidate}</span>
              <span className="mono text-xs text-text-secondary">{c.lowres_date}</span>
              <span className="mono text-xs text-text-secondary">Δ{c.abs_delta_days}d</span>
              <span className="mono text-xs text-text-primary">{c.ranking_score?.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline status ticker */}
      <div>
        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">PIPELINE STATUS</div>
        <div className="flex flex-wrap gap-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <span className={`mono text-[10px] px-2 py-0.5 rounded-sm border ${
                stage.status === 'completed'
                  ? 'border-olive/40 text-olive bg-olive/5'
                  : stage.status === 'in-progress'
                  ? 'border-accent-secondary/40 text-accent-secondary bg-accent-secondary/5'
                  : 'border-grid text-text-dim bg-transparent'
              }`}>
                {stage.status === 'completed' ? '✓' : stage.status === 'in-progress' ? '→' : '○'} {stage.shortLabel}
              </span>
              {i < PIPELINE_STAGES.length - 1 && (
                <span className="text-text-dim text-[10px] self-center">›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  const colorClass = color === 'olive' ? 'text-olive' : color === 'accent' ? 'text-accent' : color === 'brick' ? 'text-brick' : 'text-text-primary';
  return (
    <div className="panel-inset p-2.5 text-center">
      <div className="text-[10px] text-text-dim uppercase tracking-wider">{label}</div>
      <div className={`mono text-xl font-semibold mt-0.5 ${colorClass}`}>{value}</div>
      <div className="text-[9px] text-text-dim mt-0.5">{sub}</div>
    </div>
  );
}
