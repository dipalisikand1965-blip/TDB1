/**
 * DoggyBakeryCakeModal.jsx — Birthday Cakes Browse (The Doggy Bakery)
 * Row 1: Breed match — active pet's breed cake shown with "Made for [breed]" badge
 * Row 2: Shape chips (All · Circle · Bone · Heart · Square · Star · Paw) + "Other Breeds ▾"
 * Row 3: Filtered grid, 12 per page, Load More
 * Soul Made: wired to SoulMadeModal (createPortal — no z-index trap)
 * Order flow: View Details → ProductDetailModal → ticket (existing)
 *
 * Triggered via:
 *   - openBirthdayBoxBrowse custom event
 *   - <DoggyBakeryCakeModal pet={...} onClose={...} /> prop-based
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import SoulMadeModal from '../SoulMadeModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const PAGE_SIZE = 12;

/* ── Allergen helpers (per user spec) ──────────────────────────────────── */
const getAllergies = (pet) => {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => {
      if (x && !/^(none|no|unknown)$/i.test(String(x).trim()))
        s.add(String(x).trim().toLowerCase());
    });
    else if (v && !/^(none|no|unknown)$/i.test(String(v).trim()))
      s.add(String(v).trim().toLowerCase());
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.allergies);
  return [...s];
};
const isAllergen = (flavourName, pet) => {
  const allergies = getAllergies(pet).map(a => a.toLowerCase());
  const fl = (flavourName || '').toLowerCase();
  return allergies.some(a =>
    fl.includes(a) ||
    // Fish & Salmon cover each other
    (a === 'fish'   && fl.includes('salmon')) ||
    (a === 'salmon' && fl.includes('fish'))
  );
};

/* ── Flavours (TDB actual range) ────────────────────────────────────────── */
const FLAVOURS = [
  { name: 'Banana',        emoji: '🍌' },
  { name: 'Carrot',        emoji: '🥕' },
  { name: 'Chicken',       emoji: '🍗' },
  { name: 'Mutton',        emoji: '🥩' },
  { name: 'Peanut Butter', emoji: '🥜' },
  { name: 'Blueberry',     emoji: '🫐' },
  { name: 'Coconut Cream', emoji: '🥥' },
  { name: 'Strawberry',    emoji: '🍓' },
  { name: 'Fish & Salmon', emoji: '🐟' },
  { name: 'Pumpkin',       emoji: '🎃' },
];

/* ── Favourite flavour detection (maps pet soul answers → FLAVOUR names) ── */
const FLAVOUR_KEYWORDS = {
  'Banana':        ['banana'],
  'Carrot':        ['carrot', 'vegetable', 'veggie'],
  'Chicken':       ['chicken', 'poultry'],
  'Mutton':        ['mutton', 'lamb'],
  'Peanut Butter': ['peanut', 'peanut butter'],
  'Blueberry':     ['blueberry', 'berry'],
  'Coconut Cream': ['coconut'],
  'Strawberry':    ['strawberry'],
  'Fish & Salmon': ['fish', 'salmon', 'seafood'],
  'Pumpkin':       ['pumpkin'],
};

function getPetFavFlavourName(pet) {
  const soul = pet?.doggy_soul_answers || {};
  const sources = [
    soul.favorite_protein,
    soul.petFavouriteFood1,
    soul.petFavouriteFood2,
    soul.favourite_protein,
    soul.taste_banana === true ? 'banana' : null,
    ...(Array.isArray(soul.favorite_treats) ? soul.favorite_treats : [soul.favorite_treats]),
  ].filter(Boolean).map(s => String(s).toLowerCase());

  for (const [flavName, keywords] of Object.entries(FLAVOUR_KEYWORDS)) {
    if (sources.some(src => keywords.some(kw => src.includes(kw)))) {
      return flavName;
    }
  }
  return null;
}
const SIZES = [
  { label: 'Mini',    desc: 'Feeds 2–4',   price: 450  },
  { label: 'Regular', desc: 'Feeds 6–8',   price: 750  },
  { label: 'Large',   desc: 'Feeds 10–12', price: 1100 },
];

const SHAPE_CHIPS = [
  { id: 'all',    label: 'All' },
  { id: 'Circle', label: 'Circle' },
  { id: 'Bone',   label: 'Bone' },
  { id: 'Heart',  label: 'Heart' },
  { id: 'Square', label: 'Square' },
  { id: 'Star',   label: 'Star' },
  { id: 'Paw',    label: 'Paw' },
];

function validImg(url) {
  return url && typeof url === 'string' && url.startsWith('http');
}

export default function DoggyBakeryCakeModal({ pet: petProp, onClose: onCloseProp }) {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(!!petProp);
  const [pet, setPet] = useState(petProp || null);

  // Data
  const [cakes, setCakes] = useState([]);
  const [breedCakes, setBreedCakes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [shape, setShape] = useState('all');
  const [breedFilter, setBreedFilter] = useState(null);
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [breedSearch, setBreedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Order form state
  const [orderProduct, setOrderProduct]   = useState(null); // product selected for ordering
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [selectedBase,   setSelectedBase]   = useState('Oats');
  const [selectedSize,   setSelectedSize]   = useState(SIZES[0].label);
  const [petNameOnCake,  setPetNameOnCake]  = useState('');
  const [deliveryDate,   setDeliveryDate]   = useState('');
  const [deliveryTime,   setDeliveryTime]   = useState('');
  const [deliveryType,   setDeliveryType]   = useState('');
  const [cakeMessage,    setCakeMessage]    = useState('');
  const [errors,         setErrors]         = useState({});
  const [orderSending,   setOrderSending]   = useState(false);

  // Modals
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);

  const petName   = pet?.name || 'your dog';
  const petBreed  = (pet?.breed || '').toLowerCase();
  const allergies = getAllergies(pet);
  const totalPrice = SIZES.find(s => s.label === selectedSize)?.price || 0;

  // ── Listen for custom event (replaces BirthdayBoxBrowseDrawer trigger) ──────
  useEffect(() => {
    const handler = (e) => {
      const { pet: petObj, petName: name, petBreed: breed } = e.detail || {};
      setPet(petObj || (name ? { name, breed } : null));
      setShape('all');
      setBreedFilter(null);
      setPage(1);
      setIsOpen(true);
    };
    window.addEventListener('openDoggyBakeryCakes', handler);
    return () => window.removeEventListener('openDoggyBakeryCakes', handler);
  }, []);

  // ── Fetch cakes on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/product-box/products?category=cakes&limit=200&status=active`, { headers })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : d.products || d.data || []),
      fetch(`${API_URL}/api/product-box/products?category=breed-cakes&limit=100&status=active`, { headers })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : d.products || d.data || []),
    ])
      .then(([c, b]) => { setCakes(c); setBreedCakes(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, token]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onCloseProp?.();
  }, [onCloseProp]);

  // Open order form for a selected cake
  const openOrderForm = useCallback((product) => {
    setOrderProduct(product);
    // Pre-select: safe favourite > any safe > first flavour
    const favName = getPetFavFlavourName(pet);
    const safeFav = favName ? FLAVOURS.find(f => f.name === favName && !isAllergen(f.name, pet)) : null;
    const anySafe = FLAVOURS.find(f => !isAllergen(f.name, pet));
    setSelectedFlavour((safeFav || anySafe || FLAVOURS[0]).name);
    setSelectedBase('Oats');
    setSelectedSize(SIZES[0].label);
    setPetNameOnCake(pet?.name || '');
    setDeliveryDate('');
    setDeliveryTime('');
    setDeliveryType('');
    setCakeMessage('');
    setErrors({});
  }, [pet]);

  // Validate — every field compulsory
  const validate = useCallback(() => {
    const e = {};
    if (!selectedFlavour)  e.flavour      = 'Please select a flavour';
    if (!selectedBase)     e.base         = 'Please select a base';
    if (!selectedSize)     e.size         = 'Please select a size';
    if (!petNameOnCake)    e.petName      = 'Please enter the name for the cake';
    if (!deliveryDate)     e.date         = 'Please select a delivery date';
    if (!deliveryTime)     e.time         = 'Please select a delivery time slot';
    if (!deliveryType)     e.deliveryType = 'Please select delivery or pickup';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [selectedFlavour, selectedBase, selectedSize, petNameOnCake, deliveryDate, deliveryTime, deliveryType]);

  // Confirm order: 1) add to cart immediately  2) fire service desk ticket in background
  const handleConfirmOrder = useCallback(async () => {
    if (!validate()) return;
    setOrderSending(true);
    try {
      // Resolve the best product image (TDC priority order from design bible)
      const productImage = orderProduct?.watercolor_image
        || orderProduct?.cloudinary_url
        || orderProduct?.mockup_url
        || orderProduct?.primary_image
        || orderProduct?.image_url
        || orderProduct?.image
        || '';

      const cakeShape = orderProduct?.tags?.find(
        t => ['Circle','Bone','Heart','Square','Star','Paw'].includes(t)
      ) || '';

      // ── 1. Add to cart immediately ───────────────────────────────────────
      addToCart(
        {
          id:    orderProduct?.id || `cake-${Date.now()}`,
          name:  orderProduct?.name || 'Custom Birthday Cake',
          price: totalPrice,
          image: productImage,
          pillar: 'celebrate',
          isCakeOrder: true,
          customDetails: {
            // Taste
            flavour:      selectedFlavour,
            base:         selectedBase,
            size:         selectedSize,
            shape:        cakeShape,
            // Personalisation
            customName:   petNameOnCake,
            message:      cakeMessage || '',
            // Delivery
            date:         deliveryDate,
            deliveryTime: deliveryTime,
            deliveryType: deliveryType,
            // Pet
            petId:        pet?.id,
            petName:      petName,
            petBreed:     pet?.breed || '',
            petAllergies: allergies,
            // North star / soul
            lifeVision:   pet?.doggy_soul_answers?.life_vision || '',
            // Product meta
            productName:  orderProduct?.name,
            productPrice: orderProduct?.original_price,
            pillar:       'celebrate',
            source:       'doggy_bakery_cake_modal',
          },
        },
        selectedSize,
        selectedFlavour,
        1
      );

      // ── 2. Fire service desk ticket in background (non-blocking) ─────────
      fetch(`${API_URL}/api/celebrate/cake-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pet_id:           pet?.id,
          pet_name:         petName,
          pet_breed:        pet?.breed || '',
          pet_allergies:    allergies,
          product_name:     orderProduct?.name,
          product_id:       orderProduct?.id,
          product_image:    productImage,
          product_price:    orderProduct?.original_price,
          flavour:          selectedFlavour,
          base:             selectedBase,
          size:             selectedSize,
          shape:            cakeShape,
          pet_name_on_cake: petNameOnCake,
          message_on_cake:  cakeMessage || '',
          delivery_date:    deliveryDate,
          delivery_time:    deliveryTime,
          delivery_type:    deliveryType,
          total_price:      totalPrice,
          life_vision:      pet?.doggy_soul_answers?.life_vision || '',
          source:           'doggy_bakery_cake_modal',
        }),
      }).catch(e => console.warn('[DoggyBakeryCakeModal] ticket fire failed (non-critical):', e));

      // ── 3. Close modal — cart is now open ────────────────────────────────
      onCloseProp?.();

    } catch (e) {
      console.error('[DoggyBakeryCakeModal] addToCart failed', e);
      toast.error('Could not add to cart. Please try again.');
    }
    setOrderSending(false);
  }, [validate, addToCart, orderProduct, selectedFlavour, selectedBase, selectedSize, petNameOnCake, deliveryDate, deliveryTime, deliveryType, cakeMessage, allergies, totalPrice, pet, petName, token, onCloseProp]);

  // ── Breed match row ───────────────────────────────────────────────────────
  const matchedBreedCakes = breedCakes.filter(p => {
    if (!petBreed) return false;
    const tags = (p.tags || []).map(t => String(t).toLowerCase());
    const name = (p.name || '').toLowerCase();
    return tags.some(t => t.includes(petBreed) || petBreed.includes(t.replace(' cake','').trim())) ||
      name.includes(petBreed);
  }).map(p => ({ ...p, _breedMatch: true, _breedLabel: pet?.breed || petBreed }));

  // ── All available breed names from breed-cakes (use product name directly) ─
  const allBreedNames = breedCakes
    .map(p => (p.name || '').trim())
    .filter(name => {
      if (!name || name.toLowerCase() === petBreed) return false;
      const lower = name.toLowerCase();
      // Exclude cake variety names — keep only pure breed names
      if (lower.endsWith(' cake') || lower.endsWith(' cakes') ||
          lower.includes('munch') || lower.includes('smiles') ||
          lower.startsWith('frosty') || lower.startsWith('peanut') ||
          lower.startsWith('mynx') || lower === 'labowbow') return false;
      return true;
    })
    .sort();

  // ── Filtered grid ─────────────────────────────────────────────────────────
  let gridCakes = breedFilter
    ? breedCakes.filter(p => {
        const name = (p.name || '').toLowerCase();
        const bf = breedFilter.toLowerCase();
        return name === bf || name.includes(bf) ||
          (p.tags || []).some(t => String(t).toLowerCase().includes(bf));
      })
    : cakes;

  if (shape !== 'all') {
    gridCakes = gridCakes.filter(p =>
      (p.tags || []).some(t => String(t).toLowerCase() === shape.toLowerCase())
    );
  }

  const totalVisible = page * PAGE_SIZE;
  const visibleCakes = gridCakes.slice(0, totalVisible);
  const hasMore = totalVisible < gridCakes.length;

  if (!isOpen) return null;

  /* ── Order form panel (slides over the browse list) ─────────────────── */
  const BASES = [
    { name: 'Oats', desc: 'Light & wholesome' },
    { name: 'Ragi', desc: 'Nutrient-rich' },
  ];
  const TIME_SLOTS = ['10am – 12pm', '12pm – 2pm', '2pm – 4pm', '4pm – 6pm', '6pm – 8pm'];

  const orderPanel = orderProduct && (
    <div style={{ position:'fixed', inset:0, zIndex:2147483642, display:'flex', alignItems:'flex-end', justifyContent:'center', touchAction:'none' }}>
      <div onClick={() => setOrderProduct(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} />
      <div style={{ position:'relative', width:'100%', maxWidth:560, background:'#FFFBFF', borderRadius:'20px 20px 0 0', padding:'24px 20px 40px', maxHeight:'92vh', overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', boxShadow:'0 -16px 60px rgba(155,89,182,0.25)', paddingBottom:'max(40px, env(safe-area-inset-bottom, 40px))' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#1A1208' }}>🎂 Customise Your Cake</div>
            <div style={{ fontSize:13, color:'#9B59B6', fontWeight:600, marginTop:2 }}>{orderProduct.name}</div>
          </div>
          <button onClick={() => setOrderProduct(null)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#F5EEF8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} color="#6C3483" />
          </button>
        </div>

        {/* ── Order form ────────────────────────────────────────────────── */}
          {/* ── CAKE FLAVOUR ─────────────────────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:10 }}>CAKE FLAVOUR *</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:4 }}>
              {FLAVOURS.map(f => {
                const unsafe = isAllergen(f.name, pet);
                return (
                  <button key={f.name} onClick={() => { setSelectedFlavour(f.name); setErrors(p => ({...p, flavour:undefined})); }}
                    data-testid={`cake-flavour-${f.name.replace(/\s+/g,'-').toLowerCase()}`}
                    style={{ padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:600, cursor:'pointer', position:'relative', transition:'all 0.15s',
                      border: selectedFlavour===f.name ? '2px solid #9B59B6' : unsafe ? '2px solid #EF4444' : '2px solid #E8D5F5',
                      background: selectedFlavour===f.name ? '#9B59B6' : unsafe ? 'rgba(239,68,68,0.08)' : '#F5EEFF',
                      color: selectedFlavour===f.name ? '#fff' : unsafe ? '#EF4444' : '#7B2D8B' }}>
                    {f.emoji} {f.name}
                    {unsafe && <span style={{ position:'absolute', top:-6, right:-6, background:'#EF4444', color:'#fff', fontSize:9, fontWeight:700, borderRadius:999, padding:'2px 5px', lineHeight:1 }}>⚠ {petName}</span>}
                  </button>
                );
              })}
            </div>
            {isAllergen(selectedFlavour, pet) && (
              <div style={{ marginBottom:8, padding:'8px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, fontSize:13, color:'#EF4444' }}>
                ⚠ {petName} is allergic to {selectedFlavour.toLowerCase()}. Are you ordering for a different dog?
              </div>
            )}
            {errors.flavour && <div style={{ color:'#EF4444', fontSize:12, marginTop:4, marginBottom:6 }}>⚠ {errors.flavour}</div>}

            {/* ── CAKE BASE ────────────────────────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:10, marginTop:18 }}>CAKE BASE *</div>
            <div style={{ display:'flex', gap:10, marginBottom:4 }}>
              {BASES.map(b => (
                <button key={b.name} onClick={() => { setSelectedBase(b.name); setErrors(p => ({...p, base:undefined})); }}
                  style={{ flex:1, padding:'12px 8px', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                    border: selectedBase===b.name ? '2px solid #9B59B6' : '2px solid #E8D5F5',
                    background: selectedBase===b.name ? '#9B59B6' : '#F5EEFF',
                    color: selectedBase===b.name ? '#fff' : '#7B2D8B' }}>
                  <div>{b.name}</div>
                  <div style={{ fontSize:11, opacity:0.75, marginTop:2 }}>{b.desc}</div>
                </button>
              ))}
            </div>
            {errors.base && <div style={{ color:'#EF4444', fontSize:12, marginTop:4, marginBottom:6 }}>⚠ {errors.base}</div>}

            {/* ── CAKE SIZE ────────────────────────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:10, marginTop:18 }}>CAKE SIZE *</div>
            <div style={{ display:'flex', gap:8, marginBottom:4 }}>
              {SIZES.map(s => (
                <button key={s.label} onClick={() => { setSelectedSize(s.label); setErrors(p => ({...p, size:undefined})); }}
                  data-testid={`cake-size-${s.label.toLowerCase()}`}
                  style={{ flex:1, padding:'10px 8px', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', textAlign:'center',
                    border: selectedSize===s.label ? '2px solid #9B59B6' : '2px solid #E8D5F5',
                    background: selectedSize===s.label ? '#9B59B6' : '#F5EEFF',
                    color: selectedSize===s.label ? '#fff' : '#7B2D8B' }}>
                  <div>{s.label}</div>
                  <div style={{ fontSize:11, opacity:0.75, marginTop:2 }}>{s.desc}</div>
                  <div style={{ fontSize:12, fontWeight:700, marginTop:4 }}>₹{s.price}</div>
                </button>
              ))}
            </div>
            {errors.size && <div style={{ color:'#EF4444', fontSize:12, marginTop:4, marginBottom:6 }}>⚠ {errors.size}</div>}

            {/* ── PET NAME ON CAKE ─────────────────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:8, marginTop:18 }}>PET NAME ON CAKE *</div>
            <input value={petNameOnCake} onChange={e => { setPetNameOnCake(e.target.value); setErrors(p => ({...p, petName:undefined})); }}
              placeholder={petName}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${errors.petName ? '#EF4444' : '#E8D5F5'}`, fontSize:14, marginBottom:4, boxSizing:'border-box', color:'#1A1208', background:'#FFFBFF' }} />
            {errors.petName && <div style={{ color:'#EF4444', fontSize:12, marginTop:2, marginBottom:6 }}>⚠ {errors.petName}</div>}

            {/* ── DELIVERY DATE & TIME SLOT ────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:8 }}>DELIVERY DATE *</div>
                <input type="date" value={deliveryDate} onChange={e => { setDeliveryDate(e.target.value); setErrors(p => ({...p, date:undefined})); }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${errors.date ? '#EF4444' : '#E8D5F5'}`, fontSize:13, boxSizing:'border-box', color:'#1A1208', background:'#FFFBFF' }} />
                {errors.date && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>⚠ {errors.date}</div>}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:8 }}>TIME SLOT *</div>
                <select value={deliveryTime} onChange={e => { setDeliveryTime(e.target.value); setErrors(p => ({...p, time:undefined})); }}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${errors.time ? '#EF4444' : '#E8D5F5'}`, fontSize:13, boxSizing:'border-box', color: deliveryTime ? '#1A1208' : '#9B8FAA', background:'#FFFBFF' }}>
                  <option value="">Pick a slot</option>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.time && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>⚠ {errors.time}</div>}
              </div>
            </div>

            {/* ── DELIVERY TYPE ────────────────────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:10, marginTop:18 }}>DELIVERY TYPE *</div>
            <div style={{ display:'flex', gap:10, marginBottom:4 }}>
              {['Delivery', 'Pickup'].map(t => (
                <button key={t} onClick={() => { setDeliveryType(t); setErrors(p => ({...p, deliveryType:undefined})); }}
                  style={{ flex:1, padding:'12px', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                    border: deliveryType===t ? '2px solid #9B59B6' : '2px solid #E8D5F5',
                    background: deliveryType===t ? '#9B59B6' : '#F5EEFF',
                    color: deliveryType===t ? '#fff' : '#7B2D8B' }}>
                  {t === 'Delivery' ? '🚚 Delivery' : '🏠 Pickup'}
                </button>
              ))}
            </div>
            {errors.deliveryType && <div style={{ color:'#EF4444', fontSize:12, marginTop:4, marginBottom:6 }}>⚠ {errors.deliveryType}</div>}

            {/* ── MESSAGE ON CAKE (optional) ───────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:8, marginTop:18 }}>
              MESSAGE ON CAKE <span style={{ fontWeight:400, color:'#B8A0CC' }}>(optional)</span>
            </div>
            <textarea value={cakeMessage} onChange={e => setCakeMessage(e.target.value)} rows={2}
              placeholder={`Happy Birthday ${petName}!`}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8D5F5', fontSize:14, resize:'none', marginBottom:20, boxSizing:'border-box', color:'#1A1208', background:'#FFFBFF', fontFamily:'inherit' }} />

            {/* ── Price summary + Confirm ──────────────────────────────── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(155,89,182,0.07)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#9B59B6' }}>{selectedSize}{selectedFlavour ? ` · ${selectedFlavour}` : ''}{selectedBase ? ` · ${selectedBase}` : ''}</span>
              <span style={{ fontSize:18, fontWeight:800, color:'#6C3483' }}>₹{totalPrice}</span>
            </div>

            <button
              onClick={() => { if (!validate()) return; handleConfirmOrder(); }}
              disabled={orderSending}
              data-testid="confirm-cake-order"
              style={{ width:'100%', background:'linear-gradient(135deg,#4A1B6D,#9B59B6)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer', opacity: orderSending ? 0.7 : 1 }}
            >
              {orderSending ? 'Placing order…' : 'Confirm Order →'}
            </button>
        </div>
      </div>
  );

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2147483640 }}
      />

      {/* Modal */}
      <div
        data-testid="doggy-bakery-cake-modal"
        style={{
          position: 'fixed', inset: 0, zIndex: 2147483641,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', pointerEvents: 'none', overflow: 'hidden',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 620,
            maxHeight: '90dvh', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: '#FFFBFF', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(155,89,182,0.25)',
            pointerEvents: 'all',
          }}
        >
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 2,
            background: '#FFFBFF', borderBottom: '1px solid #F5EEF8',
            padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🎂</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1208' }}>Birthday Cakes</span>
              </div>
              <div style={{ fontSize: 13, color: '#9B59B6', fontWeight: 600, marginTop: 2 }}>
                For <span style={{ color: '#6C3483' }}>{petName}</span>
              </div>
            </div>
            <button onClick={handleClose} data-testid="cake-modal-close"
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F5EEF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#6C3483" />
            </button>
          </div>

          <div style={{ padding: '16px 20px 32px' }}>

            {/* ── Soul Made™ card ───────────────────────────────────────── */}
            <div
              onClick={() => setSoulMadeOpen(true)}
              data-testid="soul-made-cta"
              style={{
                background: 'linear-gradient(135deg,#1A0A2E,#3D1260)',
                borderRadius: 14, padding: '18px 20px', marginBottom: 20,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,30,140,0.2) 0%,transparent 70%)' }} />
              <div style={{ fontSize: 12, letterSpacing: '0.12em', color: 'rgba(233,30,140,0.9)', fontWeight: 700, marginBottom: 8 }}>
                ✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>
                {petName}'s face. On everything.
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontStyle: 'italic' }}>
                Upload a photo · Concierge® creates it
              </div>
              <button style={{
                background: 'linear-gradient(135deg,#C44DFF,#FF2D87)', color: '#fff',
                border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}>
                ✦ Make something only {petName} has
              </button>
            </div>

            {/* ── Row 1: Breed match ────────────────────────────────────── */}
            {matchedBreedCakes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9B59B6', marginBottom: 10 }}>
                  YOUR BREED · {(pet?.breed || petBreed).toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {matchedBreedCakes.slice(0, 4).map(p => (
                    <CakeTile key={p.id} product={p} onOrder={openOrderForm} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Row 2: Shape chips + Other Breeds ────────────────────── */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {SHAPE_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => { setShape(chip.id); setBreedFilter(null); setPage(1); }}
                  data-testid={`shape-chip-${chip.id}`}
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: shape === chip.id && !breedFilter ? '#9B59B6' : '#F5EEF8',
                    color: shape === chip.id && !breedFilter ? '#fff' : '#6C3483',
                    border: `1.5px solid ${shape === chip.id && !breedFilter ? '#9B59B6' : '#D4B8F0'}`,
                  }}
                >
                  {chip.label}
                </button>
              ))}

              {/* Other Breeds dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setBreedDropdownOpen(v => !v)}
                  data-testid="other-breeds-btn"
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    background: breedFilter ? '#9B59B6' : '#F5EEF8',
                    color: breedFilter ? '#fff' : '#6C3483',
                    border: `1.5px solid ${breedFilter ? '#9B59B6' : '#D4B8F0'}`,
                  }}
                >
                  {breedFilter ? breedFilter : 'Other Breeds'}
                  {breedDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {breedDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', left: 0, zIndex: 10,
                    background: '#fff', border: '1px solid #D4B8F0', borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(155,89,182,0.2)',
                    minWidth: 200, width: 220, padding: '6px 0',
                  }}>
                    {/* Search input */}
                    <div style={{ padding: '6px 10px 4px' }}>
                      <input
                        autoFocus
                        placeholder="Search breed…"
                        value={breedSearch}
                        onChange={e => setBreedSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 8,
                          border: '1px solid #D4B8F0', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto', padding: '2px 0' }}>
                    {breedFilter && (
                      <button onClick={() => { setBreedFilter(null); setShape('all'); setBreedDropdownOpen(false); setBreedSearch(''); setPage(1); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#C44DFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ Clear breed filter
                      </button>
                    )}
                    {allBreedNames.filter(b => !breedSearch || b.toLowerCase().includes(breedSearch.toLowerCase())).map(breed => (
                      <button key={breed}
                        onClick={() => { setBreedFilter(breed); setShape('all'); setBreedDropdownOpen(false); setBreedSearch(''); setPage(1); }}
                        data-testid={`breed-option-${breed}`}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13,
                          color: breedFilter === breed ? '#9B59B6' : '#1A1208', fontWeight: breedFilter === breed ? 700 : 400,
                          background: breedFilter === breed ? '#F5EEF8' : 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        {breed}
                      </button>
                    ))}
                    {allBreedNames.filter(b => !breedSearch || b.toLowerCase().includes(breedSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '8px 14px', fontSize: 12, color: '#B8A0CC' }}>No breeds found</div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 3: Grid + Load More ───────────────────────────────── */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9B59B6', marginBottom: 12 }}>
              {breedFilter ? `${breedFilter.toUpperCase()} CAKES` : shape !== 'all' ? `${shape.toUpperCase()} CAKES` : 'ALL BIRTHDAY CAKES'}
              <span style={{ fontWeight: 400, color: '#B8A0CC', marginLeft: 6 }}>({gridCakes.length})</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B59B6', fontSize: 14 }}>Loading cakes…</div>
            ) : visibleCakes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#B8A0CC', fontSize: 14 }}>
                No cakes found for this filter.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {visibleCakes.map(p => (
                    <CakeTile key={p.id} product={p} onOrder={openOrderForm} />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button
                      onClick={() => setPage(v => v + 1)}
                      data-testid="load-more-cakes"
                      style={{
                        padding: '10px 28px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                        background: 'linear-gradient(135deg,#9B59B6,#6C3483)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      Load more — {gridCakes.length - totalVisible} more cakes
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#B8A0CC' }}>
              ✦ Everything here is personalised for <strong style={{ color: '#6C3483' }}>{petName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SoulMade portal */}
      {soulMadeOpen && createPortal(
        <SoulMadeModal
          pet={pet}
          pillar="celebrate"
          pillarColor="#A855F7"
          pillarLabel="Celebration"
          onClose={() => setSoulMadeOpen(false)}
        />,
        document.body
      )}
    </>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {orderProduct && createPortal(orderPanel, document.body)}
    </>
  );
}

/* ── Simple cake thumbnail with Order button ─────────────────────────── */
function CakeTile({ product: p, onOrder }) {
  const img = p.image_url || p.cloudinary_url || p.mockup_url;
  return (
    <div style={{ borderRadius:14, overflow:'hidden', background:'#fff', border:'1px solid #E8D5F5', display:'flex', flexDirection:'column' }}>
      {img ? (
        <img src={img} alt={p.name} style={{ width:'100%', aspectRatio:'1', objectFit:'cover' }} />
      ) : (
        <div style={{ width:'100%', aspectRatio:'1', background:'#F5EEF8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🎂</div>
      )}
      <div style={{ padding:'8px 10px 10px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#1A1208', marginBottom:4, lineHeight:1.3, flexGrow:1 }}>{p.name}</div>
        {p.original_price > 0 && (
          <div style={{ fontSize:11, color:'#9B59B6', fontWeight:700, marginBottom:6 }}>₹{p.original_price?.toLocaleString('en-IN')}</div>
        )}
        <button
          onClick={() => onOrder(p)}
          data-testid={`cake-order-btn-${p.id}`}
          style={{ width:'100%', padding:'7px 0', borderRadius:8, border:'none', background:'linear-gradient(135deg,#9B59B6,#6C3483)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}
        >
          Order →
        </button>
      </div>
    </div>
  );
}
