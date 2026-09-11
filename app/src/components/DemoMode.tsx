'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

const DEMO_STEPS = [
  { section: 'overview', label: 'Load Overview', description: 'Final Product Overview dashboard' },
  { section: 'scene-explorer', label: 'Select Scene', description: 'Choose a real sample scene with 16 observations' },
  { section: 'timeline', label: 'View Timeline', description: 'Candidate acquisition timeline' },
  { section: 'scatter', label: 'Quality Scatter', description: 'Quality vs temporal distance — not just closest date' },
  { section: 'candidates', label: 'Candidate Panel', description: 'Ranked candidate table with metrics' },
  { section: 'candidates', label: 'Why Selected?', description: 'Click a top-K candidate for score breakdown' },
  { section: 'candidates', label: 'Why Rejected?', description: 'Click a rejected candidate for filter failure analysis' },
  { section: 'candidates', label: 'Set K=4', description: 'Update Top-K selection — map and panels update live' },
  { section: 'crosshair', label: 'Image Inspector', description: 'Real lat/lon/pixel/band readout from cursor position' },
  { section: 'crosshair', label: 'Sync Crosshair', description: 'Synchronized LR ↔ HR crosshair with real coordinates' },
  { section: 'alignment', label: 'Alignment', description: 'Before/after registration (simulated stage)' },
  { section: 'features', label: 'Feature Maps', description: 'Conceptual feature alignment visualization' },
  { section: 'fusion', label: 'Fusion', description: 'Simulated attention-based fusion weights' },
  { section: 'reconstruction', label: 'Reconstruction', description: 'LR inputs / prediction / reference / diff' },
  { section: 'roadmap', label: 'Roadmap', description: 'What\'s built vs planned' },
  { section: 'architecture', label: 'Architecture', description: 'Final system architecture diagram' },
];

interface DemoModeProps {
  onStep?: (sectionId: string, stepIndex: number) => void;
}

export default function DemoMode({ onStep }: DemoModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect
      el.classList.add('ring-1', 'ring-accent/50');
      setTimeout(() => el.classList.remove('ring-1', 'ring-accent/50'), 1500);
    }
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= DEMO_STEPS.length) {
      setIsRunning(false);
      setCurrentStep(-1);
      return;
    }
    setCurrentStep(index);
    const step = DEMO_STEPS[index];
    scrollToSection(step.section);
    onStep?.(step.section, index);
  }, [scrollToSection, onStep]);

  const startDemo = useCallback(() => {
    setIsRunning(true);
    goToStep(0);
  }, [goToStep]);

  const stopDemo = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(-1);
    if (intervalRef.current) clearTimeout(intervalRef.current);
  }, []);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  if (!isRunning) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={startDemo}
          className="px-5 py-2.5 bg-accent text-bg-primary rounded-md mono text-xs font-semibold hover:bg-accent/90 transition-fast shadow-lg shadow-accent/20"
        >
          ▶ ANALYZE SCENE
        </button>
      </div>
    );
  }

  const step = DEMO_STEPS[currentStep];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {/* Progress */}
        <div className="flex items-center gap-1 shrink-0">
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-fast cursor-pointer ${
                i === currentStep ? 'bg-accent' : i < currentStep ? 'bg-olive' : 'bg-grid'
              }`}
              onClick={() => goToStep(i)}
            />
          ))}
        </div>

        {/* Current step info */}
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] text-text-dim">
            STEP {currentStep + 1}/{DEMO_STEPS.length}
          </div>
          <div className="mono text-xs text-text-primary font-medium truncate">
            {step?.label} — <span className="text-text-secondary font-normal">{step?.description}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep <= 0}
            className="w-8 h-8 rounded-md border border-grid flex items-center justify-center text-text-dim hover:text-text-primary hover:border-border transition-fast disabled:opacity-30"
          >
            ‹
          </button>
          <button
            onClick={nextStep}
            className="px-4 h-8 rounded-md bg-accent text-bg-primary mono text-[10px] font-semibold hover:bg-accent/90 transition-fast"
          >
            {currentStep === DEMO_STEPS.length - 1 ? 'FINISH' : 'NEXT →'}
          </button>
          <button
            onClick={stopDemo}
            className="w-8 h-8 rounded-md border border-grid flex items-center justify-center text-text-dim hover:text-brick hover:border-brick/30 transition-fast"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
