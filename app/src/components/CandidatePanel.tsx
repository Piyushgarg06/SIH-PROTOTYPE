'use client';

import React from 'react';
import type { Candidate } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface CandidatePanelProps {
  allCandidates: Candidate[];
  rankedCandidates: Candidate[];
  currentK: number;
  onCandidateClick?: (candidate: Candidate) => void;
  selectedCandidate?: Candidate | null;
}

export default function CandidatePanel({
  allCandidates,
  rankedCandidates,
  currentK,
  onCandidateClick,
  selectedCandidate,
}: CandidatePanelProps) {
  const topKSet = new Set(
    rankedCandidates.slice(0, currentK).map(c => c.candidate)
  );
  const usableSet = new Set(rankedCandidates.map(c => c.candidate));

  // Sort: top-K first by rank, then usable by rank, then rejected
  const sorted = [...allCandidates].sort((a, b) => {
    const aIsTopK = topKSet.has(a.candidate);
    const bIsTopK = topKSet.has(b.candidate);
    const aIsUsable = usableSet.has(a.candidate);
    const bIsUsable = usableSet.has(b.candidate);

    if (aIsTopK && !bIsTopK) return -1;
    if (!aIsTopK && bIsTopK) return 1;
    if (aIsUsable && !bIsUsable) return -1;
    if (!aIsUsable && bIsUsable) return 1;
    return (a.rank ?? 999) - (b.rank ?? 999);
  });

  return (
    <div id="candidates" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">
          CANDIDATE PANEL · {allCandidates.length} OBSERVATIONS
        </div>
        <StatusBadge type="data" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] mono">
          <thead>
            <tr className="border-b border-grid text-text-dim text-left">
              <th className="pb-2 pr-3 font-medium">#</th>
              <th className="pb-2 pr-3 font-medium">DATE</th>
              <th className="pb-2 pr-3 font-medium text-right">Δ DAYS</th>
              <th className="pb-2 pr-3 font-medium text-right">CLOUD %</th>
              <th className="pb-2 pr-3 font-medium text-right">MASK %</th>
              <th className="pb-2 pr-3 font-medium text-right">VALID %</th>
              <th className="pb-2 pr-3 font-medium text-right">SCORE</th>
              <th className="pb-2 pr-3 font-medium text-right">RANK</th>
              <th className="pb-2 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              const isTopK = topKSet.has(c.candidate);
              const isUsable = usableSet.has(c.candidate);
              const isSelected = selectedCandidate?.candidate === c.candidate;

              return (
                <tr
                  key={c.candidate}
                  onClick={() => onCandidateClick?.(c)}
                  className={`border-b border-grid/50 cursor-pointer transition-fast ${
                    isSelected
                      ? 'bg-accent/10'
                      : isTopK
                      ? 'hover:bg-olive/5'
                      : isUsable
                      ? 'hover:bg-bg-secondary'
                      : 'opacity-50 hover:opacity-75 hover:bg-bg-secondary'
                  }`}
                >
                  <td className="py-1.5 pr-3">
                    <span className={isTopK ? 'text-olive font-medium' : 'text-text-secondary'}>
                      {c.candidate}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-text-primary">{c.lowres_date}</td>
                  <td className="py-1.5 pr-3 text-right text-text-primary">{c.abs_delta_days}</td>
                  <td className="py-1.5 pr-3 text-right">
                    <span className={
                      (c.cloud_probability_pct ?? 0) > 50 ? 'text-brick' :
                      (c.cloud_probability_pct ?? 0) > 20 ? 'text-accent-secondary' :
                      'text-text-primary'
                    }>
                      {c.cloud_probability_pct?.toFixed(1) ?? '—'}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <span className={
                      c.cloud_mask_pct > 20 ? 'text-brick' :
                      c.cloud_mask_pct > 10 ? 'text-accent-secondary' :
                      'text-text-primary'
                    }>
                      {c.cloud_mask_pct.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <span className={c.valid_pixel_pct < 90 ? 'text-brick' : 'text-text-primary'}>
                      {c.valid_pixel_pct.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right text-text-primary">
                    {c.ranking_score?.toFixed(4) ?? '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    {c.rank !== undefined ? `#${c.rank}` : '—'}
                  </td>
                  <td className="py-1.5">
                    {isTopK ? (
                      <span className="text-olive text-[9px] px-1.5 py-0.5 rounded-sm border border-olive/30 bg-olive/10">
                        TOP-K
                      </span>
                    ) : isUsable ? (
                      <span className="text-text-secondary text-[9px] px-1.5 py-0.5 rounded-sm border border-grid">
                        USABLE
                      </span>
                    ) : (
                      <span className="text-brick text-[9px] px-1.5 py-0.5 rounded-sm border border-brick/30 bg-brick/10">
                        REJECTED
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
