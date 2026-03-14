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

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, ChevronRight, ShoppingBag, Check, ChevronDown } from 'lucide-react';
import ProductCard from '../ProductCard';
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
const SoulPickCard = ({ product, pet }) => {
  const petName = pet?.name || 'your pet';
  return (
    <div className="relative">
      <ProductCard product={product} pillar="celebrate" selectedPet={pet} size="small" />
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
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: isOnboarding
          ? 'linear-gradient(135deg, #0A1A2E 0%, #1A3A5F 100%)'
          : 'linear-gradient(135deg, #1A0A00 0%, #3D1A5F 100%)',
        border: isOnboarding
          ? '1.5px solid rgba(100,200,255,0.3)'
          : '1.5px solid rgba(196,77,255,0.3)',
        minHeight: 200,
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
      <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4">
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

      {/* Request button / confirmation */}
      <div className="px-3 pb-4">
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
          background: 'linear-gradient(135deg, rgba(20,180,80,0.12), rgba(0,120,50,0.08))',
          border: '2px solid rgba(40,200,100,0.5)',
          minHeight: 160,
        }}>
        <div className="rounded-full flex items-center justify-center w-10 h-10 mb-1"
          style={{ background: 'rgba(40,200,100,0.15)', border: '2px solid rgba(40,200,100,0.5)' }}>
          <Check className="w-5 h-5" style={{ color: '#16A34A' }} />
        </div>
        <p className="font-extrabold text-center" style={{ color: '#15803D', fontSize: 14 }}>Soul score growing!</p>
        {pointsGained && (
          <div className="rounded-full px-3 py-1 font-bold" style={{ background: 'rgba(40,200,100,0.12)', color: '#166534', fontSize: 11 }}>
            +{pointsGained} pts added
          </div>
        )}
        <p className="text-center" style={{ color: 'rgba(0,0,0,0.4)', fontSize: 10 }}>
          Mira now knows {petName} better ✦
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl px-4 py-4"
      style={{
        background: 'rgba(68,136,255,0.06)',
        border: '1.5px solid rgba(68,136,255,0.28)',
        minHeight: 160,
        boxShadow: '0 2px 12px rgba(68,136,255,0.08)'
      }}>
      {/* Folder label + weight */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 12 }}>{question.folder_icon || '✦'}</span>
          <span className="text-xs font-semibold" style={{ color: '#4488FF' }}>
            {question.folder_name}
          </span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: 'rgba(68,136,255,0.12)', color: '#2255CC', fontSize: 9 }}>
          +{question.weight || 3} pts
        </span>
      </div>

      {/* Question */}
      <p className="font-bold leading-snug mb-3" style={{ color: '#0F172A', fontSize: 12 }}>
        {question.question}
      </p>

      {question.type === 'text' && (
        <textarea
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          placeholder="Type here..."
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(68,136,255,0.3)', color: '#1A1A2E' }}
        />
      )}

      {question.type === 'select' && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(question.options || []).map(opt => (
            <button key={opt} onClick={() => setSelected(opt)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
              style={{
                background: selected === opt ? 'rgba(68,136,255,0.2)' : 'rgba(0,0,0,0.04)',
                border: selected === opt ? '1.5px solid #4488FF' : '1px solid rgba(0,0,0,0.15)',
                color: selected === opt ? '#1A44AA' : '#374151',
                cursor: 'pointer',
                transform: selected === opt ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.15s ease'
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
              className="rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
              style={{
                background: multiSelected.includes(opt) ? 'rgba(68,136,255,0.2)' : 'rgba(0,0,0,0.04)',
                border: multiSelected.includes(opt) ? '1.5px solid #4488FF' : '1px solid rgba(0,0,0,0.15)',
                color: multiSelected.includes(opt) ? '#1A44AA' : '#374151',
                cursor: 'pointer'
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || (!selected && !textValue.trim() && multiSelected.length === 0)}
        className="mt-2 w-full rounded-xl py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
        style={{
          background: (!selected && !textValue.trim() && multiSelected.length === 0)
            ? 'rgba(68,136,255,0.3)'
            : 'linear-gradient(135deg,#3366EE,#5544DD)',
          border: 'none', cursor: submitting ? 'wait' : 'pointer',
          boxShadow: (!selected && !textValue.trim() && multiSelected.length === 0) ? 'none' : '0 4px 12px rgba(51,102,238,0.35)'
        }}>
        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Save +{question.weight || 3} pts
      </button>
    </div>
  );
};

// ── Soul Questions Section ─────────────────────────────────────────────────────
const SoulQuestionsSection = ({ pet, onScoreUpdated, onRefreshMiraCards }) => {
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPtsGained, setTotalPtsGained] = useState(0);
  const petName = pet?.name || 'your pet';

  const loadQuestions = useCallback(() => {
    if (!pet?.id) { setLoading(false); return; }
    fetch(`${getApiUrl()}/api/pet-soul/profile/${pet.id}/quick-questions?limit=5`)
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

  return (
    <div className="mb-6">
      {/* Big Soul Score Header */}
      <div className="rounded-2xl px-5 py-4 mb-4 flex items-center justify-between"
        style={{
          background: 'rgba(68,136,255,0.05)',
          border: '1.5px solid rgba(68,136,255,0.2)',
        }}>
        <div>
          <p className="font-extrabold uppercase tracking-widest mb-0.5" style={{ color: '#3366EE', fontSize: 10, letterSpacing: '0.1em' }}>
            ✦ GROW {petName.toUpperCase()}'S SOUL
          </p>
          <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 10 }}>
            Answer quick questions • {visibleQuestions.length} remaining
          </p>
        </div>

        {/* Big score counter */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <motion.div
              key={score}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-black"
              style={{ fontSize: 38, lineHeight: 1, color: score >= 80 ? '#C47F00' : '#2255CC' }}>
              {score ?? '--'}
            </motion.div>
            <span className="font-bold" style={{ color: 'rgba(0,0,0,0.3)', fontSize: 14, marginLeft: 2, alignSelf: 'flex-end', marginBottom: 4 }}>%</span>
          </div>
          {scoreDelta !== null && scoreDelta > 0 && (
            <motion.div
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="rounded-full px-2 py-0.5 font-bold"
              style={{ background: 'rgba(22,163,74,0.15)', color: '#15803D', fontSize: 9 }}>
              +{scoreDelta.toFixed(1)}%
            </motion.div>
          )}
          <div className="w-12 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)', height: 4 }}>
            <motion.div
              initial={{ width: `${prevScore ?? score}%` }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #4488FF, ${score >= 80 ? '#F59E0B' : '#3366EE'})` }}
            />
          </div>
        </div>
      </div>

      {/* Answered banner */}
      {answeredCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16A34A' }} />
          <p className="text-xs font-semibold" style={{ color: '#15803D' }}>
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
          <p className="text-xs font-semibold" style={{ color: 'rgba(100,180,255,0.6)' }}>
            Loading next questions...
          </p>
        </div>
      )}

      <div className="mt-3 text-center">
        <a href={`/pet-soul/${pet?.id}`}
          className="text-xs font-semibold"
          style={{ color: 'rgba(100,160,255,0.6)', textDecoration: 'none' }}>
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
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [addedCount, setAddedCount] = useState(0); // tracks items added this session
  const [miraImagines, setMiraImagines] = useState([]); // imaginary cards for non-existent flavours
  const [liveSoulScore, setLiveSoulScore] = useState(null); // live soul score updated by inline questions

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

    try {
      const apiUrl = getApiUrl();

      // ── Soul Picks: real celebrate merchandise filtered by breed ─────
      if (category === 'soul-picks') {
        const breedDisplay = getBreedDisplay(pet);
        const breedSearch = breedDisplay.toLowerCase();
        // Fetch from ALL breed merchandise categories relevant for Celebrate
        const breedCats = [
          'breed-mugs', 'breed-bandanas', 'breed-frames',
          'breed-keychains', 'breed-party_hats', 'breed-tote_bags',
          // NEW: More celebrate-relevant categories
          'breed-blankets', 'breed-bowls', 'breed-paw_print_frames',
          'breed-pet_robes', 'breed-pet_towels', 'breed-placemats',
          'breed-treat_jars', 'breed-cushion_covers'
        ];
        const responses = await Promise.all(
          breedCats.map(cat => fetch(`${apiUrl}/api/products?category=${cat}&limit=50`))
        );
        const datasets = await Promise.all(
          responses.map(r => r.ok ? r.json() : Promise.resolve({ products: [] }))
        );
        const allMerch = datasets.flatMap(d => d.products || []);
        // Filter by breed name
        const breedMerch = breedSearch
          ? allMerch.filter(p => (p.name || p.title || '').toLowerCase().includes(breedSearch))
          : allMerch;
        setBreedProducts(breedMerch.length > 0 ? breedMerch : allMerch.slice(0, 12));
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

          // 2. Mira Imagines: Create cards based on soul data
          const lovedFoods = getLovedFoods(pet);
          const allergies = (pet?.allergies || []).map(a => a.toLowerCase());
          const soulTraits = extractSoulTraits(pet);
          const imaginaryProducts = [];
          
          // A) Food-based imaginary (ORIGINAL WORKING LOGIC)
          // Deduplicate by cleaned name (salmon treats + salmon → same key 'salmon')
          const seenFoodKeys = new Set();
          const foodImaginary = lovedFoods.filter(food => {
            const f = food.toLowerCase().replace(/\s*(treat|cake|food)s?\b/g, '').trim();
            if (!f || f.length < 3) return false;
            if (seenFoodKeys.has(f)) return false; // dedupe salmon treats vs salmon
            seenFoodKeys.add(f);
            if (allergies.some(a => f.includes(a))) return false;
            return !allCakes.some(c => (c.name || '').toLowerCase().includes(f));
          });
          
          // Add food cards with proper formatting
          for (const food of foodImaginary.slice(0, 2)) {
            const cleanFood = food.replace(/\s*(treat|cake|food)s?\b/gi, '').trim();
            const label = cleanFood.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            imaginaryProducts.push({
              type: 'food',
              name: `${label} Delight Cake`,
              trait: `loves ${food}`,
              description: `Mira imagines a delicious ${cleanFood} cake just for ${petName}`,
              emoji: getFoodEmoji(cleanFood)
            });
          }
          
          // B) Activity-based imaginary products (NEW)
          const activityMap = {
            'tennis ball': { name: 'Tennis Ball Birthday Box', emoji: '🎾', desc: 'A celebration kit for the tennis ball champion' },
            'fetch': { name: 'Ultimate Fetch Party Kit', emoji: '🎯', desc: 'Party gear for the fetch-obsessed pup' },
            'swimming': { name: 'Pool Party Celebration Kit', emoji: '🏊', desc: 'Splash-ready birthday celebration' },
            'car rides': { name: 'Road Trip Birthday Adventure', emoji: '🚗', desc: 'Celebration on wheels' },
            'walks': { name: 'Adventure Walk Party Pack', emoji: '🚶', desc: 'Celebration for the explorer' },
            'cuddles': { name: 'Cozy Cuddle Birthday Box', emoji: '🥰', desc: 'Extra snuggly celebration' },
            'naps': { name: 'Nap Time Birthday Bundle', emoji: '😴', desc: 'Peaceful celebration package' },
            'running': { name: 'Zoomies Party Kit', emoji: '🏃', desc: 'High-energy celebration' },
            'squeaky toys': { name: 'Squeaky Toy Birthday Box', emoji: '🧸', desc: 'Musical celebration kit' },
          };
          
          for (const trait of soulTraits) {
            const traitLower = trait.toLowerCase();
            for (const [key, product] of Object.entries(activityMap)) {
              if (traitLower.includes(key) && imaginaryProducts.length < 4) {
                imaginaryProducts.push({
                  type: 'activity',
                  name: product.name,
                  trait: trait,
                  description: product.desc + ` for ${petName}`,
                  emoji: product.emoji
                });
                break;
              }
            }
          }
          
          // C) Soul Onboarding card if no data
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
          // This was working before - breed cakes on top!
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
  const filteredProducts = activeFilter === 'all' ? products : products.filter(p =>
    (p.life_stage || '').includes(activeFilter) ||
    (p.dietary || '').includes(activeFilter)
  );

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
          <div className="px-4 pt-4 pb-6">

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

            {/* ── MIRA'S PICKS layout — imaginary cards + breed cakes ──── */}
            {category === 'miras-picks' && (
              <>
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
                      {petName} loves these flavours — they're not in our range yet,
                      but Mira can request them specially.
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

                {/* Soul Questions — appears for ALL pets to keep growing the score */}
                <SoulQuestionsSection
                  pet={pet}
                  onScoreUpdated={(score) => setLiveSoulScore(score)}
                  onRefreshMiraCards={() => {
                    // Re-fetch mira imagines after soul data grows
                    if (pet?.id) {
                      setMiraImagines([]); // clear to trigger re-compute
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
            {category !== 'bundles' && category !== 'soul-picks' && category !== 'miras-picks' && (
              <>
                {breedProducts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: '#FF8C42', letterSpacing: '0.06em' }}>
                        ✦ {config.miraLabel}
                      </span>
                      <span className="rounded-full text-xs font-bold text-white px-2 py-0.5"
                        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)' }}>
                        For {petName}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {breedProducts.slice(0, 6).map((p, idx) => (
                        <div key={p.id || idx} className="flex-shrink-0" style={{ width: 160 }}>
                          <ProductCard product={p} pillar="celebrate" selectedPet={pet} size="small" />
                        </div>
                      ))}
                    </div>
                    <hr style={{ borderColor: '#F0E8E0', margin: '20px 0 16px' }} />
                  </div>
                )}

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
                      <ProductCard
                        key={product.id || idx}
                        product={product}
                        pillar="celebrate"
                        selectedPet={pet}
                        size="small"
                      />
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

          </div>
        )}
      </div>

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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 55 }} onClick={onClose} />
      {/* Desktop: use flex centering wrapper so Framer Motion scale doesn't fight transform */}
      {isDesktop ? (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 56, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>{ModalContent}</div>
        </div>
      ) : (
        ModalContent
      )}
    </>
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
