/**
 * MiraEmptyRequest.jsx
 * Universal empty-state + concierge capture component.
 * 
 * When a product category has 0 results, this shows:
 *   - "Mira is sourcing [category] for [petName]"
 *   - Pet profile context (breed, life stage, allergies)
 *   - "Tell Mira →" button that creates a concierge ticket
 * 
 * Usage:
 *   <MiraEmptyRequest
 *     pet={currentPet}
 *     pillar="celebrate"
 *     categoryName="Party Accessories"
 *     accentColor="#9B59B6"
 *     onRequest={async (msg) => { await request(msg, { channel: 'celebrate_empty' }); }}
 *   />
 */

import { useState } from 'react';

export default function MiraEmptyRequest({
  pet,
  pillar = 'general',
  categoryName = 'Products',
  accentColor = '#7C3AED',
  onRequest,       // async (message: string) => void — from useConcierge().request
  darkMode = false,
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const petName  = pet?.name  || 'your dog';
  const breed    = pet?.breed || '';
  const lifeStage = pet?.life_stage || pet?.doggy_soul_answers?.life_stage || '';
  const allergies = [
    ...(pet?.allergies || []),
    ...(pet?.preferences?.allergies || []),
    ...(pet?.doggy_soul_answers?.food_allergies || []),
  ].filter(a => a && !/^(none|no)$/i.test(a));

  const bg      = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.05)';
  const border  = darkMode ? 'rgba(255,255,255,0.12)' : `${accentColor}22`;
  const textCol = darkMode ? 'rgba(255,255,255,0.85)' : '#1A0A2E';
  const mutedCol = darkMode ? 'rgba(255,255,255,0.55)' : '#6B7280';

  const handleRequest = async () => {
    if (!onRequest || sent || sending) return;
    setSending(true);
    try {
      const msg = [
        `${petName} needs ${categoryName} (${pillar}).`,
        breed     ? `Breed: ${breed}.`       : null,
        lifeStage ? `Life stage: ${lifeStage}.` : null,
        allergies.length > 0 ? `No ${allergies.join(', ')}.` : null,
        `Please source ${categoryName} options for ${petName}.`,
      ].filter(Boolean).join(' ');
      await onRequest(msg);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div style={{
        textAlign: 'center', padding: '28px 16px',
        background: darkMode ? 'rgba(52,211,153,0.08)' : '#F0FDF4',
        borderRadius: 20, border: `1px solid ${darkMode ? 'rgba(52,211,153,0.2)' : '#86EFAC'}`,
        margin: '8px 0',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: darkMode ? '#86EFAC' : '#16A34A', marginBottom: 4 }}>
          Mira is on it for {petName}
        </div>
        <div style={{ fontSize: 14, color: darkMode ? 'rgba(255,255,255,0.55)' : '#6B7280' }}>
          We'll source {categoryName} and update you on WhatsApp.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      textAlign: 'center', padding: '24px 16px',
      background: bg, borderRadius: 20, border: `1px solid ${border}`,
      margin: '8px 0',
    }}>
      {/* Mira icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `linear-gradient(135deg, ${accentColor}, #C44DFF)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, margin: '0 auto 12px',
      }}>
        ✦
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 6 }}>
        No {categoryName} yet for {petName}
      </div>

      <div style={{ fontSize: 14, color: mutedCol, lineHeight: 1.6, marginBottom: 16 }}>
        Mira is personalising this. Tell the concierge and we'll source exactly what{' '}
        {petName} needs.
      </div>

      {/* Pet profile snippet */}
      {(breed || lifeStage || allergies.length > 0) && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
          marginBottom: 16,
        }}>
          {breed && (
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: darkMode ? 'rgba(255,255,255,0.10)' : `${accentColor}18`,
              color: darkMode ? 'rgba(255,255,255,0.75)' : accentColor,
            }}>
              {breed}
            </span>
          )}
          {lifeStage && (
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: darkMode ? 'rgba(255,255,255,0.10)' : `${accentColor}18`,
              color: darkMode ? 'rgba(255,255,255,0.75)' : accentColor,
            }}>
              {lifeStage}
            </span>
          )}
          {allergies.slice(0, 2).map(a => (
            <span key={a} style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: darkMode ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
              color: darkMode ? '#FCA5A5' : '#DC2626',
            }}>
              no {a}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleRequest}
        disabled={sending}
        data-testid={`mira-empty-request-${pillar}-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 14, border: 'none',
          background: `linear-gradient(135deg, ${accentColor}, #C44DFF)`,
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          opacity: sending ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.15s',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {sending ? '⌛ Sending…' : `Tell Mira what ${petName} needs →`}
      </button>
    </div>
  );
}
