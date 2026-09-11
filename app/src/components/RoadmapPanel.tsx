'use client';

import React from 'react';
import { ROADMAP_PHASES } from '@/lib/constants';

export default function RoadmapPanel() {
  return (
    <div id="roadmap" className="panel p-5">
      <div className="section-label mb-4">BUILD STATUS · ROADMAP</div>
      
      <div className="space-y-0">
        {ROADMAP_PHASES.map((phase, i) => (
          <div key={phase.name} className="relative">
            {/* Connector line */}
            {i < ROADMAP_PHASES.length - 1 && (
              <div className="absolute left-[11px] top-[28px] w-0.5 h-[calc(100%-16px)] bg-grid" />
            )}

            <div className="flex items-start gap-3 mb-4">
              {/* Status icon */}
              <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                phase.status === 'completed'
                  ? 'border-olive bg-olive/20'
                  : phase.status === 'in-progress'
                  ? 'border-accent-secondary bg-accent-secondary/10'
                  : 'border-grid bg-transparent'
              }`}>
                {phase.status === 'completed' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#7A9B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {phase.status === 'in-progress' && (
                  <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`mono text-xs font-medium ${
                    phase.status === 'completed' ? 'text-olive'
                    : phase.status === 'in-progress' ? 'text-accent-secondary'
                    : 'text-text-dim'
                  }`}>
                    {phase.name}
                  </span>
                  <span className={`mono text-[9px] px-1.5 py-0.5 rounded-sm border ${
                    phase.status === 'completed'
                      ? 'border-olive/30 text-olive'
                      : phase.status === 'in-progress'
                      ? 'border-accent-secondary/30 text-accent-secondary'
                      : 'border-grid text-text-dim'
                  }`}>
                    {phase.status === 'completed' ? '✓ COMPLETE' : phase.status === 'in-progress' ? '→ NEXT' : '○ PLANNED'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.items.map(item => (
                    <span
                      key={item}
                      className={`text-[10px] px-2 py-0.5 rounded-sm ${
                        phase.status === 'completed'
                          ? 'bg-olive/8 text-olive/80 border border-olive/15'
                          : phase.status === 'in-progress'
                          ? 'bg-accent-secondary/8 text-accent-secondary/80 border border-accent-secondary/15'
                          : 'bg-surface text-text-dim border border-grid'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
