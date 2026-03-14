/**
 * GuidedPathExpansion.jsx
 * 
 * Expansion panel for a guided path.
 * Opens inline below the card row (grid-column: span 3).
 * Contains: Mira bar + 5 sequential steps + deliverable screen.
 * Source: GuidedCelebrationPaths_MASTER.docx Sections 4, 5, 6, 7
 */

import React, { useState, useEffect, useRef } from 'react';
import GuidedPathStep from './GuidedPathStep';
import PathDeliverableScreen from './PathDeliverableScreen';

const GuidedPathExpansion = ({ path, isOpen, onClose, pet }) => {
  const petName = pet?.name || 'your pet';
  const resolve = (t) => (t || '').replace(/\{petName\}/g, petName);
  const panelRef = useRef(null);

  // Step state: which steps are done
  const [activeStep, setActiveStep] = useState(0); // 0-indexed
  const [completedSteps, setCompletedSteps] = useState([]);
  const [userChoices, setUserChoices] = useState({});
  const [showDeliverable, setShowDeliverable] = useState(false);

  // Scroll into view when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [isOpen]);

  // Reset state when path changes
  useEffect(() => {
    setActiveStep(0);
    setCompletedSteps([]);
    setUserChoices({});
    setShowDeliverable(false);
  }, [path.id]);

  const handleStepComplete = (stepIndex, choice) => {
    const step = path.steps[stepIndex];
    setCompletedSteps(prev => [...prev, stepIndex]);
    setUserChoices(prev => ({ ...prev, [step.id]: choice }));

    const nextStep = stepIndex + 1;
    if (nextStep < path.steps.length) {
      const nextStepData = path.steps[nextStep];
      if (nextStepData.ctaType === 'deliverable') {
        setShowDeliverable(true);
        setActiveStep(nextStep);
      } else {
        setActiveStep(nextStep);
      }
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setUserChoices({});
    setShowDeliverable(false);
  };

  // Steps excluding the deliverable step (shown separately)
  const interactiveSteps = path.steps.filter(s => s.ctaType !== 'deliverable');

  return (
    <div
      ref={panelRef}
      style={{
        gridColumn: '1 / -1', // span all columns
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'max-height 300ms ease-in-out, opacity 300ms ease-in-out, margin-top 300ms ease-in-out',
        maxHeight: isOpen ? '1400px' : '0',
        opacity: isOpen ? 1 : 0,
        marginTop: isOpen ? 8 : 0,
        border: isOpen ? `2px solid ${path.accent}` : 'none'
      }}
      data-testid={`guided-path-expansion-${path.id}`}
    >
      {isOpen && (
        <div style={{ padding: 24, background: '#FFFFFF' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>{path.icon}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A0030', marginBottom: 4 }}>
                {resolve(path.expansionTitle)}
              </h3>
              <p style={{ fontSize: 12, color: '#888' }}>
                {path.expansionSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: path.accentAlpha15, color: path.accentDark,
                border: 'none', borderRadius: 9999,
                padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
              data-testid={`guided-path-close-${path.id}`}
            >
              Close
            </button>
          </div>

          {/* ── Mira bar ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            borderRadius: 14, padding: '12px 16px', marginBottom: 24,
            background: path.miraBarBg
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)'
            }} />
            <div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: path.miraTextColor, lineHeight: 1.55, margin: 0 }}>
                {resolve(path.miraLine)}
              </p>
              <span style={{ fontSize: 11, fontWeight: 600, color: path.accent, display: 'block', marginTop: 4 }}>
                {path.miraByline}
              </span>
            </div>
          </div>

          {/* ── Steps ── */}
          <div style={{ marginBottom: showDeliverable ? 24 : 0 }}>
            {interactiveSteps.map((step, idx) => {
              const status = completedSteps.includes(idx)
                ? 'complete'
                : activeStep === idx
                ? 'active'
                : 'upcoming';

              return (
                <GuidedPathStep
                  key={step.id}
                  step={step}
                  stepNumber={idx + 1}
                  status={status}
                  path={path}
                  petName={petName}
                  onComplete={(choice) => handleStepComplete(idx, choice)}
                />
              );
            })}
          </div>

          {/* ── Deliverable screen (shown after all interactive steps complete) ── */}
          {showDeliverable && (
            <PathDeliverableScreen
              path={path}
              petName={petName}
              pet={pet}
              userChoices={userChoices}
              onReset={handleReset}
            />
          )}

        </div>
      )}
    </div>
  );
};

export default GuidedPathExpansion;
