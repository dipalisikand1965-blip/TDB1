/**
 * DineConciergeModal.jsx
 * The Doggy Company — /dine page
 *
 * 3-question intake modal for dine services.
 * Mirrors CelebrateConcierge's ConciergeIntakeModal exactly.
 * API: POST /api/concierge/dining-intake
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { bookViaConcierge } from '../../utils/MiraCardActions';

const DINE_OPTIONS = [
  { id: 'restaurant_discovery',  label: 'Restaurant Discovery' },
  { id: 'reservation_assistance', label: 'Reservation Assistance' },
  { id: 'date_night',            label: 'Date Night Dining' },
  { id: 'etiquette_guidance',    label: 'Dining Etiquette' },
  { id: 'venue_suitability',     label: 'Venue Suitability' },
  { id: 'special_occasion',      label: 'Special Occasion' },
  { id: 'allergy_safe',          label: 'Allergy-Safe Menu' },
  { id: 'brunch_outing',         label: 'Doggy Brunch' },
  { id: 'just_because',          label: 'Just because' },
];

const DineConciergeModal = ({ isOpen, onClose, serviceType, petName, petId }) => {
  const { token } = useAuth();
  const isMobile = useResizeMobile();

  const [selectedType,  setSelectedType]  = useState(serviceType || '');
  const [diningDate,    setDiningDate]    = useState('');
  const [notSureDate,   setNotSureDate]   = useState(false);
  const [notes,         setNotes]         = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(serviceType || '');
      setSubmitted(false);
    }
  }, [isOpen, serviceType]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedType || submitting) return;
    setSubmitting(true);
    await bookViaConcierge({
      service: selectedType,
      pillar: "dine",
      pet: { id: petId, name: petName || 'your pet' },
      token,
      channel: "dine_concierge_modal",
      notes: notes.trim() || null,
      date: notSureDate ? null : (diningDate || null),
      onSuccess: () => {
        setSubmitted(true);
        toast.success(`Sent to ${displayName}'s Concierge®`, { description: "We will reach out within 48 hours." });
      },
    });
    setSubmitting(false);
  };

  const handleClose = () => {
    setSubmitted(false);
    setSelectedType(serviceType || '');
    setDiningDate('');
    setNotSureDate(false);
    setNotes('');
    onClose();
  };

  const displayName = petName || 'your pet';

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
          padding: isMobile ? '0' : '16px',
          overflowY: isMobile ? 'auto' : 'visible',
        }}
        data-testid="dine-intake-modal-overlay"
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
          data-testid="dine-intake-modal"
        >
          {submitted ? (
            /* Confirmation */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(201,151,58,0.15)',
                border: '2px solid rgba(201,151,58,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px',
              }}>♥</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00', marginBottom: 10 }}>
                {displayName}'s dining plan is in good hands.
              </h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
                Your Concierge® has everything they need.<br />
                Expect a message within 48 hours. ♥
              </p>
              <button
                onClick={handleClose}
                style={{
                  background: 'linear-gradient(135deg,#C9973A,#F0C060)',
                  color: '#1A0A00', border: 'none', borderRadius: 12,
                  padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
                data-testid="dine-modal-done-btn"
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
                data-testid="dine-modal-close"
              >
                <X size={18} />
              </button>

              {/* Eyebrow */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,151,58,0.10)', border: '1px solid rgba(201,151,58,0.25)',
                borderRadius: 9999, padding: '4px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 11, color: '#C9973A' }}>★</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,151,58,0.90)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {displayName}'s Dining Concierge®
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: '#1A0A00',
                fontFamily: 'Georgia,serif', lineHeight: 1.2, marginBottom: 8,
              }}>
                What are we planning for{' '}
                <span style={{ color: '#C9973A' }}>{displayName}</span>?
              </h2>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
                Three questions. Then your Concierge® takes over.
              </p>

              {/* Q1: Occasion */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00', marginBottom: 12 }}>
                What are we planning?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {DINE_OPTIONS.map(opt => {
                  const sel = selectedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedType(sel ? '' : opt.id)}
                      style={{
                        border: `1.5px solid ${sel ? '#C9973A' : '#E8E0D8'}`,
                        borderRadius: 9999, padding: '7px 16px',
                        fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
                        background: sel ? '#FFF8E8' : '#fff',
                        color:      sel ? '#8B5E00' : '#555',
                        fontWeight: sel ? 700 : 400,
                      }}
                      data-testid={`dine-occasion-${opt.id}`}
                    >
                      {sel ? '✓ ' : ''}{opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Q2: When */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00', marginBottom: 12 }}>
                When?
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <input
                  type="date"
                  value={diningDate}
                  disabled={notSureDate}
                  onChange={e => { setDiningDate(e.target.value); setNotSureDate(false); }}
                  style={{
                    flex: 1, border: `1.5px solid ${!notSureDate && diningDate ? '#C9973A' : '#E8E0D8'}`,
                    borderRadius: 10, padding: '11px 14px', fontSize: 14,
                    color: '#1A0A00', outline: 'none', opacity: notSureDate ? 0.4 : 1,
                  }}
                />
                <button
                  onClick={() => { setNotSureDate(!notSureDate); setDiningDate(''); }}
                  style={{
                    border: `1.5px solid ${notSureDate ? '#C9973A' : '#E8E0D8'}`,
                    borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', background: notSureDate ? '#FFF8E8' : '#fff',
                    color: notSureDate ? '#8B5E00' : '#555', whiteSpace: 'nowrap', transition: 'all 0.12s',
                  }}
                >
                  {notSureDate ? '✓ Not sure yet' : 'Not sure yet'}
                </button>
              </div>

              {/* Q3: Notes */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00', marginBottom: 6 }}>
                Anything else about{' '}
                <span style={{ color: '#C9973A' }}>{displayName}</span>?{' '}
                <span style={{ fontSize: 12, color: '#BBB', fontWeight: 400 }}>Optional</span>
              </p>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={`Allergies, favourite foods, venue preferences, what makes ${displayName}'s tail go fastest…`}
                style={{
                  width: '100%', border: '1.5px solid #E8E0D8', borderRadius: 10,
                  padding: '12px 14px', fontSize: 13, color: '#1A0A00', outline: 'none',
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
                  background: selectedType ? 'linear-gradient(135deg,#C9973A,#F0C060)' : '#E8E0D8',
                  color: selectedType ? '#1A0A00' : '#999',
                  border: 'none', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 800, cursor: selectedType ? 'pointer' : 'not-allowed',
                  marginBottom: 10, transition: 'all 0.15s', opacity: submitting ? 0.75 : 1,
                }}
                data-testid="dine-modal-submit-btn"
              >
                {submitting ? 'Sending…' : `Send to ${displayName}'s Concierge® →`}
              </button>
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                We already have your contact details.<br />
                Your Concierge® will reach out — you don't need to chase.
              </p>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default DineConciergeModal;
