'use client';

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Candidate } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface CandidateTimelineProps {
  allCandidates: Candidate[];
  rankedCandidates: Candidate[];
  currentK: number;
  onCandidateClick?: (candidate: Candidate) => void;
}

export default function CandidateTimeline({
  allCandidates,
  rankedCandidates,
  currentK,
  onCandidateClick,
}: CandidateTimelineProps) {
  if (allCandidates.length === 0) return null;

  const hrDate = allCandidates[0]?.highres_date;
  const hrTs = new Date(hrDate).getTime();

  // Build data points
  const topKRanks = new Set(
    rankedCandidates.slice(0, currentK).map(c => c.candidate)
  );
  const usableSet = new Set(rankedCandidates.map(c => c.candidate));

  const dataPoints = allCandidates.map(c => {
    const ts = new Date(c.lowres_date).getTime();
    const isTopK = topKRanks.has(c.candidate);
    const isUsable = usableSet.has(c.candidate);
    return {
      ...c,
      timestamp: ts,
      y: 0,
      category: isTopK ? 'topk' : isUsable ? 'usable' : 'rejected',
    };
  });

  const topkData = dataPoints.filter(d => d.category === 'topk');
  const usableData = dataPoints.filter(d => d.category === 'usable');
  const rejectedData = dataPoints.filter(d => d.category === 'rejected');

  const allTs = dataPoints.map(d => d.timestamp);
  const minTs = Math.min(...allTs, hrTs) - 5 * 86400000;
  const maxTs = Math.max(...allTs, hrTs) + 5 * 86400000;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  interface TimelineTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: typeof dataPoints[number] }>;
  }

  const CustomTooltip = ({ active, payload }: TimelineTooltipProps) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="panel p-2.5 shadow-lg">
        <div className="mono text-xs font-medium text-text-primary mb-1">
          Candidate {d.candidate} · {d.category.toUpperCase()}
        </div>
        <div className="space-y-0.5 text-[10px] mono">
          <div><span className="text-text-dim">Date: </span><span className="text-text-primary">{d.lowres_date}</span></div>
          <div><span className="text-text-dim">Δ Days: </span><span className="text-text-primary">{d.abs_delta_days}</span></div>
          <div><span className="text-text-dim">Cloud Prob: </span><span className="text-text-primary">{d.cloud_probability_pct?.toFixed(1) ?? 'N/A'}%</span></div>
          {d.ranking_score !== undefined && (
            <div><span className="text-text-dim">Score: </span><span className="text-text-primary">{d.ranking_score.toFixed(4)}</span></div>
          )}
          {d.rank !== undefined && (
            <div><span className="text-text-dim">Rank: </span><span className="text-text-primary">#{d.rank}</span></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="timeline" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">CANDIDATE TIMELINE</div>
        <StatusBadge type="data" />
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232529" />
            <XAxis
              type="number"
              dataKey="timestamp"
              domain={[minTs, maxTs]}
              tickFormatter={formatDate}
              tick={{ fill: '#8C8A85', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
            />
            <YAxis hide domain={[-1, 1]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={hrTs}
              stroke="#D97840"
              strokeWidth={2}
              strokeDasharray="4 3"
              label={{ value: 'HR', position: 'top', fill: '#D97840', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <Scatter
              data={rejectedData}
              fill="transparent"
              stroke="#B5544A"
              strokeWidth={1.5}
              r={5}
              opacity={0.4}
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

      <div className="flex items-center gap-4 mt-2 text-[10px] mono text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-olive" /> Top-K
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-olive" /> Usable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-brick opacity-50" /> Rejected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0 border-t-2 border-dashed border-accent" style={{ width: 12 }} /> HR Date
        </span>
      </div>
    </div>
  );
}
