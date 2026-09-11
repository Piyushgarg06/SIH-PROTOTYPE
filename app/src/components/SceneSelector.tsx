'use client';

import React, { useState, useMemo } from 'react';
import type { TileSummary } from '@/lib/types';
import { SAMPLE_SCENES } from '@/lib/data';
import StatusBadge from './StatusBadge';

interface SceneSelectorProps {
  tiles: TileSummary[];
  selectedTile: string;
  onSelectTile: (tile: string) => void;
}

export default function SceneSelector({ tiles, selectedTile, onSelectTile }: SceneSelectorProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = tiles;
    if (q) {
      result = tiles.filter(t => t.tile.toLowerCase().includes(q));
    }
    // Always show sample scenes first
    result.sort((a, b) => {
      const aIsSample = SAMPLE_SCENES.includes(a.tile) ? 0 : 1;
      const bIsSample = SAMPLE_SCENES.includes(b.tile) ? 0 : 1;
      if (aIsSample !== bIsSample) return aIsSample - bIsSample;
      return a.tile.localeCompare(b.tile);
    });
    return showAll ? result : result.slice(0, 50);
  }, [tiles, search, showAll]);

  const selected = tiles.find(t => t.tile === selectedTile);

  return (
    <div id="scene-explorer" className="panel p-4">
      <div className="section-label mb-3">SCENE EXPLORER · {tiles.length} TILES</div>

      {/* Selected scene summary */}
      {selected && (
        <div className="panel-inset p-3 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mono text-sm font-medium text-text-primary mb-1">{selected.tile}</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-text-secondary">HR Date </span>
                  <span className="mono text-text-primary">{selected.highres_date}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Lat/Lon </span>
                  <span className="mono text-text-primary">
                    {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Area </span>
                  <span className="mono text-text-primary">{selected.area} km²</span>
                </div>
                <div>
                  <span className="text-text-secondary">Candidates </span>
                  <span className="mono text-text-primary">
                    {selected.total_candidates} total · {selected.usable_candidates} usable · K={selected.topk_count}
                  </span>
                </div>
              </div>
            </div>
            {selected.has_sample_imagery && (
              <StatusBadge type="sample" />
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6.5" cy="6.5" r="5" /><path d="M10 10l4.5 4.5" />
        </svg>
        <input
          type="text"
          placeholder="Search tiles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-bg-secondary border border-grid rounded-md pl-9 pr-3 py-2 text-xs mono text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none transition-fast"
        />
      </div>

      {/* Tile list */}
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {filtered.map(t => (
          <button
            key={t.tile}
            onClick={() => onSelectTile(t.tile)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-left transition-fast text-xs ${
              t.tile === selectedTile
                ? 'bg-accent/10 border border-accent/30'
                : 'hover:bg-bg-secondary border border-transparent'
            }`}
          >
            <span className="mono text-text-primary truncate">{t.tile}</span>
            <span className="flex items-center gap-2 shrink-0 ml-2">
              <span className="mono text-text-dim">
                {t.usable_candidates}/{t.total_candidates}
              </span>
              {SAMPLE_SCENES.includes(t.tile) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary" title="Sample imagery available" />
              )}
            </span>
          </button>
        ))}
      </div>

      {!showAll && tiles.length > 50 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 text-xs text-accent hover:text-accent-secondary transition-fast"
        >
          Show all {tiles.length} tiles...
        </button>
      )}
    </div>
  );
}
