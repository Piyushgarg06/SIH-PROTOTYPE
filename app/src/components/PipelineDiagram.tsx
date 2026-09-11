'use client';

import React, { useState } from 'react';
import { PIPELINE_STAGES } from '@/lib/constants';
import type { PipelineStage } from '@/lib/types';

export default function PipelineDiagram() {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);

  return (
    <div id="pipeline" className="panel p-5">
      <div className="section-label mb-4">PROCESSING PIPELINE</div>

      {/* Horizontal pipeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4">
        {PIPELINE_STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <button
              onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}
              className={`shrink-0 px-3 py-2.5 rounded-md border text-center transition-fast mono text-[10px] min-w-[80px] ${
                selectedStage?.id === stage.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : stage.status === 'completed'
                  ? 'border-olive/40 text-olive bg-olive/5 hover:bg-olive/10'
                  : stage.status === 'in-progress'
                  ? 'border-accent-secondary/40 text-accent-secondary bg-accent-secondary/5 hover:bg-accent-secondary/10'
                  : 'border-grid text-text-dim hover:border-border hover:text-text-secondary'
              }`}
            >
              <div className="text-[8px] uppercase tracking-wider mb-0.5">
                {stage.status === 'completed' ? '✓' : stage.status === 'in-progress' ? '→' : '○'}
              </div>
              {stage.shortLabel}
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-grid">
                <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage detail drawer */}
      {selectedStage && (
        <div className="panel-inset p-4 space-y-3" style={{ animation: 'fadeIn 150ms ease-out' }}>
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div className="flex items-center justify-between">
            <div className="mono text-sm font-medium text-text-primary">{selectedStage.label}</div>
            <span className={`mono text-[9px] px-2 py-0.5 rounded-sm border ${
              selectedStage.status === 'completed'
                ? 'border-olive/30 text-olive'
                : selectedStage.status === 'in-progress'
                ? 'border-accent-secondary/30 text-accent-secondary'
                : 'border-grid text-text-dim'
            }`}>
              {selectedStage.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StageDetail label="WHAT ENTERS" text={selectedStage.whatEnters} icon="→" />
            <StageDetail label="WHAT HAPPENS" text={selectedStage.whatHappens} icon="⟳" />
            <StageDetail label="WHAT COMES OUT" text={selectedStage.whatComesOut} icon="←" />
          </div>
        </div>
      )}
    </div>
  );
}

function StageDetail({ label, text, icon }: { label: string; text: string; icon: string }) {
  return (
    <div className="bg-bg-primary rounded-md p-3 border border-grid">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-accent text-xs">{icon}</span>
        <span className="text-[9px] text-text-dim uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-[10px] text-text-secondary leading-relaxed">{text}</p>
    </div>
  );
}
