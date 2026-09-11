'use client';

import React from 'react';

interface TopKSelectorProps {
  maxK: number;
  currentK: number;
  totalCandidates: number;
  usableCandidates: number;
  onKChange: (k: number) => void;
}

export default function TopKSelector({
  maxK,
  currentK,
  totalCandidates,
  usableCandidates,
  onKChange,
}: TopKSelectorProps) {
  const effectiveMax = Math.min(maxK, usableCandidates);
  const effectiveK = Math.min(currentK, effectiveMax);

  return (
    <div className="panel p-4">
      <div className="section-label mb-3">TOP-K SELECTOR</div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: effectiveMax }, (_, i) => i + 1).map(k => (
            <button
              key={k}
              onClick={() => onKChange(k)}
              className={`mono text-xs w-8 h-8 rounded-md border transition-fast font-medium ${
                k === effectiveK
                  ? 'border-accent bg-accent/15 text-accent'
                  : k <= effectiveK
                  ? 'border-olive/30 bg-olive/5 text-olive'
                  : 'border-grid text-text-dim hover:border-border hover:text-text-secondary'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="mono text-xs text-text-secondary">
          Selected <span className="text-olive font-medium">{effectiveK}</span> of{' '}
          <span className="text-text-primary">{usableCandidates}</span> usable observations
          <span className="text-text-dim"> ({totalCandidates} total)</span>
        </div>
      </div>

      <div className="mono text-[10px] text-text-dim">
        K=1 → single-observation reconstruction (SISR-like). K&gt;1 → multi-image reconstruction.
      </div>
    </div>
  );
}
