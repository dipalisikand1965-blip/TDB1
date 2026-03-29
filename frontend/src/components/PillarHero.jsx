/**
 * PillarHero.jsx — Unified mobile pillar hero
 * Single source of truth for ALL 12 pillar page headers
 *
 * Props:
 *   pillar       — string: 'care' | 'dine' | 'go' | 'play' etc
 *   pet          — current pet object (photo_url, name, breed)
 *   allPets      — array of all pets for switcher
 *   onSwitchPet  — function(pet) called when pet pill tapped
 *   gradient     — CSS gradient string (each pillar's own G vars)
 *   accentColor  — pill active border/bg color (unused, reserved)
 *   title        — page title e.g. "🌿 Care"
 *   subtitle     — e.g. "Care & Wellness for Mojo"
 *   tagline      — small text below subtitle
 *   allergies    — array of allergy strings to show as chips
 *   children     — anything extra below (favourite chips etc)
 */
import React from 'react';

function vibe(t = 'light') {
  if (navigator?.vibrate) navigator.vibrate(t === 'medium' ? [12] : [6]);
}

export default function PillarHero({
  pillar = 'care',
  pet = null,
  allPets = [],
  onSwitchPet = () => {},
  gradient = 'linear-gradient(160deg,#0A1F13 0%,#1B4332 55%,#2D6A4F 100%)',
  accentColor = 'rgba(255,255,255,0.9)',
  title = '',
  subtitle = '',
  tagline = '',
  allergies = [],
  children,
}) {
  const petName   = pet?.name    || 'your dog';
  const petPhoto  = pet?.photo_url || pet?.photo || pet?.image || null;
  const petBreed  = pet?.breed   || '';
  const soulScore = Math.round(pet?.overall_score || pet?.soul_score || pet?.soulScore || 0);

  return (
    <div style={{ background: gradient, padding: '40px 20px 20px', position: 'relative', overflow: 'hidden' }}>

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: -60, right: -40, width: 200, height: 200,
        background: 'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Top label */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14,
      }}>
        THE DOGGY COMPANY
      </div>

      {/* Pet avatar + page title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>

        {/* Pet avatar with soul ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Soul ring */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: `conic-gradient(rgba(255,255,255,0.85) ${soulScore * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {petPhoto ? (
                <img
                  src={petPhoto}
                  alt={petName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: 24 }}>🐾</span>
              )}
            </div>
          </div>
          {/* Soul score badge */}
          {soulScore > 0 && (
            <div style={{
              position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.55)', borderRadius: 999, padding: '1px 6px',
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap',
            }}>
              {soulScore}% SOUL
            </div>
          )}
        </div>

        {/* Title + pet breed info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 26, fontWeight: 900, color: '#fff',
            letterSpacing: '-0.3px', lineHeight: 1.1,
          }}>
            {title}
          </div>
          {petBreed && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {petBreed}
            </div>
          )}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
          {subtitle}
        </div>
      )}

      {/* Tagline */}
      {tagline && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 8, lineHeight: 1.5 }}>
          {tagline}
        </div>
      )}

      {/* Allergy chips */}
      {allergies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {allergies.map(a => (
            <div key={a} style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,107,100,0.15)', border: '1px solid rgba(255,107,100,0.35)',
              borderRadius: 999, padding: '4px 10px', fontSize: 12,
              color: '#FFB3B0', fontWeight: 500,
            }}>
              ⚠️ No {a}
            </div>
          ))}
        </div>
      )}

      {/* Extra content slot (favourite chips, etc.) */}
      {children}

      {/* Pet switcher pills — only when multiple pets */}
      {allPets.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
          marginTop: 12, paddingBottom: 2,
          touchAction: 'pan-x', overscrollBehaviorX: 'contain',
        }}>
          {allPets.map(p => (
            <button
              key={p.id}
              onClick={() => { vibe(); onSwitchPet(p); }}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                border: pet?.id === p.id
                  ? '2px solid rgba(255,255,255,0.9)'
                  : '2px solid rgba(255,255,255,0.25)',
                background: pet?.id === p.id
                  ? 'rgba(255,255,255,0.18)'
                  : 'transparent',
                color: '#fff',
              }}
            >
              {/* Mini avatar */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}>
                {(p.photo_url || p.photo) ? (
                  <img
                    src={p.photo_url || p.photo}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{
                    fontSize: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', height: '100%',
                  }}>🐾</span>
                )}
              </div>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
