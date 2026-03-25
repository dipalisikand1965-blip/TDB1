/**
 * SoulPillarExpanded.jsx
 * Celebrate Pillars Master Build — EXACT SPEC from Celebrate_Pillars_MASTER.docx
 * Sections: Panel header → Mira bar → Special panel (4 pillars) → Tab bar → Product grid → DrawerBottomBar
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import DrawerBottomBar from './DrawerBottomBar';
import ProductCard from '../ProductCard';

/* ── Shared concierge-request helper ─────────────────────────────────────── */
const API_BASE = process.env.REACT_APP_BACKEND_URL;

const sendToConcierge = async ({ requestType, label, message, petName }) => {
  try {
    const resp = await fetch(`${API_BASE}/api/concierge/pillar-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillar: 'celebrate',
        request_type: requestType,
        request_label: label,
        pet_name: petName,
        message,
        source: 'soul_pillar_expanded',
      }),
    });
    const data = await resp.json();
    return { success: true, ticketId: data.ticket_id, requestId: data.request_id };
  } catch {
    return { success: false };
  }
};

/* ── Tab definitions — EXACT from spec ─────────────────────────────────── */
const PILLAR_TABS = {
  food:      [
    { name: 'Birthday Feast',         category: 'cakes' },
    { name: 'Everyday Treats',         category: 'treats' },
    { name: 'Special Occasion',        category: 'desi-treats' },
    { name: 'Allergy-Safe Products',   category: 'nut-butters' },
  ],
  play:      [
    { name: 'Favourite Toys',    category: 'toys' },
    { name: 'Enrichment Kits',   category: 'puzzle_toys' },
    { name: 'Activity Bundles',  category: 'enrichment' },
    { name: 'Party Games',       category: 'party_accessories' },
  ],
  social:    [
    { name: 'Pawty Planning',    category: 'party_kits' },
    { name: 'Friend Gifts',      category: 'hampers' },
    { name: 'Venue Finder',      category: 'venue' },
    { name: 'Invitations',       category: 'party_accessories' },
  ],
  adventure: [
    { name: 'Birthday Walk',     category: 'walking' },
    { name: 'Outdoor Spots',     category: 'adventure' },
    { name: 'Adventure Gear',    category: 'travel' },
    { name: 'Trail Treats',      category: 'treats' },
  ],
  grooming:  [
    { name: 'Grooming Booking',       category: 'grooming', concierge: true },
    { name: 'Birthday Accessories',   category: 'party_accessories' },
    { name: 'Spa at Home',            category: 'grooming' },
    { name: 'Photo-Ready',            category: 'party_accessories' },
  ],
  learning:  [
    { name: 'Puzzle Toys',           category: 'puzzle_toys' },
    { name: 'Trick Kits',            category: 'training' },
    { name: 'Training Sessions',     category: 'training', concierge: true },
    { name: 'Brain Games',           category: 'puzzle_toys' },
  ],
  health:    [
    { name: 'Wellness Gifts',    category: 'supplements' },
    { name: 'Supplements',       category: 'supplements' },
    { name: 'Health Check',      category: 'health' },
    { name: 'Longevity Plan',    category: 'supplements' },
  ],
  memory:    [
    { name: 'Photoshoot',        category: 'portraits', concierge: true },
    { name: 'Custom Portrait',   category: 'portraits' },
    { name: 'Memory Book',       category: 'memory_books' },
    { name: 'Soul Story',        category: 'memory_books', concierge: true },
  ],
};

/* Safely convert a value that might be a string, array, or undefined to a lowercase string array */
const toStrArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).toLowerCase());
  if (typeof val === 'string') return val.split(/[,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  return [];
};

/* ── Exact Mira quotes from spec ─────────────────────────────────────────── */
const KNOWN_FLAVORS = ['salmon', 'chicken', 'beef', 'peanut butter', 'banana', 'lamb', 'tuna'];

const getMiraQuote = (pillarId, pet) => {
  const name = pet?.name || 'your pet';
  const friend1 = pet?.doggy_soul_answers?.pet_friends?.[0] || pet?.pet_friends?.[0] || 'Bruno';
  const friend2 = pet?.doggy_soul_answers?.pet_friends?.[1] || pet?.pet_friends?.[1] || 'Cookie';

  // Food pillar — derive the pet's top safe flavor dynamically
  const favTreats = toStrArray(pet?.doggy_soul_answers?.favorite_treats);
  const allergies = toStrArray(pet?.doggy_soul_answers?.food_allergies || pet?.allergies)
    .filter(a => a && a !== 'none');

  // Match a known clean flavor name from the pet's favorite treats
  const topFlavor = KNOWN_FLAVORS.find(
    f => favTreats.some(t => t.includes(f)) && !allergies.some(a => a && f.includes(a))
  ) || favTreats.find(t => !allergies.some(a => a && t.includes(a)));
  const topFlavourDisplay = topFlavor
    ? topFlavor.charAt(0).toUpperCase() + topFlavor.slice(1)
    : null;

  const quotes = {
    food: topFlavourDisplay
      ? `"I've checked every item here for ${name}. The ${topFlavourDisplay.toLowerCase()} cake is ${name}'s number one — I put it first. This is the feast ${name} deserves."`
      : `"I've checked every item here for ${name}. Nothing that could hurt them, everything that makes them happy. This is the feast ${name} deserves."`,
    play:      `"Play is ${name}'s top soul pillar. Every toy here was picked for their energy and play style. This isn't just a gift — it's speaking their language."`,
    social:    `"${name} is a Social Butterfly. Their birthday isn't complete without ${friend1} and ${friend2}. I've built the pawty around all three of them."`,
    adventure: `"${name}'s happiest when moving. Start their birthday with a sunrise walk — that's the real gift. Everything else is extra."`,
    grooming:  `"Every birthday dog deserves to look the part. ${name}'s birthday bandana is waiting. Book the pamper session first — everything else follows."`,
    learning:  `"${name} has a bright mind. The best birthday gift is something to solve. I've picked the right challenge level — they're ready for it."`,
    health:    `"The most loving thing you can give ${name} on their birthday is more time. Every product here is treatment-safe. I've checked each one personally."`,
    memory:    `"${name}'s birthday happens once. This is how you keep it. The portrait goes on the wall. The memory book is read for years. Start with the photoshoot."`,
  };
  return quotes[pillarId] || `"I've curated everything here with ${name} in mind."`;
};

/* ── Expanded titles + subtitles ─────────────────────────────────────────── */
const PILLAR_TITLES = {
  food:      { title: 'Food & Flavour — Birthday Feast',            sub: (p) => {
    const treats = toStrArray(p?.doggy_soul_answers?.favorite_treats);
    const allergies = toStrArray(p?.doggy_soul_answers?.food_allergies || p?.allergies);
    const topFlavor = treats.find(t => !allergies.some(a => a && t.includes(a))) || treats[0];
    const hasAllergens = allergies.filter(a => a && a !== 'none').length > 0;
    const allergenNote = hasAllergens ? `${allergies.filter(a => a && a !== 'none').join('-')}-free.` : 'Allergen-checked.';
    return topFlavor
      ? `${allergenNote} ${topFlavor.charAt(0).toUpperCase() + topFlavor.slice(1)}-forward. Every item checked by Mira.`
      : `${allergenNote} Every item checked by Mira.`;
  }},
  play:      { title: 'Play & Joy — The Language {petName} Speaks', sub: (p) => `Play is ${p?.name || 'your pet'}'s top soul pillar. Start here.` },
  social:    { title: 'Social & Friends — {petName}\'s Pawty',      sub: (p) => `Bruno and Cookie are already on the list. Let's plan.` },
  adventure: { title: 'Adventure & Move — Celebrate in Motion',    sub: (p) => `${p?.name || 'your pet'}'s happiest when moving. Make their birthday start with their favourite thing.` },
  grooming:  { title: 'Grooming & Beauty — Birthday Glow-Up',      sub: () => `Every birthday dog deserves to look the part.` },
  learning:  { title: 'Learning & Mind — A Gift That Grows',       sub: (p) => `The best birthday gift you can give ${p?.name || 'your pet'} is something to solve.` },
  health:    { title: 'Health & Wellness — The Most Loving Gift',  sub: (p) => `I've noted ${p?.name || 'your pet'}'s health. Everything here supports their strength.` },
  memory:    { title: 'Love & Memory — Make This Birthday Permanent', sub: (p) => `${p?.name || 'your pet'}'s birthday happens once. This is how you keep it.` },
};

/* ── Pet-dependent feast item derivation ────────────────────────────────── */
const FLAVOR_FEAST_ITEMS = {
  salmon: [
    { icon: '🎂', name: 'Salmon Birthday Cake', desc: 'The centrepiece — soy-free, no artificial colours' },
    { icon: '🍪', name: 'Salmon Biscuit Platter', desc: 'Slow-baked × 12 biscuits' },
    { icon: '🧁', name: 'Salmon Paw Cupcakes', desc: '6 frosted cups for the guests' },
  ],
  chicken: [
    { icon: '🎂', name: 'Chicken Birthday Cake', desc: 'The centrepiece — grain-free option' },
    { icon: '🍪', name: 'Chicken Treat Platter', desc: 'Mini bites × 12' },
    { icon: '🧁', name: 'Chicken Paw Cupcakes', desc: '6 mini cakes for the guests' },
  ],
  beef: [
    { icon: '🎂', name: 'Beef Birthday Cake', desc: 'The centrepiece — high protein' },
    { icon: '🍪', name: 'Beef Jerky Platter', desc: 'Slow-dried bites × 12' },
    { icon: '🧁', name: 'Beef Paw Cupcakes', desc: '6 meaty cups for the guests' },
  ],
  'peanut butter': [
    { icon: '🎂', name: 'Peanut Butter Birthday Cake', desc: 'The centrepiece — naturally sweet' },
    { icon: '🍪', name: 'PB Biscuit Platter', desc: 'Crunchy × 12 biscuits' },
    { icon: '🧁', name: 'PB Paw Cupcakes', desc: '6 cups for the guests' },
  ],
  banana: [
    { icon: '🎂', name: 'Banana & Coconut Birthday Cake', desc: 'Naturally sweet, grain-free' },
    { icon: '🍪', name: 'Banana Biscuit Platter', desc: 'Baked × 12 biscuits' },
    { icon: '🧁', name: 'Banana Paw Cupcakes', desc: '6 tropical cups for guests' },
  ],
  default: [
    { icon: '🎂', name: 'Birthday Celebration Cake', desc: 'The centrepiece — made for {petName}' },
    { icon: '🍪', name: 'Signature Treat Platter', desc: 'Handpicked × 12 biscuits' },
    { icon: '🧁', name: 'Birthday Paw Cupcakes', desc: '6 celebration cups for the guests' },
  ],
};

const deriveFeastItems = (pet) => {
  const favTreats = toStrArray(pet?.doggy_soul_answers?.favorite_treats);
  const allergies = toStrArray(pet?.doggy_soul_answers?.food_allergies || pet?.allergies);
  const detectedFlavor = Object.keys(FLAVOR_FEAST_ITEMS).find(
    f => f !== 'default' && favTreats.some(t => t.includes(f)) && !allergies.some(a => f.includes(a))
  );
  return FLAVOR_FEAST_ITEMS[detectedFlavor || 'default'];
};

/* ── Special Panel: FeastMenuCard (Pillar 1 only) ────────────────────────── */
const FeastMenuCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const feastItems = deriveFeastItems(pet);
  const [sentItems, setSentItems] = useState({});
  const [sending, setSending] = useState({});

  const requestFeastItem = async (item) => {
    if (sentItems[item.name] || sending[item.name]) return;
    setSending(prev => ({ ...prev, [item.name]: true }));
    const result = await sendToConcierge({
      requestType: 'feast_item',
      label: `Request ${item.name} for ${petName}`,
      message: `Please prepare ${item.name} (${item.desc}) for ${petName}'s birthday feast`,
      petName,
    });
    setSending(prev => ({ ...prev, [item.name]: false }));
    if (result.success) {
      setSentItems(prev => ({ ...prev, [item.name]: result.ticketId }));
    }
  };

  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3FF)' }}>
      <p className="font-extrabold mb-3" style={{ fontSize: 15, color: '#1A0030' }}>
        🍽️ {petName}'s Birthday Feast Menu
      </p>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>
        Mira curated this based on {petName}'s favourite flavours — generated on the fly for this birthday
      </p>
      <div className="grid grid-cols-3 gap-3">
        {feastItems.map(item => {
          const isSent = !!sentItems[item.name];
          const isLoading = !!sending[item.name];
          return (
            <div key={item.name} className="rounded-xl p-3 text-center"
              style={{ background: '#FFF', border: isSent ? '1.5px solid #C44DFF' : '1px solid #F0E8F8' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
              <p className="font-bold" style={{ fontSize: 11, color: '#1A0030', marginBottom: 2 }}>
                {item.name.replace('{petName}', petName)}
              </p>
              <p style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>{item.desc}</p>
              <button
                onClick={() => requestFeastItem(item)}
                disabled={isSent || isLoading}
                className="w-full rounded-full font-bold"
                style={{
                  padding: '5px 8px', fontSize: 10, cursor: isSent ? 'default' : 'pointer',
                  background: isSent ? '#F0FFF4' : 'rgba(196,77,255,0.10)',
                  border: isSent ? '1px solid #86EFAC' : '1px solid rgba(196,77,255,0.25)',
                  color: isSent ? '#166534' : '#7C3AED',
                }}
              >
                {isSent ? '✓ Sent to Concierge®' : isLoading ? '...' : 'Request via Concierge®'}
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: '#C44DFF', marginTop: 10, fontStyle: 'italic' }}>
        ✦ These are prepared fresh on order — Mira has noted {petName}'s flavour preferences
      </p>
    </div>
  );
};

/* ── Special Panel: PawtyPlannerCard (Pillar 3 only) ─────────────────────── */
const PawtyPlannerCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const friend1 = pet?.doggy_soul_answers?.pet_friends?.[0] || 'Bruno';
  const friend2 = pet?.doggy_soul_answers?.pet_friends?.[1] || 'Cookie';
  const city = pet?.city || 'your city';
  const [sentSteps, setSentSteps] = useState({});
  const [sendingSteps, setSendingSteps] = useState({});

  const steps = [
    {
      num: 1, icon: '📍',
      text: `Choose venue — Pet-friendly spot in ${city}`,
      action: 'Find a venue',
      requestType: 'venue_finder',
      label: `Find a pet-friendly venue in ${city} for ${petName}'s birthday`,
      message: `Please find a pet-friendly birthday venue in ${city} for ${petName}'s pawty. Guest list includes ${friend1} and ${friend2}.`,
    },
    {
      num: 2, icon: '💌',
      text: `Send invites to ${friend1} & ${friend2} — 5-pack paw print invitations`,
      action: 'Order invites',
      requestType: 'order_invitations',
      label: `Order paw print invitations for ${petName}'s birthday pawty`,
      message: `Please prepare 5-pack paw print birthday invitations for ${petName}'s birthday. To be sent to ${friend1} and ${friend2}.`,
    },
    {
      num: 3, icon: '🎊',
      text: `Order the pawty kit — Bandanas for 3, treat bags, decorations`,
      action: 'Order pawty kit',
      requestType: 'pawty_kit_order',
      label: `Order pawty kit for ${petName}'s birthday`,
      message: `Please prepare a birthday pawty kit for ${petName}: 3 bandanas, 6 treat bags, paw print balloons, and streamers.`,
    },
    {
      num: 4, icon: '👑',
      text: `Let Concierge® handle the rest — One call, everything arranged`,
      action: '👑 Full Concierge®',
      requestType: 'full_concierge_pawty',
      label: `Full concierge birthday pawty planning for ${petName}`,
      message: `Please handle ${petName}'s full birthday pawty — venue, invites, pawty kit, and day-of coordination for ${petName}, ${friend1} and ${friend2} in ${city}.`,
      premium: true,
    },
  ];

  const handleStepAction = async (step) => {
    if (sentSteps[step.num] || sendingSteps[step.num]) return;
    setSendingSteps(prev => ({ ...prev, [step.num]: true }));
    const result = await sendToConcierge({
      requestType: step.requestType,
      label: step.label,
      message: step.message,
      petName,
    });
    setSendingSteps(prev => ({ ...prev, [step.num]: false }));
    if (result.success) {
      setSentSteps(prev => ({ ...prev, [step.num]: result.ticketId || 'sent' }));
    }
  };

  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, #F3E5F5, #FCE4EC)' }}>
      <p className="font-extrabold mb-4" style={{ fontSize: 14, color: '#3D0060' }}>
        🦋 {petName}'s Pawty Plan — {friend1} & {friend2} invited
      </p>
      <div className="flex flex-col gap-3">
        {steps.map(step => {
          const isSent = !!sentSteps[step.num];
          const isLoading = !!sendingSteps[step.num];
          return (
            <div key={step.num} className="rounded-xl p-3 flex items-center gap-3 bg-white"
              style={{ border: isSent ? '1.5px solid #C44DFF' : '1px solid rgba(196,77,255,0.15)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
                style={{
                  background: isSent
                    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                    : 'linear-gradient(135deg, #C44DFF, #FF6B9D)'
                }}>
                {isSent ? '✓' : step.num}
              </div>
              <p className="flex-1" style={{ fontSize: 12, color: '#3D0060', lineHeight: 1.45 }}>
                {step.text}
              </p>
              <button
                onClick={() => handleStepAction(step)}
                disabled={isSent || isLoading}
                className="rounded-full text-xs font-bold px-3 py-1 flex-shrink-0"
                data-testid={`pawty-step-${step.num}-btn`}
                style={{
                  background: isSent
                    ? '#F0FFF4'
                    : step.premium
                      ? 'linear-gradient(135deg, #C9973A, #F0C060)'
                      : 'rgba(196,77,255,0.12)',
                  color: isSent ? '#166534' : step.premium ? '#1A0A00' : '#7C3AED',
                  border: isSent ? '1px solid #86EFAC' : 'none',
                  cursor: isSent ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isSent ? '✓ Sent' : isLoading ? '...' : step.action}
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: '#C44DFF', marginTop: 10, fontStyle: 'italic' }}>
        ✦ Each action creates a ticket in our concierge system — you'll get a confirmation within 24 hours
      </p>
    </div>
  );
};

/* ── Special Panel: WellnessHeroCard (Pillar 7 only) ─────────────────────── */
const WellnessHeroCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const condition = pet?.doggy_soul_answers?.health_conditions || pet?.health_conditions || '';
  const hasCondition = condition && condition !== 'none' && condition.length > 2;
  return (
    <div className="rounded-2xl p-5 text-center mb-4"
      style={{ background: 'linear-gradient(135deg, #E0F7FA, #E8F5E9)' }}>
      <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>💚</span>
      <p className="font-bold italic" style={{ fontSize: 15, color: '#1A0030', lineHeight: 1.5 }}>
        {hasCondition
          ? '"The most loving birthday gift is more time."'
          : '"The most loving birthday gift is a longer, healthier life."'}
      </p>
      <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginTop: 8 }}>
        {hasCondition
          ? `Mira has noted ${petName}'s ${condition}. Every product below is treatment-safe — checked individually. This is the pillar that matters most right now.`
          : `The most loving thing you can give ${petName} is investing in her long life. Every supplement here is right for her age.`}
      </p>
    </div>
  );
};

/* ── Special Panel: MemoryInvitationCard (Pillar 8 only) — COMPLETE ─────── */
const MEMORY_OPTIONS = [
  {
    id: 'photoshoot',
    icon: '📸',
    title: 'Birthday Photoshoot',
    desc: 'A professional captures this exact day. You keep it forever.',
    accent: 'linear-gradient(135deg, #FF6B9D, #C44DFF)',
    requestType: 'birthday_photoshoot',
    label: "{petName}'s Birthday Photoshoot",
    message: "Please arrange a professional birthday photoshoot for {petName}",
  },
  {
    id: 'portrait',
    icon: '🎨',
    title: 'Custom Portrait',
    desc: 'Your pet, painted. Every detail, exactly as they are today.',
    accent: 'linear-gradient(135deg, #C44DFF, #7C3AED)',
    requestType: 'custom_portrait',
    label: "Commission {petName}'s Custom Portrait",
    message: "Please commission a custom illustrated portrait of {petName} for their birthday",
  },
  {
    id: 'memory_book',
    icon: '📖',
    title: 'Memory Book',
    desc: 'The whole story. This year. Every photo. Every memory.',
    accent: 'linear-gradient(135deg, #7C3AED, #6366F1)',
    requestType: 'memory_book',
    label: "{petName}'s Birthday Memory Book",
    message: "Please create a personalised birthday memory book for {petName}",
  },
  {
    id: 'soul_story',
    icon: '✨',
    title: 'Soul Story Book',
    desc: "Mira writes {petName}'s life story. You keep it.",
    accent: 'linear-gradient(135deg, #F59E0B, #F97316)',
    requestType: 'soul_story_book',
    label: "{petName}'s Soul Story Book",
    message: "Please have Mira write and print a Soul Story Book for {petName}'s birthday",
  },
];

const MemoryInvitationCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const [sentOptions, setSentOptions] = useState({});
  const [sendingOptions, setSendingOptions] = useState({});

  const handleMemoryRequest = async (option) => {
    if (sentOptions[option.id] || sendingOptions[option.id]) return;
    setSendingOptions(prev => ({ ...prev, [option.id]: true }));
    const result = await sendToConcierge({
      requestType: option.requestType,
      label: option.label.replace('{petName}', petName),
      message: option.message.replace(/{petName}/g, petName),
      petName,
    });
    setSendingOptions(prev => ({ ...prev, [option.id]: false }));
    if (result.success) {
      setSentOptions(prev => ({ ...prev, [option.id]: result.ticketId || 'sent' }));
    }
  };

  return (
    <div className="rounded-2xl p-5 mb-4"
      style={{ background: 'linear-gradient(135deg, #1A0030, #3D0060)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 24 }}>📸</span>
        <div>
          <p className="font-extrabold" style={{ fontSize: 15, color: '#FFF' }}>
            Make this birthday permanent
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>
            {petName}'s birthday happens once. Choose how you keep it forever.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MEMORY_OPTIONS.map(option => {
          const isSent = !!sentOptions[option.id];
          const isLoading = !!sendingOptions[option.id];
          return (
            <div key={option.id}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.07)', border: isSent ? '1.5px solid rgba(196,77,255,0.80)' : '1px solid rgba(255,255,255,0.12)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: option.accent }}>
                <span style={{ fontSize: 18 }}>{option.icon}</span>
              </div>
              <p className="font-bold" style={{ fontSize: 13, color: '#FFF', marginBottom: 4 }}>
                {option.title}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: 12 }}>
                {option.desc.replace('{petName}', petName)}
              </p>
              <button
                onClick={() => handleMemoryRequest(option)}
                disabled={isSent || isLoading}
                className="w-full rounded-full font-bold"
                data-testid={`memory-${option.id}-btn`}
                style={{
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: isSent ? 'default' : 'pointer',
                  background: isSent
                    ? 'rgba(34,197,94,0.20)'
                    : 'rgba(255,255,255,0.12)',
                  border: isSent
                    ? '1px solid rgba(134,239,172,0.60)'
                    : '1px solid rgba(255,255,255,0.25)',
                  color: isSent ? '#86EFAC' : '#FFF',
                }}
              >
                {isSent ? '✓ Sent to Concierge®' : isLoading ? '...' : `Book via Concierge® 👑`}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10, color: 'rgba(196,77,255,0.70)', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
        ✦ Concierge® will contact you within 24 hours to confirm details
      </p>
    </div>
  );
};

/* ── Product card ─────────────────────────────────────────────────────────── */
const SoulProductCard = ({ product, petName, isFirst, isConcierge, onAddToCart, onOpenModal, pillarColor }) => {
  const price = product.price || product.variants?.[0]?.price || 0;
  const image = product.image_url || product.image || product.images?.[0];
  
  // Determine if this is a service (should go to concierge)
  const isService = isConcierge || !price || price === 0 || 
    product.category === 'grooming' || 
    product.category === 'portraits' ||
    product.name?.toLowerCase().includes('photoshoot') ||
    product.name?.toLowerCase().includes('booking') ||
    product.name?.toLowerCase().includes('session');
  
  const handleClick = () => {
    // Open full product modal
    onOpenModal?.(product, isService);
  };
  
  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isService) {
      // Open modal for concierge items
      onOpenModal?.(product, true);
    } else {
      // Quick add to cart
      onAddToCart?.(product);
      window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
    }
  };
  
  return (
    <div 
      className="rounded-2xl overflow-hidden bg-white cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      style={{ border: '1px solid #F0E8F8' }}
      onClick={handleClick}
      data-testid={`soul-product-${product.id || product.name?.replace(/\s/g,'')}`}>
      {/* Image */}
      <div className="flex items-center justify-center bg-gray-50 relative" style={{ height: 120 }}>
        {image
          ? <img src={image} alt={product.name} className="w-full h-full object-cover" />
          : <span style={{ fontSize: 40 }}>🎁</span>}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">View details</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '12px 12px 11px' }}>
        <div className="inline-block rounded-lg mb-2"
          style={{
            fontSize: 11, fontWeight: 600,
            background: isFirst
              ? 'linear-gradient(135deg,rgba(196,77,255,0.18),rgba(255,107,157,0.12))'
              : 'linear-gradient(135deg,rgba(196,77,255,0.08),rgba(255,107,157,0.06))',
            border: `1px solid ${isFirst ? 'rgba(196,77,255,0.35)' : 'rgba(196,77,255,0.18)'}`,
            padding: '3px 9px', color: '#6B21A8'
          }}>
          {isFirst ? `${petName}'s #1` : `For ${petName}`}
        </div>
        <p className="font-bold line-clamp-2" style={{ fontSize: 14, color: '#1A0030', marginBottom: 3, lineHeight: 1.3 }}>
          {product.name}
        </p>
        {product.description && (
          <p className="line-clamp-1" style={{ fontSize: 12, color: '#888', lineHeight: 1.4, marginBottom: 9 }}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-1.5 mt-1">
          <span className="font-bold" style={{ fontSize: 15, color: isService ? '#C9973A' : '#1A0030' }}>
            {isService ? 'Concierge®' : `₹${typeof price === 'number' ? price.toLocaleString('en-IN') : price}`}
          </span>
          <button onClick={handleQuickAdd}
            className="rounded-full text-white flex items-center gap-1 flex-shrink-0"
            style={{
              background: isService
                ? 'linear-gradient(135deg,#C9973A,#F0C060)'
                : 'linear-gradient(135deg,#C44DFF,#FF6B9D)',
              color: isService ? '#1A0A00' : 'white',
              border: 'none', padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}>
            {isService ? 'Book 👑' : <><Plus className="w-3 h-3" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const SoulPillarExpanded = ({ pillar, pet, onClose, onItemAdd }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  
  const petName = pet?.name || 'your pet';
  const tabs = PILLAR_TABS[pillar.id] || [{ name: 'All', category: 'cakes' }];
  const titleInfo = PILLAR_TITLES[pillar.id] || { title: pillar.name, sub: () => '' };
  const isConciergeTab = !!tabs[activeTab]?.concierge;
  
  // Get pillar color
  const pillarColors = {
    food: '#FF8C42',
    play: '#E91E63',
    social: '#9C27B0',
    adventure: '#2196F3',
    grooming: '#F9A825',
    learning: '#4CAF50',
    health: '#22C55E',
    memory: '#C44DFF'
  };
  const pillarColor = pillarColors[pillar.id] || '#C44DFF';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const currentCategory = tabs[activeTab]?.category || 'cakes';
        const isConcierge = tabs[activeTab]?.concierge;
        if (isConcierge) {
          // Concierge® tabs show services, not products
          setProducts([]);
          setLoading(false);
          return;
        }
        // Use soul-ranked endpoint when we have a pet (personalises order + excludes allergens)
        const url = pet?.id
          ? `${apiUrl}/api/products/soul-ranked?category=${currentCategory}&pet_id=${pet.id}&limit=8`
          : `${apiUrl}/api/products?category=${currentCategory}&limit=8`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('[SoulPillarExpanded]', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pillar.id, activeTab, pet?.id]);

  // Client-side allergy filter as safety net (soul-ranked already excludes on backend)
  const allergies = React.useMemo(() => {
    return [
      ...(pet?.allergies || []),
      ...(Array.isArray(pet?.doggy_soul_answers?.food_allergies)
        ? pet.doggy_soul_answers.food_allergies
        : pet?.doggy_soul_answers?.food_allergies ? [pet.doggy_soul_answers.food_allergies] : [])
    ].map(a => a?.toLowerCase()).filter(a => a && a !== 'none');
  }, [pet]);

  const filteredProducts = React.useMemo(() => {
    if (!allergies.length) return products;
    return products.filter(p => {
      const text = ((p.name || '') + (p.description || '')).toLowerCase();
      return !allergies.some(a => text.includes(a));
    });
  }, [products, allergies]);

  const handleAddToCart = (product) => {
    setItemCount(prev => prev + 1);
    onItemAdd?.(product);
  };

  const handleBottomBarAction = () => {
    if (itemCount === 0) {
      onClose();
    } else {
      window.dispatchEvent(new CustomEvent('openMiraAI', {
        detail: { message: `Build ${petName}'s birthday plan`, context: 'celebrate' }
      }));
    }
  };

  return (
    <div
      className="bg-white overflow-hidden"
      style={{
        borderRadius: 18,
        border: '2px solid #C44DFF',
        boxShadow: '0 4px 24px rgba(196,77,255,0.12)',
        marginTop: 4, marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid={`pillar-expanded-${pillar.id}`}
    >
      {/* Scrollable content */}
      <div>
        {/* 1 — Panel header */}
        <div className="flex items-start gap-3 px-5 pt-6 pb-0 mb-5">
          <span style={{ fontSize: 36, flexShrink: 0 }}>{pillar.icon}</span>
          <div className="flex-1">
            <h3 className="font-extrabold" style={{ fontSize: 20, color: '#1A0030', lineHeight: 1.2 }}>
              {titleInfo.title.replace('{petName}', petName)}
            </h3>
            <p style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>
              {titleInfo.sub(pet)}
            </p>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 rounded-full font-bold"
            style={{ background: '#F3E8FF', border: 'none', padding: '7px 16px', fontSize: 13, color: '#7C3AED', cursor: 'pointer' }}>
            Close
          </button>
        </div>

        {/* 2 — Mira bar */}
        <div className="mx-5 mb-5 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, #F3E8FF, #FCE4EC)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', marginTop: 1 }}>
            ✦
          </div>
          <div>
            <p style={{ fontSize: 14, color: '#3D0060', lineHeight: 1.6, fontStyle: 'italic' }}>
              {getMiraQuote(pillar.id, pet)}
            </p>
            <span style={{ fontSize: 12, color: '#C44DFF', marginTop: 4, fontWeight: 600, display: 'block' }}>
              ♥ Mira knows {petName}
            </span>
          </div>
        </div>

        {/* 3 — Special panel (pillars food, social, health, memory only) */}
        <div className="mx-5">
          {pillar.id === 'food'    && <FeastMenuCard pet={pet} />}
          {pillar.id === 'social'  && <PawtyPlannerCard pet={pet} />}
          {pillar.id === 'health'  && <WellnessHeroCard pet={pet} />}
          {pillar.id === 'memory'  && <MemoryInvitationCard pet={pet} />}
        </div>

        {/* 4 — Tab bar */}
        <div className="flex flex-wrap gap-2 px-5 mb-5">
          {tabs.map((tab, idx) => (
            <button key={tab.name} onClick={() => setActiveTab(idx)}
              className="rounded-full font-semibold"
              style={{
                padding: '8px 16px', fontSize: 13, cursor: 'pointer', transition: 'all 120ms',
                border: activeTab === idx ? '1px solid #C44DFF' : '1px solid #E0CCFF',
                background: activeTab === idx ? '#C44DFF' : '#FAF5FF',
                color: activeTab === idx ? '#FFFFFF' : '#7C3AED',
              }}>
              {tab.name}
            </button>
          ))}
        </div>

        {/* 5 — Product grid */}
        <div className="px-5 pb-6">
          {allergies.length > 0 && (
            <div className="mb-4 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
              style={{ background: '#FFF3E0', border: '1px solid #FFCC99', color: '#8B4500' }}>
              <span>🛡️</span>
              <span>Showing only {petName}-safe items (no {allergies.join(', ')})</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="ml-3 text-sm text-gray-500">Finding perfect items for {petName}...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">🎁</span>
              <p className="text-sm text-gray-500 mb-4">We're curating the perfect {pillar.name.toLowerCase()} items for {petName}.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', {
                  detail: { message: `Suggest ${pillar.name} celebration ideas for ${petName}`, context: 'celebrate' }
                }))}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED' }}>
                <Sparkles className="w-4 h-4" /> Ask Mira
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.slice(0, 4).map((product, idx) => (
                <ProductCard
                  key={product.id || idx}
                  product={product}
                  pillar="celebrate"
                  selectedPet={pet}
                  size="small"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DrawerBottomBar — sticky at bottom of panel */}
      <DrawerBottomBar
        itemCount={itemCount}
        drawerCategory={pillar.id}
        petName={petName}
        onAction={handleBottomBarAction}
      />
    </div>
  );
};

export default SoulPillarExpanded;
