/**
 * CareConciergeModal.jsx
 * The Doggy Company — /care page
 *
 * 3-question care concierge intake modal.
 * Mirrors DineConciergeModal exactly — sage green palette.
 * API: POST /api/concierge/care-intake
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { bookViaConcierge } from '../../utils/MiraCardActions';

const CARE_OPTIONS = [
  { id: 'grooming',       label: 'Grooming & Coat' },
  { id: 'vet_visit',      label: 'Vet Visit' },
  { id: 'dental',         label: 'Dental Care' },
  { id: 'supplements',    label: 'Supplements & Nutrition' },
  { id: 'boarding',       label: 'Boarding & Daycare' },
  { id: 'sitting',        label: 'Pet Sitting' },
  { id: 'senior_care',    label: 'Senior Care' },
  { id: 'behaviour',      label: 'Behaviour & Training' },
  { id: 'emergency',      label: 'Emergency Support' },
  { id: 'wellness_check', label: 'Wellness Check' },
  { id: 'just_because',   label: 'Just because' },
];

const G = {
  sage:    '#40916C',
  deepMid: '#2D6A4F',
  deep:    '#1B4332',
  amber:   '#C9973A',
  light:   '#74C69D',
};

const CareConciergeModal = ({ isOpen, onClose, serviceType, petName, petId }) => {
  const { token } = useAuth();
  const isMobile = useResizeMobile();

  const [selectedType, setSelectedType] = useState(serviceType || '');
  const [careDate,     setCareDate]     = useState('');
  const [notSureDate,  setNotSureDate]  = useState(false);
  const [notes,        setNotes]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(serviceType || '');
      setSubmitted(false);
    }
  }, [isOpen, serviceType]);

  if (!isOpen) return null;

  const displayName = petName || 'your pet';

  const handleSubmit = async () => {
    if (!selectedType || submitting) return;
    setSubmitting(true);
    await bookViaConcierge({
      service: selectedType,
      pillar: "care",
      pet: { id: petId, name: displayName },
      token,
      channel: "care_concierge_modal",
      notes: notes.trim() || null,
      date: notSureDate ? null : (careDate || null),
      onSuccess: () => {
        setSubmitted(true);
        toast.success(`Sent to ${displayName}'s Care Concierge`, { description: "We'll reach out within 48 hours." });
      },
    });
    setSubmitting(false);
  };

  const handleClose = () => {
    setSubmitted(false);
    setSelectedType(serviceType || '');
    setCareDate('');
    setNotSureDate(false);
    setNotes('');
    onClose();
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.50)', zIndex: 10002,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 16,
        }}
        data-testid="care-intake-modal-overlay"
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            padding: isMobile ? '24px 20px 40px' : 32,
            maxWidth: isMobile ? '100%' : 480,
            width: '100%',
            maxHeight: isMobile ? '92vh' : '90vh',
            overflowY: 'auto', position: 'relative',
          }}
          data-testid="care-intake-modal"
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(64,145,108,0.12)',
                border: `2px solid rgba(64,145,108,0.30)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px',
              }}>♥</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: G.deep, marginBottom: 10 }}>
                {displayName}'s care plan is in good hands.
              </h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
                Your Concierge has everything they need.<br />
                Expect a message within 48 hours. ♥
              </p>
              <button
                onClick={handleClose}
                style={{
                  background: `linear-gradient(135deg, ${G.sage}, ${G.light})`,
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
                data-testid="care-modal-done-btn"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Close */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%',
                }}
                data-testid="care-modal-close"
              >
                <X size={18} />
              </button>

              {/* Eyebrow — ★ Mojo's Care Concierge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `rgba(64,145,108,0.10)`, border: `1px solid rgba(64,145,108,0.25)`,
                borderRadius: 9999, padding: '4px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 11, color: G.sage }}>★</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: G.sage, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {displayName}'s Care Concierge
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: G.deep,
                fontFamily: 'Georgia,serif', lineHeight: 1.2, marginBottom: 8,
              }}>
                What should{' '}
                <span style={{ color: G.sage }}>{displayName}</span>'s{' '}
                care experience feel like?
              </h2>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
                Three questions. Then your Concierge takes over.
              </p>

              {/* Q1: What are we planning? */}
              <p style={{ fontSize: 13, fontWeight: 700, color: G.deep, marginBottom: 12 }}>
                What are we planning?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {CARE_OPTIONS.map(opt => {
                  const sel = selectedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedType(sel ? '' : opt.id)}
                      style={{
                        border: `1.5px solid ${sel ? G.sage : '#E0EDE6'}`,
                        borderRadius: 9999, padding: '7px 16px',
                        fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
                        background: sel ? '#F0FFF4' : '#fff',
                        color:      sel ? G.deepMid : '#555',
                        fontWeight: sel ? 700 : 400,
                      }}
                      data-testid={`care-occasion-${opt.id}`}
                    >
                      {sel ? '✓ ' : ''}{opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Q2: When? */}
              <p style={{ fontSize: 13, fontWeight: 700, color: G.deep, marginBottom: 12 }}>
                When?
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <input
                  type="date"
                  value={careDate}
                  disabled={notSureDate}
                  onChange={e => { setCareDate(e.target.value); setNotSureDate(false); }}
                  style={{
                    flex: 1, border: `1.5px solid ${!notSureDate && careDate ? G.sage : '#E0EDE6'}`,
                    borderRadius: 10, padding: '11px 14px', fontSize: 14,
                    color: G.deep, outline: 'none', opacity: notSureDate ? 0.4 : 1,
                    background: '#fff',
                  }}
                />
                <button
                  onClick={() => { setNotSureDate(!notSureDate); setCareDate(''); }}
                  style={{
                    border: `1.5px solid ${notSureDate ? G.sage : '#E0EDE6'}`,
                    borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', background: notSureDate ? '#F0FFF4' : '#fff',
                    color: notSureDate ? G.deepMid : '#555', whiteSpace: 'nowrap', transition: 'all 0.12s',
                  }}
                >
                  {notSureDate ? '✓ Not sure yet' : 'Not sure yet'}
                </button>
              </div>

              {/* Q3: Notes */}
              <p style={{ fontSize: 13, fontWeight: 700, color: G.deep, marginBottom: 6 }}>
                Anything specific about{' '}
                <span style={{ color: G.sage }}>{displayName}</span>?{' '}
                <span style={{ fontSize: 12, color: '#BBB', fontWeight: 400 }}>Optional</span>
              </p>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={`Coat type, allergies, temperament, what calms ${displayName}…`}
                style={{
                  width: '100%', border: '1.5px solid #E0EDE6', borderRadius: 10,
                  padding: '12px 14px', fontSize: 13, color: G.deep, outline: 'none',
                  resize: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                  marginBottom: 24, boxSizing: 'border-box',
                }}
              />

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={!selectedType || submitting}
                style={{
                  width: '100%',
                  background: selectedType
                    ? `linear-gradient(135deg, ${G.sage}, ${G.deepMid})`
                    : '#E0EDE6',
                  color: selectedType ? '#fff' : '#999',
                  border: 'none', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 800, cursor: selectedType ? 'pointer' : 'not-allowed',
                  marginBottom: 10, transition: 'all 0.15s', opacity: submitting ? 0.75 : 1,
                }}
                data-testid="care-modal-submit-btn"
              >
                {submitting ? 'Sending…' : `Send to ${displayName}'s Concierge →`}
              </button>
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                We already have your contact details.<br />
                Your Concierge will reach out — you don't need to chase.
              </p>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default CareConciergeModal;
