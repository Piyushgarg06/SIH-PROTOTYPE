'use client';

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Candidate } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface QualityTemporalScatterProps {
  allCandidates: Candidate[];
  rankedCandidates: Candidate[];
  currentK: number;
  onCandidateClick?: (candidate: Candidate) => void;
}

export default function QualityTemporalScatter({
  allCandidates,
  rankedCandidates,
  currentK,
  onCandidateClick,
}: QualityTemporalScatterProps) {
  if (allCandidates.length === 0) return null;

  const topKRanks = new Set(
    rankedCandidates.slice(0, currentK).map(c => c.candidate)
  );
  const usableSet = new Set(rankedCandidates.map(c => c.candidate));

  const dataPoints = allCandidates.map(c => ({
    ...c,
    x: c.abs_delta_days,
    y: c.cloud_probability_pct ?? 0,
    category: topKRanks.has(c.candidate) ? 'topk' : usableSet.has(c.candidate) ? 'usable' : 'rejected',
  }));

  const topkData = dataPoints.filter(d => d.category === 'topk');
  const usableData = dataPoints.filter(d => d.category === 'usable');
  const rejectedData = dataPoints.filter(d => d.category === 'rejected');

  interface ScatterTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: typeof dataPoints[number] }>;
  }

  const CustomTooltip = ({ active, payload }: ScatterTooltipProps) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="panel p-2.5 shadow-lg">
        <div className="mono text-xs font-medium text-text-primary mb-1">
          Candidate {d.candidate}
        </div>
        <div className="space-y-0.5 text-[10px] mono">
          <div><span className="text-text-dim">|Δ| Days: </span><span className="text-text-primary">{d.abs_delta_days}</span></div>
          <div><span className="text-text-dim">Cloud Prob: </span><span className="text-text-primary">{d.cloud_probability_pct?.toFixed(1) ?? 'N/A'}%</span></div>
          <div><span className="text-text-dim">Cloud Mask: </span><span className="text-text-primary">{d.cloud_mask_pct.toFixed(1)}%</span></div>
          <div><span className="text-text-dim">Valid Pix: </span><span className="text-text-primary">{d.valid_pixel_pct.toFixed(1)}%</span></div>
          <div><span className="text-text-dim">Date: </span><span className="text-text-primary">{d.lowres_date}</span></div>
          {d.ranking_score !== undefined && (
            <div><span className="text-text-dim">Score: </span><span className="text-accent">{d.ranking_score.toFixed(4)}</span></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="scatter" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">QUALITY × TEMPORAL DISTANCE</div>
        <StatusBadge type="data" />
      </div>

      <div className="text-[10px] text-text-dim mb-2 mono">
        Shows it isn&apos;t just &quot;closest date wins&quot; — quality matters.
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232529" />
            <XAxis
              type="number"
              dataKey="x"
              name="|Δ| Days"
              tick={{ fill: '#8C8A85', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
              label={{ value: '|Δ| Days from HR', position: 'bottom', offset: 10, fill: '#5C5A56', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Cloud Prob %"
              tick={{ fill: '#8C8A85', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
              label={{ value: 'Cloud Prob %', angle: -90, position: 'insideLeft', offset: 0, fill: '#5C5A56', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={rejectedData}
              fill="transparent"
              stroke="#B5544A"
              strokeWidth={1.5}
              r={4}
              opacity={0.35}
              cursor="pointer"
              onClick={(data) => onCandidateClick?.(data as unknown as Candidate)}
            />
            <Scatter
              data={usableData}
              fill="transparent"
              stroke="#7A9B6E"
              strokeWidth={1.5}
              r={5}
              cursor="pointer"
              onClick={(data) => onCandidateClick?.(data as unknown as Candidate)}
            />
            <Scatter
              data={topkData}
              fill="#7A9B6E"
              stroke="#7A9B6E"
              strokeWidth={1.5}
              r={6}
              cursor="pointer"
              onClick={(data) => onCandidateClick?.(data as unknown as Candidate)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
