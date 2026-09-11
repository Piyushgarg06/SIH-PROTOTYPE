'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Candidate, TileSummary, SceneManifest } from '@/lib/types';
import {
  getTiles,
  getCandidatesForTile,
  getRankedCandidatesForTile,
  getTopKForTile,
  loadSceneManifest,
  DEFAULT_SCENE,
  SAMPLE_SCENES,
} from '@/lib/data';

import FinalProductOverview from '@/components/FinalProductOverview';
import SceneSelector from '@/components/SceneSelector';
import RoadmapPanel from '@/components/RoadmapPanel';
import CandidateTimeline from '@/components/CandidateTimeline';
import QualityTemporalScatter from '@/components/QualityTemporalScatter';
import CandidatePanel from '@/components/CandidatePanel';
import TopKSelector from '@/components/TopKSelector';
import WhySelectedDrawer from '@/components/WhySelectedDrawer';
import WhyRejectedDrawer from '@/components/WhyRejectedDrawer';
import SynchronizedCrosshair from '@/components/SynchronizedCrosshair';
import AlignmentViewer from '@/components/AlignmentViewer';
import FeatureMapViewer from '@/components/FeatureMapViewer';
import FusionViewer from '@/components/FusionViewer';
import ReconstructionViewer from '@/components/ReconstructionViewer';
import MetricsPanel from '@/components/MetricsPanel';
import PipelineDiagram from '@/components/PipelineDiagram';
import ResearchContributionPanel from '@/components/ResearchContributionPanel';
import FinalSystemArchitectureDiagram from '@/components/FinalSystemArchitectureDiagram';
import DemoMode from '@/components/DemoMode';

export default function Page() {
  // ─── State ───────────────────────────────────────────────────────────
  const [tiles, setTiles] = useState<TileSummary[]>([]);
  const [selectedTile, setSelectedTile] = useState(DEFAULT_SCENE);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [rankedCandidates, setRankedCandidates] = useState<Candidate[]>([]);
  const [topkCandidates, setTopkCandidates] = useState<Candidate[]>([]);
  const [manifest, setManifest] = useState<SceneManifest | null>(null);
  const [currentK, setCurrentK] = useState(4);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerType, setDrawerType] = useState<'selected' | 'rejected' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Data Loading ────────────────────────────────────────────────────
  useEffect(() => {
    getTiles().then(t => {
      setTiles(t);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const [all, ranked, topk] = await Promise.all([
        getCandidatesForTile(selectedTile),
        getRankedCandidatesForTile(selectedTile),
        getTopKForTile(selectedTile),
      ]);
      setAllCandidates(all);
      setRankedCandidates(ranked);
      setTopkCandidates(topk);

      // Load manifest if this is a sample scene
      if (SAMPLE_SCENES.includes(selectedTile)) {
        const m = await loadSceneManifest(selectedTile);
        setManifest(m);
      } else {
        setManifest(null);
      }
    };
    load();
  }, [selectedTile]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleCandidateClick = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
    // Determine drawer type
    const isUsable = rankedCandidates.some(c => c.candidate === candidate.candidate);
    const isTopK = topkCandidates.some(c => c.candidate === candidate.candidate);
    if (isTopK || isUsable) {
      setDrawerType('selected');
    } else {
      setDrawerType('rejected');
    }
  }, [rankedCandidates, topkCandidates]);

  const closeDrawer = useCallback(() => {
    setDrawerType(null);
    setSelectedCandidate(null);
  }, []);

  const handleSelectTile = useCallback((tile: string) => {
    setSelectedTile(tile);
    setSelectedCandidate(null);
    setDrawerType(null);
  }, []);

  const currentTile = useMemo(() =>
    tiles.find(t => t.tile === selectedTile) || null,
    [tiles, selectedTile]
  );

  // The candidate to show in the crosshair — first top-K or the selected one
  const crosshairCandidate = useMemo(() => {
    if (selectedCandidate && rankedCandidates.some(c => c.candidate === selectedCandidate.candidate)) {
      return selectedCandidate;
    }
    return rankedCandidates[0] || null;
  }, [selectedCandidate, rankedCandidates]);

  // ─── Loading State ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mono text-accent text-sm mb-2">LOADING DATA</div>
          <div className="mono text-text-dim text-xs">Parsing CSV datasets...</div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-grid px-6 py-3 flex items-center justify-between sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="mono text-xs font-semibold text-accent tracking-wider">MISR</div>
          <div className="w-px h-4 bg-grid" />
          <div className="text-xs text-text-secondary">
            Quality-Aware Top-K Multi-Image Super-Resolution
          </div>
        </div>
        <div className="flex items-center gap-3 mono text-[10px] text-text-dim">
          <span>{tiles.length} tiles</span>
          <span className="text-grid">·</span>
          <span>{allCandidates.length} observations</span>
          <span className="text-grid">·</span>
          <span className="text-olive">{SAMPLE_SCENES.length} sample scenes</span>
        </div>
      </header>

      {/* In-page navigation */}
      <nav className="border-b border-grid px-6 py-2 flex items-center gap-1 overflow-x-auto sticky top-[49px] z-20 bg-bg-primary/95 backdrop-blur-sm">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'scene-explorer', label: 'Scenes' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'scatter', label: 'Scatter' },
          { id: 'candidates', label: 'Candidates' },
          { id: 'crosshair', label: 'Inspector' },
          { id: 'alignment', label: 'Align' },
          { id: 'features', label: 'Features' },
          { id: 'fusion', label: 'Fusion' },
          { id: 'reconstruction', label: 'Recon' },
          { id: 'metrics', label: 'Metrics' },
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'contribution', label: 'Research' },
          { id: 'roadmap', label: 'Roadmap' },
          { id: 'architecture', label: 'Architecture' },
        ].map(nav => (
          <a
            key={nav.id}
            href={`#${nav.id}`}
            className="mono text-[10px] px-2.5 py-1.5 rounded-sm text-text-dim hover:text-text-secondary hover:bg-bg-secondary transition-fast whitespace-nowrap"
          >
            {nav.label}
          </a>
        ))}
      </nav>

      {/* Main content */}
      <main className="px-6 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Section 1: Overview + Scene Explorer */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <FinalProductOverview
              tile={currentTile}
              allCandidates={allCandidates}
              rankedCandidates={rankedCandidates}
              topkCandidates={topkCandidates}
              currentK={currentK}
            />
          </div>
          <div>
            <SceneSelector
              tiles={tiles}
              selectedTile={selectedTile}
              onSelectTile={handleSelectTile}
            />
          </div>
        </div>

        {/* Section 2: Timeline + Scatter */}
        <div className="grid grid-cols-2 gap-6">
          <CandidateTimeline
            allCandidates={allCandidates}
            rankedCandidates={rankedCandidates}
            currentK={currentK}
            onCandidateClick={handleCandidateClick}
          />
          <QualityTemporalScatter
            allCandidates={allCandidates}
            rankedCandidates={rankedCandidates}
            currentK={currentK}
            onCandidateClick={handleCandidateClick}
          />
        </div>

        {/* Section 3: K Selector + Candidate Panel */}
        <TopKSelector
          maxK={topkCandidates.length}
          currentK={currentK}
          totalCandidates={allCandidates.length}
          usableCandidates={rankedCandidates.length}
          onKChange={setCurrentK}
        />
        <CandidatePanel
          allCandidates={allCandidates}
          rankedCandidates={rankedCandidates}
          currentK={currentK}
          onCandidateClick={handleCandidateClick}
          selectedCandidate={selectedCandidate}
        />

        {/* Section 4: Image Inspector + Synchronized Crosshair */}
        <SynchronizedCrosshair
          lrCandidate={crosshairCandidate}
          manifest={manifest}
          sceneId={selectedTile}
        />

        {/* Section 6: Alignment */}
        <AlignmentViewer
          candidate={crosshairCandidate}
          manifest={manifest}
          sceneId={selectedTile}
        />

        {/* Section 7: Feature Alignment */}
        <FeatureMapViewer
          candidates={rankedCandidates}
          currentK={currentK}
        />

        {/* Section 8: Fusion */}
        <FusionViewer
          candidates={rankedCandidates}
          currentK={currentK}
        />

        {/* Section 9: Reconstruction */}
        <ReconstructionViewer
          candidates={rankedCandidates}
          currentK={currentK}
          manifest={manifest}
          sceneId={selectedTile}
        />

        {/* Section 10: Metrics */}
        <MetricsPanel />

        {/* Section 11: Pipeline */}
        <PipelineDiagram />

        {/* Section 12: Research Contribution */}
        <ResearchContributionPanel />

        {/* Section 13: Roadmap */}
        <RoadmapPanel />

        {/* Section 14: Architecture */}
        <FinalSystemArchitectureDiagram />

        {/* Bottom padding for demo bar */}
        <div className="h-20" />
      </main>

      {/* Drawers */}
      {drawerType === 'selected' && selectedCandidate && (
        <WhySelectedDrawer candidate={selectedCandidate} onClose={closeDrawer} />
      )}
      {drawerType === 'rejected' && selectedCandidate && (
        <WhyRejectedDrawer candidate={selectedCandidate} onClose={closeDrawer} />
      )}

      {/* Demo Mode */}
      <DemoMode />
    </div>
  );
}
