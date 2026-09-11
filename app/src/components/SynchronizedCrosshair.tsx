'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { Candidate, SceneManifest } from '@/lib/types';
import ImageInspector from './ImageInspector';
import StatusBadge from './StatusBadge';

interface SynchronizedCrosshairProps {
  lrCandidate: Candidate | null;
  manifest: SceneManifest | null;
  sceneId: string;
}

export default function SynchronizedCrosshair({
  lrCandidate,
  manifest,
  sceneId,
}: SynchronizedCrosshairProps) {
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [lockedCoords, setLockedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [activePanel, setActivePanel] = useState<'lr' | 'hr' | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const copiedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isLocked = lockedCoords !== null;

  const copyToClipboard = useCallback((lat: number, lon: number) => {
    const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedNotification(`Copied: ${text}`);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      setCopiedNotification(null);
    }, 2500);
  }, []);

  const handleLrCursorMove = useCallback((coords: { lat: number; lon: number; pixelX: number; pixelY: number } | null) => {
    if (isLocked) return;
    if (coords) {
      setHoverCoords({ lat: coords.lat, lon: coords.lon });
      setActivePanel('lr');
    } else {
      setHoverCoords(null);
      setActivePanel(null);
    }
  }, [isLocked]);

  const handleHrCursorMove = useCallback((coords: { lat: number; lon: number; pixelX: number; pixelY: number } | null) => {
    if (isLocked) return;
    if (coords) {
      setHoverCoords({ lat: coords.lat, lon: coords.lon });
      setActivePanel('hr');
    } else {
      setHoverCoords(null);
      setActivePanel(null);
    }
  }, [isLocked]);

  const handleToggleLock = useCallback((clickedCoords?: { lat: number; lon: number } | null) => {
    if (isLocked) {
      setLockedCoords(null);
    } else {
      const target = clickedCoords || hoverCoords;
      if (target) {
        setLockedCoords(target);
        copyToClipboard(target.lat, target.lon);
      }
    }
  }, [isLocked, hoverCoords, copyToClipboard]);

  if (!lrCandidate) {
    return (
      <div id="crosshair" className="panel p-4">
        <div className="section-label mb-3">SYNCHRONIZED CROSSHAIR</div>
        <div className="text-xs text-text-dim mono text-center py-8">
          Select a candidate to enable synchronized crosshair view
        </div>
      </div>
    );
  }

  return (
    <div id="crosshair" className="panel p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="section-label">SYNCHRONIZED CROSSHAIR · LR ↔ HR</div>
          {isLocked ? (
            <span className="mono text-[10px] px-2 py-0.5 rounded-sm bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/40 font-medium">
              🔒 PIN LOCKED
            </span>
          ) : (
            <span className="mono text-[10px] px-2 py-0.5 rounded-sm bg-grid text-text-dim border border-border">
              🔓 LIVE PROBE
            </span>
          )}
          {copiedNotification && (
            <span className="mono text-[10px] px-2 py-0.5 rounded-sm bg-olive/20 text-olive border border-olive/40 font-semibold animate-fade-in flex items-center gap-1">
              📋 {copiedNotification}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleLock()}
            className={`mono text-[10px] px-2.5 py-1 rounded border transition-fast flex items-center gap-1.5 ${
              isLocked
                ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary hover:bg-accent-secondary/25'
                : 'bg-surface border-grid text-text-secondary hover:text-text-primary hover:border-accent'
            }`}
            title="Click to toggle coordinate lock and copy coordinates"
          >
            {isLocked ? '🔓 Click to Unlock' : '🔒 Click to Lock & Copy'}
          </button>
          <StatusBadge type="data" label="REAL COORDINATES" />
        </div>
      </div>

      <div className="text-[10px] text-text-dim mono mb-4 flex items-center justify-between">
        <span>Click image or coordinates below to lock and copy location. Click again to release.</span>
        <span className="text-[9px] text-text-dim hidden sm:inline">Sub-pixel Geographic Registration</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ImageInspector
          candidate={lrCandidate}
          manifest={manifest}
          sceneId={sceneId}
          isHR={false}
          onCursorMove={handleLrCursorMove}
          crosshairCoords={isLocked ? lockedCoords : (activePanel === 'hr' ? hoverCoords : null)}
          isLocked={isLocked}
          onToggleLock={handleToggleLock}
        />
        <ImageInspector
          candidate={lrCandidate}
          manifest={manifest}
          sceneId={sceneId}
          isHR={true}
          onCursorMove={handleHrCursorMove}
          crosshairCoords={isLocked ? lockedCoords : (activePanel === 'lr' ? hoverCoords : null)}
          isLocked={isLocked}
          onToggleLock={handleToggleLock}
        />
      </div>
    </div>
  );
}
