/**
 * PillarServiceSection.jsx
 * Generic watercolour service card section for ANY pillar.
 * Mirrors CareConciergeSection / PlayConciergeSection / GoConciergeSection.
 *
 * Props:
 *   pillar           – "emergency" | "farewell" | "adopt" | "learn" | "paperwork" | …
 *   pet              – pet object
 *   title            – section heading, e.g. "Emergency Help, Personally"
 *   accentColor      – pill / CTA colour
 *   darkColor        – heading colour
 *   isMobile         – true → 2-col compact grid
 *   preloadedServices– array from parent state (skips internal fetch)
 */
import React, { useState, useEffect } from 'react';
import CelebrateServiceCard from './celebrate/CelebrateServiceCard';
import { getApiUrl } from '../utils/api';
import { useConcierge } from '../hooks/useConcierge';

// Resolve breed-specific service copy: breed_whispers.indie > breed_whispers.default > mira_whisper > description
function getBreedWhisper(svc, pet) {
  if (!svc?.breed_whispers) return null;
  const key = pet?.breed ? String(pet.breed).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g,'') : null;
  if (key && svc.breed_whispers[key]) return svc.breed_whispers[key];
  return svc.breed_whispers.default || null;
}

const PillarServiceSection = ({
  pillar,
  pet,
  title,
  accentColor  = '#2D6A4F',
  darkColor    = '#111',
  isMobile     = false,
  preloadedServices,
}) => {
  const [services, setServices] = useState(preloadedServices || []);
  const [loading, setLoading]   = useState(!preloadedServices?.length);
  const [pendingService, setPendingService] = useState(null);
  const [notes, setNotes]       = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const { request } = useConcierge({ pet, pillar });
  const petName = pet?.name || 'your pet';

  useEffect(() => {
    if (preloadedServices?.length) {
      setServices(preloadedServices);
      setLoading(false);
      return;
    }
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/service-box/services?pillar=${pillar}&limit=12&is_active=true`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.services?.length) setServices(d.services);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pillar]); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = (svc) => {
    setNotes('');
    setSent(false);
    setPendingService(svc);
  };

  const closeModal = () => {
    if (sending) return;
    setPendingService(null);
    setNotes('');
    setSent(false);
  };

  const confirmRequest = async () => {
    if (sending || !pendingService) return;
    setSending(true);
    await request(pendingService.name, {
      channel: `${pillar}_svc_modal`,
      serviceId: pendingService.id,
      note: notes || undefined,
    });
    setSending(false);
    setSent(true);
    setTimeout(closeModal, 1800);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#aaa' }}>
        <div style={{ fontSize: 13 }}>Loading services…</div>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '32px 16px' : '40px 20px', color: '#aaa' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🐾</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Services being curated</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>Contact Concierge® to arrange {petName}'s services</div>
        <button
          onClick={() => request('Services enquiry', { channel: `${pillar}_svc_section` })}
          style={{ padding: '12px 28px', borderRadius: 14, border: 'none', background: accentColor, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Request via Concierge® →
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: isMobile ? 24 : 40 }} data-testid={`${pillar}-service-section`}>

      {/* Section heading */}
      {title && (
        <div style={{ marginBottom: isMobile ? 16 : 20 }}>
          <h2 style={{
            fontSize: isMobile ? 20 : 'clamp(1.3rem,5vw,2rem)',
            fontWeight: 800, color: darkColor,
            fontFamily: 'Georgia,serif', marginBottom: 6, lineHeight: 1.2,
          }}>
            {title}
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#666', lineHeight: 1.6 }}>
            All services arranged through Concierge® — personalised for {petName}.
          </p>
        </div>
      )}

      {/* Watercolour card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '1fr 1fr'
          : 'repeat(auto-fill,minmax(min(220px,100%),1fr))',
        gap: isMobile ? 12 : 14,
      }}>
        {services.map((svc, i) => (
          <CelebrateServiceCard
            key={svc.id || i}
            illustration={svc.watercolor_image || svc.cloudinary_image_url || svc.image_url}
            subLabel={svc.category || pillar}
            title={svc.name}
            description={getBreedWhisper(svc, pet) || svc.mira_whisper || svc.description || svc.tagline || ''}
            ctaText={`Book for ${petName} →`}
            onCta={() => openModal(svc)}
          />
        ))}
      </div>

      {/* Concierge request modal */}
      {pendingService && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 10010,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 420,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', lineHeight: 1 }}
            >✕</button>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>❤️</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Mira's on it</div>
                <div style={{ fontSize: 14, color: '#666' }}>Concierge® will reach out on WhatsApp within 2 hours.</div>
              </div>
            ) : (
              <>
                {/* Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accentColor}15`, border: `1px solid ${accentColor}40`, borderRadius: 999, padding: '4px 12px', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>★ Concierge®</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 4, lineHeight: 1.2, fontFamily: 'Georgia,serif' }}>
                  {pendingService.name}
                </h3>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 1.6 }}>
                  {getBreedWhisper(pendingService, pet) || pendingService.mira_whisper || pendingService.description || pendingService.tagline || `Personalised for ${petName} — our team handles every detail.`}
                </p>

                {/* Notes */}
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={`Any notes for ${petName}'s request? (optional)`}
                  rows={3}
                  style={{
                    width: '100%', borderRadius: 12, border: '1.5px solid #e5e7eb',
                    padding: '10px 12px', fontSize: 13, color: '#333', resize: 'none',
                    outline: 'none', boxSizing: 'border-box', marginBottom: 16,
                    fontFamily: 'inherit',
                  }}
                />

                <button
                  onClick={confirmRequest}
                  disabled={sending}
                  data-testid={`concierge-confirm-${pillar}`}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: sending ? `${accentColor}66` : `linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                    color: '#fff', fontSize: 15, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? 'Connecting…' : `✦ Connect with Concierge® →`}
                </button>
                <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10, margin: '10px 0 0' }}>
                  Responds within 2 hours · Emergency within 15 minutes
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PillarServiceSection;
