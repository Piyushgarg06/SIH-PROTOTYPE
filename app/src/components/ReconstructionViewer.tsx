'use client';

import React, { useState } from 'react';
import type { Candidate, SceneManifest } from '@/lib/types';
import { getPreviewUrl, getHrPreviewUrl } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface ReconstructionViewerProps {
  candidates: Candidate[];
  currentK: number;
  manifest: SceneManifest | null;
  sceneId: string;
}

export default function ReconstructionViewer({
  candidates,
  currentK,
  manifest,
  sceneId,
}: ReconstructionViewerProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const selected = candidates.slice(0, currentK);
  const hasSample = !!manifest;

  return (
    <div id="reconstruction" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">RECONSTRUCTION</div>
        <StatusBadge type="simulated" label="PREDICTION SIMULATED" />
      </div>

      <div className="text-[10px] text-text-dim mono mb-3">
        LR inputs shown are real. Predicted HR and diff map are simulated placeholders — the reconstruction model is not yet built.
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* LR Inputs */}
        <div>
          <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2">LR INPUTS (K={Math.min(currentK, selected.length)})</div>
          <div className="grid grid-cols-2 gap-1">
            {selected.map(c => (
              <div key={c.candidate} className="panel-inset p-1">
                {hasSample ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getPreviewUrl(sceneId, c.candidate, 'rgb')}
                    alt={`LR ${c.candidate}`}
                    className="w-full h-auto rounded-sm"
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center text-[8px] text-text-dim mono">N/A</div>
                )}
                <div className="mono text-[8px] text-text-dim text-center mt-0.5">#{c.rank}</div>
              </div>
            ))}
          </div>
          <StatusBadge type="data" className="mt-2" />
        </div>

        {/* Prediction (simulated) */}
        <div>
          <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2">PREDICTED HR</div>
          <div className="panel-inset p-1">
            {hasSample ? (
              <div className="relative">
                {/* Use HR image with slight blur as simulated prediction */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getHrPreviewUrl(sceneId, 'rgb')}
                  alt="Simulated prediction"
                  className="w-full h-auto rounded-sm"
                  style={{ filter: 'blur(0.5px) saturate(0.9)' }}
                />
                <div className="absolute top-1 right-1">
                  <StatusBadge type="simulated" label="SIM" />
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-[8px] text-text-dim mono border border-grid rounded-sm">
                PREDICTION PLACEHOLDER
              </div>
            )}
          </div>
        </div>

        {/* HR Reference */}
        <div>
          <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2">HR REFERENCE</div>
          <div className="panel-inset p-1">
            {hasSample ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getHrPreviewUrl(sceneId, 'rgb')}
                alt="HR reference"
                className="w-full h-auto rounded-sm"
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-[8px] text-text-dim mono border border-grid rounded-sm">
                NO SAMPLE
              </div>
            )}
          </div>
          <StatusBadge type="data" className="mt-2" />
        </div>
      </div>

      {/* Comparison slider */}
      {hasSample && (
        <div>
          <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2">PREDICTION ↔ REFERENCE COMPARISON</div>
          <div
            className="comparison-slider relative h-48 rounded-md overflow-hidden bg-bg-primary"
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setSliderPos(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            {/* Full reference */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getHrPreviewUrl(sceneId, 'rgb')}
              alt="Reference"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* Clipped prediction */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getHrPreviewUrl(sceneId, 'rgb')}
                alt="Prediction"
                className="w-full h-full object-contain"
                style={{ filter: 'blur(0.5px) saturate(0.9)', minWidth: '100%' }}
              />
            </div>
            {/* Slider line */}
            <div className="slider-line" style={{ left: `${sliderPos}%` }}>
              <div className="slider-handle" style={{ left: '50%' }} />
            </div>
            {/* Labels */}
            <div className="absolute bottom-2 left-2 mono text-[9px] text-accent bg-bg-primary/80 px-1.5 py-0.5 rounded-sm">
              PREDICTION (SIM)
            </div>
            <div className="absolute bottom-2 right-2 mono text-[9px] text-olive bg-bg-primary/80 px-1.5 py-0.5 rounded-sm">
              REFERENCE (REAL)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
