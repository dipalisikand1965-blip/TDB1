/**
 * CelebrateContentModal.jsx
 *
 * Category strip modal — fully responsive:
 * - Mobile (iOS/Android): full-screen bottom sheet
 * - Desktop: centered large modal
 *
 * Layout:
 * 1. Header: emoji + category + "For {pet}" + close
 * 2. Mira's Picks row (breed-specific, only if data exists)
 * 3. Product grid using real ProductCard component (View Details → full modal)
 * 4. For Bundles: BundleCard with inline detail sheet
 * 5. "Continue Shopping" footer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Loader2, Sparkles, ChevronRight, ShoppingBag, Check, ChevronDown, Share2, Calendar } from 'lucide-react';
import ProductCard from '../ProductCard';
import FlatArtPickerCard from '../common/FlatArtPickerCard';
import SoulMadeModal from '../SoulMadeModal';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Breed slug & display name helpers ────────────────────────────────────
const BREED_SLUG_MAP = {
  'indian pariah': 'indie', 'indie': 'indie', 'pariah': 'indie',
  'labrador retriever': 'labrador', 'labrador': 'labrador',
  'golden retriever': 'golden_retriever', 'golden': 'golden_retriever',
  'beagle': 'beagle', 'pug': 'pug',
  'german shepherd': 'german_shepherd', 'gsd': 'german_shepherd',
  'shih tzu': 'shih_tzu', 'dachshund': 'dachshund',
  'pomeranian': 'pomeranian', 'husky': 'husky', 'siberian husky': 'husky',
  'doberman': 'doberman', 'dobermann': 'doberman', 'rottweiler': 'rottweiler',
  'cocker spaniel': 'cocker_spaniel', 'border collie': 'border_collie',
};

const getBreedSlug = (pet) => {
  if (!pet) return null;
  const breed = (pet.breed || '').toLowerCase().trim();
  return BREED_SLUG_MAP[breed] || breed.replace(/\s+/g, '_') || null;
};

// Convert breed to display name: 'golden_retriever' → 'Golden Retriever', 'indie' → 'Indie'
const getBreedDisplay = (pet) => {
  const breed = (pet?.breed || '').trim();
  if (!breed) return '';
  return breed.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// Food emoji lookup for Mira Imagines cards
const FOOD_EMOJIS = {
  salmon: '🐟', fish: '🐠', tuna: '🐡', chicken: '🍗', beef: '🥩',
  lamb: '🐑', duck: '🦆', cheese: '🧀', peanut: '🥜', banana: '🍌',
  carrot: '🥕', blueberry: '🫐', strawberry: '🍓', mango: '🥭',
  vanilla: '🍦', coconut: '🥥', pumpkin: '🎃', sweet: '🍠',
};
const getFoodEmoji = (food) => {
  const f = (food || '').toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (f.includes(key)) return emoji;
  }
  return '✨';
};

// Extract loved foods from pet.learned_facts (handles multiple fact formats)
const getLovedFoods = (pet) => {
  const facts = pet?.learned_facts || [];
  if (!Array.isArray(facts)) return [];
  const foods = [];
  for (const f of facts) {
    // Format 1: {type:'loves', category:'preferences', value:'salmon treats'}
    if ((f.type === 'loves' || f.type === 'likes') && f.category === 'preferences' && f.value) {
      foods.push(f.value);
    }
    // Format 2: {category:'loves', content:"Loves ['salmon']"} (no type field)
    else if (f.category === 'loves' && f.content) {
      const match = f.content.match(/['"]([\w\s]+)['"]/);
      if (match) foods.push(match[1]);
      else {
        // fallback: grab value after "Loves " 
        const val = f.content.replace(/^loves\s*/i, '').replace(/[\[\]'"]/g, '').trim();
        if (val && val.length > 1) foods.push(val);
      }
    }
    // Format 3: {type:'loves'} with value field regardless of category
    else if ((f.type === 'loves' || f.type === 'likes') && f.value) {
      foods.push(f.value);
    }
  }
  return [...new Set(foods.filter(Boolean))];
};

// Helper to extract ALL soul traits from pet data (activities, likes, personality)
const extractSoulTraits = (pet) => {
  const traits = [];

  // From learned_facts (handles multiple formats)
  if (Array.isArray(pet?.learned_facts)) {
    for (const f of pet.learned_facts) {
      const val = f.value || f.fact || '';
      if (f.type === 'activity' || f.type === 'preference' || f.type === 'likes' || f.type === 'loves' || f.type === 'prefers') {
        if (val) traits.push(val);
      }
      // Format 2: category='loves', content="Loves ['tennis ball']"
      if (f.category === 'loves' && f.content && !val) {
        const match = f.content.match(/['"]([\w\s]+)['"]/);
        if (match) traits.push(match[1]);
      }
    }
  }

  // From soul object
  if (pet?.soul) {
    const s = pet.soul;
    if (s.loves) traits.push(...(Array.isArray(s.loves) ? s.loves : [s.loves]));
    if (s.likes) traits.push(...(Array.isArray(s.likes) ? s.likes : [s.likes]));
    if (s.activities) traits.push(...(Array.isArray(s.activities) ? s.activities : [s.activities]));
    if (s.play_style) traits.push(...(Array.isArray(s.play_style) ? s.play_style : [s.play_style]));
    if (s.personality_traits) traits.push(...(Array.isArray(s.personality_traits) ? s.personality_traits : [s.personality_traits]));
    if (s.favorite_activities) traits.push(...(Array.isArray(s.favorite_activities) ? s.favorite_activities : [s.favorite_activities]));
  }

  // From direct pet fields
  if (pet?.likes) traits.push(...(Array.isArray(pet.likes) ? pet.likes : [pet.likes]));
  if (pet?.loves) traits.push(...(Array.isArray(pet.loves) ? pet.loves : [pet.loves]));
  if (pet?.favorite_activities) traits.push(...(Array.isArray(pet.favorite_activities) ? pet.favorite_activities : []));

  // Flatten, dedupe, clean
  return [...new Set(
    traits.flat()
      .map(t => (typeof t === 'string' ? t : (t?.name || t?.value || '')).trim())
      .filter(v => v && v.length > 1)
  )];
};

// ── Category → API mapping ────────────────────────────────────────────────
// `cakes` = actual TDB bakery cakes (111 products)
// `celebration` = celebration kits/packages (NOT cakes — don't use for Birthday Cakes)
const CATEGORY_API = {
  'birthday-cakes':  [{ url: '/api/products?category=cakes&limit=80', key: 'products' }],
  'breed-cakes':     [{ url: '/api/products?category=breed-cakes&limit=60', key: 'products' }],
  'pupcakes':        [
    { url: '/api/products?category=dognuts&limit=40', key: 'products' },
    { url: '/api/products?category=pupcakes&limit=20', key: 'products' },
  ],
  'desi-treats':     [{ url: '/api/products?category=desi-treats&limit=30', key: 'products' }],
  'frozen-treats':   [{ url: '/api/products?category=frozen-treats&limit=40', key: 'products' }],
  'party':           [
    { url: '/api/products?category=party_accessories&limit=20', key: 'products' },
    { url: '/api/products?category=party_kits&limit=20', key: 'products' },
    { url: '/api/products?category=celebration_addons&limit=20', key: 'products' },
    { url: '/api/products?category=party_supplies&limit=10', key: 'products' },
    { url: '/api/products?category=breed-party_hats&limit=40', key: 'products' },  // Breed-specific party hats
  ],
  'nut-butters':     [{ url: '/api/products?category=nut-butters&limit=20', key: 'products' }],
  'hampers':         [{ url: '/api/products?category=hampers&limit=50', key: 'products' }],
  'bundles':         [{ url: '/api/celebrate/bundles', key: 'bundles' }],
  'soul-picks':      [],  // handled separately with breed endpoint
  'soul_made':       [],  // handled separately with breed endpoint
  'miras-picks':     [{ url: '/api/products?category=cakes&limit=60', key: 'products' }], // breed-filtered client-side
};

// Fallback if primary category yields nothing
const FALLBACK_API = '/api/products?category=cakes&limit=20';

// ── Mira whisper text per category ───────────────────────────────────────
const MIRA_WHISPERS = {
  'birthday-cakes': (n) => `🎂 Cake explored — ${n}'s birthday is taking shape`,
  'breed-cakes':    (n) => `🐕 Breed cake found — made just for ${n}`,
  'pupcakes':       (n) => `🧁 Treats explored — ${n} is going to love these`,
  'desi-treats':    (n) => `🪔 Desi flavours explored for ${n}`,
  'frozen-treats':  (n) => `🧊 Cool treats explored — ${n} approved!`,
  'hampers':        (n) => `🎁 Hamper explored — ${n}'s gift is looking beautiful`,
  'bundles':        (n) => `🎀 Bundle explored — complete package for ${n}`,
  'party':          (n) => `🎉 Party decor explored for ${n}'s big day`,
  'nut-butters':    (n) => `🥜 Nut butter found — ${n}'s lick of the day`,
  'soul-picks':     (n) => `✨ Soul picks — made just for ${n}`,
  'soul_made':      (n) => `✦ Want something truly unique for ${n}? Upload a photo — Concierge® creates it.`,
  'miras-picks':    (n) => `🌟 Mira curated these just for ${n}`,
};

const CTA_LABELS = {
  'birthday-cakes': (n) => `Build ${n}'s Birthday Plan →`,
  'breed-cakes':    (n) => `Plan ${n}'s Breed Celebration →`,
  'pupcakes':       (n) => `Add to ${n}'s Treat List →`,
  'desi-treats':    (n) => `Plan ${n}'s Desi Spread →`,
  'frozen-treats':  (n) => `Plan ${n}'s Cool Treats →`,
  'hampers':        (n) => `Create ${n}'s Gift Hamper →`,
  'bundles':        (n) => `Customise ${n}'s Bundle →`,
  'party':          (n) => `Plan ${n}'s Pawty Setup →`,
  'nut-butters':    (n) => `Add to ${n}'s Pantry →`,
  'soul-picks':     (n) => `Build ${n}'s Soul Box →`,
  'soul_made':      (n) => `Make it personal for ${n} →`,
  'miras-picks':    (n) => `Start ${n}'s Celebration →`,
};

// ── BundleCard + BundleDetailSheet ────────────────────────────────────────
const BundleDetailSheet = ({ bundle, pet, onClose }) => {
  const petName = pet?.name || 'your pet';
  const img = bundle.image_url || bundle.image || (Array.isArray(bundle.images) ? bundle.images[0] : bundle.images);

  return (
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 70 }} onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white"
        style={{ zIndex: 71, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header with drag handle + X */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 pt-3 pb-2"
          style={{ zIndex: 1, borderBottom: '1px solid #F5F0FF' }}>
          <div className="flex-1 flex justify-center">
            <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
            data-testid="bundle-detail-close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Bundle image - full display, no crop */}
        {img && (
          <div className="w-full bg-gray-50" style={{ minHeight: 200 }}>
            <img src={img} alt={bundle.name} className="w-full"
              style={{ maxHeight: 320, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>
        )}
        <div className="p-6">
          <div className="inline-block rounded-full text-white text-xs font-bold mb-3"
            style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', padding: '3px 12px' }}>
            Curated for {petName}
          </div>
          <h3 className="font-extrabold text-2xl mb-2" style={{ color: '#1A0A00' }}>{bundle.name}</h3>
          {bundle.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{bundle.description}</p>
          )}
          {bundle.items?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What's inside</p>
              <div className="flex flex-wrap gap-2">
                {bundle.items.map((item, idx) => (
                  <span key={idx} className="rounded-full px-3 py-1 text-sm"
                    style={{ background: 'rgba(196,77,255,0.08)', border: '1px solid rgba(196,77,255,0.20)', color: '#4B0082' }}>
                    {typeof item === 'string' ? item : item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-2xl font-extrabold" style={{ color: '#1A0A00' }}>
                ₹{(bundle.total_price || bundle.price || 0).toLocaleString('en-IN')}
              </span>
              {bundle.original_price && bundle.original_price > (bundle.total_price || bundle.price || 0) && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ₹{bundle.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('addToCart', { detail: { ...bundle, quantity: 1 } }));
                onClose();
              }}
              className="rounded-xl text-white font-bold px-6 py-3"
              style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', border: 'none', cursor: 'pointer' }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const BundleCard = ({ bundle, pet }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const img = bundle.image_url || bundle.image || bundle.images?.[0];
  const price = bundle.total_price || bundle.price || 0;

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        style={{ border: '1px solid #F0E8FF' }}
        onClick={() => setDetailOpen(true)}
        data-testid={`bundle-card-${bundle.id}`}
      >
        {img ? (
          <div className="relative bg-gray-50" style={{ paddingBottom: '75%' }}>
            <img src={img} alt={bundle.name}
              className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-purple-50" style={{ height: 140 }}>
            <span className="text-5xl">🎁</span>
          </div>
        )}
        <div className="p-3">
          {bundle.badge && (
            <span className="inline-block rounded-full text-xs font-bold mb-1"
              style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', color: 'white', padding: '2px 8px' }}>
              {bundle.badge}
            </span>
          )}
          <p className="font-bold text-sm mb-0.5 line-clamp-2" style={{ color: '#1A0A00' }}>{bundle.name}</p>
          {bundle.items?.length > 0 && (
            <p className="text-xs text-gray-500 line-clamp-1 mb-1">
              {bundle.items.slice(0, 3).map(i => typeof i === 'string' ? i : i.name).join(' · ')}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm" style={{ color: '#1A0A00' }}>
              ₹{price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs rounded-full px-2 py-0.5"
              style={{ background: 'rgba(196,77,255,0.10)', color: '#7C3AED', fontWeight: 600 }}>
              View
            </span>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {detailOpen && (
          <BundleDetailSheet bundle={bundle} pet={pet} onClose={() => setDetailOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Soul Picks Product Card — wraps ProductCard with "For {petName}" badge ─
const SoulPickCard = ({ product, pet, overrideImageUrl, artStyleLabel }) => {
  const petName = pet?.name || 'your pet';
  return (
    <div className="relative">
      <ProductCard product={product} pillar="celebrate" selectedPet={pet} size="small"
        overrideImageUrl={overrideImageUrl}
        artStyleLabel={artStyleLabel}
      />
      <span
        className="absolute top-2 left-2 text-white text-xs font-bold rounded-full px-2 py-0.5 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)', fontSize: 10, zIndex: 1 }}>
        For {petName}
      </span>
    </div>
  );
};

// ── Mira Imagines Card — custom request card for non-existent flavours ────
const MiraImaginesCard = ({ flavor, pet }) => {
  const petName = pet?.name || 'your pet';
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, token } = useAuth();

  // Handle both old format (string) and new format (object)
  const isObject = typeof flavor === 'object';
  const productType = isObject ? flavor.type : 'food';
  const productName = isObject ? flavor.name : `${flavor.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Birthday Cake`;
  const trait = isObject ? flavor.trait : `loves ${flavor}`;
  const description = isObject ? flavor.description : `Not in our collection yet — we can make it for ${petName}`;
  const emoji = isObject ? flavor.emoji : getFoodEmoji(flavor);
  const questions = isObject && flavor.questions ? flavor.questions : [];
  const isOnboarding = productType === 'onboarding';

  const handleRequest = async () => {
    if (isOnboarding) {
      setShowOnboarding(true);
      window.dispatchEvent(new CustomEvent('openSoulOnboarding', {
        detail: { pet, questions, source: 'mira_imagines' }
      }));
      return;
    }

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          parent_id: user?.id || user?.email || 'celebrate_guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'celebrate',
          intent_primary: 'mira_imagines_product',
          intent_secondary: [productType, 'custom_celebration_product'],
          life_state: 'celebrate',
          channel: 'celebrate_mira_imagines',
          initial_message: {
            sender: 'parent',
            source: 'celebrate_page',
            text: `Hi! I'd love a custom "${productName}" for ${petName}. Mira knows ${petName} ${trait}. Can you make this happen?`
          }
        })
      });
    } catch (err) {
      console.error('[MiraImaginesCard] Concierge ticket error:', err);
    } finally {
      setSending(false);
      setRequested(true);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden relative flex flex-col"
      style={{
        background: isOnboarding
          ? 'linear-gradient(135deg, #0A1A2E 0%, #1A3A5F 100%)'
          : 'linear-gradient(135deg, #1A0A00 0%, #3D1A5F 100%)',
        border: isOnboarding
          ? '1.5px solid rgba(100,200,255,0.3)'
          : '1.5px solid rgba(196,77,255,0.3)',
        minHeight: 220,
      }}
      data-testid={`mira-imagines-${isObject ? flavor.type : flavor}`}
    >
      {/* Mira badge */}
      <div className="absolute top-2 right-2 text-white text-xs font-bold rounded-full px-2 py-0.5"
        style={{
          background: isOnboarding ? 'rgba(100,200,255,0.6)' : 'rgba(196,77,255,0.6)',
          backdropFilter: 'blur(4px)',
          fontSize: 9
        }}>
        {isOnboarding ? 'Grow the Soul' : 'Mira Imagines'}
      </div>

      {/* Icon + sparkle */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4 flex-1">
        <div className="mb-2 relative">
          <span style={{ fontSize: 44 }}>{emoji}</span>
          <span className="absolute -top-1 -right-1" style={{ fontSize: 14 }}>✨</span>
        </div>
        <p className="font-extrabold text-center text-white leading-tight" style={{ fontSize: 13 }}>
          {productName}
        </p>
        <p className="text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>
          {description}
        </p>
        {!isOnboarding && trait && (
          <p className="text-center mt-1 italic" style={{ color: 'rgba(196,77,255,0.8)', fontSize: 9 }}>
            Because {petName} {trait}
          </p>
        )}
      </div>

      {/* Request button / confirmation — always pinned to bottom */}
      <div className="px-3 pb-4 mt-auto">
        {requested || showOnboarding ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl py-2"
            style={{
              background: isOnboarding ? 'rgba(100,200,255,0.2)' : 'rgba(50,200,120,0.25)',
              color: isOnboarding ? '#64C8FF' : '#32C878'
            }}>
            <Check className="w-3.5 h-3.5" />
            {isOnboarding ? 'Opening soul questions...' : 'Sent to Concierge!'}
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={sending}
            className="w-full text-white font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-1"
            style={{
              background: isOnboarding
                ? 'linear-gradient(135deg, #64C8FF, #4DA6FF)'
                : 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
              border: 'none',
              cursor: sending ? 'wait' : 'pointer',
              opacity: sending ? 0.7 : 1
            }}
            data-testid={`mira-request-${isObject ? flavor.type : flavor}`}
          >
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {isOnboarding ? 'Help Mira Know Me →' : 'Request a Quote →'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Soul Question Inline Card ─────────────────────────────────────────────────
const SoulQuestionCard = ({ question, petName, onAnswered }) => {
  const [selected, setSelected] = useState('');
  const [textValue, setTextValue] = useState('');
  const [multiSelected, setMultiSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pointsGained, setPointsGained] = useState(null);
  const { token } = useAuth();

  const handleSubmit = async () => {
    const answer = question.type === 'text' ? textValue
      : question.type === 'multi_select' ? multiSelected
      : selected;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/pet-soul/profile/${question.pet_id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ question_id: question.question_id, answer })
      });
      if (res.ok) {
        const data = await res.json();
        setPointsGained(question.weight || 3);
        setSubmitted(true);
        onAnswered?.(data.scores?.overall, question.weight || 3);
      }
    } catch (err) {
      console.error('[SoulQuestionCard] Error:', err);
      setPointsGained(question.weight || 3);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMulti = (opt) => {
    setMultiSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl px-4 py-5 flex flex-col items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #0D1A00 0%, #0A3020 100%)',
          border: '2px solid rgba(80,220,120,0.45)',
          minHeight: 160,
          boxShadow: '0 0 24px rgba(80,220,120,0.15)',
        }}>
        <div className="rounded-full flex items-center justify-center w-10 h-10 mb-1"
          style={{ background: 'rgba(80,220,120,0.18)', border: '2px solid rgba(80,220,120,0.5)' }}>
          <Check className="w-5 h-5" style={{ color: '#50DC78' }} />
        </div>
        <p className="font-extrabold text-center" style={{ color: '#50DC78', fontSize: 14, fontFamily: 'Manrope, sans-serif' }}>Soul score growing!</p>
        {pointsGained && (
          <div className="rounded-full px-3 py-1 font-bold" style={{ background: 'rgba(80,220,120,0.15)', color: '#50DC78', fontSize: 11, border: '1px solid rgba(80,220,120,0.3)' }}>
            +{pointsGained} pts added
          </div>
        )}
        <p className="text-center" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
          Mira now knows {petName} better ✦
        </p>
      </motion.div>
    );
  }

  const hasAnswer = selected || textValue.trim() || multiSelected.length > 0;

  return (
    <div className="rounded-2xl px-4 py-4"
      style={{
        background: 'linear-gradient(135deg, #12003A 0%, #2D0060 100%)',
        border: '1.5px solid rgba(196,77,255,0.35)',
        minHeight: 160,
        boxShadow: '0 4px 20px rgba(196,77,255,0.15)',
      }}>
      {/* Folder label + weight */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 12 }}>{question.folder_icon || '✦'}</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(196,77,255,0.85)', fontFamily: 'Manrope, sans-serif' }}>
            {question.folder_name}
          </span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: 'rgba(196,77,255,0.18)', color: '#D47FFF', fontSize: 9, border: '1px solid rgba(196,77,255,0.3)' }}>
          +{question.weight || 3} pts
        </span>
      </div>

      {/* Question */}
      <p className="font-bold leading-snug mb-3" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontFamily: 'Manrope, sans-serif' }}>
        {question.question}
      </p>

      {question.type === 'text' && (
        <textarea
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          placeholder="Type here..."
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(196,77,255,0.4)',
            color: 'rgba(255,255,255,0.88)',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      )}

      {question.type === 'select' && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(question.options || []).map(opt => (
            <button key={opt} onClick={() => setSelected(opt)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                background: selected === opt ? 'rgba(196,77,255,0.30)' : 'rgba(255,255,255,0.06)',
                border: selected === opt ? '1.5px solid #C44DFF' : '1px solid rgba(255,255,255,0.18)',
                color: selected === opt ? '#F0AAFF' : 'rgba(255,255,255,0.70)',
                cursor: 'pointer',
                transform: selected === opt ? 'scale(1.04)' : 'scale(1)',
                transition: 'background 0.15s, border 0.15s, transform 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi_select' && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(question.options || []).slice(0, 6).map(opt => (
            <button key={opt} onClick={() => toggleMulti(opt)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                background: multiSelected.includes(opt) ? 'rgba(196,77,255,0.30)' : 'rgba(255,255,255,0.06)',
                border: multiSelected.includes(opt) ? '1.5px solid #C44DFF' : '1px solid rgba(255,255,255,0.18)',
                color: multiSelected.includes(opt) ? '#F0AAFF' : 'rgba(255,255,255,0.70)',
                cursor: 'pointer',
                transition: 'background 0.15s, border 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !hasAnswer}
        className="mt-2 w-full rounded-xl py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5"
        style={{
          background: !hasAnswer
            ? 'rgba(196,77,255,0.18)'
            : 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
          border: 'none',
          cursor: submitting ? 'wait' : (!hasAnswer ? 'not-allowed' : 'pointer'),
          boxShadow: hasAnswer ? '0 4px 16px rgba(196,77,255,0.40)' : 'none',
          opacity: submitting ? 0.7 : 1,
          fontFamily: 'Manrope, sans-serif',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}>
        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Save +{question.weight || 3} pts
      </button>
    </div>
  );
};

// ── Soul Questions Section ─────────────────────────────────────────────────────
// ── OccasionCountdownCard — shows upcoming birthday/gotcha/festival ─────
const OccasionCountdownCard = ({ pet, petName }) => {
  const [occasion, setOccasion] = useState(null);

  useEffect(() => {
    if (!pet) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = (dateStr, label, emoji) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d)) return null;
      // Set to this year or next
      d.setFullYear(today.getFullYear());
      if (d < today) d.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((d - today) / 86400000);
      if (diff <= 45) return { label, emoji, daysLeft: diff, date: d };
      return null;
    };
    // Check birthday and gotcha_date
    const events = [
      checkDate(pet.birthday, `${petName}'s Birthday`, '🎂'),
      checkDate(pet.gotcha_date, `${petName}'s Gotcha Day`, '🐾'),
    ].filter(Boolean);
    // Also check celebration_preferences for custom occasions
    const prefs = pet?.doggy_soul_answers?.celebration_preferences;
    if (Array.isArray(prefs)) {
      // Map festival names to approximate dates (India-focused)
      const festivalDates = {
        'Diwali': `${today.getFullYear()}-10-20`,
        'Holi': `${today.getFullYear()}-03-14`,
        'Christmas': `${today.getFullYear()}-12-25`,
        'New Year': `${today.getFullYear()}-01-01`,
      };
      for (const pref of prefs) {
        if (festivalDates[pref]) {
          const ev = checkDate(festivalDates[pref], `${pref} with ${petName}`, '✨');
          if (ev) events.push(ev);
        }
      }
    }
    // Pick the nearest upcoming event
    events.sort((a, b) => a.daysLeft - b.daysLeft);
    setOccasion(events[0] || null);
  }, [pet, petName]);

  if (!occasion) return null;

  const { label, emoji, daysLeft } = occasion;
  const isToday = daysLeft === 0;
  const isSoon = daysLeft <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-4 py-4 mb-4"
      style={{
        background: 'linear-gradient(135deg, #1A0020 0%, #3D0060 100%)',
        border: `1.5px solid ${isSoon ? 'rgba(240,192,96,0.6)' : 'rgba(196,77,255,0.45)'}`,
        boxShadow: isSoon ? '0 0 24px rgba(240,192,96,0.2)' : '0 0 18px rgba(196,77,255,0.15)',
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 28 }}>{emoji}</span>
          <div>
            <p className="font-extrabold" style={{ color: isSoon ? '#F0C060' : 'rgba(255,255,255,0.92)', fontSize: 11, fontFamily: 'Manrope, sans-serif' }}>
              {isToday ? `Today is ${label}!` : `${label} in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
              Mira has prepared something special ✦
            </p>
          </div>
        </div>
        <span className="rounded-full px-2 py-1 font-black"
          style={{
            background: isSoon ? 'rgba(240,192,96,0.2)' : 'rgba(196,77,255,0.2)',
            color: isSoon ? '#F0C060' : '#D47FFF',
            fontSize: 10, border: `1px solid ${isSoon ? 'rgba(240,192,96,0.4)' : 'rgba(196,77,255,0.3)'}`,
            fontFamily: 'Manrope, sans-serif',
          }}>
          {isToday ? '🎉 TODAY' : `${daysLeft}d`}
        </span>
      </div>
    </motion.div>
  );
};

// ── PetWrap Teaser Card ─────────────────────────────────────────────────
const PetWrapTeaser = ({ pet }) => {
  const [wrapData, setWrapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const petId = pet?.id;

  useEffect(() => {
    if (!petId) { setLoading(false); return; }
    fetch(`${getApiUrl()}/api/wrapped/generate/${petId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setWrapData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [petId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/wrapped/${petId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${pet?.name}'s PetWrap`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  };

  if (loading || !wrapData) return null;
  
  const score = wrapData?.cards?.soul_score?.current_score ?? wrapData?.soul_score ?? pet?.overall_score ?? pet?.soul_score ?? 0;
  const archetype = wrapData?.archetype_name || wrapData?.cards?.cover?.archetype_name || pet?.soul_archetype?.archetype_name || '';
  const archetypeEmoji = wrapData?.archetype_emoji || wrapData?.cards?.cover?.archetype_emoji || pet?.soul_archetype?.archetype_emoji || '✦';
  const year = wrapData?.year || new Date().getFullYear();
  const petName = pet?.name || 'Your Pet';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-4 py-4 mb-4"
      style={{
        background: 'linear-gradient(135deg, #0D0020 0%, #1A0040 50%, #3D0060 100%)',
        border: '1.5px solid rgba(196,77,255,0.4)',
        boxShadow: '0 0 28px rgba(196,77,255,0.12)',
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{archetypeEmoji}</span>
          <div>
            <p className="font-extrabold" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 11, fontFamily: 'Manrope, sans-serif' }}>
              {petName}'s {year} PetWrap
            </p>
            {archetype && (
              <p style={{ color: 'rgba(196,77,255,0.8)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
                Soul Archetype: {archetype}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-black" style={{ color: '#C44DFF', fontSize: 20, fontFamily: 'Manrope, sans-serif' }}>
            {Math.round(score)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>%</span>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={`/wrapped/${petId}`} target="_blank" rel="noreferrer"
          className="flex-1 rounded-xl py-1.5 text-xs font-bold text-center"
          style={{
            background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
            color: '#fff', textDecoration: 'none',
            fontFamily: 'Manrope, sans-serif',
            boxShadow: '0 4px 12px rgba(196,77,255,0.35)',
          }}>
          View Full Wrap ✦
        </a>
        <button onClick={handleShare}
          className="rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1"
          style={{
            background: 'rgba(196,77,255,0.15)',
            border: '1px solid rgba(196,77,255,0.35)',
            color: shared ? '#50DC78' : '#D47FFF',
            cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
          }}>
          {shared ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
          {shared ? 'Copied!' : 'Share'}
        </button>
      </div>
    </motion.div>
  );
};

const SoulQuestionsSection = ({ pet, onScoreUpdated, onRefreshMiraCards }) => {
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPtsGained, setTotalPtsGained] = useState(0);
  const petName = pet?.name || 'your pet';
  // Imperative animation controls for score pop (no remount/bounce)
  const scoreControls = useAnimation();
  const prevScoreRef = useRef(null);

  // Trigger gentle pop when score changes (no key-remount bounce)
  useEffect(() => {
    if (score !== null && prevScoreRef.current !== null && score !== prevScoreRef.current) {
      scoreControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.4, ease: 'easeOut' } });
    }
    prevScoreRef.current = score;
  }, [score, scoreControls]);

  const loadQuestions = useCallback(() => {
    if (!pet?.id) { setLoading(false); return; }
    fetch(`${getApiUrl()}/api/pet-soul/profile/${pet.id}/quick-questions?limit=5&context=celebrate`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          setScore(s => {
            if (s === null) setPrevScore(data.current_score);
            return data.current_score;
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pet?.id]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleAnswered = useCallback((newScore, pts) => {
    setAnsweredCount(prev => prev + 1);
    setTotalPtsGained(prev => prev + (pts || 0));
    if (newScore !== undefined) {
      setPrevScore(score);
      setScore(newScore);
      onScoreUpdated?.(newScore);
      window.dispatchEvent(new CustomEvent('soulScoreUpdated', { detail: { petId: pet.id, score: newScore } }));
    }
    // Refresh questions AND Mira imagines after short delay
    setTimeout(() => {
      loadQuestions();
      onRefreshMiraCards?.();
    }, 800);
  }, [score, pet?.id, onScoreUpdated, onRefreshMiraCards, loadQuestions]);

  const visibleQuestions = questions.slice(0, Math.max(0, 5 - answeredCount));

  if (loading) return null;
  if (visibleQuestions.length === 0 && answeredCount === 0) return null;

  const scoreDelta = (score !== null && prevScore !== null) ? score - prevScore : null;
  const isGold = score >= 80;

  return (
    <div className="mb-6">
      {/* Big Soul Score Header — deep purple, constant glow */}
      <div className="rounded-2xl px-5 py-5 mb-4"
        style={{
          background: 'linear-gradient(135deg, #1A0020 0%, #3D0060 100%)',
          border: '1.5px solid rgba(196,77,255,0.45)',
          boxShadow: '0 0 32px rgba(196,77,255,0.18)',
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold uppercase tracking-widest mb-1"
              style={{ color: 'rgba(196,77,255,0.85)', fontSize: 9, letterSpacing: '0.14em', fontFamily: 'Manrope, sans-serif' }}>
              ✦ GROW {petName.toUpperCase()}'S SOUL
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
              Answer quick questions • {visibleQuestions.length} remaining
            </p>
          </div>

          {/* Score — constant infinite glow pulse, no bounce/remount */}
          <div className="flex flex-col items-end">
            <div className="relative flex items-end gap-0.5">
              <motion.div
                animate={scoreControls}
                className="font-black"
                style={{ fontSize: 64, lineHeight: 1, fontFamily: 'Manrope, sans-serif', color: isGold ? '#F0C060' : '#C44DFF' }}>
                {/* Constant glow overlay pulse — never stops */}
                <motion.span
                  animate={{
                    textShadow: isGold
                      ? ['0 0 16px rgba(240,192,96,0.45)', '0 0 48px rgba(240,192,96,0.9)', '0 0 16px rgba(240,192,96,0.45)']
                      : ['0 0 16px rgba(196,77,255,0.45)', '0 0 48px rgba(196,77,255,0.9)', '0 0 16px rgba(196,77,255,0.45)'],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ color: isGold ? '#F0C060' : '#C44DFF', fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: 64, lineHeight: 1 }}>
                  {score ?? '--'}
                </motion.span>
              </motion.div>
              <span className="font-bold mb-2"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
                %
              </span>
            </div>

            {/* Score delta badge */}
            {scoreDelta !== null && scoreDelta > 0 && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-full px-2.5 py-0.5 font-bold"
                style={{ background: 'rgba(80,220,120,0.2)', color: '#50DC78', fontSize: 9, border: '1px solid rgba(80,220,120,0.35)', fontFamily: 'Manrope, sans-serif' }}>
                +{scoreDelta.toFixed(1)}% this session
              </motion.div>
            )}

            {/* Animated progress bar */}
            <div className="w-16 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)', height: 4 }}>
              <motion.div
                initial={{ width: `${prevScore ?? score}%` }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: isGold ? 'linear-gradient(90deg, #C44DFF, #F0C060)' : 'linear-gradient(90deg, #C44DFF, #FF6B9D)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Answered banner */}
      {answeredCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(80,220,120,0.08)',
            border: '1px solid rgba(80,220,120,0.25)',
          }}>
          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#50DC78' }} />
          <p className="text-xs font-semibold" style={{ color: '#50DC78', fontFamily: 'Manrope, sans-serif' }}>
            {answeredCount} answer{answeredCount > 1 ? 's' : ''} saved! +{totalPtsGained} pts — Soul score: {score}%
          </p>
        </motion.div>
      )}

      {/* Question Cards */}
      {visibleQuestions.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))' }}>
          {visibleQuestions.map(q => (
            <SoulQuestionCard key={q.question_id} question={q} petName={petName} onAnswered={handleAnswered} />
          ))}
        </div>
      )}

      {visibleQuestions.length === 0 && answeredCount > 0 && (
        <div className="text-center py-4">
          <p className="text-xs font-semibold" style={{ color: 'rgba(196,77,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
            Loading next questions...
          </p>
        </div>
      )}

      <div className="mt-3 text-center">
        <a href={`/pet-soul/${pet?.id}`}
          className="text-xs font-semibold"
          style={{ color: 'rgba(196,77,255,0.7)', textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>
          See full soul profile →
        </a>
      </div>
    </div>
  );
};
export const CATEGORY_CONFIG = {
  'birthday-cakes': {
    emoji: '🎂', label: 'Birthday Cakes',
    miraLabel: "Mira's Pick for your breed",
    emptyText: 'Our bakers are preparing fresh cakes. Check back soon!'
  },
  'breed-cakes': {
    emoji: '🐕', label: 'Breed Cakes',
    miraLabel: 'Made for your breed',
    emptyText: 'Breed-specific cakes coming soon!'
  },
  'pupcakes': {
    emoji: '🧁', label: 'Pupcakes & Dognuts',
    miraLabel: "Small bites, big love",
    emptyText: 'Pupcakes baking now!'
  },
  'desi-treats': {
    emoji: '🪔', label: 'Desi Treats',
    miraLabel: 'Indian flavours your pup loves',
    emptyText: 'Desi treats coming soon!'
  },
  'frozen-treats': {
    emoji: '🧊', label: 'Frozen Treats',
    miraLabel: 'Cool & delicious',
    emptyText: 'Frozen treats coming soon!'
  },
  'party': {
    emoji: '🎉', label: 'Party & Decor',
    miraLabel: 'Dress up the pawty!',
    emptyText: 'Party supplies coming soon!'
  },
  'nut-butters': {
    emoji: '🥜', label: 'Nut Butters',
    miraLabel: 'Lick-worthy spreads',
    emptyText: 'Nut butters coming soon!'
  },
  'hampers': {
    emoji: '🎁', label: 'Gift Hampers',
    miraLabel: 'Curated hamper sets',
    emptyText: 'Hampers being curated!'
  },
  'bundles': {
    emoji: '🎀', label: 'Celebration Bundles',
    miraLabel: 'Complete celebration packages',
    emptyText: 'Bundles being assembled!'
  },
  'soul-picks': {
    emoji: '✨', label: 'Soul Picks',
    miraLabel: 'Made just for your dog',
    emptyText: "Personalised picks coming for your pup!"
  },
  'soul_made': {
    emoji: '✦', label: 'Soul Made™',
    miraLabel: 'Custom-made for your dog',
    emptyText: "Upload a photo and Concierge® will create it!"
  },
  'miras-picks': {
    emoji: '🌟', label: "Mira's Picks",
    miraLabel: 'Soul-curated by Mira',
    emptyText: 'Mira is curating your picks!'
  },
};

// ── Main Modal ──────────────────────────────────────────────────────────────
const CelebrateContentModal = ({ isOpen, onClose, category, pet }) => {
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [breedProducts, setBreedProducts] = useState([]);
  const [flatArtProducts, setFlatArtProducts] = useState([]);
  const [yappyIllustrations, setYappyIllustrations] = useState([]);
  const [artStyle, setArtStyle] = useState('watercolour');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [addedCount, setAddedCount] = useState(0); // tracks items added this session
  const [miraImagines, setMiraImagines] = useState([]); // imaginary cards for non-existent flavours
  const [liveSoulScore, setLiveSoulScore] = useState(null); // live soul score updated by inline questions
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);

  // Reset on new category open
  useEffect(() => {
    if (isOpen) {
      setAddedCount(0);
      setMiraImagines([]);
    }
  }, [isOpen, category]);

  // Listen for addToCart events to update the Mira whisper state
  useEffect(() => {
    if (!isOpen) return;
    const onAdd = () => setAddedCount(prev => prev + 1);
    window.addEventListener('addToCart', onAdd);
    return () => window.removeEventListener('addToCart', onAdd);
  }, [isOpen]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config = CATEGORY_CONFIG[category] || {
    emoji: '🛒', label: category || 'Products',
    miraLabel: 'Curated for you',
    emptyText: 'Products loading...'
  };
  const petName = pet?.name || 'your pet';
  const breedSlug = getBreedSlug(pet);

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setBundles([]);
    setBreedProducts([]);
    setFlatArtProducts([]);
    setYappyIllustrations([]);
    setArtStyle('watercolour');

    try {
      const apiUrl = getApiUrl();

      // ── Soul Picks: breed-specific celebrate merchandise from breed_products ─
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedKey = breedDisplay.toLowerCase().replace(/\s+/g,'_').replace(/[()]/g,'');
        try {
          const res = await fetch(
            `${apiUrl}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&pillar=celebrate&limit=20`
          );
          const data = res.ok ? await res.json() : { products: [] };
          const prods = (data.products || []).filter(p => {
            const url = p.mockup_url || p.cloudinary_url || '';
            return url.split('/').pop().startsWith('breed-');
          });
          setBreedProducts(prods);
        } catch { setBreedProducts([]); }
        setLoading(false);
        return;
      }

      // ── Soul Made™: breed products for custom orders ────────────────
      if (category === 'soul_made') {
        const breedDisplay = getBreedDisplay(pet);
        const breedKey = breedDisplay.toLowerCase().replace(/\s+/g,'_').replace(/[()]/g,'');
        try {
          const [res1, res2, res3] = await Promise.all([
            fetch(`${apiUrl}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&pillar=celebrate&limit=20`),
            fetch(`${apiUrl}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&flat_only=true&limit=40`),
            fetch(`${apiUrl}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&product_type=birthday_cake&limit=3`),
          ]);
        const data1 = res1.ok ? await res1.json() : { products: [] };
          const data2 = res2.ok ? await res2.json() : { products: [] };
          const data3 = res3.ok ? await res3.json() : { products: [] };
          // Filter out birthday_cake — those are illustrations, not orderable products
          setBreedProducts((data1.products || []).filter(p => p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'));
          setFlatArtProducts(data2.products || []);
          setYappyIllustrations(data3.products || []);
          setArtStyle('watercolour');
        } catch { setBreedProducts([]); setFlatArtProducts([]); setYappyFaceUrl(null); }
        setLoading(false);
        return;
      }

      // ── Bundles ──────────────────────────────────────────────────────
      if (category === 'bundles') {
        const r = await fetch(`${apiUrl}/api/celebrate/bundles`);
        if (r.ok) {
          const d = await r.json();
          setBundles(d.bundles || []);
        }
        setLoading(false);
        return;
      }

      // ── Mira's Picks: breed-aware + imaginary soul-based cards ───────────
      if (category === 'miras-picks') {
        const petName = pet?.name || 'your pet';
        const r = await fetch(`${apiUrl}/api/products?category=cakes&limit=80`);
        if (r.ok) {
          const d = await r.json();
          const allCakes = d.products || [];
          const breedDisplay = getBreedDisplay(pet);
          const breedSearch = breedDisplay.toLowerCase();

          // 1. Get breed-specific picks (Indie cakes, Golden cakes, etc.)
          let breedCakes = breedSearch
            ? allCakes.filter(p => (p.name || '').toLowerCase().includes(breedSearch))
            : [];

          // 2. Mira Imagines: Create cards based on soul data + archetype
          const lovedFoods = getLovedFoods(pet);
          const allergies = (pet?.allergies || []).map(a => a.toLowerCase());
          const soulTraits = extractSoulTraits(pet);
          const soulAnswers = pet?.doggy_soul_answers || {};
          const archetype = (pet?.soul_archetype?.primary_archetype || pet?.soul_archetype || '').toLowerCase();
          const imaginaryProducts = [];
          
          // A) Food-based imaginary cakes + treat hampers from learned_facts & soul answers
          const favProtein = soulAnswers.favorite_protein || soulAnswers.fav_protein;
          const favTreat = soulAnswers.treat_preference;
          const allFoodSources = [...lovedFoods];
          if (favProtein && !allFoodSources.includes(favProtein)) allFoodSources.unshift(favProtein);
          
          const seenFoodKeys = new Set();
          const foodImaginary = allFoodSources.filter(food => {
            const f = food.toLowerCase().replace(/\s*(treat|cake|food)s?\b/g, '').trim();
            if (!f || f.length < 3) return false;
            if (seenFoodKeys.has(f)) return false;
            seenFoodKeys.add(f);
            if (allergies.some(a => f.includes(a))) return false;
            return !allCakes.some(c => (c.name || '').toLowerCase().includes(f));
          });
          
          for (const food of foodImaginary.slice(0, 2)) {
            // Remove redundant 'treats/cake/food' suffixes from the raw food string for clean labels
            const cleanFood = food.replace(/\s*(treat|cake|food)s?\b/gi, '').trim();
            const label = cleanFood.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            imaginaryProducts.push({
              type: 'food',
              name: `${label} Celebration Cake`,
              trait: `loves ${food}`,
              description: `Mira imagines a delicious ${cleanFood} cake just for ${petName}`,
              emoji: getFoodEmoji(cleanFood)
            });
            // Also suggest a treat hamper if crunchy or soft preference
            if (favTreat && imaginaryProducts.length < 4) {
              imaginaryProducts.push({
                type: 'food',
                name: `${label} Treat Hamper`,
                trait: `loves ${food} treats`,
                description: `A curated hamper of ${cleanFood} treats for ${petName}'s celebration`,
                emoji: '🎁'
              });
            }
          }
          
          // B) Archetype-based imaginary products
          const ARCHETYPE_IMAGINATIONS = {
            'gentle_aristocrat':  [
              { name: 'Luxury Birthday Hamper', emoji: '👑', desc: 'A premium, elegant celebration for the refined soul' },
              { name: 'Velvet Bow Tie & Crown Set', emoji: '✨', desc: 'The ultimate elegant birthday accessory' },
            ],
            'wild_explorer': [
              { name: 'Adventure Birthday Kit', emoji: '🏕️', desc: 'Outdoor-ready celebration for the explorer' },
              { name: 'Durable Rope Tug Gift Set', emoji: '🌿', desc: 'Built for the wild one\'s celebrations' },
            ],
            'velcro_baby': [
              { name: 'Comfort Snuggle Birthday Pack', emoji: '🤗', desc: 'A cozy, warm celebration for your velcro baby' },
              { name: 'Mom\'s Scent Comfort Toy', emoji: '🧸', desc: 'The ultimate comfort gift' },
            ],
            'social_butterfly': [
              { name: 'Pawty Decoration Kit', emoji: '🎉', desc: 'Everything for a big, joyful pawty' },
              { name: 'Group Treat Bag for Friends', emoji: '🦋', desc: 'Share the joy with all the pals' },
            ],
            'foodie_gourmet': [
              { name: 'Gourmet Birthday Tasting Kit', emoji: '🍴', desc: 'A curated tasting experience for the foodie' },
              { name: 'Custom Recipe Celebration Cake', emoji: '👨‍🍳', desc: 'Chef-designed just for the palate of your pup' },
            ],
            'zen_philosopher': [
              { name: 'Calm Birthday Wellness Box', emoji: '🧘', desc: 'A mindful, peaceful celebration' },
              { name: 'Aromatherapy Treat Bundle', emoji: '🌿', desc: 'Gentle, soothing celebration essentials' },
            ],
          };
          
          const archetypeCards = ARCHETYPE_IMAGINATIONS[archetype] || [];
          // Always include at least 1 archetype card, regardless of how many food items
          const archetypeSlots = Math.max(1, Math.min(2, 5 - imaginaryProducts.length));
          for (const card of archetypeCards.slice(0, archetypeSlots)) {
            imaginaryProducts.push({ type: 'archetype', name: card.name, trait: archetype, description: card.desc + ` for ${petName}`, emoji: card.emoji });
          }
          
          // C) Activity-based imaginary products (toys, kits)
          const motivationType = soulAnswers.motivation_type || '';
          const activityMap = {
            'toys': { name: 'Birthday Toy Surprise Box', emoji: '🎁', desc: 'A whole box of new toys to unwrap' },
            'fetch': { name: 'Ultimate Fetch Party Kit', emoji: '🎯', desc: 'Party gear for the fetch-obsessed pup' },
            'swimming': { name: 'Pool Party Celebration Kit', emoji: '🏊', desc: 'Splash-ready birthday celebration' },
            'cuddles': { name: 'Cozy Cuddle Birthday Box', emoji: '🥰', desc: 'Extra snuggly celebration' },
            'squeaky': { name: 'Squeaky Toy Birthday Box', emoji: '🧸', desc: 'Musical celebration kit' },
            'running': { name: 'Zoomies Party Kit', emoji: '🏃', desc: 'High-energy celebration' },
          };
          const allSoulSources = [...soulTraits, motivationType];
          for (const trait of allSoulSources) {
            const tl = trait.toLowerCase();
            for (const [key, product] of Object.entries(activityMap)) {
              if (tl.includes(key) && imaginaryProducts.length < 4) {
                imaginaryProducts.push({
                  type: 'activity', name: product.name, trait: trait,
                  description: product.desc + ` for ${petName}`, emoji: product.emoji
                });
                break;
              }
            }
          }
          
          // D) Soul Onboarding card if no data at all
          if (imaginaryProducts.length === 0) {
            imaginaryProducts.push({
              type: 'onboarding',
              name: `Help Mira know ${petName} better`,
              trait: 'soul_incomplete',
              description: 'Answer a few questions so Mira can imagine perfect celebrations',
              emoji: '✨'
            });
          }
          
          setMiraImagines(imaginaryProducts.slice(0, 4));

          // 3. IMPORTANT: Show breed-specific cakes FIRST, then others
          const finalCakes = breedCakes.length > 0
            ? [...breedCakes.slice(0, 6), ...allCakes.filter(c => !breedCakes.includes(c)).slice(0, 6)]
            : allCakes.slice(0, 12);
          setProducts(finalCakes);
        }
        setLoading(false);
        return;
      }

      // ── Normal categories ─────────────────────────────────────────────
      const apis = CATEGORY_API[category] || [];
      let allProducts = [];
      // For multi-source categories, fetch all endpoints; for single source, break on first success
      const fetchAll = ['party'].includes(category);
      for (const api of apis) {
        const r = await fetch(`${apiUrl}${api.url}`);
        if (r.ok) {
          const d = await r.json();
          const items = d[api.key] || [];
          allProducts = [...allProducts, ...items];
        }
        if (!fetchAll && allProducts.length > 0) break;
      }

      // Fallback: if no products found, fetch general celebration
      if (allProducts.length === 0) {
        const r = await fetch(`${apiUrl}${FALLBACK_API}`);
        if (r.ok) {
          const d = await r.json();
          allProducts = d.products || [];
        }
      }
      // Deduplicate by id
      const seenIds = new Set();
      allProducts = allProducts.filter(p => {
        const pid = p.id || p.shopify_id;
        if (!pid || seenIds.has(pid)) return false;
        seenIds.add(pid);
        return true;
      });
      setProducts(allProducts);

      // ── Breed-specific top row for cakes categories ──────────────────
      if (breedSlug && ['birthday-cakes', 'breed-cakes'].includes(category)) {
        const breedFiltered = allProducts.filter(p => {
          const text = ((p.name || '') + ' ' + (p.description || '')).toLowerCase();
          return text.includes(breedSlug.replace(/_/g, ' ')) || text.includes(pet?.breed?.toLowerCase() || '___');
        });
        if (breedFiltered.length > 0) setBreedProducts(breedFiltered);
      }
      
      // ── Breed-specific filtering for party category ──────────────────
      // Show breed-specific party items (like "Indie Party Hat") for matching pet breed
      if (breedSlug && category === 'party') {
        const petBreedLower = (pet?.breed || '').toLowerCase().replace(/[_\s]+/g, ' ');
        const breedFilteredParty = allProducts.filter(p => {
          const nameLower = (p.name || '').toLowerCase();
          const breedField = (p.breed || '').toLowerCase().replace(/[_\s]+/g, ' ');
          const catLower = (p.category || '').toLowerCase();
          
          // Include if:
          // 1. Not a breed-specific product (generic party items)
          // 2. OR matches the pet's breed
          const isBreedSpecific = catLower.includes('breed-') || breedField;
          if (!isBreedSpecific) return true; // Generic items always shown
          
          // For breed-specific, only show matching breed
          return nameLower.includes(petBreedLower) || 
                 breedField.includes(petBreedLower) ||
                 breedField === breedSlug.replace(/_/g, ' ');
        });
        setProducts(breedFilteredParty);
      }

    } catch (err) {
      console.error('[CelebrateContentModal] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, category, breedSlug, pet]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter products
  const filteredProducts = (() => {
    const base = activeFilter === 'all' ? products : products.filter(p =>
      (p.life_stage || '').includes(activeFilter) ||
      (p.dietary || '').includes(activeFilter)
    );
    // For cake categories AND party accessories, sort pet's breed to the top
    if (['birthday-cakes', 'breed-cakes', 'party', 'party_accessories'].includes(category) && pet?.breed) {
      const petBreed = (pet.breed || '').toLowerCase().replace(/[_\s]+/g, ' ');
      return [...base].sort((a, b) => {
        const aMatch = ((a.name || '') + ' ' + (a.title || '') + ' ' + (a.breed_tags || []).join(' ')).toLowerCase().includes(petBreed) ? 0 : 1;
        const bMatch = ((b.name || '') + ' ' + (b.title || '') + ' ' + (b.breed_tags || []).join(' ')).toLowerCase().includes(petBreed) ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    return base;
  })();

  if (!isOpen) return null;

  const ModalContent = (
    <motion.div
      initial={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isDesktop ? 0 : 60, scale: isDesktop ? 0.97 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="bg-white overflow-hidden"
      style={isDesktop ? {
        width: '92vw',
        maxWidth: 1140,
        maxHeight: '90vh',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
      } : {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '93vh',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 56,
      }}
      data-testid={`celebrate-modal-${category}`}
    >
      {/* Drag handle (mobile only) */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #F0E8E0' }}
      >
        <div>
          <h2 className="font-extrabold text-xl flex items-center gap-2" style={{ color: '#1A0A00' }}>
            <span>{config.emoji}</span> {config.label}
          </h2>
          <p className="text-sm" style={{ color: '#888' }}>
            For <span style={{ color: '#C44DFF', fontWeight: 600 }}>{petName}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
          data-testid="celebrate-modal-close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            <span className="ml-3 text-gray-500 text-sm">Fetching for {petName}...</span>
          </div>
        )}

        {!loading && (
          <div className="px-4 pt-4 pb-20">

            {/* ── BUNDLES layout ──────────────────────────────────────── */}
            {category === 'bundles' && (
              bundles.length > 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#C44DFF', letterSpacing: '0.06em' }}>
                      ✦ Complete Celebration Packages
                    </p>
                  </div>
                  <div className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
                    {bundles.map((bundle, idx) => (
                      <BundleCard key={bundle.id || idx} bundle={bundle} pet={pet} />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState config={config} onAskMira={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { message: `Show me celebration bundle ideas for ${petName}`, context: 'celebrate' }
                  }));
                  onClose();
                }} />
              )
            )}

            {/* ── SOUL PICKS layout — real celebrate merchandise by breed ─ */}
            {category === 'soul-picks' && (
              <>
                {breedProducts.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                        ✦ Made for {petName} — {getBreedDisplay(pet) || pet?.breed || 'your breed'}
                      </p>
                      <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                        style={{ background: 'rgba(255,140,66,0.12)', color: '#FF8C42' }}>
                        {breedProducts.length} items
                      </span>
                    </div>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {breedProducts.map((p, idx) => (
                        <SoulPickCard key={p.id || idx} product={p} pet={pet} />
                      ))}
                    </div>

                    {/* ── Soul Made™ Trigger — inside Soul Picks ── */}
                    <div
                      data-testid="soul-made-trigger"
                      onClick={() => setSoulMadeOpen(true)}
                      style={{
                        margin:'24px 0 8px', padding:'20px 20px 18px',
                        background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
                        border:'1.5px solid rgba(196,77,255,0.4)',
                        borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
                        boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
                        transition:'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
                    >
                      <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
                        {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
                      </div>
                      <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
                        {petName}'s face. On everything.
                      </div>
                      <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
                        Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                          {`\u2726 Make something only ${petName} has`}
                        </div>
                        <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                          Upload a photo · Concierge® creates it · Price on WhatsApp
                        </div>
                      </div>
                    </div>
                    {soulMadeOpen && (
                      <SoulMadeModal
                        pet={pet}
                        pillar="celebrate"
                        pillarColor="#A855F7"
                        pillarLabel="Celebration"
                        onClose={() => setSoulMadeOpen(false)}
                      />
                    )}
                  </div>
                ) : (
                  <EmptyState config={config} onAskMira={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: { message: `What soul picks would you recommend for ${petName}?`, context: 'celebrate' }
                    }));
                    onClose();
                  }} />
                )}
              </>
            )}


            {/* ── SOUL MADE™ layout — breed products + custom order trigger ── */}
            {category === 'soul_made' && (
              <>
                {/* Art style toggle */}
                {breedProducts.length > 0 && yappyIllustrations.length > 0 && (
                  <div style={{ display:'flex', background:'rgba(168,85,247,0.08)', borderRadius:999, padding:3, marginBottom:14, gap:2, width:'fit-content' }}>
                    {['watercolour','flat_art'].map(s => (
                      <button key={s} onClick={() => setArtStyle(s)} style={{
                        padding:'5px 14px', borderRadius:999, border:'none',
                        background: artStyle===s ? '#A855F7' : 'transparent',
                        color: artStyle===s ? '#fff' : 'rgba(0,0,0,0.45)',
                        fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                      }}>
                        {s==='watercolour' ? '🎨 Watercolour' : '🐾 Flat Art'}
                      </button>
                    ))}
                  </div>
                )}

                {breedProducts.length > 0 ? (
                  artStyle === 'flat_art' ? (
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
                      {breedProducts.map((p, idx) => (
                        <FlatArtPickerCard key={p.id || p.name || idx} product={p} illustrations={yappyIllustrations} pet={pet} pillar="celebrate" />
                      ))}
                    </div>
                  ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: '#A855F7', letterSpacing: '0.06em' }}>
                        ✦ Made for {petName} — {getBreedDisplay(pet) || pet?.breed || 'your breed'}
                      </p>
                      <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                        style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
                        {breedProducts.length} items
                      </span>
                    </div>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {breedProducts.map((p, idx) => (
                        <SoulPickCard key={p.id || idx} product={p} pet={pet} />
                      ))}
                    </div>
                  </div>
                  )
                ) : !loading && (
                  <div style={{ textAlign:'center', padding:'32px 16px', color:'#888' }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>✦</div>
                    <p style={{ fontSize:14 }}>We're curating breed-specific items for {petName}. Check back soon!</p>
                  </div>
                )}

                {/* Soul Made trigger */}
                <div
                  data-testid="soul-made-trigger"
                  onClick={() => setSoulMadeOpen(true)}
                  style={{
                    margin:'24px 0 8px', padding:'20px 20px 18px',
                    background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
                    border:'1.5px solid rgba(196,77,255,0.4)',
                    borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
                    boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
                    transition:'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
                >
                  <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
                    {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
                    {petName}'s face. On everything.
                  </div>
                  <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
                    Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                      {`\u2726 Make something only ${petName} has`}
                    </div>
                    <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                      Upload a photo · Concierge® creates it · Price on WhatsApp
                    </div>
                  </div>
                </div>
                {soulMadeOpen && (
                  <SoulMadeModal pet={pet} pillar="celebrate" pillarColor="#A855F7" pillarLabel="Celebration" onClose={() => setSoulMadeOpen(false)} />
                )}
              </>
            )}

            {/* ── MIRA'S PICKS layout — imaginary cards + breed cakes ──── */}
            {category === 'miras-picks' && (
              <>
                {/* Occasion Countdown Card — shows upcoming birthday/gotcha/festival */}
                <OccasionCountdownCard pet={pet} petName={petName} />

                {/* PetWrap Teaser — next to soul, always visible */}
                <PetWrapTeaser pet={pet} />

                {/* Mira Imagines section — custom request cards */}
                {miraImagines.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: '#C44DFF', letterSpacing: '0.06em' }}>
                        ✦ Mira Imagines — Just for {petName}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#888' }}>
                      Based on {petName}'s soul profile — not in range yet, but Mira can request these specially.
                    </p>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {miraImagines.map((flavor, idx) => (
                        <MiraImaginesCard key={idx} flavor={flavor} pet={pet} />
                      ))}
                    </div>
                    <div className="my-4 border-t" style={{ borderColor: '#F5E6FF' }} />
                  </div>
                )}

                {/* Soul Questions — celebrate-context prioritized (taste_treat + celebration_preferences first) */}
                <SoulQuestionsSection
                  pet={pet}
                  onScoreUpdated={(score) => setLiveSoulScore(score)}
                  onRefreshMiraCards={() => {
                    // Re-fetch mira imagines after soul data grows
                    if (pet?.id) {
                      setMiraImagines([]);
                      setTimeout(() => fetchData(), 300);
                    }
                  }}
                />

                {/* Real curated cakes from collection */}
                {products.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: '#C44DFF', letterSpacing: '0.06em' }}>
                      🌟 Mira's picks — cakes {petName} would love
                    </p>
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                      {products.map((p, idx) => (
                        <ProductCard key={p.id || idx} product={p} pillar="celebrate" selectedPet={pet} size="small" />
                      ))}
                    </div>
                  </div>
                )}

                {miraImagines.length === 0 && products.length === 0 && (
                  <EmptyState config={config} onAskMira={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: { message: `What cakes would you pick for ${petName}?`, context: 'celebrate' }
                    }));
                    onClose();
                  }} />
                )}
              </>
            )}

            {/* ── NORMAL CATEGORIES layout ────────────────────────────── */}
            {category !== 'bundles' && category !== 'soul-picks' && category !== 'soul_made' && category !== 'miras-picks' && (
              <>
                {/* Pet's breed items first — own row for cake categories */}
                {['birthday-cakes', 'breed-cakes'].includes(category) && pet?.breed && (() => {
                  const petBreed = (pet.breed || '').toLowerCase().replace(/[_\s]+/g, ' ');
                  const myBreedItems = filteredProducts.filter(p =>
                    ((p.name || '') + ' ' + (p.title || '')).toLowerCase().includes(petBreed)
                  );
                  const otherItems = filteredProducts.filter(p =>
                    !((p.name || '') + ' ' + (p.title || '')).toLowerCase().includes(petBreed)
                  );
                  if (myBreedItems.length === 0) return null;
                  return (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                            ✦ {petName}'s Breed
                          </span>
                          <span className="rounded-full text-xs font-bold text-white px-2 py-0.5"
                            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)' }}>
                            {myBreedItems.length} {myBreedItems.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="grid gap-3"
                          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                          {myBreedItems.map((product, idx) => (
                            <ProductCard key={product.id || idx} product={product} pillar="celebrate" selectedPet={pet} size="small" />
                          ))}
                        </div>
                      </div>
                      {otherItems.length > 0 && (
                        <>
                          <hr style={{ borderColor: '#F0E8E0', margin: '0 0 16px' }} />
                          <p className="text-xs font-bold uppercase tracking-wider mb-3"
                            style={{ color: '#888', letterSpacing: '0.06em' }}>
                            All {config.label} — {otherItems.length} items
                          </p>
                          <div className="grid gap-3"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                            {otherItems.map((product, idx) => (
                              <ProductCard key={product.id || idx} product={product} pillar="celebrate" selectedPet={pet} size="small" />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Non-cake categories OR no breed match — show all */}
                {(!['birthday-cakes', 'breed-cakes'].includes(category) || !pet?.breed || (() => {
                  const petBreed = (pet?.breed || '').toLowerCase().replace(/[_\s]+/g, ' ');
                  return filteredProducts.filter(p =>
                    ((p.name || '') + ' ' + (p.title || '')).toLowerCase().includes(petBreed)
                  ).length === 0;
                })()) && (
                  <>
                    {filteredProducts.length > 0 && (
                      <p className="text-xs font-bold uppercase tracking-wider mb-3"
                        style={{ color: '#888', letterSpacing: '0.06em' }}>
                        All {config.label} — {filteredProducts.length} items
                      </p>
                    )}

                    {filteredProducts.length > 0 ? (
                      <div className="grid gap-3"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))' }}>
                        {filteredProducts.map((product, idx) => (
                          <ProductCard key={product.id || idx} product={product} pillar="celebrate" selectedPet={pet} size="small" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState config={config} onAskMira={() => {
                        window.dispatchEvent(new CustomEvent('openMiraAI', {
                          detail: { message: `Show me ${config.label} for ${petName}`, context: 'celebrate' }
                        }));
                        onClose();
                      }} />
                    )}
                  </>
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* ── SOUL MADE™ Cross-sell Strip — shows in ALL categories ── */}
      {category !== 'soul_made' && (
        <div style={{ padding: '0 20px' }}>
          <div
            data-testid="soul-made-cross-sell"
            onClick={() => setSoulMadeOpen(true)}
            style={{
              margin:'8px 0 16px', padding:'20px 20px 18px',
              background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
              border:'1.5px solid rgba(196,77,255,0.4)',
              borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
          >
            <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
              {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
              {petName}'s face. On everything.
            </div>
            <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
              Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                {`\u2726 Make something only ${petName} has`}
              </div>
              <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                Upload a photo · Concierge® creates it · Price on WhatsApp
              </div>
            </div>
          </div>
          {soulMadeOpen && (
            <SoulMadeModal pet={pet} pillar="celebrate" pillarColor="#A855F7" pillarLabel="Celebration" onClose={() => setSoulMadeOpen(false)} />
          )}
        </div>
      )}

      {/* Footer — Mira live narrative */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid #F0E8E0', background: 'white' }}
      >
        {addedCount === 0 ? (
          /* ── Browsing state: nothing added yet ─────────────────────── */
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs flex-1 min-w-0" style={{ color: '#9B7FA0', lineHeight: 1.4 }}>
              <span style={{ color: '#C44DFF', fontWeight: 600 }}>✦</span> Everything here is personalised for{' '}
              <span style={{ fontWeight: 700, color: '#1A0A00' }}>{petName}</span>
            </p>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-xl font-bold px-4 py-2.5 whitespace-nowrap"
              style={{
                background: 'rgba(196,77,255,0.08)',
                border: '1.5px solid rgba(196,77,255,0.25)',
                color: '#7C3AED', cursor: 'pointer', fontSize: 13
              }}
              data-testid="celebrate-modal-cta"
            >
              Explore More for {petName}
            </button>
          </div>
        ) : (
          /* ── Active state: items have been added ────────────────────── */
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs flex-1 min-w-0" style={{ color: '#1A0A00', lineHeight: 1.4, fontWeight: 500 }}>
              <span style={{ fontSize: 15 }}>{config.emoji}</span>{' '}
              <span style={{ color: '#C44DFF', fontWeight: 700 }}>
                + {addedCount} {addedCount === 1 ? 'thing' : 'things'}
              </span>{' '}
              — <span style={{ fontStyle: 'italic' }}>{petName}'s plan is growing</span>
            </p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openMiraAI', {
                  detail: {
                    message: `I've added ${addedCount} item${addedCount > 1 ? 's' : ''} for ${petName}. Help me build their complete celebration plan.`,
                    context: 'celebrate'
                  }
                }));
                onClose();
              }}
              className="flex-shrink-0 rounded-xl font-bold text-white px-4 py-2.5 whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
                border: 'none', cursor: 'pointer', fontSize: 13
              }}
              data-testid="celebrate-modal-cta"
            >
              Keep Building →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return ReactDOM.createPortal(
    <>
      {/* Backdrop — rendered directly in document.body to escape any CSS transform stacking context */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 55 }} onClick={onClose} />
      {/* Desktop: flex centering wrapper */}
      {isDesktop ? (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 56, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>{ModalContent}</div>
        </div>
      ) : (
        ModalContent
      )}
    </>,
    document.body
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ config, onAskMira }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center px-4">
    <span className="text-5xl mb-4">{config.emoji}</span>
    <p className="text-gray-500 text-sm mb-5 max-w-xs">{config.emptyText}</p>
    <button
      onClick={onAskMira}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED', cursor: 'pointer' }}
    >
      <Sparkles className="w-4 h-4" />
      Ask Mira
    </button>
  </div>
);

export default CelebrateContentModal;
