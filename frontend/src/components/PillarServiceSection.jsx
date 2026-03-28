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
            description={svc.description || svc.tagline || ''}
            ctaText={`Book for ${petName} →`}
            onCta={() => request(svc.name, { channel: `${pillar}_svc`, serviceId: svc.id })}
          />
        ))}
      </div>
    </div>
  );
};

export default PillarServiceSection;
