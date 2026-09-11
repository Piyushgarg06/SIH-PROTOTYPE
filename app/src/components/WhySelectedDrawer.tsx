'use client';

import React from 'react';
import type { Candidate } from '@/lib/types';
import { computeRankingBreakdown } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface WhySelectedDrawerProps {
  candidate: Candidate;
  onClose: () => void;
}

export default function WhySelectedDrawer({ candidate, onClose }: WhySelectedDrawerProps) {
  const breakdown = computeRankingBreakdown(candidate);

  const bars = [
    { label: 'Temporal', quality: breakdown.temporal_quality, contribution: breakdown.temporal_contribution, weight: 0.60, color: '#D97840' },
    { label: 'Cloud', quality: breakdown.cloud_quality, contribution: breakdown.cloud_contribution, weight: 0.30, color: '#E8A33D' },
    { label: 'Validity', quality: breakdown.validity_quality, contribution: breakdown.validity_contribution, weight: 0.10, color: '#7A9B6E' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-border z-50 flex flex-col shadow-2xl" style={{ animation: 'slideInRight 200ms ease-out' }}>
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grid">
        <div>
          <div className="section-label mb-1">WHY SELECTED?</div>
          <div className="mono text-sm font-medium text-olive">
            Candidate {candidate.candidate} · Rank #{candidate.rank}
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md border border-grid flex items-center justify-center text-text-dim hover:text-text-primary hover:border-border transition-fast">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Summary */}
        <div className="panel-inset p-3">
          <div className="mono text-xs text-text-secondary mb-2">This candidate was selected because it achieved a high ranking score across all quality dimensions.</div>
          <div className="flex items-baseline gap-2">
            <span className="mono text-2xl font-bold text-olive">{breakdown.ranking_score.toFixed(4)}</span>
            <span className="mono text-xs text-text-dim">RANKING SCORE</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-3">SCORE BREAKDOWN</div>
          <div className="space-y-3">
            {bars.map(bar => (
              <div key={bar.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-[10px] text-text-secondary">{bar.label} (w={bar.weight})</span>
                  <span className="mono text-[10px] text-text-primary">
                    {bar.quality.toFixed(4)} × {bar.weight} = {bar.contribution.toFixed(4)}
                  </span>
                </div>
                <div className="h-2 bg-bg-primary rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-fast"
                    style={{
                      width: `${bar.quality * 100}%`,
                      backgroundColor: bar.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formula */}
        <div className="panel-inset p-3">
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">FORMULA</div>
          <div className="mono text-[10px] text-text-secondary space-y-1">
            <div>temporal = exp(-|{candidate.abs_delta_days}| / 90) = {breakdown.temporal_quality.toFixed(4)}</div>
            <div>cloud = 0.5 × cloud_prob_q + 0.5 × cloud_mask_q = {breakdown.cloud_quality.toFixed(4)}</div>
            <div>validity = {candidate.valid_pixel_pct.toFixed(1)} / 100 = {breakdown.validity_quality.toFixed(4)}</div>
            <div className="pt-1 border-t border-grid text-text-primary">
              score = 0.60×{breakdown.temporal_quality.toFixed(4)} + 0.30×{breakdown.cloud_quality.toFixed(4)} + 0.10×{breakdown.validity_quality.toFixed(4)} = <span className="text-olive font-medium">{breakdown.ranking_score.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Raw telemetry */}
        <div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">RAW TELEMETRY</div>
          <div className="grid grid-cols-2 gap-2">
            <TelemetryItem label="LR Date" value={candidate.lowres_date} />
            <TelemetryItem label="HR Date" value={candidate.highres_date} />
            <TelemetryItem label="|Δ| Days" value={candidate.abs_delta_days.toString()} />
            <TelemetryItem label="Cloud Prob" value={`${candidate.cloud_probability_pct?.toFixed(1) ?? 'N/A'}%`} />
            <TelemetryItem label="Cloud Mask" value={`${candidate.cloud_mask_pct.toFixed(1)}%`} />
            <TelemetryItem label="Valid Pix" value={`${candidate.valid_pixel_pct.toFixed(1)}%`} />
          </div>
        </div>

        <StatusBadge type="data" label="LIVE COMPUTATION FROM REAL DATA" />
      </div>
    </div>
  );
}

function TelemetryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-inset p-2">
      <div className="text-[9px] text-text-dim uppercase">{label}</div>
      <div className="mono text-xs text-text-primary mt-0.5">{value}</div>
    </div>
  );
}
