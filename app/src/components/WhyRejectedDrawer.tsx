'use client';

import React from 'react';
import type { Candidate } from '@/lib/types';
import { checkFilterThresholds } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface WhyRejectedDrawerProps {
  candidate: Candidate;
  onClose: () => void;
}

export default function WhyRejectedDrawer({ candidate, onClose }: WhyRejectedDrawerProps) {
  const filterResult = checkFilterThresholds(candidate);

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
          <div className="section-label mb-1">WHY REJECTED?</div>
          <div className="mono text-sm font-medium text-brick">
            Candidate {candidate.candidate}
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md border border-grid flex items-center justify-center text-text-dim hover:text-text-primary hover:border-border transition-fast">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Summary */}
        <div className="panel-inset p-3 border-brick/20">
          <div className="mono text-xs text-text-secondary">
            This candidate was <span className="text-brick font-medium">filtered out</span> before ranking because it failed one or more quality thresholds.
          </div>
        </div>

        {/* Threshold checks */}
        <div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-3">FILTER THRESHOLD CHECKS</div>
          <div className="space-y-3">
            {filterResult.checks.map((check, i) => (
              <div key={i} className={`panel-inset p-3 ${!check.passed ? 'border-brick/30' : 'border-olive/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg ${check.passed ? 'text-olive' : 'text-brick'}`}>
                    {check.passed ? '✓' : '✕'}
                  </span>
                  <span className="mono text-xs text-text-primary">{check.label}</span>
                </div>
                <div className="flex items-center justify-between mono text-[10px]">
                  <span className="text-text-dim">
                    Actual: <span className={check.passed ? 'text-olive' : 'text-brick font-medium'}>
                      {check.actual !== null ? `${check.actual.toFixed(1)}%` : 'N/A'}
                    </span>
                  </span>
                  <span className="text-text-dim">
                    Threshold: <span className="text-text-secondary">{check.threshold}</span>
                  </span>
                </div>
                {!check.passed && (
                  <div className="mt-2 h-1.5 bg-bg-primary rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-brick/60 rounded-sm"
                      style={{ width: `${Math.min((check.actual ?? 0), 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Raw values */}
        <div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">RAW TELEMETRY</div>
          <div className="grid grid-cols-2 gap-2">
            <TelemetryItem label="LR Date" value={candidate.lowres_date} />
            <TelemetryItem label="|Δ| Days" value={candidate.abs_delta_days.toString()} />
            <TelemetryItem label="Cloud Prob" value={`${candidate.cloud_probability_pct?.toFixed(1) ?? 'N/A'}%`} warn={(candidate.cloud_probability_pct ?? 0) > 50} />
            <TelemetryItem label="Cloud Mask" value={`${candidate.cloud_mask_pct.toFixed(1)}%`} warn={candidate.cloud_mask_pct > 20} />
            <TelemetryItem label="Valid Pix" value={`${candidate.valid_pixel_pct.toFixed(1)}%`} warn={candidate.valid_pixel_pct < 90} />
            <TelemetryItem label="CSV Cloud Cover" value={`${candidate.csv_cloud_cover.toFixed(1)}`} />
          </div>
        </div>

        <StatusBadge type="data" label="REAL FILTER RESULT FROM ACTUAL DATA" />
      </div>
    </div>
  );
}

function TelemetryItem({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`panel-inset p-2 ${warn ? 'border-brick/20' : ''}`}>
      <div className="text-[9px] text-text-dim uppercase">{label}</div>
      <div className={`mono text-xs mt-0.5 ${warn ? 'text-brick' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}
