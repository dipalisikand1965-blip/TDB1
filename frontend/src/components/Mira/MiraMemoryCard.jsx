/**
 * MiraMemoryCard.jsx
 * Shows what Mira knows and remembers about the pet — displayed on the Mojo tab.
 * Renders key soul profile data, preferences, allergies, and health notes as
 * a clean, scannable "memory vault" card.
 */

import React, { useMemo } from 'react';
import { Brain, Heart, AlertCircle, Star, Zap, ShieldCheck } from 'lucide-react';

const styles = {
  card: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.06) 100%)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid rgba(139,92,246,0.12)',
    background: 'rgba(139,92,246,0.06)',
  },
  headerText: { fontSize: 13, fontWeight: 700, color: '#C4B5FD' },
  subtitle: { fontSize: 11, color: 'rgba(196,181,253,0.55)', marginTop: 1 },
  body: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  section: {},
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
  },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  pill: (color) => ({
    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    background: color.bg, color: color.text, border: `1px solid ${color.border}`,
    lineHeight: 1.4,
  }),
  allergyPill: {
    bg: 'rgba(239,68,68,0.12)', text: '#FCA5A5', border: 'rgba(239,68,68,0.25)',
  },
  favPill: {
    bg: 'rgba(34,197,94,0.1)', text: '#86EFAC', border: 'rgba(34,197,94,0.2)',
  },
  traitPill: {
    bg: 'rgba(99,102,241,0.12)', text: '#A5B4FC', border: 'rgba(99,102,241,0.2)',
  },
  healthPill: {
    bg: 'rgba(251,191,36,0.1)', text: '#FDE68A', border: 'rgba(251,191,36,0.2)',
  },
  emptyText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
};

// ── Helper: extract key soul answers into readable groups ────────────────────
function extractMemory(soulAnswers, pet, healthData) {
  const a = soulAnswers || {};
  const memory = { allergies: [], favorites: [], traits: [], health: [], lifestyle: [] };

  // Allergies
  const allergy = a.known_allergies || a.allergies || pet?.allergies || [];
  if (Array.isArray(allergy) && allergy.length) memory.allergies = allergy.slice(0, 5);
  else if (typeof allergy === 'string' && allergy !== 'none' && allergy !== 'unknown')
    memory.allergies = [allergy];

  // Favorite foods / activities
  const favFoods = a.favorite_foods || a.favourite_foods || a.fav_foods || [];
  const favActivities = a.favorite_activities || a.activities || [];
  if (Array.isArray(favFoods)) memory.favorites.push(...favFoods.slice(0, 3));
  if (Array.isArray(favActivities)) memory.favorites.push(...favActivities.slice(0, 2));
  if (typeof favFoods === 'string') memory.favorites.push(favFoods);

  // Personality traits
  const traits = a.personality_traits || a.personality || a.temperament || [];
  if (Array.isArray(traits)) memory.traits = traits.slice(0, 4);
  else if (typeof traits === 'string') memory.traits = [traits];

  const energyMap = { high: 'High Energy', medium: 'Balanced', low: 'Calm' };
  const energy = a.energy_level || pet?.energy_level;
  if (energy && energyMap[energy]) memory.traits.push(energyMap[energy]);

  // Health notes
  const conditions = a.health_conditions || a.medical_conditions || healthData?.conditions || [];
  if (Array.isArray(conditions) && conditions.length) memory.health = conditions.slice(0, 3);

  const medications = healthData?.medications?.filter(m => m.name || m.medication) || [];
  if (medications.length) memory.health.push(`${medications.length} med${medications.length > 1 ? 's' : ''}`);

  // Lifestyle notes
  const diet = a.diet_type || a.dietary_preference || '';
  if (diet) memory.lifestyle.push(diet);
  const size = pet?.size || a.size;
  if (size) memory.lifestyle.push(`${size} size`);
  const age = pet?.age || a.age;
  if (age) memory.lifestyle.push(typeof age === 'number' ? `${age} yr${age !== 1 ? 's' : ''}` : age);

  return memory;
}

export default function MiraMemoryCard({ pet, soulAnswers, healthData }) {
  const petName = pet?.name || 'your pet';
  const memory = useMemo(
    () => extractMemory(soulAnswers, pet, healthData),
    [soulAnswers, pet, healthData]
  );

  const totalKnown =
    memory.allergies.length +
    memory.favorites.length +
    memory.traits.length +
    memory.health.length +
    memory.lifestyle.length;

  return (
    <div style={styles.card} data-testid="mira-memory-card">
      {/* Header */}
      <div style={styles.header}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Brain size={15} color="#fff" />
        </div>
        <div>
          <div style={styles.headerText}>Mira's Memory — {petName}</div>
          <div style={styles.subtitle}>
            {totalKnown > 0
              ? `${totalKnown} thing${totalKnown !== 1 ? 's' : ''} Mira knows about ${petName}`
              : `Start the soul journey to teach Mira about ${petName}`}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Allergies & Sensitivities */}
        {memory.allergies.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <AlertCircle size={9} style={{ display: 'inline', marginRight: 3 }} />
              Allergies & Sensitivities
            </div>
            <div style={styles.pillRow}>
              {memory.allergies.map((a, i) => (
                <span key={i} style={styles.pill(styles.allergyPill)}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {memory.favorites.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <Heart size={9} style={{ display: 'inline', marginRight: 3 }} />
              Loves & Favorites
            </div>
            <div style={styles.pillRow}>
              {memory.favorites.map((f, i) => (
                <span key={i} style={styles.pill(styles.favPill)}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Personality */}
        {memory.traits.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <Star size={9} style={{ display: 'inline', marginRight: 3 }} />
              Personality
            </div>
            <div style={styles.pillRow}>
              {memory.traits.map((t, i) => (
                <span key={i} style={styles.pill(styles.traitPill)}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle & Bio */}
        {memory.lifestyle.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <Zap size={9} style={{ display: 'inline', marginRight: 3 }} />
              Lifestyle
            </div>
            <div style={styles.pillRow}>
              {memory.lifestyle.map((l, i) => (
                <span key={i} style={styles.pill(styles.traitPill)}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Health */}
        {memory.health.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <ShieldCheck size={9} style={{ display: 'inline', marginRight: 3 }} />
              Health Notes
            </div>
            <div style={styles.pillRow}>
              {memory.health.map((h, i) => (
                <span key={i} style={styles.pill(styles.healthPill)}>{h}</span>
              ))}
            </div>
          </div>
        )}

        {totalKnown === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧠</div>
            <div style={styles.emptyText}>
              Complete {petName}'s soul profile so Mira can remember what matters most.
            </div>
          </div>
        )}

        {/* Footer sparkle */}
        <div style={{
          fontSize: 10, color: 'rgba(139,92,246,0.5)', textAlign: 'center',
          paddingTop: 4, borderTop: '1px solid rgba(139,92,246,0.08)',
        }}>
          Mira never forgets — all data is private & secure ✦
        </div>
      </div>
    </div>
  );
}
