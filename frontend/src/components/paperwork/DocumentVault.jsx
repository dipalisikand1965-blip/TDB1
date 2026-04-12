import React, { useMemo, useState } from 'react';
import { useConcierge } from '../../hooks/useConcierge';

export default function DocumentVault({ pet, token, onConcierge }) {
  const [expanded, setExpanded] = useState(false);
  const { book } = useConcierge({ pet, pillar: 'paperwork' });

  const soul = pet?.doggy_soul_answers || {};
  const vault = pet?.vault || {};
  const petName = pet?.name || 'your dog';
  const TEAL = '#0D9488';

  const documents = useMemo(() => ([
    {
      id: 'vaccination',
      label: 'Vaccination records',
      icon: '💉',
      complete: !!(pet?.vaccinated || vault?.vaccines?.length > 0),
      detail: vault?.vaccines?.length > 0 ? `${vault.vaccines.length} records` : 'Not uploaded',
      urgent: true,
    },
    {
      id: 'microchip',
      label: 'Microchip registration',
      icon: '🔬',
      complete: !!(pet?.microchip || soul?.microchipped === 'yes'),
      detail: pet?.microchip || soul?.microchip_id || 'Not registered',
      urgent: true,
    },
    {
      id: 'insurance',
      label: 'Pet insurance',
      icon: '🛡️',
      complete: !!(soul?.insurance || soul?.insurance === 'yes'),
      detail: soul?.insurance_provider || 'Not insured',
      urgent: false,
    },
    {
      id: 'adoption',
      label: 'Adoption papers',
      icon: '📄',
      complete: !!(soul?.adoption_papers || soul?.adoption_date),
      detail: soul?.adoption_date || 'Not uploaded',
      urgent: false,
    },
    {
      id: 'travel',
      label: 'Travel documents',
      icon: '✈️',
      complete: !!(soul?.travel_docs || soul?.noc),
      detail: 'NOC, health certificate',
      urgent: false,
    },
    {
      id: 'license',
      label: 'License & registration',
      icon: '🏛️',
      complete: !!(soul?.registered || soul?.license),
      detail: 'Municipal corporation',
      urgent: false,
    },
  ]), [pet?.vaccinated, soul?.microchipped, soul?.microchip_id, soul?.insurance, soul?.insurance_provider, soul?.adoption_papers, soul?.adoption_date, soul?.travel_docs, soul?.noc, soul?.registered, soul?.license, vault?.vaccines]);

  if (!pet) return null;

  const completed = documents.filter((doc) => doc.complete).length;
  const total = documents.length;
  const pct = Math.round((completed / total) * 100);
  const missing = documents.filter((doc) => !doc.complete);
  const urgentMissing = missing.filter((doc) => doc.urgent);

  const handleSort = () => {
    book(
      { name: `${petName}'s Document Vault`, price: null },
      {
        channel: 'paperwork_document_vault',
        urgency: urgentMissing.length > 0 ? 'high' : 'normal',
        note: `Missing documents: ${missing.map((doc) => doc.label).join(' · ')}`,
      }
    );
    onConcierge?.();
  };

  return (
    <div
      data-testid="paperwork-document-vault"
      style={{
        background: '#fff',
        border: `1.5px solid ${pct === 100 ? TEAL : 'rgba(13,148,136,0.3)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        onClick={() => setExpanded((prev) => !prev)}
        data-testid="paperwork-document-vault-toggle"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: pct === 100 ? 'rgba(13,148,136,0.04)' : '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(13,148,136,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            📋
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }} data-testid="paperwork-document-vault-title">
              {petName}'s Document Vault
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }} data-testid="paperwork-document-vault-summary">
              {pet?.breed} · {completed} of {total} complete
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEAL }} data-testid="paperwork-document-vault-percent">
              {pct}%
            </div>
            <div style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.06em' }}>COMPLETE</div>
          </div>
          <div style={{ fontSize: 16, color: '#aaa' }}>{expanded ? '▲' : '▼'}</div>
        </div>
      </div>

      <div style={{ height: 4, background: 'rgba(13,148,136,0.1)' }}>
        <div
          data-testid="paperwork-document-vault-progress"
          style={{
            width: `${pct}%`,
            height: '100%',
            background: TEAL,
            transition: 'width 0.8s ease',
          }}
        />
      </div>

      {expanded && (
        <div style={{ padding: '16px 18px' }}>
          {urgentMissing.length > 0 && (
            <div
              data-testid="paperwork-document-vault-urgent-alert"
              style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: 12,
                color: '#DC2626',
              }}
            >
              ⚠️ {urgentMissing.map((doc) => doc.label).join(' · ')} — urgent
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {documents.map((doc) => (
              <div
                key={doc.id}
                data-testid={`paperwork-document-card-${doc.id}`}
                style={{
                  background: '#fff',
                  border: doc.complete ? `1.5px solid ${TEAL}` : '1.5px solid rgba(220,38,38,0.4)',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{doc.icon}</span>
                  <span
                    data-testid={`paperwork-document-status-${doc.id}`}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: doc.complete ? TEAL : '#DC2626',
                      background: doc.complete ? 'rgba(13,148,136,0.1)' : 'rgba(220,38,38,0.08)',
                      padding: '2px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {doc.complete ? 'Complete' : 'Missing'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0a2e', marginBottom: 2 }}>{doc.label}</div>
                <div style={{ fontSize: 11, color: doc.complete ? '#888' : '#DC2626' }}>{doc.detail}</div>
              </div>
            ))}
          </div>

          {missing.length > 0 && (
            <div
              onClick={handleSort}
              data-testid="paperwork-document-vault-sort-button"
              style={{
                background: '#fff',
                border: `1px solid ${TEAL}`,
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0a2e', marginBottom: 2 }}>
                  Concierge® can sort all of this
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{missing.map((doc) => doc.label).join(' · ')}</div>
              </div>
              <div
                style={{
                  background: TEAL,
                  color: '#fff',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Sort for {petName} →
              </div>
            </div>
          )}

          {pct === 100 && (
            <div
              data-testid="paperwork-document-vault-complete-state"
              style={{
                textAlign: 'center',
                padding: '12px',
                fontSize: 13,
                color: TEAL,
                fontStyle: 'italic',
              }}
            >
              ✓ {petName}'s documents are complete. Mira has everything.
            </div>
          )}
        </div>
      )}
    </div>
  );
}