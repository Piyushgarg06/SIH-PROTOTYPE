'use client';

import React, { useRef, useEffect } from 'react';
import type { Candidate } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface FeatureMapViewerProps {
  candidates: Candidate[];
  currentK: number;
}

export default function FeatureMapViewer({ candidates, currentK }: FeatureMapViewerProps) {
  const selected = candidates.slice(0, currentK);

  return (
    <div id="features" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">FEATURE ALIGNMENT</div>
        <StatusBadge type="conceptual" label="CONCEPTUAL / SIMULATED FEATURE ALIGNMENT" />
      </div>

      <div className="text-[10px] text-text-dim mono mb-3">
        Illustrative feature maps showing how a learned encoder would extract and align deep features per candidate. These are procedurally generated for demonstration.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {selected.map((c, i) => (
          <FeatureMapCard key={c.candidate} candidate={c} index={i} />
        ))}
      </div>
    </div>
  );
}

function FeatureMapCard({ candidate, index }: { candidate: Candidate; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 128;
    const h = 128;
    canvas.width = w;
    canvas.height = h;

    // Deterministic procedural heatmap based on candidate properties
    const seed = candidate.candidate * 1000 + index * 100;
    const freq1 = 0.02 + (seed % 7) * 0.01;
    const freq2 = 0.03 + (seed % 5) * 0.008;
    const phase1 = (seed % 13) * 0.5;
    const phase2 = (seed % 11) * 0.7;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v1 = Math.sin(x * freq1 + phase1) * Math.cos(y * freq2 + phase2);
        const v2 = Math.cos((x + y) * freq1 * 0.7 + phase1 * 0.5);
        const v3 = Math.sin(x * freq2 + y * freq1 + phase2);
        const val = (v1 + v2 + v3) / 3;
        const norm = (val + 1) / 2;

        // Warm colormap: dark → terracotta → amber → white
        const r = Math.min(255, Math.round(norm * 1.2 * 255));
        const g = Math.min(255, Math.round(norm * 0.7 * 200));
        const b = Math.min(255, Math.round(norm * 0.3 * 150));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [candidate, index]);

  return (
    <div className="panel-inset p-2">
      <div className="mono text-[9px] text-text-dim mb-1">
        CAND {candidate.candidate} · RANK #{candidate.rank}
      </div>
      <canvas ref={canvasRef} className="w-full h-auto rounded-sm" style={{ imageRendering: 'pixelated' }} />
      <div className="mono text-[8px] text-text-dim mt-1 text-center">
        Feature Channel {index + 1}
      </div>
    </div>
  );
}
