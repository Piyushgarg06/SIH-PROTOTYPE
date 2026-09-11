'use client';

import React, { useState } from 'react';
import type { Candidate, SceneManifest } from '@/lib/types';
import { getPreviewUrl } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface AlignmentViewerProps {
  candidate: Candidate | null;
  manifest: SceneManifest | null;
  sceneId: string;
}

export default function AlignmentViewer({ candidate, manifest, sceneId }: AlignmentViewerProps) {
  const [opacity, setOpacity] = useState(50);
  const hasSample = !!manifest && !!candidate;

  return (
    <div id="alignment" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">ALIGNMENT · BEFORE / AFTER</div>
        <StatusBadge type="simulated" label="REGISTRATION STAGE SIMULATED" />
      </div>

      <div className="text-[10px] text-text-dim mono mb-3">
        PROTOTYPE VISUALIZATION — Geographic registration uses real raster bounds. The alignment transformation shown is simulated.
      </div>

      {hasSample ? (
        <>
          <div className="relative bg-bg-primary rounded-md overflow-hidden h-64">
            {/* "Before" layer */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPreviewUrl(sceneId, candidate.candidate, 'rgb')}
              alt="Before alignment"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'hue-rotate(5deg) brightness(0.95)' }}
            />
            {/* "After" layer with opacity slider */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPreviewUrl(sceneId, candidate.candidate, 'rgb')}
              alt="After alignment"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: opacity / 100 }}
            />
            {/* Simulated slight shift indicator */}
            <div className="absolute top-2 left-2 mono text-[9px] text-accent bg-bg-primary/80 px-2 py-1 rounded-sm">
              Δx: 1.2px · Δy: -0.8px · θ: 0.03° (SIMULATED)
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="mono text-[10px] text-text-dim">BEFORE</span>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="flex-1 accent-accent h-1"
            />
            <span className="mono text-[10px] text-text-dim">AFTER</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-48 text-text-dim mono text-xs border border-grid rounded-md">
          Select a candidate with sample imagery to view alignment
        </div>
      )}
    </div>
  );
}
