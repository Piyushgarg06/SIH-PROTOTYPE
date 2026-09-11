'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { Candidate, ViewLayer, SceneManifest } from '@/lib/types';
import { getPreviewUrl, getHrPreviewUrl, pixelToGeo } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface ImageInspectorProps {
  candidate: Candidate | null;
  manifest: SceneManifest | null;
  sceneId: string;
  isHR?: boolean;
  onCursorMove?: (coords: { lat: number; lon: number; pixelX: number; pixelY: number } | null) => void;
  crosshairCoords?: { lat: number; lon: number } | null;
  isLocked?: boolean;
  onToggleLock?: (coords?: { lat: number; lon: number } | null) => void;
}

const LR_LAYERS: { key: ViewLayer; label: string }[] = [
  { key: 'rgb', label: 'RGB (True Color)' },
  { key: 'falsecolor', label: 'NIR-R-G' },
  { key: 'cloud_probability', label: 'Cloud Prob' },
  { key: 'cloud_mask', label: 'Cloud Mask' },
  { key: 'data_mask', label: 'Data Mask' },
];

const HR_LAYERS: { key: ViewLayer; label: string }[] = [
  { key: 'rgb', label: 'HR Pansharpened' },
  { key: 'falsecolor', label: 'NIR-R-G' },
  { key: 'pan', label: 'Panchromatic' },
  { key: 'rgb_original', label: 'RGB Original' },
];

export default function ImageInspector({
  candidate,
  manifest,
  sceneId,
  isHR = false,
  onCursorMove,
  crosshairCoords,
  isLocked = false,
  onToggleLock,
}: ImageInspectorProps) {
  const [activeLayer, setActiveLayer] = useState<ViewLayer>('rgb');
  const [cursorInfo, setCursorInfo] = useState<{
    pixelX: number;
    pixelY: number;
    lat: number;
    lon: number;
    relX: number;
    relY: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableLayers = isHR ? HR_LAYERS : LR_LAYERS;

  // Helper to convert pixel/relative position to Geographic Coordinates
  const getGeoCoords = useCallback((relX: number, relY: number) => {
    if (!candidate) return { lat: 0, lon: 0 };
    const lon = candidate.left + relX * (candidate.right - candidate.left);
    const lat = candidate.top + relY * (candidate.bottom - candidate.top);
    return { lat, lon };
  }, [candidate]);

  // Helper to convert Geographic Coordinates to pixel and relative position
  const getPixelFromGeo = useCallback((lon: number, lat: number) => {
    if (!candidate || candidate.right === candidate.left || candidate.bottom === candidate.top) {
      return { relX: 0.5, relY: 0.5, pixelX: 0, pixelY: 0 };
    }
    const relX = Math.max(0, Math.min(1, (lon - candidate.left) / (candidate.right - candidate.left)));
    const relY = Math.max(0, Math.min(1, (lat - candidate.top) / (candidate.bottom - candidate.top)));
    const width = isHR ? 1054 : (candidate.width || 158);
    const height = isHR ? 1054 : (candidate.height || 159);
    return {
      relX,
      relY,
      pixelX: Math.round(relX * width),
      pixelY: Math.round(relY * height),
    };
  }, [candidate, isHR]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const targetElement = imgRef.current || containerRef.current;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));

    const width = isHR ? 1054 : (candidate?.width || 158);
    const height = isHR ? 1054 : (candidate?.height || 159);
    const pixelX = Math.round(relX * width);
    const pixelY = Math.round(relY * height);
    const coords = getGeoCoords(relX, relY);

    const info = { pixelX, pixelY, lat: coords.lat, lon: coords.lon, relX, relY };
    setCursorInfo(info);
    onCursorMove?.(info);
  }, [candidate, onCursorMove, isHR, isLocked, getGeoCoords]);

  const handleMouseLeave = useCallback(() => {
    if (isLocked) return;
    setCursorInfo(null);
    onCursorMove?.(null);
  }, [onCursorMove, isLocked]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const targetElement = imgRef.current || containerRef.current;
    if (!targetElement) {
      onToggleLock?.();
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));

    const coords = getGeoCoords(relX, relY);
    onToggleLock?.({ lat: coords.lat, lon: coords.lon });
  }, [getGeoCoords, onToggleLock]);

  // Determine image URL
  const getImageUrl = () => {
    if (isHR) {
      return getHrPreviewUrl(sceneId, activeLayer);
    }
    if (!candidate) return null;
    return getPreviewUrl(sceneId, candidate.candidate, activeLayer);
  };

  const imageUrl = getImageUrl();
  const hasSampleImagery = !!manifest;

  // Compute crosshair position from external / locked coords
  const crosshairPos = crosshairCoords ? (() => {
    const pos = getPixelFromGeo(crosshairCoords.lon, crosshairCoords.lat);
    return {
      left: pos.relX * 100,
      top: pos.relY * 100,
      pixelX: pos.pixelX,
      pixelY: pos.pixelY,
    };
  })() : null;

  // Resolved telemetry values for display
  const activeLat = (crosshairCoords ? crosshairCoords.lat : cursorInfo?.lat);
  const activeLon = (crosshairCoords ? crosshairCoords.lon : cursorInfo?.lon);
  const activePixelX = (crosshairPos ? crosshairPos.pixelX : cursorInfo?.pixelX);
  const activePixelY = (crosshairPos ? crosshairPos.pixelY : cursorInfo?.pixelY);

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <div className="section-label">
            {isHR ? 'HR REFERENCE' : `LR CANDIDATE ${candidate?.candidate ?? ''}`}
          </div>
          {isLocked && (
            <span className="mono text-[9px] px-1.5 py-0.2 rounded-sm bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30">
              PINNED
            </span>
          )}
        </div>
        <StatusBadge type="data" label="REAL RASTER" />
      </div>

      {/* Layer selector */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {availableLayers.map(l => (
          <button
            key={l.key}
            onClick={() => setActiveLayer(l.key)}
            className={`mono text-[10px] px-2 py-1 rounded-sm border transition-fast ${
              activeLayer === l.key
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-grid text-text-dim hover:text-text-secondary'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Image inspection area */}
      <div
        ref={containerRef}
        className={`relative bg-bg-primary rounded-md overflow-hidden cursor-crosshair select-none border transition-fast ${
          isLocked ? 'border-accent-secondary shadow-[0_0_12px_rgba(232,163,61,0.15)]' : 'border-border'
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {hasSampleImagery && imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`${isHR ? 'HR' : 'LR'} ${activeLayer}`}
            className="w-full h-auto block select-none pointer-events-none"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${hasSampleImagery && imageUrl ? 'hidden' : ''} flex items-center justify-center h-48 text-text-dim mono text-xs`}>
          DATA UNAVAILABLE
        </div>

        {/* Crosshair overlay from synchronized coords or locked state */}
        {crosshairPos && crosshairPos.left >= 0 && crosshairPos.left <= 100 && crosshairPos.top >= 0 && crosshairPos.top <= 100 && (
          <div className={`crosshair-overlay ${isLocked ? 'crosshair-locked' : ''}`}>
            <div className="crosshair-h" style={{ top: `${crosshairPos.top}%` }} />
            <div className="crosshair-v" style={{ left: `${crosshairPos.left}%` }} />
            <div className="crosshair-dot" style={{ left: `${crosshairPos.left}%`, top: `${crosshairPos.top}%` }} />
          </div>
        )}

        {/* Own live hover crosshair (when not showing external synchronized position) */}
        {!crosshairPos && cursorInfo && (
          <div className="crosshair-overlay">
            <div className="crosshair-h" style={{ top: `${cursorInfo.relY * 100}%` }} />
            <div className="crosshair-v" style={{ left: `${cursorInfo.relX * 100}%` }} />
            <div className="crosshair-dot" style={{ left: `${cursorInfo.relX * 100}%`, top: `${cursorInfo.relY * 100}%` }} />
          </div>
        )}

        {/* Pin lock watermark badge */}
        {isLocked && (
          <div className="absolute top-2 right-2 mono text-[9px] px-1.5 py-0.5 rounded bg-bg-primary/90 text-accent-secondary border border-accent-secondary/50 backdrop-blur-sm pointer-events-none flex items-center gap-1">
            <span>🔒 PINNED</span>
          </div>
        )}
      </div>

      {/* Cursor telemetry - clickable to toggle lock */}
      <div
        className="mt-3 grid grid-cols-2 gap-2 cursor-pointer"
        onClick={() => onToggleLock?.(activeLat !== undefined && activeLon !== undefined ? { lat: activeLat, lon: activeLon } : null)}
      >
        <TelemetryReadout label="LAT" value={activeLat !== undefined ? `${activeLat.toFixed(6)}°` : '—'} isHighlighted={isLocked} />
        <TelemetryReadout label="LON" value={activeLon !== undefined ? `${activeLon.toFixed(6)}°` : '—'} isHighlighted={isLocked} />
        <TelemetryReadout label="PIXEL X" value={activePixelX !== undefined ? activePixelX.toString() : '—'} isHighlighted={isLocked} />
        <TelemetryReadout label="PIXEL Y" value={activePixelY !== undefined ? activePixelY.toString() : '—'} isHighlighted={isLocked} />
        <TelemetryReadout label="CRS" value={candidate?.crs || (isHR ? 'EPSG:4326' : '—')} />
        <TelemetryReadout label="BANDS" value={isHR ? '4 (PS/RGBN)' : (candidate?.bands.toString() ?? '12 (L2A)')} />
      </div>
    </div>
  );
}

function TelemetryReadout({
  label,
  value,
  isHighlighted = false,
}: {
  label: string;
  value: string;
  isHighlighted?: boolean;
}) {
  return (
    <div className={`panel-inset px-2 py-1.5 flex items-center justify-between transition-fast ${
      isHighlighted ? 'border-accent-secondary/40 bg-accent-secondary/5 text-accent-secondary' : 'hover:border-border'
    }`}>
      <span className="text-[9px] text-text-dim uppercase tracking-wider">{label}</span>
      <span className={`mono text-[11px] ${isHighlighted ? 'text-accent-secondary font-semibold' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
