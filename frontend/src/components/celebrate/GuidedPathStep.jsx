/**
 * GuidedPathStep.jsx
 * 
 * Individual step in a guided path expansion.
 * Status: upcoming | active | complete
 * Source: GuidedCelebrationPaths_MASTER.docx Section 7
 */

import React, { useState } from 'react';

const StepInput = ({ step, path, petName, onComplete }) => {
  const resolve = (t) => (t || '').replace(/\{petName\}/g, petName || 'your pet');
  const [selected, setSelected] = useState(null);
  const [textValue, setTextValue] = useState(step.defaultValue || '');
  const [dateValue, setDateValue] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  const handleDone = () => {
    if (step.ctaType === 'text_input') {
      onComplete(textValue || '(no guests added)');
    } else if (step.ctaType === 'date_input') {
      onComplete(dateValue || 'Date not confirmed');
    } else if (step.ctaType === 'checklist') {
      const checked = step.items?.filter(i => checkedItems[i.id]).map(i => resolve(i.label));
      onComplete(checked.length > 0 ? checked.join(', ') : 'Checklist reviewed');
    } else if (step.ctaType === 'photo_labels') {
      onComplete('Photos described');
    } else if (step.ctaType === 'timeline') {
      onComplete('Day planned');
    } else {
      onComplete(selected || 'Confirmed');
    }
  };

  if (step.ctaType === 'picker' || step.ctaType === 'product' || step.ctaType === 'photographer_list') {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {step.options?.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.label)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 10,
                border: selected === opt.label ? `2px solid ${path.accent}` : '2px solid rgba(0,0,0,0.08)',
                background: selected === opt.label ? path.accentAlpha15 : '#f9f9f9',
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A0030' }}>
                {resolve(opt.label)}
                {opt.recommended && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: path.accent, fontWeight: 700 }}>
                    ★ Mira's pick
                  </span>
                )}
              </div>
              {opt.description && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {resolve(opt.description)}
                </div>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleDone}
          disabled={!selected}
          style={{
            marginTop: 12,
            background: selected ? `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)` : '#e5e7eb',
            color: selected ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: 9999,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: selected ? 'pointer' : 'not-allowed'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Confirm →
        </button>
      </div>
    );
  }

  if (step.ctaType === 'text_input') {
    return (
      <div style={{ marginTop: 12 }}>
        <input
          type="text"
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          placeholder={resolve(step.placeholder)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleDone}
          style={{
            marginTop: 10,
            background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
            color: '#fff', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Save →
        </button>
      </div>
    );
  }

  if (step.ctaType === 'date_input') {
    return (
      <div style={{ marginTop: 12 }}>
        <input
          type="date"
          value={dateValue}
          onChange={e => setDateValue(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleDone}
          style={{
            marginLeft: 12,
            background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
            color: '#fff', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Save this date →
        </button>
      </div>
    );
  }

  if (step.ctaType === 'photo_labels') {
    return (
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {step.photoSlots?.map(slot => (
          <div key={slot.id}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
              {resolve(slot.label)}
            </p>
            <input
              type="text"
              placeholder={resolve(slot.placeholder)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid rgba(0,0,0,0.10)', fontSize: 12, fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ))}
        <button
          onClick={handleDone}
          style={{
            alignSelf: 'flex-start',
            background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
            color: '#fff', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Save memories →
        </button>
      </div>
    );
  }

  if (step.ctaType === 'timeline') {
    return (
      <div style={{ marginTop: 12 }}>
        {step.timeline?.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: path.accent, minWidth: 60, paddingTop: 2 }}>
              {t.time}
            </span>
            <span style={{ fontSize: 13, color: '#555' }}>{resolve(t.activity)}</span>
          </div>
        ))}
        <button
          onClick={handleDone}
          style={{
            marginTop: 8,
            background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
            color: '#fff', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Confirm timeline →
        </button>
      </div>
    );
  }

  if (step.ctaType === 'checklist') {
    return (
      <div style={{ marginTop: 12 }}>
        {step.items?.map(item => (
          <label key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!checkedItems[item.id]}
              onChange={() => setCheckedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
              style={{ marginTop: 2, accentColor: path.accent }}
            />
            <span style={{ fontSize: 13, color: '#555' }}>{resolve(item.label)}</span>
          </label>
        ))}
        <button
          onClick={handleDone}
          style={{
            marginTop: 8,
            background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
            color: '#fff', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
          data-testid={`step-confirm-${step.id}`}
        >
          Ready →
        </button>
      </div>
    );
  }

  return null;
};

const GuidedPathStep = ({ step, stepNumber, status, path, petName, onComplete }) => {
  const [showInput, setShowInput] = useState(false);
  const resolve = (t) => (t || '').replace(/\{petName\}/g, petName || 'your pet');

  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isUpcoming = status === 'upcoming';

  // circle colour
  const circleBg = isComplete ? '#16A34A' : isActive ? path.accent : '#E5E7EB';
  const circleColor = isComplete || isActive ? '#FFFFFF' : '#9CA3AF';

  if (step.ctaType === 'deliverable') return null; // handled by PathDeliverableScreen

  return (
    <div style={{ display: 'flex', gap: 12, opacity: isUpcoming ? 0.5 : 1 }}
      data-testid={`guided-step-${step.id}`}>
      {/* Circle + connector column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: circleBg, color: circleColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
          boxShadow: isActive ? `0 0 0 4px ${path.accentAlpha20}` : 'none',
          transition: 'all 200ms'
        }}>
          {isComplete ? '✓' : stepNumber}
        </div>
        {/* Connector line */}
        <div style={{
          width: 2, flex: 1, minHeight: 24,
          background: isComplete ? '#16A34A' : '#F3F4F6',
          marginTop: 4
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 20 }}>
        <h4 style={{
          fontSize: 14, fontWeight: 700,
          color: isActive ? '#1A0030' : isComplete ? '#16A34A' : '#9CA3AF',
          marginBottom: 4
        }}>
          {resolve(step.title)}
        </h4>

        {(isActive || isComplete) && (
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.55, marginBottom: 10 }}>
            {resolve(step.description)}
          </p>
        )}

        {isComplete && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: '#16A34A',
            background: 'rgba(22,163,74,0.12)', borderRadius: 9999, padding: '3px 10px'
          }}>
            ✓ Done
          </span>
        )}

        {isActive && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            style={{
              background: `linear-gradient(135deg, ${path.accent}, ${path.accent}CC)`,
              color: '#fff', border: 'none', borderRadius: 9999,
              padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
            data-testid={`step-cta-${step.id}`}
          >
            {resolve(step.ctaLabel)}
          </button>
        )}

        {isActive && showInput && (
          <StepInput
            step={step}
            path={path}
            petName={petName}
            onComplete={(choice) => {
              setShowInput(false);
              onComplete(choice);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GuidedPathStep;
