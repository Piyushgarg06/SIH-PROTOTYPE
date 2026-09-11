'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Candidate } from '@/lib/types';
import { generateSimulatedAttentionWeights } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface FusionViewerProps {
  candidates: Candidate[];
  currentK: number;
}

export default function FusionViewer({ candidates, currentK }: FusionViewerProps) {
  const selected = candidates.slice(0, currentK);
  const weights = generateSimulatedAttentionWeights(selected);

  const data = selected.map((c, i) => ({
    name: `Cand ${c.candidate}`,
    candidate: c.candidate,
    weight: weights[i],
    rank: c.rank,
    score: c.ranking_score,
  }));

  const colors = ['#D97840', '#E8A33D', '#7A9B6E', '#B5544A', '#8C8A85'];

  return (
    <div id="fusion" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">ATTENTION-BASED FUSION</div>
        <StatusBadge type="simulated" label="SIMULATED — NOT MODEL OUTPUT" />
      </div>

      <div className="text-[10px] text-text-dim mono mb-3">
        Per-candidate attention weights illustrating how a temporal attention mechanism would weight each observation. Weights correlate with ranking scores but are simulated.
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232529" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#8C8A85', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fill: '#8C8A85', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="panel p-2.5 shadow-lg">
                    <div className="mono text-xs text-text-primary mb-1">Candidate {d.candidate}</div>
                    <div className="mono text-[10px] space-y-0.5">
                      <div><span className="text-text-dim">Attention: </span><span className="text-accent">{(d.weight * 100).toFixed(1)}%</span></div>
                      <div><span className="text-text-dim">Rank: </span><span className="text-text-primary">#{d.rank}</span></div>
                      <div><span className="text-text-dim">Score: </span><span className="text-text-primary">{d.score?.toFixed(4)}</span></div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="weight" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 mono text-[10px] text-text-dim text-center">
        Weights sum to 1.00 — higher-ranked candidates receive proportionally higher attention.
      </div>
    </div>
  );
}
