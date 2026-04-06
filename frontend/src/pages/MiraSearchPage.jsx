/**
 * MiraSearchPage — /mira-search
 * "The Google Bar" — streaming Mira response + product/service chips
 * Members only. No nav, no sidebar, no footer.
 * Standalone — does not affect any existing pages.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useConcierge } from '../hooks/useConcierge';
import { getApiUrl } from '../utils/api';
import { getAllergiesFromPet } from '../utils/masterBriefing';
import { toast, Toaster } from 'sonner';
import CartSidebar from '../components/CartSidebar';
import { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import GroomingFlowModal from '../components/GroomingFlowModal';
import VetVisitFlowModal from '../components/VetVisitFlowModal';
import ServiceBookingModal from '../components/ServiceBookingModal';
import GoConciergeModal from '../components/go/GoConciergeModal';
import ServiceConciergeModal from '../components/services/ServiceConciergeModal';
import DoggyBakeryCakeModal from '../components/celebrate/DoggyBakeryCakeModal';
import GuidedNutritionPaths from '../components/dine/GuidedNutritionPaths';
import GuidedCarePaths from '../components/care/GuidedCarePaths';
import GuidedCelebrationPaths from '../components/celebrate/GuidedCelebrationPaths';

// ── Icons ──────────────────────────────────────────────────────────────────
import {
  Search, X, ShoppingCart, Calendar,
  Sparkles, Send, Inbox,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  night:   '#0D0B12',
  surface: '#13111A',
  card:    '#1C1928',
  border:  'rgba(255,255,255,0.07)',
  amber:   '#C9973A',
  amberL:  '#E8B554',
  ivory:   '#F5F0E8',
  muted:   'rgba(245,240,232,0.45)',
  purple:  '#7C3AED',
  purpleL: '#A78BFA',
  green:   '#10B981',
  text:    '#EDE9E0',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (price) => {
  if (!price || price === 0) return 'Price on Request';
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

const soulColor = (score) => {
  if (score >= 80) return C.green;
  if (score >= 50) return C.amber;
  return '#EF4444';
};

// ── Soul nudge banner ──────────────────────────────────────────────────────
function SoulNudge({ pet }) {
  const score = Math.round(pet?.overall_score || 0);
  const isComplete = score >= 80;
  return (
    <Link to="/pet-home" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 12,
      background: isComplete ? 'rgba(16,185,129,0.07)' : 'rgba(201,151,58,0.1)',
      border: `1px solid ${isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(201,151,58,0.3)'}`,
      textDecoration: 'none', marginBottom: 16,
    }}>
      <Sparkles size={14} color={isComplete ? C.green : C.amber} />
      <span style={{ fontSize: 13, color: isComplete ? C.green : C.amber, fontFamily: 'DM Sans, sans-serif' }}>
        {isComplete
          ? `${pet?.name || 'Your dog'}'s soul profile is complete · Update anytime →`
          : `Tell Mira ${Math.ceil((80 - score) / 10)} more things about ${pet?.name || 'your dog'} to unlock full personalisation →`}
      </span>
    </Link>
  );
}

// ── Horizontally scrollable strip with desktop arrow buttons ──────────────
function ScrollStrip({ children, gap = 12 }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };
  return (
    <div className="ms-scroll-wrap" style={{ position: 'relative' }}>
      {/* Left arrow */}
      <button className="ms-scroll-arrow" onClick={() => scroll(-1)} style={{
        position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(26,23,36,0.92)', border: '1px solid rgba(201,151,58,0.35)',
        color: '#C9973A', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, lineHeight: 1,
      }}>‹</button>
      {/* Strip */}
      <div ref={ref} className="ms-chip-scroll"
        style={{ display: 'flex', gap, overflowX: 'auto', paddingBottom: 8 }}>
        {children}
      </div>
      {/* Right arrow */}
      <button className="ms-scroll-arrow" onClick={() => scroll(1)} style={{
        position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(26,23,36,0.92)', border: '1px solid rgba(201,151,58,0.35)',
        color: '#C9973A', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, lineHeight: 1,
      }}>›</button>
    </div>
  );
}



// ── Pet selector chip ──────────────────────────────────────────────────────
function PetChip({ pet, active, onClick }) {
  const score = Math.round(pet?.overall_score || 0);
  const img = pet?.photo_url || pet?.profile_image;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 6px', borderRadius: 999,
      border: `1.5px solid ${active ? C.amber : C.border}`,
      background: active ? 'rgba(201,151,58,0.1)' : C.card,
      cursor: 'pointer', transition: 'all 0.18s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {img
          ? <img src={img} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 12 }}>🐾</span>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.amber : C.text, fontFamily: 'DM Sans, sans-serif' }}>
        {pet?.name}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: soulColor(score), fontFamily: 'DM Sans, sans-serif',
      }}>
        {score}%
      </span>
    </button>
  );
}

// ── Streaming text renderer ────────────────────────────────────────────────
function StreamingText({ text, streaming }) {
  if (!text) return null;
  return (
    <div style={{
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 15, lineHeight: 1.75,
      color: C.text, whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {text}
      {streaming && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: C.amberL, marginLeft: 2,
          animation: 'blink 1s step-end infinite',
          verticalAlign: 'text-bottom',
        }} />
      )}
    </div>
  );
}


// ── Amazon query cleaner — strips pet names, filler, leaves core product noun ──
// "Mojo wants a bath tub" → "bath tub"
// "find me salmon treats for my dog" → "salmon treats"
function buildAmazonQuery(rawQuery, petName = '') {
  let q = rawQuery || '';
  // Strip pet name (case-insensitive)
  if (petName) q = q.replace(new RegExp(petName, 'gi'), '');
  // Strip conversational filler
  q = q
    .replace(/\b(i want|i need|find me|get me|show me|looking for|can you find|please|help me find|what about|is there|do you have|do you sell|where can i get|where can i find|wants?|needs?|loves?|would like|my dog|my pet|my pup|my puppy|for my|for him|for her|for them|a good|the best|some|any)\b/gi, ' ')
    .replace(/\b(a|an|the|for|of|with|in|on|at|to|and|or|but|my|your|his|her|their|our)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return q || rawQuery; // fallback to original if stripping left nothing
}

// ── ImagineChip ── "Mira Imagines" chip ──────────────────────────────────────
const IMAGINE_ICONS = ['✨', '🐾', '🌿'];

// Map raw query → clean intent label (never slice raw text mid-word)
function resolveImagineLabel(query = '') {
  const q = query.toLowerCase();
  if (/birthday|cake|celebrat|party|gotcha/i.test(q))        return 'a perfect birthday celebration';
  if (/groom|spa|bath|haircut|trim/i.test(q))                return 'a premium grooming experience';
  if (/food|eat|meal|treat|diet|salmon|chicken|dine/i.test(q)) return 'the perfect meal or treat';
  if (/walk|park|trail|outdoor|adventure|go|explore/i.test(q)) return 'an outdoor adventure';
  if (/play|toy|fun|game|social|buddy|friend/i.test(q))       return 'a perfect play session';
  if (/vet|health|doctor|medicine|care|sick/i.test(q))        return 'the best care option';
  if (/stay|hotel|travel|trip|holiday/i.test(q))              return 'a pet-friendly stay';
  if (/learn|train|class|school|behaviour/i.test(q))          return 'the ideal training plan';
  if (/day|plan|routine|schedule/i.test(q))                   return 'a perfect day plan';
  return 'the ideal experience';
}

function ImagineChip({ petName, query, idx, onConcierge, onAmazonClick }) {
  const icon = IMAGINE_ICONS[idx % 3];
  const intentLabel = resolveImagineLabel(query);
  const labels = [
    `Mira imagines ${intentLabel} for ${petName}`,
    `Concierge will source ${intentLabel} for ${petName}`,
    `Tell us more about what ${petName} needs`,
  ];
  return (
    <div style={{
      background: `linear-gradient(135deg, #1e1830 0%, #251d35 100%)`,
      border: `1px solid rgba(201,151,58,0.35)`,
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      minWidth: 160, maxWidth: 200, flexShrink: 0,
      transition: 'border-color 0.18s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.35)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Placeholder — amber shimmer */}
      <div style={{ width: '100%', height: 100, background: 'linear-gradient(135deg, rgba(201,151,58,0.15) 0%, rgba(201,151,58,0.06) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        {icon}
      </div>
      <div style={{ padding: '10px 10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10, color: 'rgba(201,151,58,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Mira Imagines
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#f5f5f5', lineHeight: 1.3 }}>
          {labels[idx % 3]}
        </div>
      </div>
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button
          onClick={onConcierge}
          style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: `1px solid rgba(201,151,58,0.5)`, background: 'transparent', color: 'rgba(201,151,58,0.9)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          Ask Concierge →
        </button>
        <a
          onClick={e => { e.preventDefault(); onAmazonClick?.(); window.open(`https://www.amazon.in/s?k=dog+${encodeURIComponent(buildAmazonQuery(query, petName))}&tag=thedoggyco-21`, '_blank'); }}
          href={`https://www.amazon.in/s?k=dog+${encodeURIComponent(buildAmazonQuery(query, petName))}&tag=thedoggyco-21`}
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#FF9900', textDecoration: 'none', fontWeight: 600, textAlign: 'center', display: 'block', padding: '2px 0', cursor: 'pointer' }}
        >
          Search Amazon →
        </a>
      </div>
    </div>
  );
}


// ── Product / service chip ─────────────────────────────────────────────────
function ResultChip({ item, type, pet, onBook, onCart, onCardClick }) {
  const img = item.cloudinary_url || item.photo_url || item.image_url || item.image;
  const price = item.original_price || item.price || 0;
  const isService = type === 'service';

  return (
    <div
      onClick={() => onCardClick && onCardClick(item)}
      style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        minWidth: 160, maxWidth: 200, flexShrink: 0,
        transition: 'border-color 0.18s, transform 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ width: '100%', height: 100, background: '#1a1724', overflow: 'hidden', flexShrink: 0 }}>
        {img
          ? <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {isService ? '🐾' : '🛒'}
            </div>}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
          {isService ? 'Price on Request' : fmt(price)}
        </div>
      </div>

      {/* CTA — stopPropagation so card click (modal) doesn't also fire */}
      <div style={{ padding: '0 10px 10px' }}>
        {isService ? (
          <button
            onClick={e => { e.stopPropagation(); onBook(item); }}
            style={{
              width: '100%', padding: '6px 0',
              borderRadius: 8, border: `1px solid ${C.amber}`,
              background: 'transparent', color: C.amber,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            <Calendar size={11} /> Book →
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onCart(item); }}
            style={{
              width: '100%', padding: '6px 0',
              borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg,${C.amber},${C.amberL})`,
              color: '#0D0B12',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            <ShoppingCart size={11} /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ── Guided Path Map ───────────────────────────────────────────────────────
const GUIDED_PATH_MAP = {
  birthday_celebration: { path:'/celebrate-soul', title:"Plan [pet]'s Perfect Celebration", subtitle:'Mira walks you through every step' },
  food_dining:          { path:'/dine',           title:"Build [pet]'s Nutrition Plan",      subtitle:'From soul to bowl — step by step' },
  grooming_care:        { path:'/care',           title:"[pet]'s Complete Care Plan",        subtitle:'Coat, health and comfort arranged' },
  adopt_rescue:         { path:'/adopt',          title:"Ready to Adopt?",                   subtitle:'Mira guides you home' },
  farewell_memorial:    { path:'/farewell',       title:"Gentle Farewell Support",           subtitle:'We walk this path with you' },
  training_behavior:    { path:'/learn',          title:"Train [pet] with Mira",             subtitle:'Step by step, your way' },
  travel_adventure:     { path:'/go',             title:"Plan [pet]'s Perfect Trip",         subtitle:'Every detail arranged by Concierge' },
  emergency_urgent:     { path:'/emergency',      title:"Emergency Help for [pet]",          subtitle:'Immediate routing and support' },
  vet_health:           { path:'/care',           title:"[pet]'s Health Check Plan",         subtitle:'Vet, vaccines and wellness arranged' },
  paperwork_docs:       { path:'/paperwork',      title:"[pet]'s Documents in Order",        subtitle:'Passport, microchip, insurance sorted' },
  play_enrichment:      { path:'/play',           title:"[pet]'s Play & Enrichment Plan",    subtitle:'Mental stimulation and fun arranged' },
  shop_accessories:     { path:'/shop',           title:"Shop for [pet]",                    subtitle:'Curated picks from Concierge' },
};

// ── Quick prompts ──────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { emoji: '🎂', label: 'Plan birthday' },
  { emoji: '🍽️', label: 'What to eat today' },
  { emoji: '✂️', label: 'Book a groomer' },
  { emoji: '💊', label: 'Health check' },
  { emoji: '🧸', label: 'Find a toy' },
  { emoji: '✈️', label: 'Plan a trip' },
];

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MiraSearchPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [query, setQuery] = useState('');
  const [followUp, setFollowUp] = useState('');
  // turns = [{ id, query, response, products, services, streaming }]
  const [turns, setTurns] = useState([]);

  // ── Component-level turn patcher (used by "Show more" button in render) ──
  const patchTurn = useCallback((turnId, patch) =>
    setTurns(prev => prev.map(t => t.id === turnId ? { ...t, ...patch } : t)),
  []);

  const loadMoreProducts = useCallback(async (turn) => {
    if (!turn || turn.loadingMore) return;
    const turnId = turn.id;
    patchTurn(turnId, { loadingMore: true });
    const _petName = activePet?.name || 'your dog';
    const petId = activePet?.id || activePet?._id;
    const breed = activePet?.breed || activePet?.identity?.breed || '';
    try {
      // Read latest offset from state to avoid stale closure bug
      let currentOffset = 6;
      let currentProducts = [];
      setTurns(prev => {
        const t = prev.find(x => x.id === turnId);
        currentOffset = t?.productsOffset || 6;
        currentProducts = t?.products || [];
        return prev; // no mutation, just reading
      });

      const r = await fetch(`${getApiUrl()}/api/mira/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          query: turn.semanticQuery || turn.query,
          pet_id: petId, pet_name: _petName,
          breed, allergens: getAllergiesFromPet(activePet),
          limit: 6,
          offset: currentOffset,
        }),
      });
      const d = r.ok ? await r.json() : null;
      const more = (d?.products || []).filter(p => !currentProducts.some(e => e.id === p.id));
      // Use functional update so we always append to the LATEST products list
      setTurns(prev => prev.map(t => t.id === turnId ? {
        ...t,
        products: [...(t.products || []), ...more],
        productsOffset: (t.productsOffset || 6) + 6,
        hasMore: d?.has_more === true && more.length > 0,
        loadingMore: false,
      } : t));
    } catch {
      patchTurn(turnId, { loadingMore: false, hasMore: false });
    }
  }, [activePet, token, patchTurn, setTurns]);
  const [hasSearched, setHasSearched] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selProduct, setSelProduct] = useState(null);
  // ── Service modal states ──────────────────────────────────────────────────
  const [groomingOpen, setGroomingOpen] = useState(false);
  const [vetOpen, setVetOpen] = useState(false);
  const [boardingOpen, setBoardingOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [goOpen, setGoOpen] = useState(false);
  // ServiceConciergeModal: full service object { pillar, name, sub_category } | null
  const [conciergeService, setConciergeService] = useState(null);
  const [bakeryCakeOpen, setBakeryCakeOpen] = useState(false);
  const [guidedPathOpen, setGuidedPathOpen] = useState(null);

  // useConcierge after activePet is declared (avoids temporal dead zone error)
  const { fire: conciergefire } = useConcierge({ pet: activePet, pillar: 'general' });

  // ── Keyword regex patterns (order matters — most specific first) ───────────
  const GROOMING_RE  = /\bgroom(?:ing)?\b|\bspa\b|\bwash\b|nail\s*trim|haircut|fur\s*cut|coat\s*trim|\bshed(?:ding)?\b/i;
  const VET_RE       = /\bvet\b|veterinar|checkup|check.?up|vaccine|vaccin|doctor|consult|deworming|tick|flea|health\s+check/i;
  const BOARDING_RE  = /boarding|daycare|day.?care|pet.?sitting|overnight|kennel|pet hotel|home.?boarding/i;
  const TRAINING_RE  = /training|train|obedien|puppy class|agility|command|behav|discipline/i;
  const GO_RE        = /\bwalk\b|hike|trail|outdoor|trip|travel|transport|carry|stroller|go outside/i;
  const PHOTO_RE     = /photo|photoshoot|photo.?shoot|portrait|picture|session|memories.*shoot|shoot.*dog/i;
  const CELEBRATE_RE = /birthday|celebrate|party|event|gotcha.?day|anniversary|paw.?ty|cake\s|festiv/i;
  const LEARN_RE     = /\bclass\b|\bclasses\b|lesson|course|workshop|behaviour school|puppy school|learn/i;

  // ── Near-me detection ─────────────────────────────────────────────────────
  // Matches: "near me", "nearby", explicit cities, "where can I find", "in [any city]"
  // Designed to catch any world city — not a hardcoded list
  const NEAR_ME_RE = new RegExp(
    [
      'near\\s+me', 'nearby', 'near\\s+by',
      'close\\s+to\\s+me', 'find.*near', 'around\\s+me',
      'in\\s+my\\s+area', 'in\\s+my\\s+city',
      'where\\s+can\\s+i\\s+find', 'where\\s+do\\s+i\\s+find',
      'where.*find.*near', 'find.*in\\s+[a-z]',
      // Any "in [Capitalised word]" pattern → catches all world cities
      'in\\s+[A-Z][a-z]{2,}',
      // Explicit common queries kept as anchors
      'in\\s+goa', 'in\\s+mumbai', 'in\\s+delhi', 'in\\s+pune',
      'in\\s+hyderabad', 'in\\s+chennai', 'in\\s+ooty',
      'in\\s+bangalore', 'in\\s+bengaluru', 'in\\s+kolkata',
    ].join('|'),
    'i'
  );
  const PLACE_TYPE_MAP = [
    [/grooming|groomer|groom|bath|spa|trim|nail/i, 'groomer'],
    [/\bvet\b|veterinar|checkup|vaccine|doctor|clinic/i, 'vet'],
    [/training|trainer|obedien|puppy class|agility/i, 'trainer'],
    [/boarding|daycare|day.?care|kennel|pet hotel/i, 'daycare'],
    [/park|walk|hike|outdoor|trail|dog park/i, 'park'],
  ];

  const inputRef = useRef(null);
  const followUpRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user && !token) {
      navigate('/login?redirect=/mira-search');
    }
  }, [user, token, navigate]);

  // ── Load pets ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${getApiUrl()}/api/pets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.pets || []);
        setPets(list);
        setActivePet(list[0] || null);
      })
      .catch(() => {});
  }, [token]);

  // ── Focus input on mount ──────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Scroll to bottom after each new turn ─────────────────────────────────
  useEffect(() => {
    if (turns.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [turns.length, turns[turns.length - 1]?.response?.length]);

  // ── Stream handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    if (!activePet) { toast.error('Please select a pet first'); return; }

    // Check if any turn is already streaming
    const anyStreaming = turns.some(t => t.streaming);
    if (anyStreaming) return;

    // Cancel previous abort
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const turnId = Date.now();

    // Build history from previous turns
    const history = turns.flatMap(t => [
      { role: 'user', content: t.query },
      { role: 'assistant', content: t.response || '' },
    ]).slice(-10);

    // Add this turn to the conversation
    setTurns(prev => [...prev, {
      id: turnId, query: q,
      response: '', streaming: true,
      products: [], services: [],
    }]);
    setHasSearched(true);
    setQuery('');
    setFollowUp('');

    const body = {
      message: q,
      session_id: `search_${turnId}`,
      source: 'mira_search',
      current_pillar: 'general',
      selected_pet_id: activePet?.id || activePet?._id,
      pet_name: activePet?.name,
      pet_breed: activePet?.breed || activePet?.identity?.breed || null,
      soul_answers: activePet?.doggy_soul_answers || {},
      archetype: activePet?.archetype?.primary_archetype || activePet?.soul_archetype || null,
      history,
    };

    const updateTurn = (patch) =>
      setTurns(prev => prev.map(t => t.id === turnId ? { ...t, ...patch } : t));

    try {
      const res = await fetch(`${getApiUrl()}/api/mira/os/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let enrichedProducts = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { reader.cancel(); break; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'enriched') {
              enrichedProducts = parsed.data?.products || [];
              // nearby_places is a FLAG {show_nearme:true}, not an array.
              // Services DB is empty — show a booking CTA when flag fires
              const nearbyFlag = parsed.data?.nearby_places;
              if (nearbyFlag?.show_nearme) {
                setTurns(prev => prev.map(t =>
                  t.id === turnId ? { ...t, servicesCta: true } : t
                ));
              }
              continue;
            }
            const tok = parsed.text || parsed.delta || parsed.content || '';
            if (!tok) continue;
            fullText += tok;
            updateTurn({ response: fullText });
          } catch {}
        }
      }

      // ── Step 1: use enriched products from stream if available ────────────
      const prods = enrichedProducts.filter(p => p.product_type !== 'service').slice(0, 6);
      updateTurn({ streaming: false, response: fullText, products: prods, services: [], showImagines: false, productsOffset: 6, hasMore: false });

      // ── Step 2: fallback to semantic-search (query-aware + breed-boosted + allergen-safe) ──
      const petId  = activePet?.id || activePet?._id;
      const breed  = activePet?.breed || activePet?.identity?.breed || '';
      const allergens = getAllergiesFromPet(activePet);
      if (prods.length === 0) {
        fetch(`${getApiUrl()}/api/mira/semantic-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query: q, pet_id: petId, pet_name: petName, breed, allergens, limit: 6, offset: 0 }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            const hits = d?.products || [];
            const intent = d?.primary_intent || null;
            if (hits.length > 0) {
              updateTurn({ products: hits.slice(0, 6), productsOffset: 6, hasMore: d?.has_more === true, semanticQuery: q, intent });
            } else {
              // ── Step 3: no matches at all — show MiraImaginesBreed ──────
              updateTurn({ showImagines: true, hasMore: false, intent });
            }
          })
          .catch(() => { updateTurn({ showImagines: true, hasMore: false }); });
      }

      // Focus the follow-up input
      setTimeout(() => followUpRef.current?.focus(), 300);

      // ── Keyword → service modal router (400ms delay so response renders first) ──
      const MODAL_DELAY = 400;
      if (GROOMING_RE.test(q)) {
        setTimeout(() => setGroomingOpen(true), MODAL_DELAY);
      } else if (VET_RE.test(q)) {
        setTimeout(() => setVetOpen(true), MODAL_DELAY);
      } else if (BOARDING_RE.test(q)) {
        setTimeout(() => setBoardingOpen(true), MODAL_DELAY);
      } else if (TRAINING_RE.test(q)) {
        setTimeout(() => setTrainingOpen(true), MODAL_DELAY);
      } else if (GO_RE.test(q)) {
        setTimeout(() => setGoOpen(true), MODAL_DELAY);
      } else if (PHOTO_RE.test(q)) {
        setTimeout(() => setConciergeService({ pillar: 'celebrate', name: 'Photoshoot & Portrait', sub_category: 'photoshoot' }), MODAL_DELAY);
      } else if (breed && /\bcake\b|cupcake|pawcake|custom.*cake|breed.*cake/i.test(q) && (q.toLowerCase().includes(breed.toLowerCase()) || /breed.specific|custom.*cake|made.*for.*breed/i.test(q))) {
        // Breed + cake combo → open DoggyBakeryCakeModal (auto-filters by pet.breed)
        setTimeout(() => setBakeryCakeOpen(true), MODAL_DELAY);
      } else if (CELEBRATE_RE.test(q)) {
        setTimeout(() => setConciergeService({ pillar: 'celebrate', name: '' }), MODAL_DELAY);
      } else if (LEARN_RE.test(q)) {
        setTimeout(() => setConciergeService({ pillar: 'learn', name: '' }), MODAL_DELAY);
      }

      // ── Near-me: fetch Google Places inline if query contains "near me" ───
      if (NEAR_ME_RE.test(q)) {
        const placeType = (PLACE_TYPE_MAP.find(([re]) => re.test(q)) || [])[1] || 'all';
        navigator.geolocation?.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude: lat, longitude: lng } = pos.coords;
              const res = await fetch(
                `${getApiUrl()}/api/places/care-providers?lat=${lat}&lng=${lng}&type=${placeType}&radius=5000`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
              );
              const data = res.ok ? await res.json() : null;
              const places = data?.places || [];
              if (places.length > 0) {
                updateTurn({ places, placeType });
              }
            } catch { /* silent — places are bonus content */ }
          },
          () => {
            // Geo denied — prompt user for city via turn state (no hardcoded city)
            updateTurn({ places: [], placeType, needsCity: true });
          }
        );
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        updateTurn({ streaming: false, response: 'Mira had a moment. Please try again.' });
      }
    }
  }, [query, followUp, activePet, token, turns]);

  // ── WhatsApp — send full conversation ────────────────────────────────────
  const handleWhatsApp = () => {
    if (!turns.length) return;
    const lines = turns
      .filter(t => t.response)
      .map(t => `*You:* ${t.query}\n*Mira:* ${t.response.slice(0, 400)}${t.response.length > 400 ? '…' : ''}`)
      .join('\n\n');
    const msg = `*Mira conversation for ${petName}:*\n\n${lines}\n\n_Powered by The Doggy Company_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const petName = activePet?.name || 'your dog';
  const soulScore = Math.round(activePet?.overall_score || 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh', background: C.night,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: '0 16px 120px',
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ms-chip-scroll::-webkit-scrollbar { display:none; }
        .ms-chip-scroll { scrollbar-width:none; }
        .ms-qp-btn:hover { background: rgba(201,151,58,0.12) !important; border-color: rgba(201,151,58,0.4) !important; }
        .ms-scroll-arrow { opacity:0; transition: opacity 0.2s; pointer-events:none; }
        .ms-scroll-wrap:hover .ms-scroll-arrow { opacity:1; pointer-events:all; }
        @media (max-width: 640px) { .ms-scroll-arrow { display:none !important; } }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0 24px',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 28,
      }}>
        {/* Mira wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.ivory, letterSpacing: '-0.02em' }}>Mira</span>
        </div>

        {/* Pet selector + cart icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {pets.slice(0, 4).map(pet => (
            <PetChip
              key={pet.id || pet._id}
              pet={pet}
              active={activePet?.id === pet.id || activePet?._id === pet._id}
              onClick={() => setActivePet(pet)}
            />
          ))}
          {/* My Requests */}
          <button
            onClick={() => navigate('/my-requests')}
            data-testid="mira-search-my-requests"
            title="My Requests"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.card, border: `1.5px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.purpleL}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <Inbox size={16} color={C.purpleL} />
          </button>
          {/* Cart icon */}
          <button
            onClick={() => setCartOpen(true)}
            data-testid="mira-search-cart"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.card, border: `1.5px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.amber}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <ShoppingCart size={16} color={C.amber} />
          </button>
        </div>
      </div>

      {/* ── Soul nudge ── */}
      {activePet && <div style={{ width: '100%', maxWidth: 720 }}>
        <SoulNudge pet={activePet} />
      </div>}

      {/* ── Search bar (hidden after first search — follow-up bar takes over) ── */}
      {!hasSearched && <div
        style={{
          width: '100%', maxWidth: 720,
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 20, padding: '4px 6px 4px 20px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 0 40px rgba(124,58,237,0.08)',
          marginBottom: 28,
        }}
      >
        <Search size={18} color={C.muted} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder={`What can Mira do for ${petName} today?`}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 16, color: C.ivory, fontFamily: 'DM Sans, sans-serif',
            padding: '12px 0', caretColor: C.amber,
          }}
          data-testid="mira-search-input"
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.muted }}>
            <X size={16} />
          </button>
        )}
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || turns.some(t => t.streaming)}
          data-testid="mira-search-submit"
          style={{
            padding: '10px 18px', borderRadius: 14,
            border: 'none', cursor: query.trim() && !turns.some(t => t.streaming) ? 'pointer' : 'not-allowed',
            background: query.trim() && !turns.some(t => t.streaming)
              ? `linear-gradient(135deg,${C.amber},${C.amberL})`
              : 'rgba(255,255,255,0.06)',
            color: query.trim() && !turns.some(t => t.streaming) ? C.night : C.muted,
            fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.18s', flexShrink: 0,
          }}
        >
          {turns.some(t => t.streaming)
            ? <><span style={{ width: 14, height: 14, border: `2px solid ${C.muted}`, borderTopColor: C.amber, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Thinking</>
            : <><Send size={14} /> Ask</>}
        </button>
      </div>}

      {/* ── Quick prompts (only before first search) ── */}
      {!hasSearched && (
        <div style={{ width: '100%', maxWidth: 720, marginTop: 32, animation: 'fadeUp 0.4s ease' }}>
          <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>
            Try asking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.label}
                className="ms-qp-btn"
                onClick={() => { setQuery(p.label); handleSearch(p.label); }}
                style={{
                  padding: '8px 16px', borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.text,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation thread ── */}
      {turns.map((turn, idx) => {
        const isLast = idx === turns.length - 1;
        return (
          <div key={turn.id} style={{ width: '100%', maxWidth: 720, marginBottom: 8, animation: 'fadeUp 0.3s ease' }}>

            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <div style={{
                background: 'rgba(201,151,58,0.12)',
                border: `1px solid rgba(201,151,58,0.25)`,
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 16px',
                maxWidth: '80%',
                fontSize: 14, color: C.ivory,
                fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5,
              }}>
                {turn.query}
              </div>
            </div>

            {/* Mira response */}
            {(turn.response || turn.streaming) && (
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '20px 24px 18px',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Sparkles size={11} color="#fff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.purpleL }}>Mira</span>
                  {turn.streaming && (
                    <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>thinking for {petName}…</span>
                  )}
                </div>
                <StreamingText text={turn.response} streaming={turn.streaming} />
              </div>
            )}

            {/* Products for this turn */}
            {turn.products?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 600 }}>
                  Mira picks for {petName}
                </p>
                <ScrollStrip gap={12}>
                  {turn.products.map((p, i) => (
                    <ResultChip key={p.id || p._id || i} item={p} type="product" pet={activePet}
                      onCardClick={item => setSelProduct(item)}
                      onCart={item => { addToCart(item); toast.success(`${item.name} added to cart! 🛒`); }}
                      onBook={() => {}} />
                  ))}
                </ScrollStrip>
                {/* ── Show more: fetch next page of the same intent ── */}
                {turn.hasMore && !turn.loadingMore && (
                  <button
                    data-testid="show-more-products-btn"
                    onClick={() => loadMoreProducts(turn)}
                    style={{ marginTop: 10, fontSize: 12, color: C.amber, background: 'none', border: `1px solid ${C.amber}`, borderRadius: 20, padding: '4px 14px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Show more options →
                  </button>
                )}
                {turn.loadingMore && (
                  <p style={{ marginTop: 8, fontSize: 12, color: C.muted }}>Loading more...</p>
                )}
              </div>
            )}

            {/* ── Service strip — 3 services matching the intent's pillar ── */}
            {turn.services?.length > 0 && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.45s ease' }}>
                <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 600 }}>
                  Services for {petName}
                </p>
                <ScrollStrip gap={10}>
                  {turn.services.map((svc, i) => (
                    <div key={svc.id || i}
                      data-testid="service-chip"
                      onClick={() => setConciergeService({ pillar: svc.pillar || 'services', name: svc.name, sub_category: svc.type || svc.category })}
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.06) 100%)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: 12, padding: '10px 14px',
                        minWidth: 170, maxWidth: 220, flexShrink: 0,
                        cursor: 'pointer', transition: 'border-color 0.18s, transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {svc.pillar || 'service'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 6 }}>
                        {svc.name}
                      </div>
                      {svc.description && (
                        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 6 }}>
                          {svc.description.slice(0, 55)}{svc.description.length > 55 ? '…' : ''}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {(svc.base_price || svc.price) ? (
                          <span style={{ fontSize: 12, color: C.amber, fontWeight: 700 }}>₹{svc.base_price || svc.price}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.muted }}>Price on request</span>
                        )}
                        <span style={{ fontSize: 11, color: 'rgba(167,139,250,0.9)', fontWeight: 600 }}>Book →</span>
                      </div>
                    </div>
                  ))}
                </ScrollStrip>
              </div>
            )}

            {/* Guided Path — chip-sized card, scrolls with product strip */}
            {GUIDED_PATH_MAP[turn.intent] && !turn.streaming && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.5s ease' }}>
                <ScrollStrip gap={12}>
                  <div
                    onClick={() => setGuidedPathOpen(turn.intent)}
                    data-testid="guided-path-chip"
                    style={{
                      display: 'inline-flex', flexDirection: 'column',
                      minWidth: 160, maxWidth: 200, flexShrink: 0,
                      background: '#1C1928',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 14, padding: '12px 14px',
                      cursor: 'pointer', transition: 'border-color 0.18s, transform 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ fontSize: 10, color: '#F5F0E8', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      ✦ Guided Path
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F0E8',
                      lineHeight: 1.3, marginBottom: 4, fontFamily: 'Georgia,serif' }}>
                      {GUIDED_PATH_MAP[turn.intent].title.replace('[pet]', activePet?.name || 'your dog')}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.8)', lineHeight: 1.3 }}>
                      {GUIDED_PATH_MAP[turn.intent].subtitle} →
                    </div>
                  </div>
                </ScrollStrip>
              </div>
            )}

            {/* ── NearMe: geo denied OR city override ── */}
            {(turn.needsCity || turn.showCityInput) && !turn.places?.length && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.4s ease' }}>
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                  {turn.needsCity
                    ? 'Location access was denied. Which city should Mira search in?'
                    : 'Search in a different city:'}
                </p>
                <form onSubmit={async e => {
                  e.preventDefault();
                  const city = e.target.city.value.trim();
                  if (!city) return;
                  patchTurn(turn.id, { needsCity: false, showCityInput: false });
                  try {
                    const res = await fetch(
                      `${getApiUrl()}/api/places/care-providers?city=${encodeURIComponent(city)}&type=${turn.placeType || 'all'}`,
                      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                    );
                    const d = res.ok ? await res.json() : null;
                    if (d?.places?.length) patchTurn(turn.id, { places: d.places });
                    else patchTurn(turn.id, { places: [] });
                  } catch { patchTurn(turn.id, { places: [] }); }
                }} style={{ display: 'flex', gap: 8 }}>
                  <input name="city" placeholder="e.g. Goa, Mumbai, London, Tokyo"
                    defaultValue={activePet?.city || ''}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none' }} />
                  <button type="submit" style={{ padding: '7px 16px', borderRadius: 8, background: C.amber, color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Search
                  </button>
                </form>
              </div>
            )}

            {/* ── NearMe Place Cards — horizontal chip scroll strip ── */}
            {turn.places?.length > 0 && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, margin: 0 }}>
                    Near you · {turn.places.length} {turn.placeType || 'places'} found
                  </p>
                  <button
                    onClick={() => patchTurn(turn.id, { showCityInput: !turn.showCityInput, places: [] })}
                    style={{ fontSize: 11, color: C.amber, background: 'none', border: `1px solid ${C.amber}44`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                    Change city
                  </button>
                </div>
                <ScrollStrip gap={12}>
                  {turn.places.slice(0, 6).map((place, i) => {
                    const placeIcon = place.type === 'vet' ? '🏥' : place.type === 'trainer' ? '🎓' : place.type === 'daycare' ? '🏠' : '✂️';
                    return (
                      <div key={place.place_id || i} data-testid="near-me-place-card"
                        style={{
                          display: 'inline-flex', flexDirection: 'column',
                          minWidth: 160, maxWidth: 200, flexShrink: 0,
                          background: C.card, border: `1px solid ${C.border}`,
                          borderRadius: 14, overflow: 'hidden', cursor: 'default',
                          transition: 'border-color 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; }}
                      >
                        {/* Icon banner */}
                        <div style={{ height: 64, background: `${C.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                          {placeIcon}
                        </div>
                        {/* Content */}
                        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: C.text, lineHeight: 1.3 }}>{place.name}</span>
                            {place.tdc_verified && (
                              <span style={{ fontSize: 9, background: `${C.amber}33`, color: C.amber, borderRadius: 8, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ TDC</span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.3 }}>{place.vicinity}</p>
                          {place.rating && (
                            <span style={{ fontSize: 11, color: '#f59e0b' }}>{'★'.repeat(Math.round(place.rating))} {place.rating}</span>
                          )}
                          {place.mira_note && (
                            <p style={{ fontSize: 10, color: C.amber, margin: 0, fontStyle: 'italic', lineHeight: 1.3 }}>{place.mira_note}</p>
                          )}
                        </div>
                        {/* Book CTA */}
                        <div style={{ padding: '0 12px 10px' }}>
                          <button
                            onClick={() => {
                              if (place.phone) window.open(`tel:${place.phone}`);
                              else if (place.url) window.open(place.url, '_blank');
                            }}
                            style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: 'none', background: C.amber, color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Book / Call →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </ScrollStrip>
              </div>
            )}

            {/* Step 3 — Mira Imagines strip: same layout as real products ── */}
            {turn.showImagines && !turn.streaming && activePet && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.4s ease' }}>
                <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 600 }}>
                  Mira imagines for {petName}
                </p>
                <ScrollStrip gap={12}>
                  {[0, 1, 2].map(i => (
                    <ImagineChip
                      key={i} idx={i}
                      petName={petName}
                      query={turn.query}
                      onConcierge={async () => {
                        try {
                          await conciergefire({
                            type: 'request',
                            name: `Mira Search: ${turn.query}`,
                            note: turn.query,
                            metadata: { query: turn.query, intent: turn.intent, source: 'mira_search', imagines: true },
                            silent: true,
                          });
                          toast.success('Sent to Concierge! We\'ll find the right match for ' + petName);
                        } catch {
                          toast.error('Could not send — please try again');
                        }
                      }}
                      onAmazonClick={() => conciergefire({ type: 'request', note: `Amazon search: ${turn.query}`, silent: true, metadata: { source: 'amazon_click', query: turn.query } })}
                    />
                  ))}
                </ScrollStrip>
              </div>
            )}

            {/* Services CTA */}
            {turn.servicesCta && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                marginBottom: 12, animation: 'fadeUp 0.35s ease',
              }}>
                <Calendar size={16} color={C.purpleL} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text, fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                  Looking for services near you?
                </span>
                <button
                  onClick={async () => {
                    patchTurn(turn.id, { servicesCta: false });
                    setConciergeService({ pillar: 'services', name: 'Find a Service' });
                  }}
                  style={{ fontSize: 13, fontWeight: 700, color: C.amber, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }}
                >
                  Book via Concierge →
                </button>
              </div>
            )}

            {/* ── Follow-up input (only after last turn completes) ── */}
            {isLast && !turn.streaming && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.card,
                border: `1.5px solid rgba(201,151,58,0.25)`,
                borderRadius: 16, padding: '6px 8px 6px 16px',
                marginTop: 4, marginBottom: 8,
                transition: 'border-color 0.2s',
              }}>
                <input
                  ref={followUpRef}
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && followUp.trim()) handleSearch(followUp.trim()); }}
                  placeholder="Ask a follow-up…"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: C.ivory,
                    fontFamily: 'DM Sans, sans-serif', padding: '8px 0',
                    caretColor: C.amber,
                  }}
                  data-testid="mira-search-followup"
                />
                <button
                  onClick={() => followUp.trim() && handleSearch(followUp.trim())}
                  disabled={!followUp.trim()}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: 'none',
                    background: followUp.trim()
                      ? `linear-gradient(135deg,${C.amber},${C.amberL})`
                      : 'rgba(255,255,255,0.06)',
                    color: followUp.trim() ? C.night : C.muted,
                    fontWeight: 700, fontSize: 13,
                    cursor: followUp.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  <Send size={13} /> Ask
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={bottomRef} style={{ height: 100 }} />

      {/* ── WhatsApp bottom bar (fixed) — shown after first complete turn ── */}
      {turns.some(t => t.response && !t.streaming) && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: `linear-gradient(to top, ${C.night} 70%, transparent)`,
          display: 'flex', justifyContent: 'center',
          zIndex: 50,
          animation: 'fadeUp 0.3s ease',
        }}>
          <button
            onClick={handleWhatsApp}
            data-testid="mira-search-whatsapp"
            style={{
              padding: '13px 28px', borderRadius: 999,
              border: 'none', background: '#25D366',
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            Send full conversation to WhatsApp →
          </button>
        </div>
      )}

      {/* ── GroomingFlowModal — opens when query is grooming-related ── */}
      {groomingOpen && (
        <GroomingFlowModal
          isOpen={groomingOpen}
          pet={activePet}
          onClose={() => setGroomingOpen(false)}
        />
      )}

      {/* ── VetVisitFlowModal — vet / checkup / vaccine queries ── */}
      <VetVisitFlowModal
        isOpen={vetOpen}
        onClose={() => setVetOpen(false)}
        pet={activePet}
        user={user}
        token={token}
        entryPoint="mira_search"
      />

      {/* ── ServiceBookingModal (Boarding) — boarding / daycare / overnight queries ── */}
      <ServiceBookingModal
        isOpen={boardingOpen}
        onClose={() => setBoardingOpen(false)}
        serviceType="boarding"
      />

      {/* ── ServiceBookingModal (Training) — training / obedience / puppy class queries ── */}
      <ServiceBookingModal
        isOpen={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        serviceType="training"
      />

      {/* ── GoConciergeModal — walk / hike / transport / trip queries ── */}
      {goOpen && (
        <GoConciergeModal
          pet={activePet}
          service={{ name: 'Go & Explore' }}
          token={token}
          onClose={() => setGoOpen(false)}
        />
      )}

      {/* ── DoggyBakeryCakeModal — [breed] + cake queries ── */}
      {bakeryCakeOpen && (
        <DoggyBakeryCakeModal
          pet={activePet}
          onClose={() => setBakeryCakeOpen(false)}
        />
      )}

      {/* ── ServiceConciergeModal — celebrate / photoshoot / learn queries ── */}
      {conciergeService && (
        <ServiceConciergeModal
          service={conciergeService}
          pet={activePet}
          user={user}
          onClose={() => setConciergeService(null)}
        />
      )}

      {/* ── Guided Path Modals ── */}
      {guidedPathOpen === 'food_dining' && (
        <GuidedNutritionPaths pet={activePet} onClose={() => setGuidedPathOpen(null)} />
      )}
      {guidedPathOpen === 'grooming_care' && (
        <GuidedCarePaths pet={activePet} onClose={() => setGuidedPathOpen(null)} />
      )}
      {guidedPathOpen === 'birthday_celebration' && (
        <GuidedCelebrationPaths pet={activePet} onClose={() => setGuidedPathOpen(null)} />
      )}
      {['travel_adventure','training_behavior','play_enrichment',
        'farewell_memorial','emergency_urgent','paperwork_docs','adopt_rescue',
        'vet_health','shop_accessories']
        .includes(guidedPathOpen) && (
        <ServiceConciergeModal
          service={{ pillar: GUIDED_PATH_MAP[guidedPathOpen]?.path.replace('/',''), name: GUIDED_PATH_MAP[guidedPathOpen]?.title }}
          pet={activePet}
          user={user}
          onClose={() => setGuidedPathOpen(null)}
          onBooked={() => setGuidedPathOpen(null)}
        />
      )}

      {/* ── CartSidebar ── */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── ProductDetailModal — card tap opens this ── */}
      {selProduct && (
        <ProductDetailModal
          product={selProduct}
          pillar={selProduct?.pillar || 'celebrate'}
          selectedPet={activePet}
          onClose={() => setSelProduct(null)}
        />
      )}

      {/* Toaster — bottom-center, offset above WhatsApp bar */}
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { marginBottom: 80 } }}
        richColors
      />
    </div>
  );
}
