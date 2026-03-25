/**
 * DineSoulPage_v10.jsx — Mobile-first, production-integrated rewrite
 * The Doggy Company — /dine
 *
 * Goals:
 * - Cleaner iPhone-first layout
 * - Real pet context
 * - Real product + service wiring
 * - Real cart integration
 * - Real concierge actions
 * - Real Soul Made modal
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Check, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import PillarPageLayout from '../components/PillarPageLayout';
import SoulMadeModal from '../components/SoulMadeModal';
import DineCategoryStrip from '../components/dine/DineCategoryStrip';
import PetFriendlySpots from '../components/dine/PetFriendlySpots';
import { API_URL } from '../utils/api';
import { ProductDetailModal } from '../components/ProductCard';
import DineSoulPageDesktopLegacy from './DineSoulPageDesktopLegacy';

const C = {
  cream: '#FCF7F1',
  brown: '#2B170B',
  taupe: '#7A6458',
  amber: '#D97706',
  orange: '#F97316',
  apricot: '#FFB36A',
  border: '#EFD8C2',
  chipBg: '#FFF3E8',
  chipTxt: '#B56A28',
  card: '#FFFFFF',
  miraAcc: '#C2410C',
  dark: '#1A0A00',
  dark2: '#2D1A00',
  green: '#27AE60',
};

const CTA_GRAD = 'linear-gradient(135deg,#F97316,#D97706)';
const DARK_GRAD = 'linear-gradient(135deg,#1A0A00,#2D1A00)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .dine-page { font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:${C.cream}; color:${C.brown}; min-height:100vh; padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
  .dine-card { background:${C.card}; border:1px solid ${C.border}; border-radius:22px; }
  .dine-cta { display:flex; align-items:center; justify-content:center; width:100%; min-height:48px; padding:13px 20px; border-radius:14px; border:none; background:${CTA_GRAD}; color:#fff; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:transform 0.15s; }
  .dine-cta:active { transform:scale(0.97); }
  .dine-chip { display:inline-flex; align-items:center; padding:7px 16px; border-radius:999px; background:${C.chipBg}; color:${C.chipTxt}; font-size:14px; font-weight:500; white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; min-height:36px; }
  .dine-chip.active { background:${C.amber}; color:#fff; }
  .dine-rail-item { flex-shrink:0; background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:12px 14px; text-align:center; min-width:84px; cursor:pointer; transition:all 0.15s; }
  .dine-rail-item.active { background:${C.amber}; border-color:${C.amber}; }
  .dine-rail-item:active { transform:scale(0.96); }
  .dine-seg { flex:1; padding:12px; text-align:center; font-size:15px; font-weight:600; cursor:pointer; border-radius:11px; transition:all 0.2s; font-family:'DM Sans',sans-serif; border:none; }
  .dine-seg.active { background:${C.card}; color:${C.brown}; box-shadow:0 2px 8px rgba(43,23,11,0.08); }
  .dine-seg.inactive { background:transparent; color:${C.taupe}; }
  .no-scrollbar::-webkit-scrollbar { display:none; }
  .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
  @keyframes dine-sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
`;

const DIMENSIONS = [
  { id: 'meals', icon: '🐟', name: 'Daily Meals', sub: 'Main nourishment', badge: 'Personalised', bg: 'linear-gradient(135deg,#FFF8F0,#FFF0E0)', terms: ['meal', 'wet', 'dry', 'kibble', 'raw', 'fresh', 'food'] },
  { id: 'treats', icon: '🦴', name: 'Treats & Rewards', sub: 'Safe reward picks', badge: 'Allergen-safe', bg: 'linear-gradient(135deg,#FFF3E0,#FFE8D0)', terms: ['treat', 'chew', 'biscuit', 'training'] },
  { id: 'supplements', icon: '💊', name: 'Supplements', sub: 'Health & vitality', badge: 'Vet-checked', bg: 'linear-gradient(135deg,#F0FFF4,#E0F7E9)', terms: ['supplement', 'vitamin', 'probiotic', 'omega', 'joint', 'immunity'] },
  { id: 'frozen', icon: '🧊', name: 'Frozen & Fresh', sub: 'Premium ingredients', badge: 'Fresh only', bg: 'linear-gradient(135deg,#EFF8FF,#E0F0FF)', terms: ['frozen', 'fresh', 'cold', 'ice', 'yogurt'] },
  { id: 'homemade', icon: '🍳', name: 'Homemade', sub: 'Recipes for your dog', badge: 'Free recipes', bg: 'linear-gradient(135deg,#FFFDE7,#FFF9C4)', terms: ['recipe', 'guide', 'pantry', 'homemade'] },
];

const DIM_ID_TO_CATEGORY = {
  meals: 'Daily Meals',
  treats: 'Treats & Rewards',
  supplements: 'Supplements',
  frozen: 'Frozen & Fresh',
  homemade: 'Homemade & Recipes',
};

const getAllergies = (pet) => {
  const soul = pet?.doggy_soul_answers || {};
  const raw = soul.food_allergies || pet?.allergies || [];
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((x) => String(x).trim()).filter(Boolean).filter((x) => !/^(none|no|unknown)$/i.test(x));
};

const getFavouriteTreat = (pet) => pet?.doggy_soul_answers?.favourite_treat?.replace(/_/g, ' ') || null;
const getDietType = (pet) => pet?.doggy_soul_answers?.diet_type?.replace(/_/g, ' ') || null;
const getHealthCondition = (pet) => pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions || null;
const getFavoriteProtein = (pet) => pet?.doggy_soul_answers?.favorite_protein || pet?.doggy_soul_answers?.fav_protein || null;
const getFoodDrive = (pet) => pet?.doggy_soul_answers?.food_motivation || pet?.doggy_soul_answers?.food_drive || null;
const getSensitiveStomach = (pet) => pet?.doggy_soul_answers?.sensitive_stomach || null;
const getGrainFree = (pet) => pet?.doggy_soul_answers?.prefers_grain_free || null;

const buildDineImagineCards = (pet) => {
  const petName = pet?.name || 'your dog';
  const breed = pet?.breed || 'your dog';
  const faveProtein = getFavoriteProtein(pet) || 'Salmon';
  return [
    {
      icon: '🐟',
      title: `${petName}'s Fresh Bowl Plan`,
      desc: `A fresh food rhythm built around ${breed} needs, portioned for energy and digestion.`,
      quote: `“I’d start ${petName} with clean protein and a calmer bowl.”`,
    },
    {
      icon: '🦴',
      title: `${petName}'s Treat Ritual`,
      desc: `Reward picks aligned to ${petName}'s favourite protein and safe enough for frequent use.`,
      quote: `“For ${petName}, I’d keep rewards simple, safe and irresistible.”`,
    },
    {
      icon: '🥣',
      title: `${breed} Tummy Support`,
      desc: `A gentle support set for stomach balance, appetite confidence and smoother meal transitions.`,
      quote: `“I’d protect ${petName}'s tummy first, then build joy around food.”`,
    },
  ];
};
const vibrate = (type = 'light') => {
  if (!navigator.vibrate) return;
  if (type === 'success') navigator.vibrate([8, 40, 10]);
  else if (type === 'medium') navigator.vibrate([12]);
  else navigator.vibrate([6]);
};

const normaliseProductCard = (p, petName) => ({
  id: p.id || p._id,
  name: p.name,
  desc: p.sub_category?.replace(/_/g, ' ') || `For ${petName}`,
  price: `₹${Math.round(p.price || p.pricing?.selling_price || 499)}`,
  imageUrl: p.cloudinary_url || p.image_url || p.mockup_url || p.image,
  tag: p.breed && p.breed !== 'all' ? `For ${p.breed}` : null,
  bg: C.chipBg,
  raw: p,
});

const filterProductsForDim = (products, dimId) => {
  const dim = DIMENSIONS.find((d) => d.id === dimId);
  if (!dim) return products;
  const filtered = products.filter((p) => {
    const hay = `${p.name || ''} ${p.category || ''} ${p.sub_category || ''} ${p.description || ''}`.toLowerCase();
    return dim.terms.some((term) => hay.includes(term));
  });
  return filtered.length > 0 ? filtered : products;
};

function DineLoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🍽️</div>
        <div style={{ fontSize: 16, color: C.taupe }}>Loading your dog&apos;s dining world…</div>
      </div>
    </div>
  );
}

function DineEmptyState({ onAddPet }) {
  return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <div className="dine-card" style={{ padding: '28px 20px' }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🐾</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Add your pet to unlock Dine</div>
        <div style={{ fontSize: 15, color: C.taupe, lineHeight: 1.6, marginBottom: 16 }}>
          Mira will tailor meals, treats, cafés, and restaurants once she knows your dog.
        </div>
        <button className="dine-cta" onClick={onAddPet}>Add your pet →</button>
      </div>
    </div>
  );
}

function DinePetProfileCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || 'mixed breed';
  const score = Math.round(pet?.overall_score || pet?.soul_score || 0);
  const allergies = getAllergies(pet);
  const treat = getFavouriteTreat(pet);
  const diet = getDietType(pet);
  const insight = allergies.length > 0
    ? `${allergies.map((a) => `No ${a}`).join(' · ')}${treat ? ` · Loves ${treat}` : ''}`
    : treat ? `Loves ${treat}${diet ? ` · ${diet} diet` : ''}` : `Mira knows what ${name} loves and what to avoid`;

  return (
    <div onClick={() => { vibrate('light'); onOpen(); }} data-testid="dine-profile-card" className="dine-card" style={{ padding: 16, margin: '0 16px 20px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(43,23,11,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${C.apricot},${C.amber})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {pet?.photo_url ? <img src={pet.photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🐾</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>{name}&apos;s Food Profile</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: C.chipBg, borderRadius: 999, padding: '3px 10px', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.chipTxt }}>{breed}</span>
            </div>
            <div style={{ fontSize: 13, color: C.taupe, lineHeight: 1.4 }}>{insight}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.amber, lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: 11, color: C.taupe, letterSpacing: '0.08em' }}>SOUL</div>
          <div style={{ fontSize: 11, color: C.orange, marginTop: 2 }}>Tap →</div>
        </div>
      </div>
    </div>
  );
}

function DineProfileSheet({ pet, onClose, onConcierge }) {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || 'mixed breed';
  const score = Math.round(pet?.overall_score || pet?.soul_score || 0);
  const allergies = getAllergies(pet);
  const diet = getDietType(pet) || 'Home-cooked';
  const treat = getFavouriteTreat(pet) || 'Soft chews';
  const condition = getHealthCondition(pet) || 'All healthy';
  const faveProtein = getFavoriteProtein(pet) || 'Salmon';
  const foodDrive = getFoodDrive(pet) || 'Very food motivated';
  const stomach = getSensitiveStomach(pet) || 'Sometimes';
  const grainFree = getGrainFree(pet);
  const grainFreeLabel = grainFree === true ? 'Yes' : grainFree === false ? 'No' : (grainFree || 'Yes');
  const loves = [getFavouriteTreat(pet), faveProtein].filter(Boolean).join(' · ') || 'Peanut butter';
  const summary = `Mira knows ${name}'s body and taste. Everything here is filtered for safety, joy, and what they reach for first.`;
  const imagineCards = buildDineImagineCards(pet);
  const cards = [
    { label: 'Allergy', value: allergies.length ? `No ${allergies.join(' / ')}` : 'None noted', color: '#FF8C42' },
    { label: 'Diet', value: diet, color: '#F0C060' },
    { label: 'Fave protein', value: faveProtein, color: '#FFB36A' },
    { label: 'Food drive', value: foodDrive, color: '#F0C060' },
    { label: 'Treat type', value: treat, color: '#FF8C42' },
    { label: 'Loves', value: loves, color: '#FFD680' },
    { label: 'Stomach', value: stomach, color: '#D9B6FF' },
    { label: 'Grain-free', value: grainFreeLabel, color: '#8EE29A' },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 28, animation: 'dine-sheet 0.28s ease', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
        <div style={{ padding: '24px 22px 20px', background: 'linear-gradient(135deg,#1A0A00 0%, #3D0A00 55%, #521224 100%)', position: 'sticky', top: 0, zIndex: 5 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 18, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.72)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,140,66,0.90)', fontSize: 10, marginBottom: 5 }}>
                ✦ GROW {name.toUpperCase()}'S TUMMY PROFILE
              </div>
              <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>
                Answer quick questions · {name}'s food profile is almost there
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, paddingRight: 40 }}>
              <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: score >= 80 ? '#F0C060' : '#FF8C42', textShadow: score >= 80 ? '0 0 20px rgba(240,192,96,0.6)' : '0 0 20px rgba(255,140,66,0.6)' }}>{score}</span>
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 18, marginBottom: 8 }}>%</span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.10)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${score}%`, borderRadius: 999, background: 'linear-gradient(90deg, #FF2D87, #C44DFF)' }} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8C42,#C44DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontStyle: 'italic', lineHeight: 1.55 }}>{summary}</div>
              <div style={{ fontSize: 11, color: '#FFAAD4', marginTop: 4, fontWeight: 600 }}>♥ Mira knows {name}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 18px 24px', background: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.brown, marginBottom: 12 }}>What Mira knows about {name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cards.map((card) => (
              <div key={card.label} style={{ borderRadius: 16, padding: '14px 14px 16px', background: 'linear-gradient(135deg,#1A0620 0%, #2d0a00 100%)', border: '1px solid rgba(180,80,255,0.22)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: card.color, marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 16, lineHeight: 1.35, color: '#fff' }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              width: '100%',
              borderRadius: 14,
              background: '#2D1B69',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              margin: '16px 0',
              minHeight: 72,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: '#7C3AED',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              ✦
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Mira is learning {name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#C4B5FD',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Complete {name}&apos;s Soul Profile to get real scored picks.
              </div>
            </div>
            <button
              onClick={() => { window.location.href = `/pet/${pet?.id || pet?._id}?tab=personality`; }}
              style={{
                background: '#4C1D95',
                border: '1px solid #7C3AED',
                borderRadius: 20,
                padding: '10px 16px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                minHeight: 44,
              }}
            >
              Complete Profile →
            </button>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: C.brown, marginBottom: 12 }}>Mira imagines these for {name}</div>
          <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
            {imagineCards.map((card, index) => (
              <div key={index} style={{ width: 260, minWidth: 260, minHeight: 320, borderRadius: 16, background: '#3D1F0D', padding: 20, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, marginBottom: 16 }}>{card.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: '#C4A882', lineHeight: 1.6, marginBottom: 14 }}>{card.desc}</div>
                <div style={{ fontSize: 13, color: '#C4A882', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '2px solid #D97706', paddingLeft: 10, marginBottom: 16 }}>
                  {card.quote}
                </div>
                <button
                  onClick={() => onConcierge?.({ name: card.title, desc: card.desc })}
                  className="dine-cta"
                  style={{ background: '#6B3A2A', borderRadius: 10, minHeight: 44, marginTop: 'auto' }}
                >
                  Ask Concierge →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DineSegmentedSwitch({ mode, onChange }) {
  return (
    <div style={{ margin: '0 16px 24px', background: C.border, borderRadius: 14, padding: 3, display: 'flex', gap: 3 }}>
      {[
        { id: 'eat', label: '🍲 Eat & Nourish' },
        { id: 'out', label: '🍽️ Dine Out' },
      ].map((tab) => (
        <button key={tab.id} className={`dine-seg${mode === tab.id ? ' active' : ' inactive'}`} onClick={() => { vibrate('light'); onChange(tab.id); }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DineSectionHeading({ title, helper }) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginBottom: 6 }}>{title}</div>
      {helper && <div style={{ fontSize: 16, color: C.taupe, lineHeight: 1.5 }}>{helper}</div>}
    </div>
  );
}

function DineProductCard({ product, onAdd, onView }) {
  const [added, setAdded] = useState(false);
  return (
    <div className="dine-card" style={{ overflow: 'hidden', cursor: 'pointer' }} data-testid={`dine-product-${product.id || product.name}`} onClick={() => onView?.(product)}>
      <div style={{ height: 110, background: product.bg || C.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>{product.icon || '🍖'}</span>}
        {product.tag && <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(43,23,11,0.75)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 700 }}>{product.tag}</div>}
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 12, color: C.taupe, marginBottom: 10, lineHeight: 1.4 }}>{product.desc}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.amber }}>{product.price}</div>
          <button onClick={(e) => { e.stopPropagation(); vibrate('success'); setAdded(true); onAdd?.(product); }} style={{ padding: '7px 14px', borderRadius: 999, border: 'none', background: added ? '#E8F5E9' : CTA_GRAD, color: added ? '#27AE60' : '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36 }}>
            {added ? '✓ Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DineDimensionsRail({ dims, openDim, onSelect, pet, apiProducts, onAdd, onView }) {
  const name = pet?.name || 'your dog';
  const categoryName = openDim ? DIM_ID_TO_CATEGORY[openDim] : null;
  const rawByTab = categoryName ? (apiProducts[categoryName] || {}) : {};
  const allRaw = Object.values(rawByTab).flat().map((p) => normaliseProductCard(p, name));
  const tabList = ['All', ...Object.keys(rawByTab)];
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    setActiveTab('All');
  }, [openDim]);

  const filteredByTab = activeTab === 'All'
    ? allRaw
    : allRaw.filter((p) => p.raw?.sub_category === activeTab || p.raw?.category === activeTab || p.raw?.product_type === activeTab);

  const shownProducts = openDim ? filteredByTab : [];
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {dims.map((dim) => (
          <div key={dim.id} onClick={() => { vibrate('light'); onSelect(dim.id === openDim ? null : dim.id); }} style={{ minWidth: 160, flexShrink: 0, borderRadius: 20, padding: 16, background: dim.bg, cursor: 'pointer', border: openDim === dim.id ? `2px solid ${C.orange}` : '2px solid transparent' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{dim.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{dim.name}</div>
            <div style={{ fontSize: 13, color: C.taupe, lineHeight: 1.4, marginBottom: 10 }}>{dim.sub}</div>
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.07)', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>{dim.badge}</div>
          </div>
        ))}
      </div>

      {openDim && (
        <div style={{ marginTop: 12, background: C.card, border: `1.5px solid ${C.orange}`, borderRadius: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: C.chipBg, borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: C.miraAcc, lineHeight: 1.5 }}>
              I&apos;ve filtered this for {name}&apos;s body and taste.
            </div>
          </div>
          {tabList.length > 1 && (
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
              {tabList.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`dine-chip${activeTab === tab ? ' active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  {tab === 'All' ? tab : tab.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          )}

          {allRaw.length > 0 && (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:14, fontSize:11, color:'#888' }}>
              <span style={{ color: '#27AE60', fontWeight: 700 }}>✓ {shownProducts.length} safe for {name}</span>
              {allRaw.length !== shownProducts.length && (
                <span style={{ color: '#E87722' }}>✗ {allRaw.length - shownProducts.length} filtered</span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {shownProducts.map((p) => (
              <DineProductCard key={p.id} product={p} onAdd={onAdd} onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DineMiraBar({ pet, onOpen }) {
  const allergies = getAllergies(pet);
  const name = pet?.name || 'your dog';
  const text = allergies.length > 0 ? `I've already removed everything containing ${allergies.join(' and ')}. What you see here is safe.` : `I know ${name}'s body as well as I know their soul. Everything here is filtered for them.`;
  return (
    <div style={{ margin: '0 16px 20px', background: C.brown, borderRadius: 20, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.apricot, letterSpacing: '0.1em', marginBottom: 8 }}>✦ MIRA ON {name.toUpperCase()}'S NUTRITION</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 14, fontStyle: 'italic' }}>&quot;{text}&quot;</div>
      <button className="dine-cta" onClick={() => { vibrate('medium'); onOpen(); }}>See Mira&apos;s Picks for {name} →</button>
    </div>
  );
}

function DineMiraPicksSheet({ pet, products = [], services = [], onClose, onConcierge, onAdd, onView }) {
  const name = pet?.name || 'your dog';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '12px 16px calc(24px + env(safe-area-inset-bottom))', animation: 'dine-sheet 0.28s ease' }}>
        <div style={{ width: 48, height: 5, borderRadius: 999, background: C.border, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>Mira&apos;s Picks</div>
            <div style={{ fontSize: 15, color: C.taupe, marginTop: 4 }}>Safe, smart picks for {name}.</div>
          </div>
          <button onClick={onClose} style={{ width: 42, height: 42, borderRadius: '50%', background: C.chipBg, border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {services.slice(0, 2).map((svc, i) => (
            <div key={i} style={{ borderRadius: 20, background: DARK_GRAD, padding: '18px 16px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', color: C.apricot, marginBottom: 8 }}>MIRA SERVICE PICK</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{svc.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>{svc.desc}</div>
              <button className="dine-cta" onClick={() => onConcierge?.(svc)}>Reserve via Concierge®</button>
            </div>
          ))}
          {products.slice(0, 3).map((p) => (
            <DineProductCard key={p.id} product={p} onAdd={onAdd} onView={onView} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DineSoulMadeInlineCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div className="dine-card" onClick={() => { vibrate('medium'); onOpen?.(); }} style={{ position: 'relative', overflow: 'hidden', padding: '20px 18px', background: 'linear-gradient(135deg,#1A0A00,#381207)', color: '#fff', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,106,0.18) 0%, transparent 70%)' }} />
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: C.apricot, fontWeight: 700, marginBottom: 10 }}>✦ SOUL MADE™ · MADE ONLY FOR {name.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>{name}&apos;s face. On bowls, aprons, placemats and more.</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, marginBottom: 14 }}>One-of-one dining pieces, designed around your dog.</div>
        <button className="dine-cta" style={{ background: 'linear-gradient(135deg,#FF8C42,#C44400)' }}>Make something only {name} has →</button>
      </div>
    </div>
  );
}

function DineConciergeCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ margin: '0 16px 24px', background: C.brown, borderRadius: 24, padding: 20 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(201,151,58,0.2)', border: '1px solid rgba(201,151,58,0.4)', borderRadius: 999, padding: '5px 14px', color: '#F0C060', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>👑 Dining Concierge®</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Want us to plan the whole outing for {name}?</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>We find the right venue, check food safety, make the reservation, and have a safe meal waiting.</div>
      <button onClick={() => { vibrate('medium'); onOpen?.(); }} style={{ width: '100%', minHeight: 48, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#C9973A,#F0C060)', color: C.brown, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>👑 Talk to your Concierge</button>
    </div>
  );
}

function DineIntakeSheet({ pet, onClose, onSend }) {
  const [occasion, setOccasion] = useState('Restaurant Discovery');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const name = pet?.name || 'your dog';
  const OCCASIONS = ['Restaurant Discovery', 'Reservation Assistance', 'Dining Etiquette', 'Venue Suitability', 'Special Diet Planning', 'Pet-Friendly Café Hunt'];

  const handleSend = async () => {
    setSending(true);
    await onSend?.(occasion, notes);
    setSending(false);
    setSent(true);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '88vh', overflowY: 'auto', background: C.card, borderRadius: '24px 24px 0 0', padding: '12px 20px calc(32px + env(safe-area-inset-bottom))', animation: 'dine-sheet 0.3s ease' }}>
        <div style={{ width: 48, height: 5, borderRadius: 999, background: C.border, margin: '0 auto 20px' }} />
        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👑</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Sent to {name}&apos;s Concierge.</div>
            <div style={{ fontSize: 15, color: C.taupe, lineHeight: 1.7, marginBottom: 24 }}>We’ll reach out within 48 hours.</div>
            <button className="dine-cta" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Dining Concierge®</div>
                <div style={{ fontSize: 15, color: C.taupe }}>Tell us what you need for {name}</div>
              </div>
              <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: C.chipBg, border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>What do you need?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {OCCASIONS.map((occ) => <button key={occ} onClick={() => setOccasion(occ)} className={`dine-chip${occasion === occ ? ' active' : ''}`}>{occ}</button>)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Any details?</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Outdoor seating near Indiranagar, non-chicken options, evening reservation..." style={{ width: '100%', minHeight: 88, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', fontSize: 15, color: C.brown, background: C.cream, lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: 20, fontFamily: 'inherit' }} />
            <button className="dine-cta" onClick={handleSend} disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending…' : `Send to Concierge® for ${name} →`}</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DineSoulPage() {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const { token } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar: 'dine', pet: currentPet });
  const { request, book } = useConcierge({ pet: currentPet, pillar: 'dine' });

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('eat');
  const [openDim, setOpenDim] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [miraOpen, setMiraOpen] = useState(false);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [apiProducts, setApiProducts] = useState({});
  const [miraProducts, setMiraProducts] = useState([]);
  const [miraServices, setMiraServices] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    const FOOD_CATS = ['Daily Meals', 'Treats & Rewards', 'Supplements', 'Frozen & Fresh', 'Homemade & Recipes'];

    Promise.all(
      FOOD_CATS.map((cat) =>
        fetch(`${API_URL}/api/admin/pillar-products?pillar=dine&limit=100&category=${encodeURIComponent(cat)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )
      .then((results) => {
        const grouped = {};
        results.forEach((data) => {
          if (!data?.products?.length) return;
          data.products.forEach((p) => {
            const cat = p.category || '';
            const sub = p.sub_category || '';
            if (!grouped[cat]) grouped[cat] = {};
            if (!grouped[cat][sub]) grouped[cat][sub] = [];
            grouped[cat][sub].push(p);
          });
        });

        setApiProducts(grouped);

        const flat = Object.values(grouped)
          .flatMap((subMap) => Object.values(subMap).flat())
          .map((p) => normaliseProductCard(p, currentPet.name));
        setProducts(flat);
      })
      .catch(() => {
        setApiProducts({});
        setProducts([]);
      });
  }, [token, currentPet]);

  useEffect(() => {
    if (!token || !currentPet?.id) return;
    fetch(`${API_URL}/api/mira/claude-picks/${currentPet.id}?pillar=dine&limit=6&min_score=60&entity_type=product`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setMiraProducts((d?.picks || []).map((p) => ({
          id: p.id || p._id,
          name: p.name,
          desc: p.mira_reason || p.description || 'Chosen for your dog',
          price: p.price ? `₹${p.price}` : 'Price on request',
          imageUrl: p.image_url || p.image || p.cloudinary_url,
          raw: p,
        })));
      })
      .catch(() => {});

    fetch(`${API_URL}/api/mira/claude-picks/${currentPet.id}?pillar=dine&limit=3&min_score=60&entity_type=service`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setMiraServices((d?.picks || []).map((s) => ({
          id: s.id || s._id,
          name: s.name,
          desc: s.mira_reason || s.description || 'Concierge dining help',
          raw: s,
        })));
      })
      .catch(() => {});
  }, [token, currentPet]);

  const handleAddToCart = useCallback((product) => {
    if (!product?.raw) return;
    addToCart({
      id: product.raw.id || product.id,
      name: product.raw.name || product.name,
      price: Number(product.raw.price || product.raw.pricing?.selling_price || 0),
      image: product.raw.cloudinary_url || product.raw.image_url || product.raw.mockup_url || product.imageUrl,
      category: product.raw.category || 'dine',
      pillar: 'dine',
    }, null, null, 1);
  }, [addToCart]);

  const handleConcierge = useCallback(async (item) => {
    if (!item) return;
    await book(item.raw || { name: item.name, price: item.raw?.price || 0 }, {
      channel: 'dine_mira_sheet'
    });
  }, [book]);

  const handleConciergeRequest = useCallback(async (occasion, notes) => {
    await request(`Dining concierge request for ${currentPet?.name || 'your dog'}: ${occasion}${notes ? `. Notes: ${notes}` : ''}`, {
      channel: 'dine_intake',
      metadata: { occasion, notes }
    });
  }, [request, currentPet]);

  const handleImagineConcierge = useCallback(async (card) => {
    const name = currentPet?.name || 'your dog';
    await request(`Dine Mira imagine request for ${name}: ${card?.name || 'Personalised dining idea'}${card?.desc ? `. ${card.desc}` : ''}`, {
      channel: 'dine_imagines',
      metadata: { card_title: card?.name, card_desc: card?.desc }
    });
    setToast(`Sent to Concierge for ${name}`);
    setTimeout(() => setToast(null), 2200);
  }, [request, currentPet]);

  if (isDesktop) {
    return <DineSoulPageDesktopLegacy />;
  }

  if (loading) {
    return (
      <PillarPageLayout pillar="dine" hideHero hideNavigation>
        <DineLoadingState />
      </PillarPageLayout>
    );
  }

  if (!currentPet) {
    return (
      <PillarPageLayout pillar="dine" hideHero hideNavigation>
        <style>{CSS}</style>
        <div className="dine-page">
          <DineEmptyState onAddPet={() => navigate('/join')} />
        </div>
      </PillarPageLayout>
    );
  }

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="dine" hideHero hideNavigation>
      <div className="dine-page" data-testid="dine-mobile-v10">
        <style>{CSS}</style>

        {profileOpen && <DineProfileSheet pet={currentPet} onClose={() => setProfileOpen(false)} onConcierge={handleImagineConcierge} />}
        {miraOpen && <DineMiraPicksSheet pet={currentPet} products={miraProducts} services={miraServices} onClose={() => setMiraOpen(false)} onConcierge={handleConcierge} onAdd={handleAddToCart} onView={setSelectedProduct} />}
        {intakeOpen && <DineIntakeSheet pet={currentPet} onClose={() => setIntakeOpen(false)} onSend={handleConciergeRequest} />}
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="dine" pillarColor="#D97706" pillarLabel="Dining" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct.raw || selectedProduct} pillar="dine" selectedPet={currentPet} onClose={() => setSelectedProduct(null)} />}

        {toast && (
          <div style={{ position:'fixed', left:'50%', bottom:'calc(92px + env(safe-area-inset-bottom))', transform:'translateX(-50%)', zIndex:9000, background:'#1A0A00', color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:13, fontWeight:600, boxShadow:'0 12px 28px rgba(0,0,0,0.24)' }}>
            {toast}
          </div>
        )}

        <div style={{ background: 'linear-gradient(160deg,#3d1200 0%,#7a2800 50%,#c44400 100%)', padding: '20px 16px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(255,140,66,0.2) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🍽️ Dine</div>
            </div>
            {contextPets?.length > 1 && (
              <select
                value={currentPet?.id}
                onChange={(e) => { vibrate('light'); setCurrentPet(contextPets.find((p) => p.id === e.target.value)); }}
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '7px 14px', color: '#fff', fontSize: 13 }}
              >
                {contextPets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentPet?.photo_url ? <img src={currentPet.photo_url} alt={petName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🐾</span>}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Food & Nourishment</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>for {petName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {getAllergies(currentPet).map((a) => (
              <div key={a} style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,107,100,0.15)', border: '1px solid rgba(255,107,100,0.3)', borderRadius: 999, padding: '5px 12px', fontSize: 13, color: '#FFB3B0', fontWeight: 500 }}>⚠️ No {a}</div>
            ))}
            {getFavouriteTreat(currentPet) && (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,208,128,0.12)', border: '1px solid rgba(255,208,128,0.3)', borderRadius: 999, padding: '5px 12px', fontSize: 13, color: '#FFD080', fontWeight: 500 }}>💚 Loves {getFavouriteTreat(currentPet)}</div>
            )}
          </div>
        </div>

        <DinePetProfileCard pet={currentPet} onOpen={() => setProfileOpen(true)} />
        <DineCategoryStrip pet={currentPet} />
        <DineSegmentedSwitch mode={mode} onChange={setMode} />

        {mode === 'eat' && (
          <>
            <DineSectionHeading title={`How would ${petName} love to eat?`} helper="Food, treats, and recipes filtered to their body and taste." />
            <DineDimensionsRail dims={DIMENSIONS} openDim={openDim} onSelect={setOpenDim} pet={currentPet} apiProducts={apiProducts} onAdd={handleAddToCart} onView={setSelectedProduct} />
            <DineMiraBar pet={currentPet} onOpen={() => setMiraOpen(true)} />
            {products.length > 0 && (
              <div style={{ padding: '0 16px 24px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Products for {petName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {products.slice(0, 6).map((p) => (
                    <DineProductCard key={p.id} product={p} onAdd={handleAddToCart} onView={setSelectedProduct} />
                  ))}
                </div>
              </div>
            )}
            <DineSoulMadeInlineCard pet={currentPet} onOpen={() => setSoulMadeOpen(true)} />
          </>
        )}

        {mode === 'out' && (
          <>
            <DineSectionHeading title={`Where would ${petName} love to eat?`} helper="Pet-friendly restaurants and cafés near you." />
            <div style={{ padding: '0 16px 24px' }}>
              <PetFriendlySpots pet={currentPet} onReserve={(venueName) => { request(`Reserve venue for ${petName}: ${venueName}`, { channel: 'dine_nearme' }); setIntakeOpen(true); }} />
            </div>
          </>
        )}

        <DineConciergeCard pet={currentPet} onOpen={() => setIntakeOpen(true)} />
      </div>
    </PillarPageLayout>
  );
}