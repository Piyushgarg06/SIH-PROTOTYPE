'use client';

import React from 'react';

export default function ResearchContributionPanel() {
  return (
    <div id="contribution" className="panel p-5">
      <div className="section-label mb-4">RESEARCH CONTRIBUTION</div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Existing approach */}
        <div className="panel-inset p-4 border-brick/20">
          <div className="mono text-[10px] text-brick uppercase tracking-wider mb-3 font-medium">
            EXISTING APPROACH
          </div>
          <div className="text-sm text-text-primary mb-3 font-medium">Single-Image Super-Resolution</div>
          <ul className="space-y-2 text-[11px] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-brick shrink-0 mt-0.5">✕</span>
              Uses one LR observation — ignores the remaining 15+ available
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brick shrink-0 mt-0.5">✕</span>
              No quality assessment — blindly uses whatever image is provided
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brick shrink-0 mt-0.5">✕</span>
              Wastes rich multi-temporal complementary information
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brick shrink-0 mt-0.5">✕</span>
              Limited by the information content of a single observation
            </li>
          </ul>
        </div>

        {/* Proposed approach */}
        <div className="panel-inset p-4 border-olive/20">
          <div className="mono text-[10px] text-olive uppercase tracking-wider mb-3 font-medium">
            PROPOSED APPROACH
          </div>
          <div className="text-sm text-text-primary mb-3 font-medium">Quality-Aware Multi-Image SR</div>
          <ul className="space-y-2 text-[11px] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-olive shrink-0 mt-0.5">✓</span>
              Assesses quality of all available observations automatically
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive shrink-0 mt-0.5">✓</span>
              Filters out unusable observations (cloud, invalid data)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive shrink-0 mt-0.5">✓</span>
              Ranks candidates by composite quality score
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive shrink-0 mt-0.5">✓</span>
              Selects best K observations for multi-image fusion
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive shrink-0 mt-0.5">✓</span>
              Combines complementary information via learned attention
            </li>
          </ul>
        </div>
      </div>

      {/* Key insight */}
      <div className="panel-inset p-4 text-center border-accent/20">
        <div className="text-lg text-text-primary font-medium italic mb-2">
          &ldquo;Not every observation is equally useful.&rdquo;
        </div>
        <div className="text-[11px] text-text-secondary max-w-xl mx-auto">
          The contribution is not multi-image SR itself — it is the <span className="text-accent font-medium">quality-aware selection and fusion framework</span> that determines which observations to use, how to rank them, and how to weight their contributions during reconstruction.
        </div>
      </div>
    </div>
  );
}
