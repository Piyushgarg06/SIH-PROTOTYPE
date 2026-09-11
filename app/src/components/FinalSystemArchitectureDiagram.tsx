'use client';

import React from 'react';

const ARCH_STAGES = [
  { label: 'Raw Multi-Temporal Data', sub: '16 Sentinel-2 L2A observations', status: 'completed', icon: '📡' },
  { label: 'Quality Feature Extraction', sub: 'Cloud prob · Cloud mask · Valid pixels · Temporal distance', status: 'completed', icon: '📊' },
  { label: 'Quality-Aware Filtering', sub: 'Valid ≥90% · Cloud mask ≤20% · Cloud prob ≤50%', status: 'completed', icon: '🔍' },
  { label: 'Composite Ranking', sub: '0.60×temporal + 0.30×cloud + 0.10×validity', status: 'completed', icon: '📈' },
  { label: 'Top-K Selection', sub: 'Best K observations by ranking score', status: 'completed', icon: '🎯' },
  { label: 'Geographic Alignment', sub: 'Affine registration to HR reference grid', status: 'in-progress', icon: '🗺️' },
  { label: 'Feature Encoder', sub: 'Shared CNN per observation → deep features', status: 'planned', icon: '🧠' },
  { label: 'Learned Feature Alignment', sub: 'Deformable convolutions / optical flow', status: 'planned', icon: '🔗' },
  { label: 'Attention-Based Fusion', sub: 'Per-pixel temporal attention weights', status: 'planned', icon: '⚡' },
  { label: 'HR Reconstruction', sub: 'Decoder with sub-pixel upsampling', status: 'planned', icon: '🖼️' },
  { label: 'Evaluation', sub: 'PSNR · SSIM · SAM vs baselines', status: 'planned', icon: '📋' },
  { label: 'Super-Resolution Output', sub: 'High-resolution reconstructed image', status: 'planned', icon: '✨' },
];

export default function FinalSystemArchitectureDiagram() {
  return (
    <div id="architecture" className="panel p-5">
      <div className="section-label mb-4">FINAL SYSTEM ARCHITECTURE</div>

      <div className="flex flex-col items-center gap-0">
        {ARCH_STAGES.map((stage, i) => (
          <React.Fragment key={i}>
            {/* Stage box */}
            <div className={`w-full max-w-lg px-5 py-3 rounded-md border transition-fast ${
              stage.status === 'completed'
                ? 'border-olive/40 bg-olive/5'
                : stage.status === 'in-progress'
                ? 'border-accent-secondary/40 bg-accent-secondary/5'
                : 'border-grid bg-surface'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{stage.icon}</span>
                <div className="flex-1">
                  <div className={`mono text-xs font-medium ${
                    stage.status === 'completed' ? 'text-olive'
                    : stage.status === 'in-progress' ? 'text-accent-secondary'
                    : 'text-text-secondary'
                  }`}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5">{stage.sub}</div>
                </div>
                <span className={`mono text-[8px] px-1.5 py-0.5 rounded-sm border ${
                  stage.status === 'completed'
                    ? 'border-olive/30 text-olive'
                    : stage.status === 'in-progress'
                    ? 'border-accent-secondary/30 text-accent-secondary'
                    : 'border-grid text-text-dim'
                }`}>
                  {stage.status === 'completed' ? '✓' : stage.status === 'in-progress' ? '→' : '○'}
                </span>
              </div>
            </div>

            {/* Connector arrow */}
            {i < ARCH_STAGES.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <div className={`w-0.5 h-4 ${
                  stage.status === 'completed' && ARCH_STAGES[i + 1].status === 'completed'
                    ? 'bg-olive/40'
                    : 'bg-grid'
                }`} />
                <svg width="12" height="8" viewBox="0 0 12 8" className={
                  stage.status === 'completed' && ARCH_STAGES[i + 1].status === 'completed'
                    ? 'text-olive/40'
                    : 'text-grid'
                }>
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-5 text-[10px] mono text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-olive/40 bg-olive/5" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-accent-secondary/40 bg-accent-secondary/5" /> In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-grid bg-surface" /> Planned
        </span>
      </div>
    </div>
  );
}
