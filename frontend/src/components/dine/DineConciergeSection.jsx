/**
 * DineConciergeSection.jsx
 * The Doggy Company — /dine page
 *
 * "Dine, Personally" — mirrors CelebrateServiceGrid exactly.
 * Data-driven: reads all dine services from Service Box API.
 * Service Box admin (/admin → Dine → Services) is the single source of truth.
 * Adding/editing a service in Service Box immediately updates this grid.
 *
 * Layout: 4-col desktop, 2-col tablet, 1-col mobile.
 */

import React, { useState, useEffect } from 'react';
import CelebrateServiceCard from '../celebrate/CelebrateServiceCard';
import DineConciergeModal from './DineConciergeModal';
import { getApiUrl } from '../../utils/api';
import { useConcierge } from '../../hooks/useConcierge';

const DineConciergeSection = ({ pet }) => {
  const [services,    setServices]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [intakeModal, setIntakeModal] = useState({ open: false, serviceType: '' });
  const { book } = useConcierge({ pet, pillar: 'dine' });

  const petName = pet?.name || 'your pet';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/service-box/services?pillar=dine&limit=20&is_active=true`);
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.services || []).sort((a, b) => {
            const ao = a.sort_order ?? 99;
            const bo = b.sort_order ?? 99;
            if (ao !== bo) return ao - bo;
            return (a.name || '').localeCompare(b.name || '');
          });
          setServices(sorted);
        }
      } catch (err) {
        console.error('[DineConciergeSection] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const resolveCopy = (text = '') => text.replace(/\{petName\}/g, petName);

  const openIntake = (serviceType) => {
    book({ service: `${petName} — ${serviceType}`, channel: 'dine_service_grid', urgency: 'normal' });
    setIntakeModal({ open: true, serviceType });
  };

  // Skeleton while loading
  if (loading) {
    return (
      <section style={{ padding: '0 0 48px' }} data-testid="dine-service-grid">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 'clamp(1.3rem,5vw,2rem)', fontWeight: 800, color: '#1A0A00', fontFamily: 'Georgia, serif' }}>
            Dine, Personally
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="service-grid-responsive">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 320, borderRadius: 16, background: '#FFF3E0', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </section>
    );
  }

  // Determine grid columns
  const cols = services.length <= 4 ? Math.max(services.length, 1) : 4;

  return (
    <section style={{ padding: '0 0 48px' }} data-testid="dine-service-grid">
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 5vw, 2rem)',
          fontWeight: 800,
          color: '#1A0A00',
          fontFamily: 'Georgia, serif',
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          Dine, Personally
        </h2>
        <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>
          Tell us what you want {petName}'s dining experience to feel like. We'll handle the rest.
        </p>
      </div>

      {/* Grid — driven by Service Box data */}
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}
        className="service-grid-responsive"
      >
        {services.map((svc) => (
          <CelebrateServiceCard
            key={svc.id || svc._id || svc.name}
            illustration={svc.image_url || svc.watercolor_image || svc.image || ''}
            subLabel={svc.sub_label || svc.sub_title || svc.category || ''}
            title={svc.name}
            description={resolveCopy(svc.description || '')}
            ctaText={resolveCopy(svc.cta_text || `Book ${petName}'s ${svc.name} →`)}
            onCta={() => openIntake(svc.service_type || svc.name)}
          />
        ))}
      </div>

      {/* Intake Modal */}
      <DineConciergeModal
        isOpen={intakeModal.open}
        onClose={() => setIntakeModal({ open: false, serviceType: '' })}
        serviceType={intakeModal.serviceType}
        petName={petName}
        petId={pet?.id}
      />
    </section>
  );
};

export default DineConciergeSection;
