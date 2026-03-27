/**
 * TDC PILLAR HERO GRADIENTS — MASTER REFERENCE
 * ─────────────────────────────────────────────
 * Never deviate from these.
 * Every pillar is dark at the top, lighter at the bottom.
 * Never bright. Never flat. Never the same as another pillar.
 *
 * Usage in any mobile page:
 *
 *   import { PILLAR_HEROES } from '../constants/pillarHeroes';
 *
 *   <div style={{
 *     background: PILLAR_HEROES['go'].gradient,
 *     padding: '20px 16px 24px',
 *     position: 'relative',
 *     overflow: 'hidden'
 *   }}>
 */

export const PILLAR_HEROES = {

  care: {
    // Soft sage green — nurturing, gentle
    gradient: 'linear-gradient(160deg,#0A1F14 0%,#1A3D2B 55%,#2D6A4F 100%)',
    accent: '#52B788',
    label: 'Care',
  },

  dine: {
    // Deep cocoa/amber — warm, appetising
    gradient: 'linear-gradient(160deg,#1A0A00 0%,#3D1200 55%,#7A2800 100%)',
    accent: '#D97706',
    label: 'Dine',
  },

  celebrate: {
    // Deep purple — festive, magical
    gradient: 'linear-gradient(160deg,#1A0A2E 0%,#2D1060 55%,#4A1B8C 100%)',
    accent: '#9B59B6',
    label: 'Celebrate',
  },

  go: {
    // Dark deep teal — adventure, travel
    gradient: 'linear-gradient(160deg,#03211A 0%,#06503F 55%,#0E8A70 100%)',
    accent: '#1ABC9C',
    label: 'Go',
  },

  play: {
    // Deep orange/coral — energetic, fun
    gradient: 'linear-gradient(160deg,#1A0800 0%,#7A2600 55%,#C84B00 100%)',
    accent: '#FF6B35',
    label: 'Play',
  },

  learn: {
    // Deep navy blue — intelligent, calm
    gradient: 'linear-gradient(160deg,#050A1A 0%,#0D1F4A 55%,#1A3A7A 100%)',
    accent: '#3B82F6',
    label: 'Learn',
  },

  paperwork: {
    // Deep slate — professional, serious
    gradient: 'linear-gradient(160deg,#0A0F1A 0%,#1A2340 55%,#2D3A5C 100%)',
    accent: '#64748B',
    label: 'Paperwork',
  },

  emergency: {
    // Deep crimson — urgent, critical
    gradient: 'linear-gradient(160deg,#1A0000 0%,#4A0000 55%,#8B0000 100%)',
    accent: '#EF4444',
    label: 'Emergency',
  },

  farewell: {
    // Deep indigo/violet — gentle, memorial
    gradient: 'linear-gradient(160deg,#0A0A1A 0%,#1A1040 55%,#2D1F6A 100%)',
    accent: '#7C3AED',
    label: 'Farewell',
  },

  adopt: {
    // Deep warm rose — hopeful, loving
    gradient: 'linear-gradient(160deg,#1A0A0F 0%,#4A1020 55%,#8B1A35 100%)',
    accent: '#EC4899',
    label: 'Adopt',
  },

  shop: {
    // Deep charcoal gold — premium, editorial
    gradient: 'linear-gradient(160deg,#0F0F0F 0%,#1A1500 55%,#3D3000 100%)',
    accent: '#C9973A',
    label: 'Shop',
  },

};

/**
 * Standard hero div style — copy-paste ready
 *
 * <div style={pillarHeroStyle('go')}>
 */
export const pillarHeroStyle = (pillar) => ({
  background: PILLAR_HEROES[pillar]?.gradient || PILLAR_HEROES.care.gradient,
  padding: '20px 16px 24px',
  position: 'relative',
  overflow: 'hidden',
});
