// ─── SoulRadar.jsx ───────────────────────────────────────────────────────────
// Bible §7.4 — Soul radar must be fully visible above fold for soul score >75%
// Fixes the clipping issue caused by the chat input bar overlapping the radar
//
// Usage: Replace the existing soul radar / visualization in MiraDemoPage.jsx
// with this component. It positions itself as a BACKGROUND element behind content,
// not as a content block — so it never gets clipped by the input bar.

import React, { useMemo } from 'react';

// Bible soul chapter weights (from SYSTEM_OVERVIEW.md)
const SOUL_CHAPTERS = [
  { key: 'identity_score',   label: 'Identity',   weight: 0.20, color: '#C96D9E' },
  { key: 'health_score',     label: 'Health',     weight: 0.20, color: '#40916C' },
  { key: 'behaviour_score',  label: 'Behaviour',  weight: 0.15, color: '#7C3AED' },
  { key: 'nutrition_score',  label: 'Nutrition',  weight: 0.15, color: '#FF8C42' },
  { key: 'social_score',     label: 'Social',     weight: 0.10, color: '#4DBFA8' },
  { key: 'travel_score',     label: 'Travel',     weight: 0.10, color: '#1ABC9C' },
  { key: 'learning_score',   label: 'Learning',   weight: 0.10, color: '#E8A045' },
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildRadarPath(cx, cy, maxR, scores, chapters) {
  const points = chapters.map((ch, i) => {
    const angle = (360 / chapters.length) * i;
    const raw = scores[ch.key] ?? 0;
    // Normalise: soul chapter scores are 0–100, radar radius is 0–maxR
    const r = (raw / 100) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
}

// ─── Background Radar (ambient, behind content) ───────────────────────────────
export function SoulRadarBackground({ pet, size = 320, opacity = 0.18 }) {
  const score = pet?.overall_score || pet?.soul_score || 0;

  // ── ALL hooks must be before any early returns (Rules of Hooks) ─────────────
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.42;

  const scores = useMemo(() => ({
    identity_score: pet?.doggy_soul_answers ? 80 : 0,
    health_score: pet?.doggy_soul_answers?.health_conditions ? 70 : 60,
    behaviour_score: pet?.doggy_soul_answers?.energy_level ? 75 : 50,
    nutrition_score: pet?.doggy_soul_answers?.food_allergies ? 65 : 55,
    social_score: pet?.doggy_soul_answers?.other_pets ? 70 : 50,
    travel_score: pet?.doggy_soul_answers?.travel_comfort ? 60 : 40,
    learning_score: pet?.doggy_soul_answers?.training_level ? 65 : 45,
    ...(pet?.soul_chapter_scores || {}),
  }), [pet]);

  const radarPath = buildRadarPath(cx, cy, maxR, scores, SOUL_CHAPTERS);

  // Don't render if soul score too low — would look empty
  if (score < 30) return null;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, pointerEvents: 'none', display: 'block' }}
      aria-hidden="true"
    >
      {/* Grid rings */}
      {rings.map((r, i) => (
        <circle
          key={i}
          cx={cx} cy={cy}
          r={maxR * r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {SOUL_CHAPTERS.map((ch, i) => {
        const angle = (360 / SOUL_CHAPTERS.length) * i;
        const outer = polarToCartesian(cx, cy, maxR, angle);
        return (
          <line
            key={ch.key}
            x1={cx} y1={cy}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Radar fill */}
      <path
        d={radarPath}
        fill="rgba(139,92,246,0.15)"
        stroke="rgba(139,92,246,0.5)"
        strokeWidth={1.5}
      />

      {/* Chapter dots */}
      {SOUL_CHAPTERS.map((ch, i) => {
        const angle = (360 / SOUL_CHAPTERS.length) * i;
        const raw = scores[ch.key] ?? 0;
        const r = (raw / 100) * maxR;
        const pt = polarToCartesian(cx, cy, r, angle);
        return (
          <circle
            key={ch.key}
            cx={pt.x.toFixed(1)}
            cy={pt.y.toFixed(1)}
            r={3}
            fill={ch.color}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

// ─── Inline Radar (shown in content flow, e.g. hero section) ─────────────────
// Use this when you want the radar IN the content (not just ambient background)
// It includes chapter labels and is fully self-contained

export function SoulRadarInline({ pet, size = 260 }) {
  const score = pet?.overall_score || pet?.soul_score || 0;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;

  const scores = useMemo(() => ({
    identity_score: 80, health_score: 70, behaviour_score: 75,
    nutrition_score: 65, social_score: 70, travel_score: 60, learning_score: 65,
    ...(pet?.soul_chapter_scores || {}),
  }), [pet]);

  const radarPath = buildRadarPath(cx, cy, maxR, scores, SOUL_CHAPTERS);
  const rings = [0.33, 0.66, 1.0];

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
      >
        {rings.map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={maxR * r}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
        ))}
        {SOUL_CHAPTERS.map((ch, i) => {
          const angle = (360 / SOUL_CHAPTERS.length) * i;
          const outer = polarToCartesian(cx, cy, maxR, angle);
          return <line key={ch.key} x1={cx} y1={cy}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />;
        })}
        <path d={radarPath}
          fill="rgba(139,92,246,0.18)"
          stroke="rgba(139,92,246,0.6)"
          strokeWidth={1.5} />
        {SOUL_CHAPTERS.map((ch, i) => {
          const angle = (360 / SOUL_CHAPTERS.length) * i;
          const raw = scores[ch.key] ?? 0;
          const r = (raw / 100) * maxR;
          const pt = polarToCartesian(cx, cy, r, angle);
          const labelPt = polarToCartesian(cx, cy, maxR + 18, angle);
          return (
            <g key={ch.key}>
              <circle cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)} r={3.5}
                fill={ch.color} />
              <text x={labelPt.x.toFixed(1)} y={labelPt.y.toFixed(1)}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} fill="rgba(255,255,255,0.5)"
                fontFamily="'DM Sans', sans-serif">
                {ch.label}
              </text>
            </g>
          );
        })}
        {/* Centre score */}
        <text x={cx} y={cy - 6} textAnchor="middle"
          fontSize={22} fontWeight={700} fill="white"
          fontFamily="'Playfair Display', Georgia, serif">
          {score}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          fontSize={9} fill="rgba(255,255,255,0.5)"
          fontFamily="'DM Sans', sans-serif" letterSpacing={1}>
          SOUL
        </text>
      </svg>
    </div>
  );
}

// ─── Hero layout fix ──────────────────────────────────────────────────────────
// This is the CORRECT way to use the radar in the hero so it doesn't get
// clipped by the chat input bar.
//
// The radar goes in the BACKGROUND layer (position: absolute, z-index: 0)
// Content (chips, reminder card) sits above it (position: relative, z-index: 1)
// The chat input bar is at the bottom with its own z-index
//
// WRONG pattern (causes clipping):
//   <div className="hero">
//     <SoulRadar />          ← IN content flow, gets pushed down, clipped by input
//     <SoulChips />
//     <ReminderCard />
//   </div>
//
// CORRECT pattern:
//   <div className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
//     {/* Background layer */}
//     <div style={{ position: 'absolute', top: '50%', left: '50%',
//                   transform: 'translate(-50%, -50%)', zIndex: 0,
//                   pointerEvents: 'none' }}>
//       <SoulRadarBackground pet={currentPet} size={400} opacity={0.15} />
//     </div>
//     {/* Content layer */}
//     <div style={{ position: 'relative', zIndex: 1 }}>
//       <SoulChips pet={currentPet} onSoulClick={openSoulProfile} />
//       <h1>For {currentPet?.name}</h1>
//       <p>Curated for {currentPet?.name} today</p>
//       <ReminderCard />
//     </div>
//   </div>
//   {/* Input bar — separate from hero, never inside it */}
//   <ChatInputBar />

export default SoulRadarInline;
