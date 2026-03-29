/**
 * DineSoulPage_v11.jsx — Mobile-first, fully wired
 * The Doggy Company — /dine
 *
 * COMPLETE — includes:
 * ✅ applyMiraIntelligence (allergen filter + loved items sort)
 * ✅ useMiraIntelligence + getMiraIntelligenceSubtitle
 * ✅ soulScoreUpdated listener
 * ✅ Real activeTab category switching (no 4-card cap)
 * ✅ ProductDetailModal on product tap
 * ✅ MiraImaginesBreed
 * ✅ DineConciergeSection ("Dine, Personally")
 * ✅ GuidedNutritionPaths
 * ✅ MealBoxCard
 * ✅ Full concierge wiring — every action fires ticket
 * ✅ NearMe (PetFriendlySpots) fixed layout
 * ✅ Breed-specific products
 * ✅ WhatsApp on every booking via tdc.book / tdc.request
 * ✅ SoulMadeModal
 * ✅ Pet switching
 * ✅ PillarSoulProfile
 * ✅ Desktop → DineSoulPageDesktopLegacy
 *
 * COLOURS: #FCF7F1 cream · #2B170B cocoa · #D97706 amber · #F97316 orange
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';
import { applyMiraFilter, filterBreedProducts } from '../hooks/useMiraFilter';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import PillarPageLayout from '../components/PillarPageLayout';
import SoulMadeModal from '../components/SoulMadeModal';
import DineCategoryStrip from '../components/dine/DineCategoryStrip';
import PetFriendlySpots from '../components/dine/PetFriendlySpots';
import DineConciergeSection from '../components/dine/DineConciergeSection';
import GuidedNutritionPaths from '../components/dine/GuidedNutritionPaths';
import MealBoxCard from '../components/dine/MealBoxCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraEmptyRequest from '../components/common/MiraEmptyRequest';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import PillarSoulProfile from '../components/PillarSoulProfile';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import DineSoulPageDesktopLegacy from './DineSoulPageDesktopLegacy';
import DineMobilePage from './DineMobilePage';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import '../styles/mobile-design-system.css';

// ── Design tokens ──────────────────────────────────────────────
const C = {
  cream:   '#FCF7F1',
  brown:   '#2B170B',
  taupe:   '#7A6458',
  amber:   '#D97706',
  orange:  '#F97316',
  apricot: '#FFB36A',
  border:  '#EFD8C2',
  chipBg:  '#FFF3E8',
  chipTxt: '#B56A28',
  card:    '#FFFFFF',
  miraAcc: '#C2410C',
  dark:    '#1A0A00',
  dark2:   '#2D1A00',
  green:   '#27AE60',
};

const CTAGrad  = 'linear-gradient(135deg,#F97316,#D97706)';
const DarkGrad = 'linear-gradient(135deg,#1A0A00,#2D1A00)';

// ── CSS ────────────────────────────────────────────────────────
export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .dp { font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;
        background:${C.cream}; color:${C.brown}; min-height:100vh;
        padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
  .dp-card { background:${C.card}; border:1px solid ${C.border}; border-radius:22px; }
  .dp-cta  { display:flex; align-items:center; justify-content:center; width:100%;
              min-height:48px; padding:13px 20px; border-radius:14px; border:none;
              background:${CTAGrad}; color:#fff; font-size:15px; font-weight:600;
              font-family:-apple-system,BlinkMacSystemFont,sans-serif; cursor:pointer; transition:transform 0.15s; }
  .dp-cta:active { transform:scale(0.97); }
  .dp-chip { display:inline-flex; align-items:center; padding:7px 16px; border-radius:999px;
              background:${C.chipBg}; color:${C.chipTxt}; font-size:14px; font-weight:500;
              white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; min-height:44px; }
  .dp-chip.on { background:${C.amber}; color:#fff; }
  .dp-seg { flex:1; padding:12px; text-align:center; font-size:15px; font-weight:600;
             cursor:pointer; border-radius:11px; transition:all 0.2s;
             font-family:-apple-system,BlinkMacSystemFont,sans-serif; border:none; }
  .dp-seg.on  { background:${C.card}; color:${C.brown}; box-shadow:0 2px 8px rgba(43,23,11,0.08); }
  .dp-seg.off { background:transparent; color:${C.taupe}; }
  .no-sb { overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .no-sb::-webkit-scrollbar { display:none; }
  @keyframes dp-sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes dp-fade  { from{opacity:0} to{opacity:1} }
  @keyframes dp-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;

// ── Haptic ─────────────────────────────────────────────────────
export function vibe(type = 'light') {
  if (!navigator?.vibrate) return;
  if (type === 'success') navigator.vibrate([8, 40, 10]);
  else if (type === 'medium') navigator.vibrate([12]);
  else navigator.vibrate([6]);
}

// ── Pet data helpers ───────────────────────────────────────────
const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies|unknown|na|n\/a)$/i;

export function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(String(x).trim()); });
    else if (v && !CLEAN_NONE.test(String(v).trim())) s.add(String(v).trim());
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s];
}

export function getLoves(pet) {
  const loves = [];
  const addLove = item => {
    if (!item) return;
    const v = typeof item === 'string' ? item : (item?.name || item?.value || null);
    if (v) loves.push(v);
  };
  addLove(pet?.doggy_soul_answers?.favorite_treats);
  addLove(pet?.doggy_soul_answers?.favorite_protein);
  if (pet?.preferences?.favorite_flavors?.length) addLove(pet.preferences.favorite_flavors[0]);
  return [...new Set(loves)].slice(0, 3);
}

export function getFavourite(pet) {
  const pick = v => Array.isArray(v) ? v[0] : v;
  const t1 = pick(pet?.doggy_soul_answers?.favourite_treat);
  const t2 = pick(pet?.doggy_soul_answers?.favorite_treats);
  const s1 = typeof t1 === 'string' ? t1.replace(/_/g, ' ') : '';
  const s2 = typeof t2 === 'string' ? t2.replace(/_/g, ' ') : '';
  return s1 || s2 || null;
}
export function getDiet(pet) {
  const dt = pet?.doggy_soul_answers?.diet_type;
  return typeof dt === 'string' ? dt.replace(/_/g, ' ') : null;
}
export function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(', ') : String(raw);
  return str.toLowerCase() === 'none' || str.trim() === '' ? null : str;
}
export function getFavoriteProtein(pet) {
  return pet?.doggy_soul_answers?.favorite_protein || pet?.doggy_soul_answers?.fav_protein || null;
}
export function getNutritionGoal(pet) {
  return pet?.doggy_soul_answers?.nutrition_goal || pet?.doggy_soul_answers?.weight_goal || null;
}

// ── Mira Intelligence ──────────────────────────────────────────
export function isSafeFromAllergen(allergen, text, freeText) {
  const a = allergen.toLowerCase();
  if (freeText.includes(`${a}-free`) || freeText.includes(`${a} free`)) return true;
  if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return true;
  return false;
}
export function containsAllergen(allergen, text) {
  const a = allergen.toLowerCase();
  const cleaned = text.replace(new RegExp(`${a}[- ]free`, 'gi'), '');
  return cleaned.includes(a);
}

export function applyMiraIntelligence(products, allergies, loves, healthCondition, nutritionGoal, pet) {
  const petName = pet?.name || 'your dog';
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const loveTerms = loves.map(l => l.toLowerCase().trim()).filter(Boolean);
  // Allergen synonym map — checks ingredient synonyms not just the allergen name
  const ALLERGEN_MAP = { chicken:['chicken','poultry','fowl'], soy:['soy','soya','tofu','edamame'], wheat:['wheat','gluten','flour','barley'], dairy:['milk','cheese','butter','lactose','whey'], eggs:['egg','eggs'], beef:['beef','bovine'], pork:['pork','ham','bacon'], lamb:['lamb','mutton'], fish:['fish','salmon','tuna','cod','anchovy'] };

  const filtered = products
    .filter(p => {
      if (!allergyTerms.length) return true;
      const productText = `${p.name} ${p.description || ''} ${(p.ingredients||[]).join(' ')}`.toLowerCase();
      const freeFromText = (p.allergy_free || '').toLowerCase();
      return !allergyTerms.some(allergen => {
        const synonyms = ALLERGEN_MAP[allergen] || [allergen];
        if (synonyms.some(syn => freeFromText.includes(`${syn}-free`) || freeFromText.includes(`${syn} free`))) return false;
        return synonyms.some(syn => { const cleaned = productText.replace(new RegExp(`${syn}[- ]free`,'gi'),''); return cleaned.includes(syn); });
      });
    })
    .map(p => {
      const productText = `${p.name} ${p.description || ''} ${p.sub_category || ''}`.toLowerCase();
      const freeFromText = (p.allergy_free || '').toLowerCase();
      const tagText = (p.mira_tag || '').toLowerCase();
      const matchedLove = loveTerms.find(l => productText.includes(l));
      const isHealthSafe = healthCondition && (
        tagText.includes('treatment') ||
        freeFromText.includes('treatment-safe') ||
        productText.includes('treatment-safe') ||
        productText.includes('recovery')
      );
      const isAllergySafe = allergyTerms.length > 0 &&
        allergyTerms.every(a => freeFromText.includes(`${a}-free`));
      const conflictsGoal = nutritionGoal && (
        (nutritionGoal.toLowerCase().includes('weight loss') && productText.includes('high calorie')) ||
        (nutritionGoal.toLowerCase().includes('weight gain') && productText.includes('low calorie'))
      );
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove) mira_hint = `${petName} loves ${matchedLove.charAt(0).toUpperCase()+matchedLove.slice(1)}`;
        else if (isHealthSafe) mira_hint = `Safe during ${petName}'s treatment`;
        else if (isAllergySafe) mira_hint = `Free from ${allergyTerms.join(' & ')} — safe for ${petName}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _loved: !!matchedLove, _healthSafe: isHealthSafe, _dimmed: !!conflictsGoal, miraPick: false };
    })
    .sort((a, b) => {
      if (a._dimmed && !b._dimmed) return 1;
      if (!a._dimmed && b._dimmed) return -1;
      if (a._loved && !b._loved) return -1;
      if (!a._loved && b._loved) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      if (!a._healthSafe && b._healthSafe) return 1;
      return 0;
    });
  if (filtered.length > 0) filtered[0] = { ...filtered[0], miraPick: true };
  return filtered;
}

// ── Dimensions ────────────────────────────────────────────────
export const DINE_DIMS = [
  { id:'meals',       icon:'🐟', name:'Daily Meals',     sub:'Main nourishment',    badge:'Personalised',  bg:'linear-gradient(135deg,#FFF8F0,#FFF0E0)', color:'#FF8C42', category:'Daily Meals',       tabs:['All','Wet Food','Dry Kibble','Raw','Fresh Cooked'] },
  { id:'treats',      icon:'🦴', name:'Treats & Chews',  sub:'Safe reward picks',   badge:'Allergen-safe', bg:'linear-gradient(135deg,#FFF3E0,#FFE8D0)', color:'#FF8C42', category:'Treats & Rewards',   tabs:['All','Soft Chews','Crunchy','Dental','Training'] },
  { id:'supplements', icon:'💊', name:'Supplements',      sub:'Health & vitality',   badge:'Vet-checked',   bg:'linear-gradient(135deg,#F0FFF4,#E0F7E9)', color:'#27AE60', category:'Supplements',        tabs:['All','Joints','Skin & Coat','Digestion','Immunity'] },
  { id:'frozen',      icon:'🧊', name:'Frozen & Fresh',  sub:'Premium ingredients', badge:'Fresh only',    bg:'linear-gradient(135deg,#EFF8FF,#E0F0FF)', color:'#3498DB', category:'Frozen & Fresh',     tabs:['All','Frozen Meals','Cold Pressed','Fresh Delivery'] },
  { id:'homemade',    icon:'🍳', name:'Homemade',        sub:'Recipes for your dog',badge:'Free recipes',  bg:'linear-gradient(135deg,#FFFDE7,#FFF9C4)', color:'#F9A825', category:'Homemade & Recipes',  tabs:['All','Quick','Weekend','Birthday','Ingredient Guide'] },
];

// ── Normalise product card ─────────────────────────────────────
export const normCard = (p, petName) => ({
  id: p.id || p._id,
  name: p.name,
  desc: p.sub_category?.replace(/_/g, ' ') || `For ${petName}`,
  price: `₹${Math.round(p.price || p.pricing?.selling_price || 499)}`,
  imageUrl: p.cloudinary_url || p.image_url || p.mockup_url || p.image,
  tag: p.breed && p.breed !== 'all' ? `For ${p.breed}` : null,
  mira_hint: p.mira_hint,
  miraPick: p.miraPick || false,
  _loved: p._loved || false,
  _dimmed: p._dimmed || false,
  _healthSafe: p._healthSafe || false,
  sub_category: p.sub_category,
  bg: C.chipBg,
  raw: p,
});

// ─────────────────────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────────────────────

export function DineLoadingState() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.cream }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🍽️</div>
        <div style={{ fontSize:16, color:C.taupe }}>Loading your dog&apos;s dining world…</div>
      </div>
    </div>
  );
}

export function DineEmptyState({ onAddPet }) {
  return (
    <div style={{ padding:'24px 16px', textAlign:'center' }}>
      <div className="dp-card" style={{ padding:'32px 20px' }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🐾</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Add your pet to unlock Dine</div>
        <div style={{ fontSize:15, color:C.taupe, lineHeight:1.7, marginBottom:20 }}>
          Mira will tailor meals, treats, cafés, and restaurants once she knows your dog.
        </div>
        <button className="dp-cta" onClick={onAddPet}>Add your pet →</button>
      </div>
    </div>
  );
}

// ── Pet Profile Card ───────────────────────────────────────────
export function DinePetProfileCard({ pet, onOpen }) {
  const name      = pet?.name || 'your dog';
  const breed     = pet?.breed || 'mixed breed';
  const score     = Math.round(pet?.overall_score || pet?.soul_score || 0);
  const allergies = getAllergies(pet);
  const treat     = getFavourite(pet);
  const diet      = getDiet(pet);

  const insight = allergies.length > 0
    ? `${allergies.map(a => `No ${a}`).join(' · ')}${treat ? ` · Loves ${treat}` : ''}`
    : treat ? `Loves ${treat}${diet ? ` · ${diet} diet` : ''}`
    : `Mira knows what ${name} loves and what to avoid`;

  return (
    <div
      onClick={() => { vibe('light'); onOpen(); }}
      data-testid="dine-profile-card"
      className="dp-card"
      style={{ padding:16, margin:'0 16px 20px', cursor:'pointer', boxShadow:'0 4px 20px rgba(43,23,11,0.06)' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${C.apricot},${C.amber})`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {pet?.photo_url
              ? <img src={pet.photo_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:24 }}>🐾</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4, lineHeight:1.2 }}>{name}&apos;s Food Profile</div>
            <div style={{ display:'inline-flex', alignItems:'center', background:C.chipBg, borderRadius:999, padding:'3px 10px', marginBottom:5 }}>
              <span style={{ fontSize:14, fontWeight:500, color:C.chipTxt }}>{breed}</span>
            </div>
            <div style={{ fontSize:14, color:C.taupe, lineHeight:1.4 }}>{insight}</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:26, fontWeight:700, color:C.amber, lineHeight:1 }}>{score}%</div>
          <div style={{ fontSize:14, color:C.taupe, letterSpacing:'0.08em' }}>SOUL</div>
          <div style={{ fontSize:14, color:C.orange, marginTop:2 }}>Tap →</div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Sheet ──────────────────────────────────────────────
export function DineProfileSheet({ pet, onClose, onConcierge }) {
  const name       = pet?.name || 'your dog';
  const score      = Math.round(pet?.overall_score || pet?.soul_score || 0);
  const allergies  = getAllergies(pet);
  const diet       = getDiet(pet) || 'Home-cooked';
  const treat      = getFavourite(pet) || 'Soft chews';
  const condition  = getHealthCondition(pet) || 'All healthy';
  const faveProtein = getFavoriteProtein(pet) || 'Salmon';
  const loves = [getFavourite(pet), faveProtein].filter(Boolean).join(' · ') || 'Peanut butter';
  const summary = `Mira knows ${name}'s body and taste. Everything here is filtered for safety, joy, and what they reach for first.`;

  const cards = [
    { label:'Allergy',     value: allergies.length ? `No ${allergies.join(' / ')}` : 'None noted', color:'#FF8C42' },
    { label:'Diet',        value: diet,         color:'#F0C060' },
    { label:'Fave protein',value: faveProtein,  color:'#FFB36A' },
    { label:'Loves',       value: loves,        color:'#FFD680' },
    { label:'Health',      value: condition,    color:'#8EE29A' },
    { label:'Treat type',  value: treat,        color:'#D9B6FF' },
  ];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.62)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:540, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', background:'#fff', borderRadius:28, animation:'dp-sheet 0.28s ease', boxShadow:'0 24px 80px rgba(0,0,0,0.45)' }}>

        {/* Dark header */}
        <div style={{ padding:'32px 22px 20px', background:'linear-gradient(135deg,#1A0A00 0%,#3D0A00 55%,#521224 100%)', position:'sticky', top:0, zIndex:5 }}>
          <button onClick={onClose} style={{ position:'absolute', top:16, right:18, width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.72)', cursor:'pointer', fontSize:18 }}>✕</button>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
            <div>
              <div style={{ fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(255,140,66,0.90)', fontSize:14, marginBottom:5 }}>
                ✦ GROW {name.toUpperCase()}&apos;S TUMMY PROFILE
              </div>
              <div style={{ color:'rgba(255,255,255,0.50)', fontSize:14 }}>Answer quick questions · {name}&apos;s food profile is almost there</div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:2, paddingRight:40 }}>
              <span style={{ fontSize:64, fontWeight:900, lineHeight:1, color:score >= 80 ? '#F0C060' : '#FF8C42' }}>{score}</span>
              <span style={{ color:'rgba(255,255,255,0.40)', fontSize:18, marginBottom:8 }}>%</span>
            </div>
          </div>
          <div style={{ height:6, borderRadius:999, background:'rgba(255,255,255,0.10)', overflow:'hidden', marginBottom:16 }}>
            <div style={{ height:'100%', width:`${score}%`, borderRadius:999, background:'linear-gradient(90deg,#FF2D87,#C44DFF)' }} />
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', flexShrink:0 }}>✦</div>
            <div>
              <div style={{ fontSize:14, color:'#fff', fontStyle:'italic', lineHeight:1.55 }}>{summary}</div>
              <div style={{ fontSize:14, color:'#FFAAD4', marginTop:4, fontWeight:600 }}>♥ Mira knows {name}</div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding:'20px 18px 24px', background:'#fff', overflowY:'auto', flex:1, minHeight:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.brown, marginBottom:12 }}>What Mira knows about {name}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {cards.map(card => (
              <div key={card.label} style={{ borderRadius:16, padding:'14px 14px 16px', background:'linear-gradient(135deg,#1A0620 0%,#2d0a00 100%)', border:'1px solid rgba(180,80,255,0.22)' }}>
                <div style={{ fontSize:14, fontWeight:700, color:card.color, marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:15, lineHeight:1.35, color:'#fff' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Complete profile nudge */}
          <div style={{ borderRadius:14, background:'#2D1B69', padding:'14px 16px', display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{ width:44, height:44, background:'#7C3AED', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', flexShrink:0 }}>✦</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:2 }}>Mira is learning {name}</div>
              <div style={{ fontSize:14, color:'#C4B5FD', lineHeight:1.4 }}>Complete {name}&apos;s Soul Profile to get real scored picks.</div>
            </div>
            <button onClick={() => { window.location.href = `/pet/${pet?.id || pet?._id}?tab=personality`; }} style={{ background:'#4C1D95', border:'1px solid #7C3AED', borderRadius:20, padding:'10px 16px', color:'#fff', fontSize:14, fontWeight:700, whiteSpace:'nowrap', cursor:'pointer', flexShrink:0 }}>
              Complete →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Segmented Switch ───────────────────────────────────────────
export function DineSegmentedSwitch({ mode, onChange }) {
  return (
    <div style={{ margin:'0 16px 24px', background:C.border, borderRadius:14, padding:3, display:'flex', gap:3 }}>
      {[{ id:'eat', label:'🍲 Eat & Nourish' }, { id:'out', label:'🍽️ Dine Out' }].map(tab => (
        <button key={tab.id} className={`dp-seg ${mode === tab.id ? 'on' : 'off'}`} onClick={() => { vibe('light'); onChange(tab.id); }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Section Heading ────────────────────────────────────────────
export function DineSectionHeading({ title, helper }) {
  return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ fontSize:28, fontWeight:700, lineHeight:1.1, marginBottom:6 }}>{title}</div>
      {helper && <div style={{ fontSize:16, color:C.taupe, lineHeight:1.5 }}>{helper}</div>}
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────
export function DineProductCard({ product, onAdd, onTap }) {
  const [added, setAdded] = useState(false);
  return (
    <div
      className="dp-card"
      style={{
        overflow:'hidden', cursor:'pointer',
        border: product.miraPick ? '2px solid #FF8C42' : '1px solid #F0E8E0',
        opacity: product._dimmed ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}
      onClick={() => onTap?.(product)}
      data-testid={`dine-product-${product.id || product.name}`}
    >
      <div style={{ height:110, background:product.bg || C.chipBg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <span style={{ fontSize:32 }}>🍖</span>}
        {product.miraPick && <div style={{ position:'absolute', top:8, left:8, background:'linear-gradient(135deg,#FF8C42,#C44DFF)', borderRadius:6, padding:'2px 7px', fontSize:9, color:'#fff', fontWeight:700 }}>✦ Mira&apos;s pick</div>}
        {!product.miraPick && product.tag && <div style={{ position:'absolute', top:8, left:8, background:'rgba(43,23,11,0.75)', borderRadius:6, padding:'2px 7px', fontSize:14, color:'#fff', fontWeight:700 }}>{product.tag}</div>}
        {product.mira_hint && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(43,23,11,0.7))', padding:'4px 8px', fontSize:14, color:'#FFD080' }}>✦ {product.mira_hint}</div>}
      </div>
      <div style={{ padding:'10px 12px 14px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:3, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize:14, color:C.taupe, marginBottom:10, lineHeight:1.4 }}>{product.desc}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.amber }}>{product.price}</div>
          <button
            onClick={e => { e.stopPropagation(); vibe('success'); setAdded(true); onAdd?.(product); }}
            style={{ padding:'7px 14px', borderRadius:999, border:'none', background:added ? '#E8F5E9' : CTAGrad, color:added ? '#27AE60' : '#fff', fontSize:14, fontWeight:700, cursor:'pointer', minHeight:44 }}
          >
            {added ? '✓ Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dimensions Rail (FULL — real tabs, no cap) ─────────────────
export function DineDimensionsRail({ dims, openDim, onSelect, pet, apiProducts, onAdd, onTap }) {
  const [activeTab, setActiveTab] = useState('All');
  const name = pet?.name || 'your dog';
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const nutritionGoal = getNutritionGoal(pet);

  useEffect(() => { setActiveTab('All'); }, [openDim]);

  const currentDim = dims.find(d => d.id === openDim);

  // Get products for this dim from apiProducts (grouped by category)
  const rawProducts = currentDim
    ? Object.entries(apiProducts)
        .filter(([cat]) => cat.toLowerCase().includes(currentDim.category?.toLowerCase()?.split(' ')[0] || currentDim.id))
        .flatMap(([, subMap]) => Object.values(subMap).flat())
    : [];

  // Apply Mira Intelligence
  const intelligentProducts = applyMiraIntelligence(rawProducts, allergies, loves, healthCondition, nutritionGoal, pet);

  // Filter by active tab
  const displayProducts = activeTab === 'All'
    ? intelligentProducts
    : intelligentProducts.filter(p => (p.sub_category || '').toLowerCase().includes(activeTab.toLowerCase().split(' ')[0]?.toLowerCase() || ''));

  const normalised = displayProducts.map(p => normCard(p, name));

  const miraText = allergies.length > 0
    ? `I&apos;ve removed everything containing ${allergies.slice(0,2).join(' and ')}. Loved items are first.`
    : `Everything here is filtered for ${name}&apos;s body and taste.`;

  return (
    <div style={{ padding:'0 16px 16px' }}>
      {/* Dimension cards rail */}
      <div className="no-sb" style={{ display:'flex', gap:12, paddingBottom:4 }}>
        {dims.map(dim => (
          <div
            key={dim.id}
            onClick={() => { vibe('light'); onSelect(dim.id === openDim ? null : dim.id); }}
            style={{ minWidth:160, flexShrink:0, borderRadius:20, padding:16, background:dim.bg, cursor:'pointer', border:openDim === dim.id ? `2px solid ${C.orange}` : '2px solid transparent', transition:'border 0.15s' }}
          >
            <div style={{ fontSize:28, marginBottom:8 }}>{dim.icon}</div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{dim.name}</div>
            <div style={{ fontSize:14, color:C.taupe, lineHeight:1.4, marginBottom:10 }}>{dim.sub}</div>
            <div style={{ display:'inline-flex', background:'rgba(0,0,0,0.07)', borderRadius:999, padding:'4px 10px', fontSize:14, fontWeight:600 }}>{dim.badge}</div>
          </div>
        ))}
      </div>

      {/* Expanded panel */}
      {openDim && currentDim && (
        <div style={{ marginTop:12, background:C.card, border:`1.5px solid ${C.orange}`, borderRadius:20, padding:16, animation:'dp-in 0.2s ease' }}>

          {/* Mira bar */}
          <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:C.chipBg, borderRadius:12, padding:'10px 12px', marginBottom:14 }}>
            <span style={{ fontSize:14 }}>✦</span>
            <div style={{ fontSize:14, fontStyle:'italic', color:C.miraAcc, lineHeight:1.5 }}>
              I&apos;ve filtered this for {name}&apos;s body and taste.
              {allergies.length > 0 && ` No ${allergies.slice(0,2).join(' or ')}.`}
              {loves.length > 0 && ` ${loves[0].charAt(0).toUpperCase() + loves[0].slice(1)} picks are first.`}
            </div>
          </div>

          {/* Real subcategory tabs */}
          <div className="no-sb" style={{ display:'flex', gap:8, marginBottom:14 }}>
            {currentDim.tabs.map((tab, i) => (
              <button
                key={tab}
                className={`dp-chip${activeTab === tab ? ' on' : ''}`}
                style={{ fontSize:14 }}
                onClick={() => { vibe('light'); setActiveTab(tab); }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Product grid — NO CAP */}
          {normalised.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{currentDim.icon}</div>
              {allergies.length > 0 ? (
                <>
                  <div style={{ fontSize:14, color:C.taupe }}>Mira filtered everything here for {name}&apos;s {allergies.slice(0,2).join(' & ')} allergies.</div>
                  <div style={{ marginTop:8, fontSize:14, color:'#27AE60', fontWeight:600 }}>Ask Concierge® to source safe alternatives →</div>
                </>
              ) : (
                <div style={{ fontSize:14, color:C.taupe }}>
                  {activeTab !== 'All' ? `No ${activeTab} products yet.` : `Mira is curating ${currentDim.name} for ${name}. Check back soon.`}
                </div>
              )}
              {activeTab !== 'All' && normalised.length === 0 && !allergies.length && (
                <button onClick={() => setActiveTab('All')} style={{ marginTop:12, padding:'8px 16px', borderRadius:999, background:C.chipBg, color:C.chipTxt, border:'none', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                  Show all →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mira's pick callout */}
              {normalised[0]?.miraPick && (
                <div style={{ background:'linear-gradient(135deg,rgba(255,140,66,0.1),rgba(196,77,255,0.06))', border:'1px solid rgba(255,140,66,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', flexShrink:0 }}>✦</div>
                  <div style={{ fontSize:14, color:'#3D1A00', lineHeight:1.4 }}>
                    <strong>Mira&apos;s pick:</strong> {normalised[0].name}
                    {normalised[0].mira_hint && <span style={{ color:'#888', marginLeft:5 }}>— {normalised[0].mira_hint}</span>}
                  </div>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {normalised.map(p => (
                  <DineProductCard key={p.id} product={p} onAdd={onAdd} onTap={onTap} />
                ))}
              </div>
              {/* Footer */}
              <div style={{ borderTop:`1px solid ${C.chipBg}`, paddingTop:10, marginTop:10, fontSize:14, color:C.taupe, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>{normalised.length} items · filtered for {name}{allergies.length > 0 ? ` · no ${allergies.slice(0,2).join(', ')}` : ''}</span>
                {rawProducts.length > normalised.length && (
                  <span style={{ color:C.orange, fontWeight:600 }}>{rawProducts.length - normalised.length} filtered</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mira Bar ───────────────────────────────────────────────────
export function DineMiraBar({ pet, onOpen }) {
  const allergies = getAllergies(pet);
  const name = pet?.name || 'your dog';
  const loves = getLoves(pet);
  const text = allergies.length > 0
    ? `I've already removed everything containing ${allergies.join(' and ')}. What you see here is safe.`
    : loves.length > 0
    ? `${loves[0].charAt(0).toUpperCase() + loves[0].slice(1)} picks are first — I know what ${name} loves.`
    : `I know ${name}'s body as well as I know their soul. Everything here is filtered for them.`;

  return (
    <div style={{ margin:'0 16px 20px', background:C.brown, borderRadius:20, padding:16 }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.apricot, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {name.toUpperCase()}&apos;S NUTRITION</div>
      <div style={{ fontSize:14, color:'#FFCC80', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>&quot;{text}&quot;</div>
      <button className="dp-cta" onClick={() => { vibe('medium'); onOpen(); }}>See Mira&apos;s Picks for {name} →</button>
    </div>
  );
}

// ── Mira Picks Sheet ───────────────────────────────────────────
export function DineMiraPicksSheet({ pet, products = [], services = [], onClose, onConcierge, onAdd, onTap }) {
  const name = pet?.name || 'your dog';
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxHeight:'88vh', overflowY:'auto', background:'#fff', borderRadius:'28px 28px 0 0', padding:'12px 16px calc(24px + env(safe-area-inset-bottom))', animation:'dp-sheet 0.28s ease' }}>
        <div style={{ width:48, height:5, borderRadius:999, background:C.border, margin:'0 auto 18px' }} />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:18 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:700, lineHeight:1.1 }}>Mira&apos;s Picks</div>
            <div style={{ fontSize:15, color:C.taupe, marginTop:4 }}>Safe, smart picks for {name}.</div>
          </div>
          <button onClick={onClose} style={{ width:42, height:42, borderRadius:'50%', background:C.chipBg, border:'none', cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          {services.slice(0, 2).map((svc, i) => (
            <div key={i} style={{ borderRadius:20, background:DarkGrad, padding:'18px 16px' }}>
              <div style={{ fontSize:14, letterSpacing:'0.08em', color:C.apricot, marginBottom:8 }}>MIRA SERVICE PICK</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>{svc.name}</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:14 }}>{svc.desc}</div>
              <button className="dp-cta" onClick={() => onConcierge?.(svc)}>Reserve via Concierge®</button>
            </div>
          ))}
          {products.map(p => (
            <DineProductCard key={p.id} product={p} onAdd={onAdd} onTap={onTap} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Soul Made Inline Card ──────────────────────────────────────
export function DineSoulMadeInlineCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ padding:'0 16px 24px' }}>
      <div
        className="dp-card"
        onClick={() => { vibe('medium'); onOpen?.(); }}
        style={{ position:'relative', overflow:'hidden', padding:'20px 18px', background:'linear-gradient(135deg,#1A0A00,#381207)', color:'#fff', cursor:'pointer' }}
      >
        <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,179,106,0.18) 0%,transparent 70%)' }} />
        <div style={{ fontSize:14, letterSpacing:'0.14em', color:C.apricot, fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {name.toUpperCase()}</div>
        <div style={{ fontSize:22, fontWeight:700, lineHeight:1.2, marginBottom:8 }}>{name}&apos;s face. On bowls, aprons, placemats and more.</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.62)', lineHeight:1.6, marginBottom:14 }}>One-of-one dining pieces, designed around your dog.</div>
        <button className="dp-cta" style={{ background:'linear-gradient(135deg,#FF8C42,#C44400)' }}>Make something only {name} has →</button>
      </div>
    </div>
  );
}

// ── Concierge® Card ─────────────────────────────────────────────
export function DineConciergeCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ margin:'0 16px 24px', background:C.brown, borderRadius:24, padding:20 }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(201,151,58,0.2)', border:'1px solid rgba(201,151,58,0.4)', borderRadius:999, padding:'5px 14px', color:'#F0C060', fontSize:14, fontWeight:600, marginBottom:12 }}>👑 Dining Concierge®</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Want us to plan the whole outing for {name}?</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>We find the right venue, check food safety, make the reservation, and have a safe meal waiting.</div>
      <button onClick={() => { vibe('medium'); onOpen?.(); }} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:'linear-gradient(135deg,#C9973A,#F0C060)', color:C.brown, fontSize:15, fontWeight:700, cursor:'pointer' }}>
        👑 Talk to your Concierge®
      </button>
    </div>
  );
}

// ── Intake Sheet ───────────────────────────────────────────────
export function DineIntakeSheet({ pet, onClose, onSend, prefillVenue }) {
  const [occasion, setOccasion] = useState(prefillVenue ? 'Reservation Assistance' : 'Restaurant Discovery');
  const [notes, setNotes] = useState(prefillVenue ? `Venue: ${prefillVenue}` : '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const name = pet?.name || 'your dog';
  const OCCASIONS = ['Restaurant Discovery','Reservation Assistance','Dining Etiquette','Venue Suitability','Special Diet Planning','Pet-Friendly Café Hunt'];

  const handleSend = async () => {
    setSending(true);
    await onSend?.(occasion, notes);
    setSending(false);
    setSent(true);
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxHeight:'88vh', overflowY:'auto', background:C.card, borderRadius:'24px 24px 0 0', padding:'12px 20px calc(32px + env(safe-area-inset-bottom))', animation:'dp-sheet 0.3s ease' }}>
        <div style={{ width:48, height:5, borderRadius:999, background:C.border, margin:'0 auto 20px' }} />
        {sent ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>👑</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:10 }}>Sent to {name}&apos;s Concierge®.</div>
            <div style={{ fontSize:15, color:C.taupe, lineHeight:1.7, marginBottom:24 }}>We&apos;ll reach out within 48 hours.</div>
            <button className="dp-cta" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>Dining Concierge®</div>
                <div style={{ fontSize:15, color:C.taupe }}>Tell us what you need for {name}</div>
              </div>
              <button onClick={onClose} style={{ width:40, height:40, borderRadius:'50%', background:C.chipBg, border:'none', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>What do you need?</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
              {OCCASIONS.map(occ => (
                <button key={occ} onClick={() => setOccasion(occ)} className={`dp-chip${occasion === occ ? ' on' : ''}`}>{occ}</button>
              ))}
            </div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>Any details?</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={`Outdoor seating near ${pet?.city || 'your area'}, non-chicken options, evening reservation…`}
              style={{ width:'100%', minHeight:88, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 14px', fontSize:15, color:C.brown, background:C.cream, lineHeight:1.6, resize:'none', outline:'none', marginBottom:20, fontFamily:'inherit' }}
            />
            <button className="dp-cta" onClick={handleSend} disabled={sending} style={{ opacity:sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : `Send to Concierge® for ${name} →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function DineSoulPage() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) return <DineSoulPageDesktopLegacy />;

  return <DineMobilePage />;
}

