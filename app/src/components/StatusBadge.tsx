'use client';

import React from 'react';
import type { BadgeType } from '@/lib/types';

interface StatusBadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

const BADGE_LABELS: Record<BadgeType, string> = {
  data: 'DATA',
  simulated: 'SIMULATED',
  conceptual: 'CONCEPTUAL',
  sample: 'SAMPLE IMAGERY AVAILABLE',
};

export default function StatusBadge({ type, label, className = '' }: StatusBadgeProps) {
  const badgeClass = `badge badge-${type}`;
  return (
    <span className={`${badgeClass} ${className}`}>
      {type === 'data' && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
        </svg>
      )}
      {type === 'simulated' && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 4L3 6L7 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {type === 'conceptual' && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
        </svg>
      )}
      {label || BADGE_LABELS[type]}
    </span>
  );
}
