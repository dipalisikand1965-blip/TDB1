/**
 * ConciergeIntakeModal.jsx
 * 
 * 3-question intake modal shared across all 8 service cards.
 * Q1: What are we celebrating? (pre-selected from card's serviceType)
 * Q2: When? (date + "Not sure yet")
 * Q3: Anything else? (free text)
 * 
 * Spec: Modal bg #FFFFFF, border-radius 20px, padding 32px, max-width 480px
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { X } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { bookViaConcierge } from '../../utils/MiraCardActions';

const CELEBRATION_OPTIONS = [
  { id: 'birthday_party', label: 'Birthday' },
  { id: 'gotcha_day', label: 'Gotcha Day' },
  { id: 'milestone', label: 'Milestone' },
  { id: 'photography', label: 'Photoshoot' },
  { id: 'surprise_delivery', label: 'Surprise' },
  { id: 'pawty', label: 'Pawty' },
  { id: 'custom_cake', label: 'Cake Consultation' },
  { id: 'venue', label: 'Venue Booking' },
  { id: 'just_because', label: 'Just because' },
];

const ConciergeIntakeModal = ({ isOpen, onClose, serviceType, petName, petId }) => {
  const { user, token } = useAuth();
  const isMobile = useResizeMobile();
  const [selectedType, setSelectedType] = useState(serviceType || '');
  const [celebrationDate, setCelebrationDate] = useState('');
  const [notSureDate, setNotSureDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [intakeId, setIntakeId] = useState(null);

  // Sync selectedType when modal opens with a new serviceType prop
  // (useState only initializes once on mount — useEffect keeps it in sync)
  React.useEffect(() => {
    if (isOpen) {
      setSelectedType(serviceType || '');
    }
  }, [isOpen, serviceType]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await bookViaConcierge({
      service: selectedType || 'general celebration',
      pillar: "celebrate",
      pet: { id: petId, name: petName || 'your pet' },
      token,
      channel: "celebrate_concierge_intake_modal",
      notes: notes.trim() || null,
      date: notSureDate ? null : (celebrationDate || null),
      onSuccess: (data) => {
        setIntakeId(data?.ticket_id || data?.intakeId || null);
        setSubmitted(true);
      },
    });
    setSubmitting(false);
  };

  const handleClose = () => {
    setSubmitted(false);
    setSelectedType(serviceType || '');
    setCelebrationDate('');
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
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.50)',
          zIndex: 10000,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '88px 0 0' : '16px',
          overflowY: isMobile ? 'auto' : 'visible',
        }}
        data-testid="concierge-intake-modal-overlay"
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            padding: isMobile ? '24px 20px' : 32,
            maxWidth: 480,
            width: '100%',
            maxHeight: isMobile ? 'none' : '90vh',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 10001
          }}
          data-testid="concierge-intake-modal"
        >
          {submitted ? (
            /* Confirmation screen */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64,
                borderRadius: '50%',
                background: 'rgba(201,151,58,0.15)',
                border: '2px solid rgba(201,151,58,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px'
              }}>♥</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A0030', marginBottom: 10 }}>
                {displayName}'s celebration is in good hands.
              </h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
                Your Concierge® has everything they need. Expect a message within 48 hours. ♥
              </p>
              <p style={{ fontSize: 12, color: 'rgba(201,151,58,0.80)', fontWeight: 600 }}>
                48h response promise
              </p>
              <button
                onClick={handleClose}
                style={{
                  marginTop: 24,
                  background: 'linear-gradient(135deg, #C9973A, #F0C060)',
                  color: '#1A0A00',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 32px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%'
                }}
                data-testid="intake-modal-close-confirmation"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Close button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                data-testid="intake-modal-close"
              >
                <X className="w-5 h-5" style={{ color: '#888' }} />
              </button>

              {/* Eyebrow */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(201,151,58,0.15)',
                border: '1px solid rgba(201,151,58,0.40)',
                borderRadius: 9999,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#F0C060',
                marginBottom: 16
              }}>
                <span style={{ color: '#C9973A' }}>★</span>
                {displayName}'s Concierge®
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '1.25rem',
                fontFamily: 'Georgia, serif',
                fontWeight: 800,
                color: '#1A0030',
                marginBottom: 6,
                lineHeight: 1.3
              }}>
                What should <span style={{ color: '#C9973A' }}>{displayName}</span>'s celebration feel like?
              </h2>

              {/* Subtitle */}
              <p style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.5 }}>
                Three questions. Then your Concierge® takes over.
              </p>

              {/* Q1: What are we celebrating? */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0030', marginBottom: 12 }}>
                  What are we celebrating?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CELEBRATION_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedType(opt.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 9999,
                        fontSize: 13,
                        fontWeight: selectedType === opt.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        background: selectedType === opt.id
                          ? 'linear-gradient(135deg, #C9973A, #F0C060)'
                          : 'rgba(0,0,0,0.04)',
                        border: selectedType === opt.id
                          ? '1px solid transparent'
                          : '1px solid rgba(0,0,0,0.10)',
                        color: selectedType === opt.id ? '#1A0A00' : '#444'
                      }}
                      data-testid={`celebration-option-${opt.id}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: When? */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0030', marginBottom: 12 }}>
                  When?
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={celebrationDate}
                    onChange={e => {
                      setCelebrationDate(e.target.value);
                      setNotSureDate(false);
                    }}
                    disabled={notSureDate}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.15)',
                      fontSize: 13,
                      color: notSureDate ? '#aaa' : '#1A0030',
                      background: notSureDate ? '#f5f5f5' : '#fff',
                      cursor: notSureDate ? 'not-allowed' : 'text',
                      flex: 1,
                      minWidth: 140
                    }}
                    data-testid="intake-date-input"
                  />
                  <button
                    onClick={() => {
                      setNotSureDate(!notSureDate);
                      if (!notSureDate) setCelebrationDate('');
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: notSureDate ? 700 : 500,
                      cursor: 'pointer',
                      background: notSureDate ? 'rgba(201,151,58,0.15)' : 'rgba(0,0,0,0.04)',
                      border: notSureDate ? '1px solid rgba(201,151,58,0.40)' : '1px solid rgba(0,0,0,0.10)',
                      color: notSureDate ? '#C9973A' : '#444',
                      whiteSpace: 'nowrap'
                    }}
                    data-testid="intake-not-sure-date"
                  >
                    Not sure yet
                  </button>
                </div>
              </div>

              {/* Q3: Anything else? (optional) */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0030', marginBottom: 8 }}>
                  Anything else we should know about <span style={{ color: '#C9973A' }}>{displayName}</span>?{' '}
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>Optional</span>
                </p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Allergies, favourite things, what makes their tail go fastest..."
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.12)',
                    fontSize: 13,
                    color: '#1A0030',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  data-testid="intake-notes-input"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #C9973A, #F0C060)',
                  color: '#1A0A00',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'all 150ms'
                }}
                data-testid="intake-submit-btn"
              >
                {submitting ? 'Sending...' : 'Send to my Concierge® →'}
              </button>

              {/* Privacy note */}
              <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                We already have your contact details. Your Concierge® will reach out — you don't need to chase.
              </p>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default ConciergeIntakeModal;
