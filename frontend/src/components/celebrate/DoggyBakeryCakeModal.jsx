/**
 * DoggyBakeryCakeModal.jsx — Doggy Bakery Breed Cake Order
 * The Doggy Company
 *
 * Actual TDB pricing (scraped from thedoggybakery.com/collections/custom-breed-cakes):
 *   - Oats or Ragi base — price depends on FLAVOUR not size
 *   - Veg flavours (Banana, Carrot, Apple, Coconut, Mango): ₹950
 *   - Non-veg light (Chicken, Chicken Liver, Peanut Butter, Cheese, Fish): ₹999
 *   - Non-veg rich (Mutton, Lamb): ₹1,200
 *
 * Triggers: Breed Cakes strip + standalone banner on /celebrate
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConcierge } from '../../hooks/useConcierge';
import { API_URL } from '../../utils/api';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
  .cbc-illus {
    border-radius: 12px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; transition: all 0.15s;
    background: rgba(255,255,255,0.96);
  }
  .cbc-illus:hover { border-color: rgba(168,85,247,0.4); }
  .cbc-illus.sel  { border-color: #A855F7; }
  .cbc-base {
    flex: 1; padding: 12px 8px; border-radius: 12px; cursor: pointer;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    text-align: center; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; color: #F5F0E8;
  }
  .cbc-base.sel { border-color: #A855F7; background: rgba(168,85,247,0.12); }
  .cbc-flav {
    padding: 8px 14px; border-radius: 999px; cursor: pointer;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; color: rgba(245,240,232,0.65);
    transition: all 0.15s; white-space: nowrap;
  }
  .cbc-flav.sel { border-color: #C9973A; background: rgba(201,151,58,0.12); color: #C9973A; }
  .cbc-breed {
    padding: 6px 14px; border-radius: 999px; cursor: pointer;
    font-size: 12px; font-weight: 500; white-space: nowrap; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
  }
  .cbc-breed.sel   { background: #A855F7; color: #fff; border: none; }
  .cbc-breed.unsel { background: rgba(255,255,255,0.04); color: rgba(245,240,232,0.55); border: 1px solid rgba(255,255,255,0.1); }
  .cbc-textarea {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 12px 14px; color: #F5F0E8; font-size: 13px;
    font-family: 'DM Sans', sans-serif; resize: none; outline: none;
    line-height: 1.6; box-sizing: border-box;
  }
  .cbc-textarea::placeholder { color: rgba(245,240,232,0.25); }
  .cbc-textarea:focus { border-color: rgba(201,151,58,0.4); }
  @keyframes cbc-slide { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes cbc-fade  { from{opacity:0} to{opacity:1} }
  @keyframes cbc-pop   {
    0%  {transform:translateX(-50%) translateY(0)   scale(1);   opacity:1}
    60% {transform:translateX(-50%) translateY(-28px) scale(1.1); opacity:1}
    100%{transform:translateX(-50%) translateY(-56px) scale(0.9); opacity:0}
  }
`;

const ALL_BREEDS = [
  'indie','labrador','golden retriever','german shepherd','beagle',
  'pug','shih tzu','boxer','rottweiler','doberman',
  'border collie','cocker spaniel','dachshund','chihuahua','poodle',
  'bulldog','husky','dalmatian','great dane','saint bernard',
  'maltese','pomeranian','bichon frise','lhasa apso','samoyed',
  'chow chow','akita','basenji','shar pei','tibetan mastiff',
  'irish setter','weimaraner','vizsla','brittany','pointer',
  'schnauzer','airedale terrier','bull terrier','jack russell','fox terrier',
  'whippet','greyhound','afghan hound','saluki','bloodhound',
  'basset hound','newfoundland','leonberger','bernese mountain dog','alaskan malamute',
];

// TDB base options — both Oats and Ragi start at the same price tier
const BASE_OPTIONS = [
  { id:'oats', label:'Oats', desc:'Light & wholesome', icon:'🌾' },
  { id:'ragi', label:'Ragi', desc:'Nutrient-rich',     icon:'🌿' },
];

// Actual TDB pricing by flavour (scraped March 2026)
const ALL_FLAVOURS = [
  { id:'peanut_butter', label:'🥜 Peanut Butter', allergens:[],                 price:999  },
  { id:'carrot',        label:'🥕 Carrot',         allergens:[],                 price:950  },
  { id:'banana',        label:'🍌 Banana',          allergens:[],                 price:950  },
  { id:'apple',         label:'🍎 Apple & Cinnamon',allergens:[],                 price:950  },
  { id:'cheese',        label:'🧀 Cheese',          allergens:['dairy'],          price:999  },
  { id:'chicken',       label:'🍗 Chicken',         allergens:['chicken','poultry'],price:999},
  { id:'fish_salmon',   label:'🐟 Fish (Salmon)',   allergens:['fish'],           price:999  },
  { id:'lamb',          label:'🍖 Lamb',            allergens:['lamb'],           price:1200 },
];

// ── Flavour → matching keyword list (for favourite detection) ───────────────
const FLAVOUR_KEYWORDS = {
  peanut_butter: ['peanut','peanut butter','peanutbutter'],
  carrot:        ['carrot','vegetable','veggie','veg'],
  banana:        ['banana'],
  apple:         ['apple','cinnamon'],
  cheese:        ['cheese','dairy','paneer'],
  chicken:       ['chicken','poultry'],
  fish_salmon:   ['fish','salmon','seafood'],
  lamb:          ['lamb','mutton'],
};

function getPetFavFlavours(pet) {
  const soul = pet?.doggy_soul_answers || {};
  const sources = [
    soul.favorite_protein,
    soul.petFavouriteFood1,
    soul.petFavouriteFood2,
    soul.favourite_protein,
    ...(Array.isArray(soul.favorite_treats) ? soul.favorite_treats : [soul.favorite_treats]),
  ].filter(Boolean).map(s => String(s).toLowerCase());

  const favIds = new Set();
  if (soul.taste_banana === true) favIds.add('banana');

  for (const [flavId, keywords] of Object.entries(FLAVOUR_KEYWORDS)) {
    if (sources.some(src => keywords.some(kw => src.includes(kw)))) {
      favIds.add(flavId);
    }
  }
  return favIds;
}

function getAllergies(pet) {
  const soul = pet?.doggy_soul_answers || {};
  const raw  = soul.food_allergies || pet?.allergies || '';
  if (!raw || /^(none|no|unknown)$/i.test(String(raw).trim())) return [];
  // Parse comma/semicolon list; skip test_ prefixed values and short strings
  const items = (Array.isArray(raw) ? raw : String(raw).split(/,|;/))
    .map(x => x.trim().toLowerCase())
    .filter(a => a.length > 2 && !a.startsWith('test_'));
  return items;
}

export default function DoggyBakeryCakeModal({ pet, onClose }) {
  const { token, user }      = useAuth();
  const { request }          = useConcierge({ pet, pillar: 'celebrate' });

  const allergies    = getAllergies(pet);
  const petFavIds    = getPetFavFlavours(pet);
  const petName      = pet?.name  || 'your dog';
  const defaultBreed = (pet?.breed || 'indie').toLowerCase().replace(/\s+/g,'_');

  // Compute these BEFORE any useState so the initializer can reference them
  const safeFlavours = ALL_FLAVOURS.filter(f =>
    !f.allergens.some(a => allergies.includes(a))
  );
  const sortedFlavours = safeFlavours.slice().sort((a, b) => {
    const aFav = petFavIds.has(a.id) ? -1 : 0;
    const bFav = petFavIds.has(b.id) ? -1 : 0;
    return aFav - bFav;
  });
  const orderedBreeds = [
    defaultBreed,
    ...ALL_BREEDS.filter(b => b !== defaultBreed),
  ];

  const [breed,      setBreed]      = useState(defaultBreed);
  const [illus,      setIllus]      = useState([]);
  const [selIllus,   setSelIllus]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [base,       setBase]       = useState('oats');
  const [flavour,    setFlavour]    = useState(() => {
    // Default to the pet's top favourite flavour if safe
    const fav = sortedFlavours[0]?.id || 'banana';
    return fav;
  });
  const [message,    setMessage]    = useState('');
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [showPop,    setShowPop]    = useState(false);
  const [showBreeds, setShowBreeds] = useState(false);

  // Load illustrations for selected breed
  const loadIllus = useCallback(async (b) => {
    setLoading(true);
    setSelIllus(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Try birthday_cake first, then cake alias
      for (const pt of ['birthday_cake', 'cake']) {
        const res = await fetch(
          `${API_URL}/api/mockups/breed-products?breed=${encodeURIComponent(b)}&product_type=${pt}&limit=8`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          const products = data.products || data.results || [];
          if (products.length > 0) { setIllus(products); break; }
        }
      }
    } catch { setIllus([]); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadIllus(breed); }, [breed, loadIllus]);

  // Auto-select first illustration
  useEffect(() => {
    if (illus.length > 0 && !selIllus) setSelIllus(illus[0]);
  }, [illus]);

  // Keep flavour safe when breed/allergies change
  useEffect(() => {
    if (!safeFlavours.find(f => f.id === flavour)) {
      setFlavour(safeFlavours[0]?.id || 'banana');
    }
  }, [breed, allergies.join(',')]);

  const selectedFlavour = safeFlavours.find(f => f.id === flavour);
  const selectedBase    = BASE_OPTIONS.find(b => b.id === base);
  const price           = selectedFlavour ? `₹${selectedFlavour.price.toLocaleString('en-IN')}` : '₹950';

  const handleOrder = async () => {
    setSending(true);
    const illusUrl   = selIllus?.cloudinary_url || selIllus?.mockup_url || selIllus?.image_url || '';
    const allergyNote = allergies.length > 0
      ? `⚠️ ALLERGY ALERT: No ${allergies.join(', ')} — critical`
      : 'No known allergies';

    const subject = `🎂 Breed Cake Order — ${breed.charAt(0).toUpperCase()+breed.slice(1)} · ${selectedBase?.label} · ${selectedFlavour?.label?.split(' ').slice(1).join(' ')||flavour} — for ${petName}`;

    const body =
      `🎂 BREED CAKE ORDER — DOGGY BAKERY\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `FOR: ${petName} (${breed.charAt(0).toUpperCase()+breed.slice(1)})\n\n` +
      `ILLUSTRATION SELECTED:\n` +
      `  Name: ${selIllus?.name || selIllus?.colour_label || 'Variant selected'}\n` +
      (illusUrl ? `  Image URL: ${illusUrl}\n` : `  No image URL — check admin gallery\n`) +
      `\nCAKE DETAILS:\n` +
      `  Base: ${selectedBase?.label} (${selectedBase?.desc})\n` +
      `  Flavour: ${selectedFlavour?.label || flavour}\n` +
      `  Price: ${price}\n` +
      `  Message on cake: ${message ? `"${message}"` : '(none)'}\n\n` +
      `${allergyNote}\n\n` +
      `ACTION NEEDED:\n` +
      `  1. Download illustration from URL above\n` +
      `  2. Confirm price + delivery date via WhatsApp\n` +
      `  3. Collect payment before baking\n`;

    try {
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id:      user?.id || user?.email || '',
          intent_primary: 'breed_cake_order',
          pillar:         'celebrate',
          channel:        'doggy_bakery_order',
          urgency:        'normal',
          pet_id:         pet?.id,
          initial_message: {
            sender: 'parent',
            source: 'breed_cake_order',
            text:   `${subject}\n\n${body}`,
          },
        }),
      });
    } catch (e) {
      console.error('[DoggyBakeryCakeModal] order failed', e);
    }

    setSending(false);
    setDone(true);
    setShowPop(true);
    setTimeout(() => setShowPop(false), 1500);
  };

  return (
    <div
      data-testid="doggy-bakery-cake-modal"
      onClick={onClose}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.75)',
        zIndex:2000,
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        animation:'cbc-fade 0.2s ease',
      }}
    >
      <style>{`${FONTS}${CSS}`}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:'min(760px, 98vw)',
          maxHeight:'92vh', overflowY:'auto',
          background:'#0F0A1E',
          borderRadius:'24px 24px 0 0',
          border:'1px solid rgba(168,85,247,0.3)',
          animation:'cbc-slide 0.3s cubic-bezier(0.16,1,0.3,1)',
          fontFamily:"'DM Sans',sans-serif",
          color:'#F5F0E8',
          position:'relative',
        }}
      >
        {/* Confetti pop */}
        {showPop && (
          <div style={{
            position:'fixed', top:'30%', left:'50%',
            background:'#A855F7', color:'#fff',
            fontWeight:700, fontSize:16,
            padding:'8px 24px', borderRadius:999,
            animation:'cbc-pop 1.2s ease forwards',
            pointerEvents:'none', zIndex:9999,
          }}>
            🎂 Sent to Doggy Bakery!
          </div>
        )}

        {/* Header */}
        <div style={{
          padding:'20px 20px 16px',
          background:'linear-gradient(135deg,#0F0A1E,rgba(168,85,247,0.15))',
          borderBottom:'1px solid rgba(168,85,247,0.15)',
          position:'sticky', top:0, zIndex:10,
          borderRadius:'24px 24px 0 0',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#A855F7', letterSpacing:'0.14em', marginBottom:4 }}>
                DOGGY BAKERY™ · BREED CAKE
              </div>
              <div style={{
                fontFamily:"'Cormorant Garamond',Georgia,serif",
                fontSize:'1.5rem', fontWeight:300, lineHeight:1.2,
              }}>
                A cake that looks like <em style={{ color:'#A855F7' }}>their dog.</em>
              </div>
            </div>
            <button onClick={onClose} data-testid="cake-modal-close" style={{
              width:32, height:32, borderRadius:'50%',
              background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'rgba(245,240,232,0.5)',
              cursor:'pointer', fontSize:16,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 20px 40px' }}>
          {!done ? (
            <>
              {/* Breed selector */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,240,232,0.4)', letterSpacing:'0.08em' }}>
                  BREED
                </div>
                <button
                  onClick={() => setShowBreeds(p => !p)}
                  style={{ background:'none', border:'none', color:'#A855F7', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                >
                  {showBreeds ? 'Show less ▲' : 'All breeds ▾'}
                </button>
              </div>

              <div style={{
                display:'flex', gap:6, flexWrap: showBreeds ? 'wrap' : 'nowrap',
                overflowX: showBreeds ? 'visible' : 'auto',
                marginBottom:20, paddingBottom:4,
              }}>
                {(showBreeds ? orderedBreeds : orderedBreeds.slice(0, 12)).map(b => {
                  const isPetBreed = b === defaultBreed;
                  return (
                    <button
                      key={b}
                      className={`cbc-breed ${breed === b ? 'sel' : 'unsel'}`}
                      onClick={() => { setBreed(b); setShowBreeds(false); }}
                      data-testid={`breed-pill-${b.replace(/\s+/g,'-')}`}
                    >
                      {isPetBreed ? `${petName} (${b.charAt(0).toUpperCase()+b.slice(1)})` : b.charAt(0).toUpperCase() + b.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Illustration picker */}
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,240,232,0.4)', letterSpacing:'0.08em', marginBottom:10 }}>
                PICK THE ONE THAT LOOKS LIKE YOUR DOG
              </div>

              {loading ? (
                <div style={{ textAlign:'center', padding:'32px', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  Loading {breed} illustrations…
                </div>
              ) : illus.length > 0 ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
                  {illus.map((p, i) => {
                    const imgUrl = p.cloudinary_url || p.mockup_url || p.image_url;
                    const isSel  = selIllus?.id === p.id || selIllus === p;
                    const variantName = p.name?.split(' ').slice(-2).join(' ') || `Style ${i+1}`;
                    return (
                      <div
                        key={i}
                        className={`cbc-illus${isSel ? ' sel' : ''}`}
                        onClick={() => setSelIllus(p)}
                        data-testid={`illus-card-${i}`}
                      >
                        <div style={{
                          height:90, background:'rgba(255,255,255,0.96)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          position:'relative', overflow:'hidden',
                        }}>
                          {imgUrl
                            ? <img src={imgUrl} alt={variantName} style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }}/>
                            : <span style={{ fontSize:36 }}>🎂</span>
                          }
                          {isSel && (
                            <div style={{
                              position:'absolute', top:6, right:6,
                              width:18, height:18, borderRadius:'50%',
                              background:'#A855F7',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:10, color:'#fff',
                            }}>✓</div>
                          )}
                        </div>
                        <div style={{
                          padding:'6px 8px', fontSize:10, fontWeight:600,
                          color: isSel ? '#A855F7' : 'rgba(245,240,232,0.5)',
                          textAlign:'center', background:'#0F0A1E',
                        }}>
                          {variantName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  background:'rgba(255,255,255,0.03)',
                  border:'1px dashed rgba(255,255,255,0.1)',
                  borderRadius:14, padding:'24px',
                  textAlign:'center', marginBottom:20,
                  fontSize:13, color:'rgba(245,240,232,0.3)',
                }}>
                  🎂 {breed.charAt(0).toUpperCase()+breed.slice(1)} cake illustrations being generated.
                  <br/>
                  <span style={{ fontSize:11, marginTop:6, display:'block' }}>
                    Check back in a few minutes — or choose another breed above.
                  </span>
                </div>
              )}

              {/* Base selector (Oats / Ragi) */}
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,240,232,0.4)', letterSpacing:'0.08em', marginBottom:10 }}>
                CAKE BASE
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                {BASE_OPTIONS.map(b => (
                  <button
                    key={b.id}
                    className={`cbc-base${base === b.id ? ' sel' : ''}`}
                    onClick={() => setBase(b.id)}
                    data-testid={`base-option-${b.id}`}
                  >
                    <div style={{ fontSize:20, marginBottom:3 }}>{b.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color: base===b.id ? '#A855F7' : '#F5F0E8' }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize:10, color: base===b.id ? '#A855F7' : 'rgba(245,240,232,0.4)', marginTop:2 }}>
                      {b.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Flavour selector */}
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,240,232,0.4)', letterSpacing:'0.08em', marginBottom:10 }}>
                CAKE FLAVOUR
                <span style={{ fontWeight:400, fontSize:10, marginLeft:6, color:'#C9973A' }}>
                  · price varies by flavour
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:4 }}>
                {sortedFlavours.map(f => {
                  const isFav = petFavIds.has(f.id);
                  return (
                    <button
                      key={f.id}
                      className={`cbc-flav${flavour === f.id ? ' sel' : ''}`}
                      onClick={() => setFlavour(f.id)}
                      data-testid={`flavour-btn-${f.id}`}
                      title={`₹${f.price.toLocaleString('en-IN')}`}
                      style={isFav ? { borderColor:'rgba(201,151,58,0.6)', color:'#C9973A', background:'rgba(201,151,58,0.10)' } : {}}
                    >
                      {f.label}
                      {isFav && (
                        <span style={{ marginLeft:5, fontSize:10, background:'rgba(201,151,58,0.20)', borderRadius:4, padding:'1px 5px', color:'#C9973A', fontWeight:700 }}>
                          {petName}'s fave
                        </span>
                      )}
                      <span style={{ marginLeft:5, fontSize:10, opacity:0.7 }}>
                        ₹{f.price.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Fish note — as specified */}
              <div style={{ fontSize:11, color:'rgba(245,240,232,0.35)', marginTop:6, marginBottom: allergies.length > 0 ? 8 : 20 }}>
                🐟 Fish = Salmon · Safe for most dogs · Not suitable if fish-allergic
              </div>

              {allergies.length > 0 && (
                <div style={{ fontSize:11, color:'rgba(245,240,232,0.3)', marginBottom:20, paddingLeft:4 }}>
                  ⚠️ Showing allergen-safe options only — no {allergies.join(', ')} for {petName}
                </div>
              )}

              {/* Price summary pill */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'rgba(201,151,58,0.08)', border:'1px solid rgba(201,151,58,0.25)',
                borderRadius:12, padding:'10px 16px', marginBottom:20,
              }}>
                <span style={{ fontSize:12, color:'rgba(245,240,232,0.5)' }}>
                  {selectedBase?.label} base · {selectedFlavour?.label?.split(' ').slice(1).join(' ') || flavour}
                </span>
                <span style={{ fontSize:18, fontWeight:700, color:'#C9973A' }} data-testid="cake-price-display">
                  {price}
                </span>
              </div>

              {/* Message on cake */}
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,240,232,0.4)', letterSpacing:'0.08em', marginBottom:10 }}>
                MESSAGE ON THE CAKE
                <span style={{ fontWeight:400, fontSize:10, marginLeft:6 }}>(optional · max 30 chars)</span>
              </div>
              <textarea
                className="cbc-textarea"
                rows={2}
                maxLength={30}
                placeholder={`e.g. "Happy Birthday ${petName}! 🐾"`}
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ marginBottom:4 }}
                data-testid="cake-message-input"
              />
              <div style={{ fontSize:11, color:'rgba(245,240,232,0.25)', textAlign:'right', marginBottom:20 }}>
                {message.length}/30
              </div>

              {/* Mira note */}
              <div style={{
                background:'rgba(168,85,247,0.08)',
                border:'1px solid rgba(168,85,247,0.2)',
                borderRadius:12, padding:'12px 14px',
                marginBottom:20,
                display:'flex', gap:8, alignItems:'flex-start',
              }}>
                <span style={{ fontSize:14, flexShrink:0 }}>✦</span>
                <div style={{ fontSize:12, fontStyle:'italic', color:'rgba(245,240,232,0.65)', lineHeight:1.6 }}>
                  {selIllus
                    ? `Your ${breed} breed cake on ${selectedBase?.label} base with ${selectedFlavour?.label?.split(' ').slice(1).join(' ') || flavour} is going to Doggy Bakery. They'll confirm the delivery date on WhatsApp.`
                    : `Pick an illustration above and Doggy Bakery will bake it for ${petName}. 🎂`
                  }
                  {allergies.length > 0 && ` No ${allergies.join(' or ')} — noted.`}
                </div>
              </div>

              {/* Order CTA */}
              <button
                onClick={handleOrder}
                disabled={sending || !selIllus}
                data-testid="cake-order-btn"
                style={{
                  width:'100%', padding:'16px', borderRadius:14, border:'none',
                  background: selIllus && !sending
                    ? 'linear-gradient(135deg,#A855F7,#9333EA)'
                    : 'rgba(255,255,255,0.06)',
                  color: selIllus && !sending ? '#fff' : 'rgba(245,240,232,0.3)',
                  fontSize:15, fontWeight:700,
                  cursor: selIllus && !sending ? 'pointer' : 'not-allowed',
                  fontFamily:'inherit', marginBottom:10,
                  transition:'all 0.2s',
                }}
              >
                {sending
                  ? 'Sending to Doggy Bakery…'
                  : !selIllus
                  ? 'Pick an illustration first'
                  : `Order ${breed} cake → Doggy Bakery`
                }
              </button>
              <div style={{ textAlign:'center', fontSize:11, color:'rgba(245,240,232,0.25)' }}>
                No payment now · {price} · Delivery date confirmed on WhatsApp
              </div>
            </>
          ) : (
            /* Done screen */
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎂</div>

              <div style={{
                fontFamily:"'Cormorant Garamond',Georgia,serif",
                fontSize:'1.7rem', fontWeight:300,
                color:'#F5F0E8', marginBottom:12, lineHeight:1.2,
              }}>
                Order sent. <em style={{ color:'#A855F7' }}>Doggy Bakery is on it.</em>
              </div>

              <p style={{ fontSize:13, color:'rgba(245,240,232,0.55)', lineHeight:1.7, marginBottom:24 }}>
                Your {breed} breed cake on {selectedBase?.label} base — {selectedFlavour?.label?.split(' ').slice(1).join(' ')} sponge, {price} — is on its way to our bakers.
                They'll WhatsApp you a price confirmation and delivery date within a few hours.
              </p>

              {selIllus && (selIllus.cloudinary_url || selIllus.mockup_url) && (
                <div style={{
                  width:120, height:120, borderRadius:16,
                  overflow:'hidden', margin:'0 auto 20px',
                  border:'2px solid rgba(168,85,247,0.3)',
                  background:'rgba(255,255,255,0.96)',
                }}>
                  <img
                    src={selIllus.cloudinary_url || selIllus.mockup_url}
                    alt="Your cake illustration"
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }}
                  />
                </div>
              )}

              <div style={{
                background:'rgba(168,85,247,0.08)',
                border:'1px solid rgba(168,85,247,0.2)',
                borderRadius:12, padding:'12px 14px',
                fontSize:12, fontStyle:'italic',
                color:'rgba(245,240,232,0.65)', lineHeight:1.6,
                marginBottom:24,
              }}>
                "Your {breed} cake is going to be beautiful. Doggy Bakery will bake it with love — just for {petName}. 🌷"
              </div>

              <button onClick={onClose} data-testid="cake-done-close" style={{
                width:'100%', padding:'14px', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#A855F7,#9333EA)',
                color:'#fff', fontSize:15, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                Back to Celebrate →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
