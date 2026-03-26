/**
 * CareSoulPage.jsx — /care pillar
 * The Doggy Company
 *
 * Architecture mirrors DineSoulPage.jsx exactly:
 *   - usePillarContext for real pet data (no MOCK_PET)
 *   - useAuth for token
 *   - PillarPageLayout wrapper
 *   - Helmet for SEO
 *   - Real API calls for products, soul questions, Mira picks
 *   - SharedProductCard + ProductDetailModal (same as Dine)
 *   - applyMiraIntelligence (client-side filter, same pattern as Dine)
 *   - LoadingState + NoPetState
 *   - Responsive dimension grid (2-col → 4-col)
 *   - Multi-step service booking flows (Grooming, Vet, Boarding, etc.)
 *
 * Colour world: Sage green — distinct from /dine (amber) and /celebrate (purple)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import CareHero from "../components/care/CareHero";
import CareCategoryStrip from "../components/care/CareCategoryStrip";
import GuidedCarePaths from "../components/care/GuidedCarePaths";
import CareConciergeSection from "../components/care/CareConciergeSection";
import CareConciergeModal from "../components/care/CareConciergeModal";
import CareNearMe from "../components/care/CareNearMe";
import ConciergeToast from "../components/common/ConciergeToast";
import { API_URL } from "../utils/api";
import { MiraPicksSkeleton, ProductGridSkeleton } from "../components/common/ProductSkeleton";
import { tdc } from "../utils/tdc_intent";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import MiraImaginesBreed from "../components/common/MiraImaginesBreed";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeCollection from "../components/SoulMadeCollection";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import SoulMadeModal from "../components/SoulMadeModal";
import { useConcierge } from "../hooks/useConcierge";
import CareMobilePage from './CareMobilePage';
import { filterBreedProducts } from '../hooks/useMiraFilter';
// ─────────────────────────────────────────────────────────────
// COLOUR SYSTEM — Sage Green
// ─────────────────────────────────────────────────────────────
const G = {
  deep:        "#1B4332",
  deepMid:     "#2D6A4F",
  sage:        "#40916C",
  light:       "#74C69D",
  pale:        "#D8F3DC",
  cream:       "#F0FFF4",
  pageBg:      "#F0FFF4",
  card:        "#FFFFFF",
  border:      "rgba(45,106,79,0.18)",
  borderLight: "rgba(45,106,79,0.10)",
  darkText:    "#1B4332",
  mutedText:   "#52796F",
  hintText:    "#84A98C",
  whiteDim:    "rgba(255,255,255,0.65)",
  greenBg:     "rgba(64,145,108,0.12)",
  greenBorder: "rgba(64,145,108,0.30)",
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name || "your dog") : ""; }

const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies|n\/a)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v && !CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a && !CLEAN_NONE.test(String(a).trim()));
}

function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(", ") : String(raw);
  return str.toLowerCase() === "none" || str.trim() === "" ? null : str;
}

function getCoatType(pet) {
  return pet?.doggy_soul_answers?.coat_type || pet?.coat_type || null;
}

function getGroomingComfort(pet) {
  return pet?.doggy_soul_answers?.grooming_comfort || null;
}

function getDentalHealth(pet) {
  return pet?.doggy_soul_answers?.dental_health || pet?.dentalHealth || null;
}

// Normalize pet for service booking flows (ensures all fields present)
function normalizePetForFlow(rawPet) {
  if (!rawPet) return null;
  return {
    id: rawPet.id || rawPet._id,
    name: rawPet.name || "your dog",
    breed: rawPet.breed || "",
    age: rawPet.age || null,
    avatar: rawPet.avatar || "🐕",
    avatarUrl: rawPet.photo_url || rawPet.avatar_url || null,
    soulPercent: rawPet.overall_score || rawPet.soul_score || rawPet.profile_completion || 70,
    coatType: getCoatType(rawPet),
    groomingComfort: getGroomingComfort(rawPet) || "Comfortable",
    dentalHealth: getDentalHealth(rawPet) || "Good",
    anxietyTriggers: (() => {
      const raw = rawPet.doggy_soul_answers?.anxiety_triggers || rawPet.anxiety_triggers;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    })(),
    lastVetVisit: rawPet.last_vet_visit || null,
    vaccinated: rawPet.vaccinated ?? true,
    healthCondition: getHealthCondition(rawPet),
    allergies: getAllergies(rawPet),
    city: rawPet.city || "India",
  };
}

// ─────────────────────────────────────────────────────────────
// CARE DIMENSION CONFIG — dynamic per pet
// ─────────────────────────────────────────────────────────────
function getCareDims(pet) {
  const coat      = getCoatType(pet);
  const comfort   = getGroomingComfort(pet);
  const allergies = getAllergies(pet);
  const condition = getHealthCondition(pet);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  const allergyText = allergies.length ? allergies.slice(0,2).map(a=>`${a}-free`).join(", ") : "skin-safe";

  return [
    {
      id: "grooming", icon: "✂️", label: "Grooming",
      sub: coat ? `${cap(coat)} coat · ${comfort ? comfort + " with grooming" : "personalised"}` : "Coat care, bath & salon",
      badge: coat ? `${cap(coat)} coat match` : "Mira matched",
      badgeBg: G.sage, glowColor: "rgba(64,145,108,0.25)", glow: true,
      mira: coat
        ? `I matched everything here to {name}'s ${coat.toLowerCase()} coat. ${comfort ? "And I know {name} is " + comfort.toLowerCase() + " with grooming." : ""}`
        : `These products are matched to {name}'s coat type — tell me more and I can be even more specific.`,
    },
    {
      id: "dental", icon: "🦷", label: "Dental & Paw",
      sub: "Oral care, paw health & nail care",
      badge: "Daily care", badgeBg: "#00695C", glowColor: "rgba(0,105,92,0.22)", glow: true,
      mira: "Dental health is the most overlooked part of care. These are the products I'd choose for {name}'s daily routine.",
    },
    {
      id: "coat", icon: "🌿", label: "Coat & Skin",
      sub: `${allergyText} · inside-out coat health`,
      badge: "Health priority", badgeBg: "#388E3C", glowColor: "rgba(56,142,60,0.20)", glow: true,
      mira: allergies.length
        ? "{name} has sensitivities — every product here is safe and chosen specifically for that."
        : "These supplements and topical products support {name}'s coat and skin from the inside out.",
    },
    {
      id: "wellness", icon: "🏥", label: "Wellness Visits",
      sub: "Vet discovery, vaccination & health records",
      badge: "Explore", badgeBg: "rgba(0,0,0,0.07)", glowColor: "rgba(0,0,0,0.05)", glow: false,
      mira: "Tell me when {name} last visited the vet and I'll help you plan the next one.",
    },
    {
      id: "senior", icon: "🌸", label: "Senior Care",
      sub: condition ? `Comfort, mobility & ${condition} support` : "Comfort, mobility & special needs",
      badge: condition ? "Health priority" : "Explore",
      badgeBg: condition ? "#AD1457" : "rgba(0,0,0,0.07)",
      glowColor: "rgba(173,20,87,0.20)", glow: !!condition,
      mira: condition
        ? "I've taken {name}'s " + condition + " into account for everything here."
        : "These products support {name}'s comfort and quality of life as they get older.",
    },
    {
      id: "supplements", icon: "💊", label: "Supplements",
      sub: condition ? `Treatment-safe, vet-checked for ${condition}` : "Vet-checked, personalised",
      badge: condition ? "Health priority" : "Wellness",
      badgeBg: condition ? "#2E7D32" : "#4A148C",
      glowColor: "rgba(74,20,140,0.18)", glow: !!condition,
      mira: condition
        ? "Every supplement here is treatment-safe for {name}'s " + condition + "."
        : "These are the supplements I'd choose for {name} right now — vet-checked and age-appropriate.",
    },
    {
      id: "soul", icon: "✨", label: "Soul Care",
      sub: "Breed collection & personalised for {name}",
      badge: "Soul Made", badgeBg: G.deepMid, glowColor: "rgba(45,106,79,0.22)", glow: true,
      mira: "These are made specifically for {name}'s breed and personality. The collection grows as I learn more.",
    },
    {
      id: "mira", icon: "🪄", label: "Mira's Picks",
      sub: "Curated for {name}'s WellnessProfile",
      badge: "✦ Mira Pick", badgeBg: G.deep, glowColor: "rgba(45,106,79,0.22)", glow: true,
      mira: "These are my top picks across all care dimensions for {name} right now.",
    },
    {
      id: "soul_made", icon: "✦", label: "Soul Made™",
      sub: "Custom-made for {name}",
      badge: "Make it personal", badgeBg: G.sage, glowColor: "rgba(45,157,120,0.18)", glow: true,
      mira: "Want something truly one-of-a-kind? Upload {name}'s photo — I'll have Concierge® create it just for you.",
    },
  ];
}

// dim id → API category name
const DIM_ID_TO_CATEGORY = {
  grooming:    "Grooming",
  dental:      "Dental & Paw",
  coat:        "Coat & Skin",
  wellness:    "Wellness Visits",
  senior:      "Senior Care",
  supplements: "Supplements",
  soul:        "Soul Care Products",
  mira:        "Mira's Care Picks",
};

// ─────────────────────────────────────────────────────────────
// MIRA INTELLIGENCE — client-side filter + sort
// ─────────────────────────────────────────────────────────────
function isSafeFromAllergen(allergen, text, freeFromText) {
  const a = allergen.toLowerCase();
  if (freeFromText.includes(`${a}-free`) || freeFromText.includes(`${a} free`)) return true;
  if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return true;
  return false;
}
function containsAllergen(allergen, text) {
  const a = allergen.toLowerCase();
  return text.replace(new RegExp(`${a}[- ]free`, "gi"), "").includes(a);
}

function applyMiraIntelligence(products, allergies, coat, condition, pet) {
  const petName = pet?.name || "your dog";
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const coatLower = (coat || "").toLowerCase();
  const petBreedLower = (pet?.breed || "").trim().toLowerCase();
  return products
    .filter(p => {
      if (!allergyTerms.length) return true;
      const text = `${p.name} ${p.description || ""}`.toLowerCase();
      const free = (p.allergy_free || "").toLowerCase();
      return !allergyTerms.some(a => {
        if (isSafeFromAllergen(a, text, free)) return false;
        return containsAllergen(a, text);
      });
    })
    .map(p => {
      const text = `${p.name} ${p.description || ""} ${p.sub_category || ""}`.toLowerCase();
      const free = (p.allergy_free || "").toLowerCase();
      const tag  = (p.mira_tag || "").toLowerCase();
      const coatMatch  = coatLower && (text.includes(coatLower) || tag.includes("coat match"));
      const healthSafe = condition && (tag.includes("treatment") || free.includes("treatment-safe"));
      const allergySafe = allergyTerms.length && allergyTerms.every(a => free.includes(`${a}-free`));
      // Breed-match: product name includes the pet's breed → highest sort priority
      const breedMatch = petBreedLower && (p.name || "").toLowerCase().includes(petBreedLower);
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (breedMatch)       mira_hint = `Made for ${petName}'s breed`;
        else if (coatMatch)   mira_hint = `Matched to ${petName}'s ${coat} coat`;
        else if (healthSafe)  mira_hint = `Safe during ${petName}'s treatment`;
        else if (allergySafe) mira_hint = `Free from ${allergyTerms.join(" & ")} — safe for ${petName}`;
        else if (p.mira_tag)  mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _breedMatch: !!breedMatch, _coatMatch: !!coatMatch, _healthSafe: !!healthSafe };
    })
    .sort((a, b) => {
      if (a._breedMatch && !b._breedMatch) return -1;
      if (!a._breedMatch && b._breedMatch) return 1;
      if (a._coatMatch && !b._coatMatch) return -1;
      if (!a._coatMatch && b._coatMatch) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      if (!a._healthSafe && b._healthSafe) return 1;
      return 0;
    });
}

// ─────────────────────────────────────────────────────────────
// MIRA'S PICKS — AI scored products + services
// ─────────────────────────────────────────────────────────────
function resolvePickImage(pick) {
  const candidates = [pick.image_url, pick.image, pick.media?.primary_image, ...(pick.images || [])];
  return candidates.find(url => url && url.startsWith("http")) || null;
}

// ─────────────────────────────────────────────────────────────
// MIRA IMAGINE CARD — dark green, "Mira Imagines" badge, Concierge® CTA
// ─────────────────────────────────────────────────────────────
function MiraImagineCard({ item, pet, token }) {
  const [state,  setState]  = useState("idle");
  const [imgUrl, setImgUrl] = useState(null);
  const petName  = pet?.name || "your dog";
  const breedKey = (pet?.breed||"indie").toLowerCase().replace(/\s+/g,"_").replace(/-/g,"_").replace(/\s*\(.*\)/,"");

  useEffect(() => {
    fetch(`${API_URL}/api/ai-images/pipeline/mira-imagines/care/${breedKey}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.url) setImgUrl(d.url); })
      .catch(()=>{});
  }, [breedKey]);
  const send = async () => {
    setState("sending");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "guest",
          pet_id: pet?.id || "",
          pillar: "care",
          intent_primary: "mira_imagines_request",
          life_state: "EXPLORE",
          channel: "care_mira_picks_imagines",
          initial_message: { sender: "parent", text: `I'd love "${item.name}" for ${petName}. Mira imagined this — please help source it!` },
        }),
      });
    } catch {}
    setState("sent");
  };
  return (
    <div style={{ borderRadius:14, overflow:"hidden", background:"linear-gradient(135deg,#0D2818,#1B4332)", border:`1.5px solid rgba(64,145,108,0.30)`, display:"flex", flexDirection:"column", minHeight:220 }}>
      <div style={{ position:"relative", height:130, background:"linear-gradient(135deg,#1B4332,#2D6A4F)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {imgUrl
          ? <img src={imgUrl} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgUrl(null)}/>
          : <span style={{ fontSize:40 }}>{item.emoji || "🌿"}</span>}
        <div style={{ position:"absolute", top:8, left:8, background:G.sage, color:"#fff", fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>Mira Imagines</div>
      </div>
      <div style={{ flex:1, padding:"10px 12px 4px" }}>
        <p style={{ fontWeight:800, color:"#fff", fontSize:13, lineHeight:1.3, marginBottom:4 }}>{item.name}</p>
        <p style={{ color:"rgba(255,255,255,0.50)", fontSize:11, lineHeight:1.4, margin:0, fontStyle:"italic" }}>{item.description}</p>
      </div>
      <div style={{ padding:"0 12px 12px" }}>
        {state === "sent"
          ? <div style={{ textAlign:"center", fontSize:13, fontWeight:700, color:"#34D399" }}>✓ Sent to Concierge®!</div>
          : <button onClick={send} disabled={state==="sending"} style={{ width:"100%", background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", border:"none", borderRadius:10, padding:"10px", fontSize:13, fontWeight:700, cursor:"pointer", opacity:state==="sending"?0.7:1 }} data-testid={`mira-imagine-btn-${item.id}`}>
              {state==="sending" ? "Sending…" : "Tap — Concierge® →"}
            </button>}
      </div>
    </div>
  );
}


function MiraPicksSection({ pet }) {
  const [picks, setPicks]               = useState([]);
  const [scoringPending, setScoringPending] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [selectedPick, setSelectedPick] = useState(null);
  const [conciergeService, setConciergeService] = useState(null);
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeSent, setConciergeSent]       = useState(false);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const intelligenceLine = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);

  const handleServiceConcierge = async service => {
    setConciergeSending(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "guest",
          pet_id: pet?.id || "",
          pillar: "care",
          intent_primary: "service_request",
          intent_secondary: [service.name || service.entity_name],
          life_state: "PLAN",
          channel: "miras_picks",
          initial_message: { sender: "parent", source: "care_miras_picks", text: `I'd like "${service.name || service.entity_name}" for ${petName}. Mira scored it ${service.mira_score || "?"}/100. Please help!` },
        }),
      });
    } catch {}
    setConciergeSending(false);
    setConciergeSent(true);
    setTimeout(() => { setConciergeSent(false); setConciergeService(null); }, 2000);
  };

  useEffect(() => {
    if (!pet?.id) { setLoading(false); return; }
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=care&limit=12&min_score=60&entity_type=product`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=care&limit=6&min_score=60&entity_type=service`).then(r => r.ok ? r.json() : null),
    ])
      .then(([pData, sData]) => {
        const prods = pData?.picks || [];
        const svcs  = sData?.picks || [];
        const merged = [];
        let pi = 0, si = 0;
        while (pi < prods.length || si < svcs.length) {
          if (pi < prods.length) merged.push(prods[pi++]);
          if (pi < prods.length) merged.push(prods[pi++]);
          if (si < svcs.length)  merged.push(svcs[si++]);
        }
        if (merged.length) { 
          setPicks(merged.slice(0, 16));
          // Check if any results are fallback (scoring pending)
          const hasFallback = merged.some(p => p.is_fallback);
          setScoringPending(hasFallback);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pet?.id]);

  if (loading) return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ height: 22, width: 220, borderRadius: 8, background: 'linear-gradient(90deg,#E8F5F0 25%,#D4EDE5 50%,#E8F5F0 75%)', backgroundSize: '200% 100%', animation: 'care-shimmer 1.4s infinite', marginBottom: 8 }} />
      <div style={{ height: 12, width: 280, borderRadius: 6, background: 'linear-gradient(90deg,#E8F5F0 25%,#D4EDE5 50%,#E8F5F0 75%)', backgroundSize: '200% 100%', animation: 'care-shimmer 1.4s infinite', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flexShrink: 0, width: 168, borderRadius: 14, overflow: 'hidden', background: '#F9FBF9', border: '1.5px solid #E0EDE7' }}>
            <div style={{ height: 130, background: 'linear-gradient(90deg,#E8F5F0 25%,#D4EDE5 50%,#E8F5F0 75%)', backgroundSize: '200% 100%', animation: 'care-shimmer 1.4s infinite' }} />
            <div style={{ padding: '10px 11px 12px' }}>
              <div style={{ height: 10, borderRadius: 6, background: 'linear-gradient(90deg,#E8F5F0 25%,#D4EDE5 50%,#E8F5F0 75%)', backgroundSize: '200% 100%', animation: 'care-shimmer 1.4s infinite', marginBottom: 8, width: '80%' }} />
              <div style={{ height: 8, borderRadius: 6, background: 'linear-gradient(90deg,#E8F5F0 25%,#D4EDE5 50%,#E8F5F0 75%)', backgroundSize: '200% 100%', animation: 'care-shimmer 1.4s infinite', width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes care-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </section>
  );

  // If no Mira-scored picks, always show Mira Imagines cards (never empty)
  if (!picks.length) {
    const petBreed   = pet?.breed || "";
    const petCoat    = pet?.coat_type || pet?.coatType || pet?.doggy_soul_answers?.coat_type || "";
    const petCondition = pet?.healthCondition || pet?.health_data?.chronic_conditions?.[0] || "";
    const imagines = [
      {
        id: "care-imagine-1",
        isImagined: true, emoji: "✂️",
        name: petBreed ? `${petBreed} Grooming Kit` : `${petName}'s Grooming Set`,
        description: `A complete grooming kit built for ${petBreed || petName}'s coat type — Mira would source this monthly.`,
      },
      petCoat ? {
        id: "care-imagine-2",
        isImagined: true, emoji: "🌿",
        name: `${petCoat.replace(/\bcoat\b/gi,"").trim()} Coat Spa Pack`,
        description: `Deep conditioning for ${petName}'s ${petCoat} — Mira's top coat health pick.`,
      } : {
        id: "care-imagine-2",
        isImagined: true, emoji: "🌿",
        name: `${petName}'s Monthly Coat Care`,
        description: `Mira curates shampoo, conditioner, and a coat serum matched to ${petName}'s coat needs.`,
      },
      {
        id: "care-imagine-3",
        isImagined: true, emoji: "💊",
        name: `${petName}'s Wellness Bundle`,
        description: petCondition
          ? `Vet-approved supplements for ${petCondition} — Mira imagines this as ${petName}'s monthly care pack.`
          : `Mira's curated monthly care box — grooming, dental, and wellness tailored to ${petName}.`,
      },
    ];
    return (
      <section style={{ marginBottom: 32 }} data-testid="care-mira-picks-section">
        <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
          <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
            Mira's Care Picks for <span style={{ color:G.sage }}>{petName}</span>
          </h3>
          <span style={{ fontSize:11, background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>
            {intelligenceLine.includes("order") ? "AI Scored" : "Pet Specific"}
          </span>
        </div>
        <p style={{ fontSize:13, color:"#888", marginBottom:16, lineHeight:1.5 }}>{intelligenceLine}</p>
        {/* Mira Imagines — breed-specific intelligence */}
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none" }}>
          <MiraImaginesBreed pet={pet} pillar="care" colour={G.sage} onConcierge={(card)=>setConciergeService(card)}/>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 32 }} data-testid="care-mira-picks-section">
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
          Mira's Care Picks for <span style={{ color:G.sage }}>{petName}</span>
        </h3>
        <span style={{ fontSize:11, background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>
          AI Scored
        </span>
      </div>
      <p style={{ fontSize:12, color:"#888", marginBottom:16, lineHeight:1.5 }}>
        Products &amp; services matched by Mira to {petName}'s wellness profile — updated as {petName} grows.
      </p>
      {scoringPending && (
        <div style={{ background:"rgba(45,106,79,0.06)", border:"1px solid rgba(45,106,79,0.2)", borderRadius:10, padding:"8px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12, color:G.sage }}>
          <span style={{ fontSize:16 }}>✨</span>
          Mira is personalising these picks for {petName} — tailored scores ready soon.
        </div>
      )}
      <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:10, scrollbarWidth:"thin" }} className="care-picks-scroll">
        <style>{`.care-picks-scroll::-webkit-scrollbar{height:4px}.care-picks-scroll::-webkit-scrollbar-thumb{background:${G.sage}50;border-radius:4px}`}</style>
        {picks.map((pick, i) => {
          const isService = pick.entity_type === "service";
          const img = resolvePickImage(pick);
          const score = pick.mira_score || 0;
          const scoreColor = score >= 80 ? "#16A34A" : score >= 70 ? G.sage : "#6B7280";
          return (
            <div key={pick.id || i}
              style={{ flexShrink:0, width:168, background:"#fff", borderRadius:14, border:`1.5px solid ${G.borderLight}`, overflow:"hidden", cursor:"pointer", transition:"transform 0.15s,box-shadow 0.15s" }}
              onClick={() => isService ? setConciergeService(pick) : setSelectedPick(pick)}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 20px rgba(45,106,79,0.12)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              data-testid={`care-pick-card-${i}`}
            >
              <div style={{ width:"100%", height:130, background:G.cream, overflow:"hidden", position:"relative" }}>
                {img
                  ? <img src={img} alt={pick.name || ""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:isService?`linear-gradient(135deg,${G.deep},${G.deepMid})`:`linear-gradient(135deg,${G.deepMid},${G.sage})`, color:"#fff", fontSize:12, fontWeight:700, padding:8, textAlign:"center" }}>
                      {(pick.name || pick.entity_name || "").slice(0,18) || (isService?"SERVICE":"PRODUCT")}
                    </div>}
                <span style={{ position:"absolute", top:7, left:7, fontSize:9, fontWeight:700, background:isService?G.deepMid:G.sage, color:"#fff", borderRadius:20, padding:"2px 7px", letterSpacing:0.5 }}>
                  {isService?"SERVICE":"PRODUCT"}
                </span>
              </div>
              <div style={{ padding:"10px 11px 12px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:G.darkText, lineHeight:1.3, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {pick.name || pick.entity_name || "—"}
                </div>
                {!isService && <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                  <div style={{ flex:1, height:4, background:G.pale, borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:10, fontWeight:800, color:scoreColor, minWidth:26 }}>{score}</span>
                </div>}
                {isService ? <p style={{ fontSize:10, color:G.deepMid, lineHeight:1.4, margin:0, fontStyle:"italic" }}>Concierge® support for wellness care.</p> : pick.mira_reason && <p style={{ fontSize:10, color:"#888", lineHeight:1.4, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontStyle:"italic" }}>{pick.mira_reason}</p>}
                <p style={{ fontSize:9, color:isService?G.deepMid:G.sage, fontWeight:700, margin:"6px 0 0", letterSpacing:"0.04em" }}>
                  {isService?"Tap → Talk to Concierge®":"Tap → View & Add"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPick && <ProductDetailModal product={selectedPick} pillar="care" selectedPet={pet} onClose={() => setSelectedPick(null)} />}

      {conciergeService && (
        <div onClick={() => !conciergeSending && setConciergeService(null)} style={{ position:"fixed", inset:0, zIndex:10003, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"min(420px,100%)", borderRadius:20, background:"#fff", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", overflow:"hidden" }} data-testid="care-service-modal">
            <div style={{ background:`linear-gradient(135deg,${G.deep},${G.deepMid})`, padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, background:G.sage, color:"#fff", borderRadius:20, padding:"3px 10px" }}>SERVICE</span>
                <button onClick={() => setConciergeService(null)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:20, width:28, height:28, cursor:"pointer", color:"rgba(255,255,255,0.7)", fontSize:16 }}>✕</button>
              </div>
              <p style={{ fontWeight:800, color:"#fff", fontSize:16, margin:"0 0 6px", lineHeight:1.3 }}>{conciergeService.name || conciergeService.entity_name}</p>
              {conciergeService.mira_reason && <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12, margin:0, fontStyle:"italic" }}>{conciergeService.mira_reason}</p>}
            </div>
            <div style={{ padding:"20px 24px" }}>
              <p style={{ fontSize:13, color:"#555", marginBottom:16 }}>Our concierge team will reach out within 48 hours to arrange this for <strong>{petName}</strong>.</p>
              {conciergeSent
                ? <div style={{ textAlign:"center", padding:12, borderRadius:12, background:`rgba(64,145,108,0.08)`, border:`1px solid rgba(64,145,108,0.3)` }}><Check size={20} style={{ color:G.sage, margin:"0 auto 6px" }} /><p style={{ fontWeight:700, color:G.sage, margin:0, fontSize:14 }}>Sent to Concierge®!</p></div>
                : <button onClick={() => handleServiceConcierge(conciergeService)} disabled={conciergeSending} data-testid="care-service-modal-btn" style={{ width:"100%", background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", border:"none", borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:conciergeSending?"wait":"pointer", opacity:conciergeSending?0.7:1 }}>
                    {conciergeSending?"Sending…":`Send to Concierge® for ${petName} →`}
                  </button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BREED CARE INSIGHTS — drives bar chip + drawer best practices
// ─────────────────────────────────────────────────────────────
const BREED_CARE_INSIGHTS = {
  'indie': {
    tagline: 'short, straight coat · weekly brush',
    coat_desc: 'Short, dense, straight coat — hardy and low-maintenance. Brush weekly, bath monthly.',
    tips: [
      'Weekly brushing with a rubber mitt or bristle brush keeps shedding minimal',
      'Monthly bath with gentle, mild shampoo — Indie skin is naturally resilient',
      'Clean ears every 2 weeks — Indies can accumulate wax in their upright ears',
      'Nail trim every 3–4 weeks to prevent discomfort when walking',
    ],
    watch_for: 'Tick and flea infestations in monsoon season · Skin infections from street exposure',
    dental: 'Brush 2–3× per week — Indies are genetically hardy but tartar builds with age',
  },
  'shih tzu': {
    tagline: 'silky double coat · daily brush · face fold care',
    coat_desc: 'Long, silky double coat — requires daily brushing and professional grooming every 6–8 weeks.',
    tips: [
      'Brush daily with a pin brush and slicker — focus on behind ears and armpits',
      'Clean face folds and around eyes daily with pet-safe wipes',
      'Professional grooming every 6–8 weeks — consider a "puppy cut" for easier home care',
      'Tear stain cleaning every 2–3 days to prevent redness and infection',
    ],
    watch_for: 'Brachycephalic breathing issues · Eye discharge · Patellar luxation',
    dental: 'Brush daily — Shih Tzus are extremely prone to dental disease',
  },
  'labrador': {
    tagline: 'dense double coat · weekly brush · ear check',
    coat_desc: 'Dense, water-resistant double coat — sheds year-round with heavy seasonal blow-outs.',
    tips: [
      'Brush weekly with a slicker brush; increase to daily during shedding season',
      'Bath every 4–6 weeks — avoid over-bathing which strips natural oils',
      'Check and clean ears weekly — Labs are highly prone to ear infections',
      'Paw inspection after outdoor activity — Labs love mud and debris',
    ],
    watch_for: 'Obesity · Hip dysplasia · Ear infections',
    dental: 'Brush 3× per week — large mouths accumulate tartar fast',
  },
  'golden retriever': {
    tagline: 'feathered coat · brush 3× week · ear care',
    coat_desc: 'Long, dense, water-repellent coat with feathering on legs, chest, and tail.',
    tips: [
      'Brush 2–3× per week — focus on feathered areas prone to matting',
      'Professional grooming every 8–12 weeks',
      'Check ears weekly — Goldens are prone to ear infections',
      'Bath every 4–6 weeks with moisturising shampoo to maintain coat shine',
    ],
    watch_for: 'Hip dysplasia · Skin allergies · Cancer risk',
    dental: 'Brush daily — Goldens have large mouths that collect plaque',
  },
  'poodle': {
    tagline: 'curly non-shedding coat · groom every 6 weeks',
    coat_desc: 'Curly, non-shedding coat that grows continuously — professional grooming essential.',
    tips: [
      'Brush daily to prevent matting between professional grooming sessions',
      'Professional grooming every 6–8 weeks is non-negotiable',
      'Clean and check ears weekly — curly ear canals trap moisture',
      'Keep hair trimmed around eyes for hygiene and vision',
    ],
    watch_for: 'Ear infections · Eye problems · Hip dysplasia',
    dental: 'Brush daily — small mouths are overcrowded and plaque-prone',
  },
  'french bulldog': {
    tagline: 'smooth coat · daily face fold cleaning',
    coat_desc: 'Short, smooth coat — minimal brushing, but face fold care is critical for health.',
    tips: [
      'Wipe facial folds daily with unscented pet wipes to prevent skin fold infections',
      'Bath every 2–4 weeks — keep folds dry after bathing',
      'Check and wipe tail pocket every 2–3 days if present',
      'Brush weekly with a soft bristle brush to remove dead hair',
    ],
    watch_for: 'Brachycephalic syndrome · Skin fold infections · Spinal issues',
    dental: 'Brush daily — Frenchies have the highest dental disease risk',
  },
  'german shepherd': {
    tagline: 'double coat · brush 2–3× week',
    coat_desc: 'Dense double coat with soft undercoat — heavy year-round shedder.',
    tips: [
      'Brush 2–3× per week with an undercoat rake; daily during shedding seasons',
      'Bath every 4–6 weeks — over-bathing strips natural oils',
      'Check ears weekly — prone to infections',
      'Nail trim every 3–4 weeks — GSD nails grow fast',
    ],
    watch_for: 'Hip and elbow dysplasia · Degenerative myelopathy · Bloat',
    dental: 'Brush 3× per week',
  },
  'husky': {
    tagline: 'thick double coat · seasonal blow-out · never shave',
    coat_desc: 'Thick double coat — sheds year-round with two heavy annual blow-outs.',
    tips: [
      'Brush 2–3× per week; daily during bi-annual blow-out season',
      'Use an undercoat rake + slicker brush combination',
      'Bath every 6–8 weeks — Huskies are naturally clean and odour-resistant',
      'NEVER shave — double coat insulates in both heat and cold',
    ],
    watch_for: 'Eye conditions (cataracts, PRA) · Hip dysplasia · Hypothyroidism',
    dental: 'Brush 2–3× per week',
  },
  'pug': {
    tagline: 'smooth coat · face wrinkle care daily',
    coat_desc: 'Short, smooth coat with facial skin folds that require daily attention.',
    tips: [
      'Clean facial wrinkles daily with pet-safe wipes to prevent yeast infections',
      'Brush weekly with a rubber grooming mitt',
      'Clean eyes gently every day — Pug eyes are prominent and collect debris',
      'Bath every 3–4 weeks with gentle hypoallergenic shampoo',
    ],
    watch_for: 'Brachycephalic breathing · Eye injuries · Obesity',
    dental: 'Brush daily — Pugs are very prone to dental disease',
  },
  'beagle': {
    tagline: 'short coat · ear cleaning weekly',
    coat_desc: 'Short, dense, weather-resistant coat — moderate shedder.',
    tips: [
      'Brush weekly with a hound glove or soft bristle brush',
      'Clean long, floppy ears weekly — Beagles have the highest ear infection risk',
      'Bath every 4–6 weeks — Beagles can develop a characteristic hound odour',
      'Paw check after trail walks — prone to cuts and debris between toes',
    ],
    watch_for: 'Obesity · Ear infections · Intervertebral disc disease',
    dental: 'Brush 2–3× per week',
  },
  'chihuahua': {
    tagline: 'smooth or long coat · dental care critical',
    coat_desc: 'Either smooth or long coat — low to moderate maintenance. Dental care is critical.',
    tips: [
      'Brush weekly (smooth coat) or 2–3× per week (long coat)',
      'Bath every 2–4 weeks with gentle puppy shampoo',
      'Keep warm in cold weather — Chihuahuas are temperature-sensitive',
      'Nail trim every 2–3 weeks — tiny paws, fast-growing nails',
    ],
    watch_for: 'Dental disease · Patellar luxation · Heart disease · Hypoglycaemia',
    dental: 'Brush DAILY — highest dental disease risk of all breeds',
  },
  'dachshund': {
    tagline: 'smooth, wire, or long coat · back care essential',
    coat_desc: 'Three coat varieties — all require regular grooming. Spinal health is critical.',
    tips: [
      'Brush weekly (smooth/wire) or 2–3× per week (long coat)',
      'Avoid stairs and jumping — Dachshund spines are fragile',
      'Clean ears weekly — long ear canals trap moisture',
      'Use a ramp for furniture access to protect their long backs',
    ],
    watch_for: 'Intervertebral Disc Disease (IVDD) · Obesity · Dental disease',
    dental: 'Brush daily — tiny mouths with big dental disease risk',
  },
};

function getBreedInsight(pet) {
  const breedRaw = (pet?.breed || '').trim().toLowerCase();
  return BREED_CARE_INSIGHTS[breedRaw] || BREED_CARE_INSIGHTS['default'] || {
    tagline: 'personalised care',
    coat_desc: 'Regular grooming keeps your dog healthy and comfortable.',
    tips: [
      'Regular brushing reduces shedding and keeps coat healthy',
      'Monthly baths with breed-appropriate shampoo',
      'Nail trim every 3–4 weeks',
      'Ear cleaning every 2 weeks',
    ],
    watch_for: null,
    dental: 'Brush 2–3× per week to prevent tartar buildup',
  };
}

function generateWellnessImagines(pet) {
  const petName = pet?.name || 'your dog';
  const breed = (pet?.breed || '').trim();
  const coat = getCoatType(pet);
  const condition = getHealthCondition(pet);
  const imagines = [];
  if (breed) {
    imagines.push({
      id: `wi-groom-${breed.replace(/\s/g,'-')}`,
      emoji: '✂️',
      name: `${breed.charAt(0).toUpperCase() + breed.slice(1)} Grooming Essentials Kit`,
      description: `A complete grooming set built for ${breed}'s coat — brushes, breed-safe shampoo, ear care, and more.`,
    });
  }
  if (coat) {
    imagines.push({
      id: `wi-coat-${coat.replace(/\s/g,'-')}`,
      emoji: '🌿',
      name: `${coat.charAt(0).toUpperCase() + coat.slice(1)} Coat Conditioning Pack`,
      description: `Deep conditioning treatment for ${petName}'s ${coat} coat — Mira would love to source this monthly.`,
    });
  }
  if (condition && condition.toLowerCase() !== 'none') {
    imagines.push({
      id: 'wi-health',
      emoji: '💊',
      name: `${petName}'s Recovery Care Kit`,
      description: `Gentle supplements and care products safe for ${petName}'s ${condition} — vet-approved, sourced by Mira.`,
    });
  } else {
    imagines.push({
      id: 'wi-dental',
      emoji: '🦷',
      name: `${petName}'s Dental & Fresh Breath Kit`,
      description: `Enzymatic toothbrush, dental chews, and water additive — everything ${petName} needs for healthy teeth.`,
    });
  }
  return imagines.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────
// WELLNESS PROFILE — compact bar + soul questions modal
// Fetches real questions from /api/pet-soul/profile/{id}/quick-questions
// ─────────────────────────────────────────────────────────────
function WellnessProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore]   = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [qLoading, setQLoading]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted]   = useState({});
  const [qPts, setQPts]             = useState({});
  const [totalPts, setTotalPts]     = useState(0);

  const coat      = getCoatType(pet);
  const comfort   = getGroomingComfort(pet);
  const condition = getHealthCondition(pet);
  const dental    = getDentalHealth(pet);
  const petName   = pet?.name || "your dog";
  const breedInsight = getBreedInsight(pet);
  const wellnessImagines = generateWellnessImagines(pet);

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=care`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) setLiveScore(data.current_score);
        }
      })
      .catch(err => { if (err.name !== "AbortError") console.error("[WellnessProfile]", err); })
      .finally(() => { clearTimeout(timer); setQLoading(false); });
  }, [pet?.id]);

  useEffect(() => { if (drawerOpen) loadQuestions(); }, [drawerOpen, loadQuestions]);

  const handleAnswer = (qId, val, type) => {
    setAnswers(prev => {
      if (type === "multi_select") {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur, val] };
      }
      return { ...prev, [qId]: val };
    });
  };

  const handleSubmit = async q => {
    const answer = answers[q.question_id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(p => ({ ...p, [q.question_id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: q.question_id, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        const weight = q.weight || 3;
        setQPts(p => ({ ...p, [q.question_id]: weight }));
        setTotalPts(p => p + weight);
        setSubmitted(p => ({ ...p, [q.question_id]: true }));
        tdc.request({ text: `Soul answer for ${petName}: ${q.question_text || q.question_id}`, pillar: 'care', pet, channel: 'care_wellness_profile' });
        if (data.scores?.overall !== undefined) {
          setLiveScore(data.scores.overall);
          window.dispatchEvent(new CustomEvent("soulScoreUpdated", { detail: { petId: pet.id, score: data.scores.overall } }));
        }
        setTimeout(() => loadQuestions(), 800);
      }
    } catch (err) { console.error("[WellnessProfile submit]", err); }
    finally { setSubmitting(p => ({ ...p, [q.question_id]: false })); }
  };

  const visibleQuestions = questions.filter(q => !submitted[q.question_id]);

  return (
    <>
      {/* Compact clickable bar */}
      <div onClick={() => setDrawerOpen(true)} data-testid="wellness-profile"
        style={{ background:"#fff", border:`2px solid ${G.pale}`, borderRadius:16, padding:"14px 18px", marginBottom:20, cursor:"pointer", display:"flex", alignItems:"center", gap:14, boxShadow:`0 2px 12px rgba(45,106,79,0.08)` }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, fontSize:20, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center" }}>🌿</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petName}'s Grooming Profile</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
            {pet?.breed && <span style={{ fontSize:10, fontWeight:600, color:"#1B4332", background:"#D8F3DC", border:"1px solid #74C69D", borderRadius:20, padding:"2px 8px" }}>🐾 {pet.breed} · {breedInsight.tagline}</span>}
            {coat && <span style={{ fontSize:10, fontWeight:600, color:G.deepMid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>🌿 {coat}</span>}
            {comfort && <span style={{ fontSize:10, fontWeight:600, color:"#1565C0", background:"#E3F2FD", border:"1px solid #90CAF9", borderRadius:20, padding:"2px 8px" }}>✓ {comfort} with grooming</span>}
            {dental && <span style={{ fontSize:10, fontWeight:600, color:"#00695C", background:"#E0F2F1", border:"1px solid #80CBC4", borderRadius:20, padding:"2px 8px" }}>🦷 {dental}</span>}
            {condition && <span style={{ fontSize:10, fontWeight:600, color:"#AD1457", background:"#FCE4EC", border:"1px solid #F48FB1", borderRadius:20, padding:"2px 8px" }}>⚕ {condition}</span>}
            {!pet?.breed && !coat && !comfort && <span style={{ fontSize:10, color:"#999" }}>Tap to tell Mira about {petName}'s care needs</span>}
          </div>
        </div>
        <span style={{ fontSize:11, color:G.sage, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>Mira's picks →</span>
      </div>

      {/* Modal */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position:"fixed", inset:0, zIndex:10002, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} data-testid="wellness-drawer"
            style={{ width:"min(780px,100%)", maxHeight:"90vh", overflowY:"auto", borderRadius:24, background:"#fff", boxShadow:"0 24px 80px rgba(0,0,0,0.55)", display:"flex", flexDirection:"column" }}>

            {/* Dark sage header */}
            <div style={{ borderRadius:"24px 24px 0 0", padding:"24px 28px 20px", background:`linear-gradient(135deg,#0A1F12 0%,${G.deep} 60%,${G.deepMid} 100%)`, flexShrink:0, position:"sticky", top:0, zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <p style={{ fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:`${G.light}E6`, fontSize:10, marginBottom:5 }}>
                    ✦ GROW {petName.toUpperCase()}'S WELLNESS PROFILE
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.50)", fontSize:12 }}>
                    {liveScore >= 95
                      ? `${petName}'s wellness profile is complete — Mira has everything she needs`
                      : liveScore >= 70
                        ? `Answer a few more · ${petName}'s profile is looking great`
                        : `Answer quick questions · ${petName}'s care profile is being built`}
                  </p>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:2 }}>
                  <span style={{ fontSize:72, fontWeight:900, lineHeight:1, color:liveScore>=80?G.pale:G.light, textShadow:`0 0 20px ${G.light}80` }}>
                    {liveScore ?? "—"}
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.40)", fontSize:18, marginBottom:8 }}>%</span>
                </div>
              </div>
              <div style={{ height:5, borderRadius:5, background:"rgba(255,255,255,0.10)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${liveScore||0}%`, borderRadius:5, background:`linear-gradient(90deg,${G.sage},${G.light})`, transition:"width 0.9s ease-out" }} />
              </div>
              <button onClick={() => setDrawerOpen(false)} data-testid="wellness-drawer-close"
                style={{ position:"absolute", top:16, right:20, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer", color:"rgba(255,255,255,0.70)" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:"24px 28px", background:"#fff" }}>
              {totalPts > 0 && (
                <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, background:G.greenBg, border:`1px solid ${G.greenBorder}` }}>
                  <Check size={14} style={{ color:G.light, flexShrink:0 }} />
                  <p style={{ fontSize:13, fontWeight:600, color:G.light }}>Answers saved · +{totalPts} pts added to soul score</p>
                </div>
              )}

              {/* ── BREED BEST PRACTICES ── */}
              <div style={{ marginBottom:22, borderRadius:16, overflow:"hidden", border:`1.5px solid #B7E4C7` }}>
                <div style={{ background:"linear-gradient(135deg,#0A1F12,#1B4332)", padding:"14px 18px 12px" }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.10em", color:"#74C69D" }}>Best Practices · {pet?.breed || "Your Dog"}</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"rgba(255,255,255,0.55)" }}>{breedInsight.coat_desc}</p>
                </div>
                <div style={{ background:"#F0FFF4", padding:"14px 18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
                    {breedInsight.tips.map((tip, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", borderRadius:10, background:"#fff", border:"1px solid #C3E6CB" }}>
                        <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{["🪮","🛁","👂","✂️"][i] || "✦"}</span>
                        <p style={{ margin:0, fontSize:11, color:"#1B4332", lineHeight:1.5 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    {breedInsight.watch_for && (
                      <div style={{ flex:1, padding:"8px 12px", borderRadius:10, background:"#FFF3E0", border:"1px solid #FFCC80" }}>
                        <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#E65100", marginBottom:3 }}>Watch for</p>
                        <p style={{ margin:0, fontSize:10, color:"#BF360C", lineHeight:1.4 }}>{breedInsight.watch_for}</p>
                      </div>
                    )}
                    {breedInsight.dental && (
                      <div style={{ flex:1, padding:"8px 12px", borderRadius:10, background:"#E0F2F1", border:"1px solid #80CBC4" }}>
                        <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#00695C", marginBottom:3 }}>Dental</p>
                        <p style={{ margin:0, fontSize:10, color:"#004D40", lineHeight:1.4 }}>{breedInsight.dental}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── QUESTIONS ── */}

              {qLoading ? (
                <div style={{ textAlign:"center", padding:"32px 0", color:"#888", fontSize:13 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.sage, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
                  Loading {petName}'s questions…
                </div>
              ) : visibleQuestions.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>🌿</div>
                  <p style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>
                    {liveScore >= 95 ? `${petName}'s wellness profile is complete!` : `All current questions answered for ${petName}`}
                  </p>
                  <p style={{ fontSize:12, color:"#888" }}>
                    {liveScore >= 95
                      ? "Mira has everything she needs"
                      : `Score: ${liveScore}% — some fields may be filled through daily interactions`}
                  </p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
                  {visibleQuestions.map(q => {
                    const isSub  = submitted[q.question_id];
                    const isSend = submitting[q.question_id];
                    const ans    = answers[q.question_id];
                    const hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : true);
                    if (isSub) return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:140, background:`linear-gradient(135deg,#0A1F12,${G.deep})`, border:`2px solid ${G.light}70` }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:G.greenBg, border:`2px solid ${G.light}80`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Check size={20} style={{ color:G.light }} />
                        </div>
                        <p style={{ fontWeight:800, color:G.light, fontSize:14, textAlign:"center" }}>Soul score growing!</p>
                        <div style={{ borderRadius:20, padding:"4px 12px", fontWeight:700, fontSize:11, background:G.greenBg, color:G.light, border:`1px solid ${G.light}50` }}>+{qPts[q.question_id]||3} pts added</div>
                        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, textAlign:"center" }}>Mira now knows {petName} better ✦</p>
                      </div>
                    );
                    return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:14, background:`linear-gradient(135deg,#0A1F12,${G.deep})`, border:`1.5px solid ${G.greenBorder}`, minHeight:140 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12 }}>{q.folder_icon||"✦"}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:`${G.light}DD` }}>{q.folder_name}</span>
                          </div>
                          <span style={{ borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, background:G.greenBg, color:G.light, border:`1px solid ${G.greenBorder}` }}>+{q.weight||3} pts</span>
                        </div>
                        <p style={{ fontWeight:700, fontSize:12, color:"rgba(255,255,255,0.92)", marginBottom:10, lineHeight:1.4 }}>{q.question}</p>
                        {(q.type === "select" || (!q.type && Array.isArray(q.options) && q.options.length > 0)) && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).map(opt => {
                              const isSelected = ans === opt;
                              return (
                                <button key={opt}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleAnswer(q.question_id, opt, "select"); }}
                                  style={{ borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700,
                                    background: isSelected ? "#74C69D" : "rgba(255,255,255,0.12)",
                                    border: isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.25)",
                                    color: isSelected ? "#fff" : "rgba(255,255,255,0.80)",
                                    cursor:"pointer",
                                    boxShadow: isSelected ? "0 2px 8px rgba(116,198,157,0.5)" : "none",
                                    transform: isSelected ? "scale(1.04)" : "scale(1)",
                                    transition:"all 0.15s ease",
                                  }}>{opt}</button>
                              );
                            })}
                          </div>
                        )}
                        {q.type === "multi_select" && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).slice(0,6).map(opt => {
                              const selArr = ans || [];
                              const isSelected = selArr.includes(opt);
                              return (
                                <button key={opt}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleAnswer(q.question_id, opt, "multi_select"); }}
                                  style={{ borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700,
                                    background: isSelected ? "#74C69D" : "rgba(255,255,255,0.12)",
                                    border: isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.25)",
                                    color: isSelected ? "#fff" : "rgba(255,255,255,0.80)",
                                    cursor:"pointer",
                                    boxShadow: isSelected ? "0 2px 8px rgba(116,198,157,0.5)" : "none",
                                    transform: isSelected ? "scale(1.04)" : "scale(1)",
                                    transition:"all 0.15s ease",
                                  }}>{opt}</button>
                              );
                            })}
                          </div>
                        )}
                        {q.type === "text" && (
                          <textarea value={ans||""} onChange={e => handleAnswer(q.question_id, e.target.value, "text")} rows={2} placeholder="Type here…"
                            style={{ width:"100%", borderRadius:10, padding:"8px 12px", fontSize:12, background:"rgba(255,255,255,0.08)", border:`1px solid ${G.greenBorder}`, color:"rgba(255,255,255,0.88)", outline:"none", resize:"none", boxSizing:"border-box" }} />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleSubmit(q); }} disabled={isSend||!hasAns}
                          style={{ marginTop:8, width:"100%", borderRadius:10, padding:10, fontSize:12, fontWeight:800, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            background: !hasAns ? "rgba(255,255,255,0.15)" : `linear-gradient(135deg,${G.sage},${G.deepMid})`,
                            border:"none", cursor:!hasAns?"not-allowed":"pointer",
                            opacity: !hasAns ? 0.5 : 1,
                            transition:"all 0.2s ease",
                            boxShadow: hasAns ? `0 2px 12px rgba(116,198,157,0.4)` : "none",
                          }}>
                          {isSend ? <Loader2 size={14} className="animate-spin" /> : null}
                          {isSend ? "Saving…" : `Save +${q.weight||3} pts →`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── MIRA IMAGINES — always shown at bottom ── */}
              <div style={{ marginTop:8, paddingTop:20, borderTop:`1px solid #E8F5E9` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <span style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.10em", color:G.deepMid }}>✦ Mira Imagines</span>
                  <span style={{ fontSize:10, color:"#888" }}>— products Mira would source for {petName}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {wellnessImagines.map(item => (
                    <MiraImagineCard key={item.id} item={item} pet={pet} token={token} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// DIM EXPANDED — mirrors DineSoulPage's DimExpanded
// Uses SharedProductCard + real apiProducts
// ─────────────────────────────────────────────────────────────

// ─── Known breed names — applied globally across all dimensions ──────────────

// Keeps only products without a breed name OR that match this pet's breed.

// Helper: robust breed matching (handles multi-word breeds, "Labrador Retriever" → "Labrador")
function matchesBreed(productName, breedRaw) {
  if (!breedRaw) return false;
  const nameLower = (productName || '').toLowerCase();
  if (nameLower.includes(breedRaw)) return true;
  // Any word of the breed > 3 chars
  return breedRaw.split(/\s+/).filter(w => w.length > 3).some(w => nameLower.includes(w));
}

function DimExpanded({ dim, pet, onClose, apiProducts = {} }) {
  const petName = pet?.name || "your dog";
  const catName = DIM_ID_TO_CATEGORY[dim.id];
  const loadMoreRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // All raw products for this dimension from API
  const rawByTab = apiProducts[catName] || {};
  let allRaw = Object.values(rawByTab).flat();

  // Apply global breed filter — removes other breeds' products from ALL dimensions
  allRaw = filterBreedProducts(allRaw, pet?.breed);

  // Mira intelligence
  const allergies  = getAllergies(pet);
  const coat       = getCoatType(pet);
  const condition  = getHealthCondition(pet);
  const intelligent = applyMiraIntelligence(allRaw, allergies, coat, condition, pet);

  // Build tabs only from sub_categories that have products after filtering
  const filteredSubCats = [...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
  const tabList = ["All", ...filteredSubCats];
  const [activeTab, setActiveTab] = useState("All");
  const [dimTab, setDimTab] = useState("products");

  const products = activeTab === "All"
    ? intelligent
    : intelligent.filter(p => p.sub_category === activeTab);

  // Reset visible count when tab changes
  const prevTab = useRef(activeTab);
  if (prevTab.current !== activeTab) {
    prevTab.current = activeTab;
    setVisibleCount(20);
  }

  // Lazy scroll sentinel — load more when bottom enters viewport
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(n => n + 20); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products.length, activeTab]);

  const visibleProducts = products.slice(0, visibleCount);
  const miraCtx = { includeText: "Add to Cart" };

  return (
    <div style={{ background:"#fff", border:`2px solid ${G.sage}`, borderRadius:18, padding:22, marginBottom:16 }} data-testid={`care-dim-expanded-${dim.id}`}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${G.pale}` }}>
        <span style={{ fontSize:28 }}>{dim.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:G.darkText }}>{dim.label}</div>
          <div style={{ fontSize:11, color:"#888" }}>
            {allergies.map(a=>`${a}-free`).join(" · ")}{allergies.length > 0 ? " · " : ""}
            {condition ? "Treatment-safe" : "Personalised for " + petName}
          </div>
        </div>
        <button onClick={onClose} style={{ background:G.cream, border:"none", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, color:G.sage, cursor:"pointer" }}>Close ✕</button>
      </div>

      {/* Mira quote */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:G.greenBg, border:`1px solid ${G.greenBorder}`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:"50%", background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <p style={{ fontSize:12, color:G.darkText, fontStyle:"italic", lineHeight:1.5, margin:0 }}>"{t(dim.mira, petName)}"</p>
          <span style={{ fontSize:10, color:G.sage, fontWeight:600 }}>♥ Mira knows {petName}</span>
        </div>
      </div>

      {/* Products / Personalised tab toggle */}
      <div style={{ display:"flex", borderBottom:`1px solid ${G.borderLight}`, marginBottom:14 }}>
        {[["products","🎯 All Products"],["personalised","✦ Personalised"]].map(([tid,label]) => (
          <button key={tid} onClick={() => setDimTab(tid)} data-testid={`care-dim-tab-${tid}`}
            style={{ flex:1, padding:"9px 0", background:"none", border:"none", borderBottom:dimTab===tid?`2.5px solid ${G.sage}`:"2.5px solid transparent", color:dimTab===tid?G.sage:"#888", fontSize:12, fontWeight:dimTab===tid?700:400, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {dimTab === "personalised" ? (
        <div>
          <PersonalisedBreedSection pet={pet} pillar="care" />
        </div>
      ) : (
        <>
          {/* Sub-category tabs — only tabs with products after filtering */}
          {tabList.length > 1 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {tabList.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${activeTab===tab?G.sage:G.border}`, background:activeTab===tab?G.sage:"#FFF", fontSize:11, fontWeight:600, color:activeTab===tab?"#fff":G.mutedText, cursor:"pointer" }}>
                  {tab.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}

          {/* Mira stats */}
          {allRaw.length > 0 && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14, fontSize:11, color:"#888" }}>
              <span style={{ color:"#27AE60", fontWeight:700 }}>✓ {intelligent.length} for {petName}</span>
              {allRaw.length - intelligent.length > 0 && (
                <span style={{ color:"#E87722" }}>✗ {allRaw.length - intelligent.length} filtered</span>
              )}
            </div>
          )}

          {/* Product grid — lazy scroll */}
          {products.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"#888", fontSize:13 }}>
              {allRaw.length === 0
                ? `Loading ${dim.label} products for ${petName}…`
                : `All ${dim.label} products were filtered for ${petName}'s allergens.`}
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap:12 }}>
                {visibleProducts.map(p => (
                  <div key={p.id} style={{ position:"relative" }} data-testid={`care-dim-product-${p.id}`}>
                    <SharedProductCard product={p} pillar="care" selectedPet={pet} miraContext={miraCtx} />
                  </div>
                ))}
              </div>
              {visibleCount < products.length && (
                <div ref={loadMoreRef} style={{ height:1, marginTop:8 }} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARE TAB BAR
// ─────────────────────────────────────────────────────────────
function CareTabBar({ active, onChange }) {
  return (
    <div
      style={{ display:"flex", justifyContent:"center", gap:8, padding:"12px 16px", background:"#F5FBF7", borderBottom:`1px solid ${G.borderLight}` }}
      data-testid="care-tab-bar"
    >
      {[
        { id:"care",       icon:"🌿", label:"Care & Products" },
        { id:"services",   icon:"✂️",  label:"Care Services" },
        { id:"find-care",  icon:"📍", label:"Find Care" },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"8px 20px",
            fontSize:13, fontWeight:700,
            color: active === tab.id ? "#fff" : G.sage,
            background: active === tab.id ? `linear-gradient(135deg,${G.sage},${G.deepMid})` : G.cream,
            border: `1.5px solid ${active === tab.id ? G.sage : G.border}`,
            borderRadius:20,
            cursor:"pointer",
            transition:"all 0.18s",
            boxShadow: active === tab.id ? `0 2px 12px rgba(64,145,108,0.30)` : "none",
          }}
          data-testid={`care-tab-${tab.id}`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING & NO PET STATES
// ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 50%,${G.sage} 100%)` }} data-testid="care-loading">
      <div style={{ textAlign:"center", color:"#fff" }}>
        <div style={{ fontSize:32, marginBottom:12, animation:"spin 1s linear infinite" }}>🌿</div>
        <p style={{ color:"rgba(255,255,255,0.70)" }}>Loading Mira's care collection…</p>
      </div>
    </div>
  );
}

function NoPetState({ onAddPet }) {
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 16px", background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 50%,${G.sage} 100%)` }} data-testid="care-no-pet">
      <div style={{ textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:24 }}>🌿</div>
        <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:800, color:"#fff", marginBottom:16, fontFamily:"Georgia,serif" }}>Care &amp; Wellbeing<br/>for your pet</h1>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.70)", marginBottom:32 }}>Add your pet to unlock a personalised care experience — grooming, wellness, and supplements filtered by Mira.</p>
        <button onClick={onAddPet} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:9999, fontWeight:600, fontSize:16, cursor:"pointer", background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", border:"none", boxShadow:`0 4px 20px rgba(64,145,108,0.40)` }} data-testid="care-add-pet-btn">
          <span>✦</span><span>Add your dog to begin</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHARED BOOKING MODAL COMPONENTS
// ─────────────────────────────────────────────────────────────
function StepCard({ label, selected, onClick, sub, icon }) {
  return (
    <div
      onClick={onClick}
      style={{ border:`1.5px solid ${selected ? G.sage : "#E8E0D8"}`, borderRadius:12, padding:"14px 16px", background:selected?G.cream:"#fff", cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"flex-start", gap:12 }}
    >
      {icon && <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:G.mutedText, marginTop:2 }}>{sub}</div>}
      </div>
      {selected && (
        <div style={{ width:22, height:22, borderRadius:"50%", background:G.sage, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>
      )}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, accentColor = G.sage }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.label;
        const sel = Array.isArray(selected) ? selected.includes(val) : selected === val;
        return (
          <button key={val} onClick={() => onToggle(val)}
            style={{ border:`1.5px solid ${sel ? accentColor : "#E8E0D8"}`, borderRadius:20, padding:"8px 16px", background:sel?`${accentColor}15`:"#fff", color:sel?accentColor:"#555", fontSize:13, fontWeight:sel?600:400, cursor:"pointer", transition:"all 0.12s" }}>
            {sel ? "✓ " : ""}{val}
          </button>
        );
      })}
    </div>
  );
}

function MiraKnows({ text }) {
  return (
    <div style={{ background:G.pale, border:`1px solid ${G.greenBorder}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:20 }}>
      <span style={{ fontSize:14, flexShrink:0 }}>ⓘ</span>
      <div style={{ fontSize:13, color:G.deepMid }}>
        <strong style={{ color:G.deepMid }}>Mira knows:</strong>{" "}{text}
      </div>
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ height:4, background:"rgba(255,255,255,0.25)", borderRadius:4, overflow:"hidden", marginBottom:6 }}>
      <div style={{ height:"100%", width:`${(step/total)*100}%`, background:"#fff", borderRadius:4, transition:"width 0.3s" }} />
    </div>
  );
}

function BookingHeader({ service, step, totalSteps, pet, onClose }) {
  return (
    <div style={{ background:`linear-gradient(135deg,${service.accentColor},${service.accentColor}CC)`, padding:"20px 24px 16px", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
          <span style={{ fontSize:14 }}>{service.icon}</span>
          <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{service.name}</span>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>
      <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:4 }}>
        {service.name} for {pet.name}
      </div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:10 }}>
        Arranged around {pet.name}'s comfort and {pet.breed || "breed"} needs
      </div>
      <ProgressBar step={step} total={totalSteps} />
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Step {step} of {totalSteps}</div>
    </div>
  );
}

function PetBadge({ pet }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", marginBottom:16, borderBottom:`1px solid ${G.borderLight}` }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, overflow:"hidden", flexShrink:0 }}>
        {pet.avatarUrl ? <img src={pet.avatarUrl} alt={pet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span>{pet.avatar||"🐕"}</span>}
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:G.darkText }}>For {pet.name}</div>
        <div style={{ fontSize:13, color:G.mutedText }}>{pet.breed}</div>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, onSend, nextDisabled, isLast, accentColor, sending }) {
  return (
    <div style={{ display:"flex", gap:10, paddingTop:16, borderTop:`1px solid ${G.borderLight}` }}>
      {onBack && (
        <button onClick={onBack} style={{ flex:1, background:"#fff", border:`1.5px solid ${G.border}`, borderRadius:12, padding:12, fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>
          ← Back
        </button>
      )}
      <button
        onClick={isLast ? onSend : onNext}
        disabled={nextDisabled}
        style={{
          flex:2, background:nextDisabled?"#E8E0D8":isLast?`linear-gradient(135deg,${accentColor},${accentColor}99)`:`linear-gradient(135deg,${G.sage},${G.light})`,
          color:nextDisabled?"#999":isLast?"#fff":G.deep,
          border:"none", borderRadius:12, padding:12,
          fontSize:14, fontWeight:800, cursor:nextDisabled?"not-allowed":"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          transition:"all 0.15s",
        }}
      >
        {sending?"Sending…":isLast?"✦ Send to Concierge®":"Continue →"}
      </button>
    </div>
  );
}

function BookingConfirmed({ service, pet, onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 32px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${service.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>
        {service.urgent ? "🚨" : "✦"}
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:8 }}>Your {service.name.toLowerCase()} request for {pet.name} has been received.</div>
      <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>
        {service.urgent ? "Our Concierge® team will call you within 5 minutes." : `Our Concierge® team will review and get back to you with the best options for ${pet.name}.`}
      </div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.cream, border:`1px solid ${G.border}`, borderRadius:20, padding:"6px 16px", fontSize:13, color:G.sage, fontWeight:600, marginBottom:24 }}>
        📥 Added to your Inbox
      </div>
      <div>
        <button onClick={onClose} style={{ background:G.sage, color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          View in Concierge® Inbox
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARE SERVICES CONFIG
// ─────────────────────────────────────────────────────────────
const CARE_SERVICES = [
  { id:"grooming", icon:"✂️", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,${G.pale},${G.light})`, free:false, name:"Grooming", tagline:"Hygiene, coat care, bath, nail trim", desc:"We find the right groomer for {petName}'s coat type, book, and follow up.", accentColor:"#C2185B", steps:5 },
  { id:"vet", icon:"🏥", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)", free:false, name:"Vet Visits", tagline:"Clinic discovery, booking & follow-up", desc:"Trusted vets near you — clinic or home visit. Bookings confirmed, records collected.", accentColor:"#1565C0", steps:4 },
  { id:"boarding", icon:"🏡", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)", free:false, name:"Boarding & Daycare", tagline:"Overnight boarding & daytime supervision", desc:"We find the right boarding for {petName} — vetted, reviewed, and booked by your Concierge®.", accentColor:"#2D6A4F", steps:4 },
  { id:"sitting", icon:"🏠", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#FFF8E1,#FFE082)", free:false, name:"Pet Sitting", tagline:"In-home care, feeding & companionship", desc:"Someone comes to {petName}'s home. A few hours or overnight — whichever {petName} needs.", accentColor:"#E65100", steps:4 },
  { id:"behaviour", icon:"💜", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#F3E5F5,#E1BEE7)", free:false, name:"Behaviour Support", tagline:"Anxiety, fear & stress support", desc:"Certified behaviourists and trainers — matched to {petName}'s specific triggers and needs.", accentColor:"#6A1B9A", steps:5 },
  { id:"senior", icon:"🌸", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#FCE4EC,#F8BBD9)", free:false, name:"Senior & Special Needs", tagline:"Comfort, mobility & special handling", desc:"Gentle, specialised care for {petName}'s golden years — or any special needs.", accentColor:"#AD1457", steps:4 },
  { id:"nutrition", icon:"🥗", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#FFF3E0,#FFE0B2)", free:false, name:"Nutrition Consults", tagline:"Diet consults & allergy support", desc:"One-on-one with a vet nutritionist — {petName}'s allergies and preferences already loaded.", accentColor:"#E65100", steps:4 },
  { id:"emergency", icon:"🚨", illustrationUrl:null, illustrationBg:"linear-gradient(135deg,#FFEBEE,#FFCDD2)", free:true, name:"Emergency Help", tagline:"Urgent care routing & coordination", desc:"Tell us what's happening. We route you to the nearest emergency vet immediately.", accentColor:"#C62828", steps:2, urgent:true },
];

// ─────────────────────────────────────────────────────────────
// SERVICE BOOKING FLOWS
// ─────────────────────────────────────────────────────────────

// ── GROOMING FLOW (5 steps) ──────────────────────────────────
function GroomingFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep]     = useState(1);
  const [mode, setMode]     = useState(null);
  const [format, setFormat] = useState(null);
  const [svcs, setSvcs]     = useState([]);
  const [comfort, setComfort] = useState({ strangers:null, nervous:null });
  const [location, setLocation] = useState({ area:"", water:null, time:null, date:"" });
  const [sent, setSent]     = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ mode, format, services: svcs, comfort, location, summary: `Grooming for ${pet.name}: Mode=${mode}, Format=${format}, Services=${svcs.join(', ')}, Stranger comfort=${comfort.strangers}, Nervous=${comfort.nervous}, Date=${location.date}, Time=${location.time}${location.area?`, Area=${location.area}`:''}` });
    setSent(true);
  };
  const toggleSvc = v => setSvcs(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const today = new Date().toISOString().split('T')[0];
  const canNext = [!!mode,!!format,svcs.length>0,comfort.strangers&&comfort.nervous,location.date&&location.time][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.coatType||"Long silky"} coat — regular brushing prevents matting. ${pet.groomingComfort==="Comfortable"?pet.name+" is comfortable being groomed.":"Gentle handling recommended."}`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How would you like grooming arranged?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"home",icon:"🏠",l:"At Home",s:"Groomer comes to you"},{v:"salon",icon:"💇",l:"At Salon",s:"Visit a grooming salon"},{v:"mira",icon:"✦",l:"Let Mira Recommend",s:"Based on your pet's needs"},{v:"myself",icon:"🛁",l:"I Groom at Home",s:"Help me do it right"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={mode===o.v} onClick={()=>setMode(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Select service format</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"individual",l:"Individual Services",s:"Pick specific services"},{v:"full",l:"Full Groom",s:"Complete grooming session"},{v:"bundle",l:"Bundle / Plan",s:"Multi-session packages"},{v:"maintenance",l:"Maintenance",s:"Regular upkeep"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} selected={format===o.v} onClick={()=>setFormat(o.v)} />
            ))}
          </div>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Choose services for {pet.name}</div>
          <ChipSelect options={["Bath + Blow Dry","Haircut / Trim","Nail Clipping","Ear Cleaning","Paw Care / Paw Trim","Hygiene Trim","Deshedding","Detangling / De-matting","Coat Styling","Teeth Cleaning"]} selected={svcs} onToggle={toggleSvc} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Comfortable with strangers?</div>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {["Yes","Sometimes","No"].map(v=>(<StepCard key={v} label={v} selected={comfort.strangers===v} onClick={()=>setComfort(p=>({...p,strangers:v}))} />))}
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Nervous during grooming?</div>
          <div style={{ display:"flex", gap:10 }}>
            {["Yes","No","Not sure"].map(v=>(<StepCard key={v} label={v} selected={comfort.nervous===v} onClick={()=>setComfort(p=>({...p,nervous:v}))} />))}
          </div>
        </>)}
        {step===5 && (<>
          {mode==="home" && (<>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Area / Landmark</div>
            <input type="text" placeholder="Nearby landmark" value={location.area} onChange={e=>setLocation(p=>({...p,area:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:16, boxSizing:"border-box" }} />
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Water access available?</div>
            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              {["Yes","No"].map(v=>(<StepCard key={v} label={v} selected={location.water===v} onClick={()=>setLocation(p=>({...p,water:v}))} />))}
            </div>
          </>)}
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Preferred date</div>
          <input type="date" min={today} value={location.date} onChange={e=>setLocation(p=>({...p,date:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${location.date?G.sage:G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:16, boxSizing:"border-box", background:"#fff" }} />
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferred time window</div>
          <div style={{ display:"flex", gap:10 }}>
            {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–8pm)"].map(v=>(<StepCard key={v} label={v} selected={location.time===v} onClick={()=>setLocation(p=>({...p,time:v,water:p.water||"Yes"}))} />))}
          </div>
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===5} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── VET VISITS FLOW (4 steps) ────────────────────────────────
function VetFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep]   = useState(1);
  const [reason, setReason] = useState(null);
  const [pref, setPref]   = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [sent, setSent]   = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ reason, preference: pref, urgency, notes, preferredDate, summary: `Vet visit for ${pet.name}: Reason=${reason}, Type=${pref}, Urgency=${urgency}${preferredDate?`, Date=${preferredDate}`:''}${notes?`, Notes=${notes}`:''}` });
    setSent(true);
  };
  const today = new Date().toISOString().split('T')[0];
  const canNext = [!!reason,!!pref,!!urgency,true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s vaccination records and health history are on file with your Concierge®. The vet will be briefed before the visit.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Reason for visit</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"routine",icon:"✅",l:"Routine Check-up",s:"Annual wellness exam"},{v:"vaccination",icon:"💉",l:"Vaccination",s:"Booster or first shot"},{v:"concern",icon:"🩺",l:"Health Concern",s:"Something specific to check"},{v:"followup",icon:"🔄",l:"Follow-up",s:"Continuing treatment"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={reason===o.v} onClick={()=>setReason(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferred visit type</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"clinic",icon:"🏥",l:"At the Clinic",s:"Visit nearby clinic"},{v:"home",icon:"🏠",l:"Home Visit",s:"Vet comes to you"},{v:"mira",icon:"✦",l:"Mira Recommends",s:"Best option for your pet"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={pref===o.v} onClick={()=>setPref(o.v)} />
            ))}
          </div>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How soon does {pet.name} need to be seen?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10 }}>
            {[{v:"urgent",icon:"🚨",l:"Within 24 hours",s:"Something feels urgent"},{v:"soon",icon:"📅",l:"Within a week",s:"Should be checked soon"},{v:"routine",icon:"🗓️",l:"Any time in the next month",s:"Routine, no rush"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={urgency===o.v} onClick={()=>setUrgency(o.v)} />
            ))}
          </div>
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Preferred appointment date</div>
          <input type="date" min={today} value={preferredDate} onChange={e=>setPreferredDate(e.target.value)} style={{ width:"100%", border:`1.5px solid ${preferredDate?G.sage:G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:16, boxSizing:"border-box", background:"#fff" }} />
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Anything specific to share? <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
          <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Describe any symptoms, concerns, or details about ${pet.name}…`} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── BOARDING FLOW (4 steps) ──────────────────────────────────
function BoardingFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep]   = useState(1);
  const [type, setType]   = useState(null);
  const [dates, setDates] = useState({ from:"", to:"", flexible:false });
  const [reqs, setReqs]   = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [sent, setSent]   = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ type, dates, requirements: reqs, preferences: prefs, summary: `Boarding for ${pet.name}: Type=${type}, Dates=${dates.flexible?'Flexible':`${dates.from} to ${dates.to}`}, Requirements=${reqs.join(', ')||'none'}, Preferences=${prefs.join(', ')||'none'}` });
    setSent(true);
  };
  const toggleReq  = v => setReqs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const togglePref = v => setPrefs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!type,(dates.from&&dates.to)||dates.flexible,true,true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s feeding schedule and special requirements are already noted. The boarding facility will be briefed in advance.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of stay does {pet.name} need?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"overnight",icon:"🌙",l:"Overnight Boarding",s:"Multi-day stay at a facility"},{v:"daycare",icon:"☀️",l:"Daycare Only",s:"Drop off and pick up same day"},{v:"luxury",icon:"⭐",l:"Luxury Stay",s:"Premium suite and extra care"},{v:"family",icon:"🏡",l:"Family Home Stay",s:"Stay with a vetted pet family"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When do you need boarding?</div>
          {!dates.flexible && (
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:G.mutedText, marginBottom:4 }}>From</div>
                <input type="date" value={dates.from} onChange={e=>setDates(p=>({...p,from:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 12px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:G.mutedText, marginBottom:4 }}>To</div>
                <input type="date" value={dates.to} onChange={e=>setDates(p=>({...p,to:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 12px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>
          )}
          <button onClick={()=>setDates(p=>({...p,flexible:!p.flexible}))} style={{ border:`1.5px solid ${dates.flexible?G.sage:"#E8E0D8"}`, borderRadius:20, padding:"8px 16px", background:dates.flexible?G.cream:"#fff", color:dates.flexible?G.deepMid:"#555", fontSize:13, fontWeight:dates.flexible?600:400, cursor:"pointer" }}>
            {dates.flexible?"✓ Dates are flexible":"Dates are flexible"}
          </button>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Any special requirements?</div>
          <ChipSelect options={["Medication administration","Special diet","Separation anxiety","Breed-specific handling","Senior care needed","Post-surgery recovery","Highly active dog","Shy / needs slow introduction"]} selected={reqs} onToggle={toggleReq} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferences for the facility</div>
          <ChipSelect options={["Near my home","Near my vet","Luxury / premium suite","Standard accommodation","Outdoor run available","Indoor only","Small dogs only","24/7 vet on site"]} selected={prefs} onToggle={togglePref} accentColor={service.accentColor} />
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── PET SITTING FLOW (4 steps) ───────────────────────────────
function SittingFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [when, setWhen] = useState({ date:"", time:null, recurring:null });
  const [needs, setNeeds] = useState([]);
  const [access, setAccess] = useState({ notes:"" });
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ type, when, needs, access_notes: access.notes, summary: `Pet sitting for ${pet.name}: Type=${type}, Date=${when.date||'TBD'}, Time=${when.time||'TBD'}, Needs=${needs.join(', ')||'none'}${access.notes?`, Notes=${access.notes}`:''}` });
    setSent(true);
  };
  const toggleNeed = v => setNeeds(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!type,when.time&&(when.date||when.recurring),needs.length>0,true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s feeding routine and medication needs are already on file with your Concierge®.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of pet sitting does {pet.name} need?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"hourly",icon:"⏰",l:"A few hours",s:"While you're out"},{v:"fullday",icon:"☀️",l:"Full day",s:"Morning to evening"},{v:"overnight",icon:"🌙",l:"Overnight",s:"Sitter stays the night"},{v:"regular",icon:"📅",l:"Regular / weekly",s:"Ongoing schedule"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>When?</div>
          <input type="date" value={when.date} onChange={e=>setWhen(p=>({...p,date:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>Preferred time</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
            {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Flexible"].map(v=>(
              <button key={v} onClick={()=>setWhen(p=>({...p,time:v}))} style={{ border:`1.5px solid ${when.time===v?G.sage:"#E8E0D8"}`, borderRadius:20, padding:"7px 14px", background:when.time===v?G.cream:"#fff", color:when.time===v?G.deepMid:"#555", fontSize:12, fontWeight:when.time===v?600:400, cursor:"pointer" }}>{when.time===v?"✓ ":""}{v}</button>
            ))}
          </div>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does {pet.name} need during the sitting?</div>
          <ChipSelect options={["Feeding","Fresh water","Walks","Playtime","Medication administration","Companionship (lap dog)","Potty breaks","Training reinforcement"]} selected={needs} onToggle={toggleNeed} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Home access & special notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
          <textarea rows={5} value={access.notes} onChange={e=>setAccess({notes:e.target.value})} placeholder={`Key safe location, gate code, emergency contact, any quirks about ${pet.name}…`} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── BEHAVIOUR SUPPORT FLOW (5 steps) ────────────────────────
function BehaviourFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep]   = useState(1);
  const [concern, setConcern] = useState(null);
  const [when, setWhen]   = useState(null);
  const [triggers, setTriggers] = useState(pet.anxietyTriggers||[]);
  const [tried, setTried] = useState([]);
  const [approach, setApproach] = useState(null);
  const [sent, setSent]   = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ concern, when, triggers, tried, approach, summary: `Behaviour support for ${pet.name}: Concern=${concern}, When=${when}, Triggers=${triggers.join(', ')||'none'}, Tried=${tried.join(', ')||'nothing'}, Approach=${approach}` });
    setSent(true);
  };
  const toggleTrig  = v => setTriggers(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const toggleTried = v => setTried(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!concern,!!when,triggers.length>0,true,!!approach][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Known triggers for ${pet.name}: ${(pet.anxietyTriggers||[]).join(", ")||"none recorded yet"}. Personality profile already loaded.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What is the primary concern?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"aggression",icon:"⚠️",l:"Aggression",s:"Towards people or other dogs"},{v:"separation",icon:"🏠",l:"Separation anxiety",s:"Distress when left alone"},{v:"fear",icon:"😨",l:"Fear / Phobia",s:"Specific fears causing distress"},{v:"reactivity",icon:"🐕",l:"Reactivity",s:"Overreaction to triggers"},{v:"barking",icon:"🔊",l:"Excessive barking",s:"Constant or triggered barking"},{v:"destructive",icon:"💥",l:"Destructive behaviour",s:"Chewing, digging, destroying"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={concern===o.v} onClick={()=>setConcern(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When does it happen?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"always",l:"Always",s:"Constant or near-constant"},{v:"triggers",l:"Specific triggers",s:"When certain things happen"},{v:"new",l:"Recently started",s:"New behaviour change"},{v:"worsening",l:"Getting worse",s:"Ongoing but escalating"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} selected={when===o.v} onClick={()=>setWhen(o.v)} />
            ))}
          </div>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>Confirm {pet.name}'s triggers</div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>Pre-filled from soul profile. Add or remove as needed.</div>
          <ChipSelect options={["Loud noises","Car travel","Strangers / crowds","Vet visits","Being left alone","Storms","Other dogs","Fireworks","New environments","Sudden movements"]} selected={triggers} onToggle={toggleTrig} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What has been tried so far?</div>
          <ChipSelect options={["Nothing yet","Basic training","Professional training","Calming supplements","Medication (vet prescribed)","Pheromone diffuser","Compression wrap","Behaviour modification plan"]} selected={tried} onToggle={toggleTried} accentColor={service.accentColor} />
        </>)}
        {step===5 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferred approach</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"behaviourist",icon:"👩‍⚕️",l:"Certified behaviourist",s:"Specialist assessment and plan"},{v:"trainer",icon:"🎓",l:"Positive trainer",s:"Training-based approach"},{v:"products",icon:"🌿",l:"Products first",s:"Calming supplements and tools"},{v:"vet",icon:"🏥",l:"Vet referral",s:"Medical assessment needed"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={approach===o.v} onClick={()=>setApproach(o.v)} />
            ))}
          </div>
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===5} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── SENIOR & SPECIAL NEEDS FLOW (4 steps) ────────────────────
function SeniorFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep] = useState(1);
  const [need, setNeed] = useState(null);
  const [situation, setSituation] = useState("");
  const [setup, setSetup] = useState([]);
  const [vetInvolv, setVetInvolv] = useState(null);
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ need, situation, setup, vet_involvement: vetInvolv, summary: `Senior/special care for ${pet.name}: Need=${need}, Setup=${setup.join(', ')||'none'}, Vet=${vetInvolv}${situation?`, Situation=${situation}`:''}` });
    setSent(true);
  };
  const toggleSetup = v => setSetup(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!need,true,setup.length>0,!!vetInvolv][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name} is ${pet.age||"?"} years old. ${pet.healthCondition?"Health condition on file: "+pet.healthCondition+".":"No health conditions recorded."} Senior care recommendations are tailored to their breed.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does {pet.name} need most right now?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"mobility",icon:"🦽",l:"Mobility support",s:"Arthritis, stiffness"},{v:"pain",icon:"💊",l:"Pain management",s:"Chronic or acute pain support"},{v:"cognitive",icon:"🧠",l:"Cognitive decline",s:"Confusion, night waking"},{v:"surgery",icon:"🏥",l:"Post-surgery recovery",s:"Wound care, restricted movement"},{v:"palliative",icon:"💜",l:"Palliative care",s:"End-of-life comfort"},{v:"special",icon:"🌸",l:"Special handling",s:"Physical disability or unusual needs"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={need===o.v} onClick={()=>setNeed(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Tell us what's changed recently <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
          <textarea rows={5} value={situation} onChange={e=>setSituation(e.target.value)} placeholder="What have you noticed? When did it start? What has been tried?" style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does the home setup need?</div>
          <ChipSelect options={["Orthopaedic bed","Ramp or steps","Raised feeding station","Non-slip mats","Self-warming blanket","Baby gate to restrict stairs","Night light","Mobility harness"]} selected={setup} onToggle={toggleSetup} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Vet involvement?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10 }}>
            {[{v:"have",icon:"✅",l:"I have a vet managing this",s:"Concierge® coordinates alongside existing vet"},{v:"need",icon:"🔍",l:"I need a vet first",s:"Help me find the right specialist"},{v:"second",icon:"💬",l:"I want a second opinion",s:"Not confident in current treatment plan"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={vetInvolv===o.v} onClick={()=>setVetInvolv(o.v)} />
            ))}
          </div>
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── NUTRITION CONSULTS FLOW (4 steps) ────────────────────────
function NutritionFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState(null);
  const [currentDiet, setCurrentDiet] = useState(null);
  const [issues, setIssues] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ reason, currentDiet, issues, outcome, summary: `Nutrition consult for ${pet.name}: Reason=${reason}, Current diet=${currentDiet}, Issues=${issues.join(', ')||'none'}, Desired outcome=${outcome}` });
    setSent(true);
  };
  const toggleIssue = v => setIssues(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!reason,!!currentDiet,true,!!outcome][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s allergies (${(pet.allergies||[]).join(", ")||"none recorded"}) and food preferences are pre-loaded. The nutritionist will have everything before the consult.`} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Reason for this consultation?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"general",icon:"🥗",l:"General diet review",s:"Is what I'm feeding right?"},{v:"allergy",icon:"🛡️",l:"Allergy diet planning",s:"Safe food after allergen discovery"},{v:"weight",icon:"⚖️",l:"Weight management",s:"Safe weight loss or gain"},{v:"medical",icon:"💊",l:"Medical diet",s:"Condition-specific"},{v:"puppy",icon:"🐶",l:"Puppy nutrition",s:"Getting the foundations right"},{v:"senior",icon:"🌸",l:"Senior nutrition",s:"Adapting diet for older dogs"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={reason===o.v} onClick={()=>setReason(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What is {pet.name} eating right now?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"kibble",icon:"🥣",l:"Commercial kibble",s:"Dry food from a bag"},{v:"wet",icon:"🥫",l:"Wet / canned food",s:"Pouches or tins"},{v:"raw",icon:"🥩",l:"Raw diet",s:"BARF or prey model"},{v:"homecooked",icon:"🍲",l:"Home-cooked",s:"Fresh meals"},{v:"mixed",icon:"🔀",l:"Mixed / combination",s:"Multiple types"},{v:"unsure",icon:"❓",l:"Not sure / varies",s:"Inconsistent or changing"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={currentDiet===o.v} onClick={()=>setCurrentDiet(o.v)} />
            ))}
          </div>
        </>)}
        {step===3 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>Known issues to address</div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>Pre-filled from soul profile. Add anything else.</div>
          <ChipSelect options={[...(pet.allergies||[]).map(a=>a.charAt(0).toUpperCase()+a.slice(1)+" allergy"),"Weight management","Digestive issues","Skin / coat problems","Dental health","Low energy","Picky eater","Sensitive stomach"]} selected={issues} onToggle={toggleIssue} accentColor={service.accentColor} />
        </>)}
        {step===4 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What would you like from this consultation?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10 }}>
            {[{v:"mealplan",icon:"📋",l:"A complete meal plan",s:"Day-by-day guide matched to "+pet.name+"'s needs"},{v:"products",icon:"🛒",l:"Product recommendations",s:"Best food brands and supplements for "+pet.name},{v:"vet",icon:"🏥",l:"Vet nutritionist referral",s:"Medical-grade nutrition assessment"},{v:"transition",icon:"🔄",l:"Diet transition support",s:"How to safely switch "+pet.name+"'s food"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={outcome===o.v} onClick={()=>setOutcome(o.v)} />
            ))}
          </div>
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── EMERGENCY FLOW (2 steps — fast) ─────────────────────────
function EmergencyFlow({ pet, service, onClose, sendToConcierge }) {
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState(null);
  const [location, setLocation] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    await sendToConcierge({ situation, location, summary: `EMERGENCY for ${pet.name}: ${situation}${location?`, Location: ${location}`:''}` });
    setSent(true);
  };
  const canNext = [!!situation,true][step-1];
  if (sent) return (
    <div style={{ textAlign:"center", padding:"40px 32px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#C62828", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>🚨</div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:15, color:"#C62828", fontWeight:700, marginBottom:8 }}>We will call you within 5 minutes.</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>Your emergency request for {pet.name} has been received.<br/>Our Concierge® team is routing you to the nearest emergency vet now.</div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:20, padding:"6px 16px", fontSize:13, color:"#C62828", fontWeight:600, marginBottom:24 }}>📥 Added to your Inbox</div>
      <div><button onClick={onClose} style={{ background:"#C62828", color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
    </div>
  );
  return (
    <>
      <div style={{ background:"linear-gradient(135deg,#C62828,#B71C1C)", padding:"20px 24px 16px", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
            <span style={{ fontSize:14 }}>🚨</span>
            <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>Emergency Help</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:4 }}>Emergency for {pet.name}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:10 }}>Tell us what's happening. We'll route you immediately.</div>
        <ProgressBar step={step} total={2} />
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Step {step} of 2</div>
      </div>
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        {step===1 && (<>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What's happening?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{v:"injury",icon:"🩹",l:"Injury / accident",s:"Cut, fracture, trauma"},{v:"poison",icon:"☠️",l:"Poisoning / ingestion",s:"Ate something dangerous"},{v:"breathing",icon:"😮‍💨",l:"Breathing difficulty",s:"Struggling to breathe"},{v:"seizure",icon:"⚡",l:"Seizure",s:"Convulsions or collapse"},{v:"collapse",icon:"💔",l:"Collapse / unconscious",s:"Can't get up or unresponsive"},{v:"lost",icon:"🔍",l:"Lost pet",s:"Missing and can't locate them"}].map(o=>(
              <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={situation===o.v} onClick={()=>setSituation(o.v)} />
            ))}
          </div>
        </>)}
        {step===2 && (<>
          <div style={{ background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:12, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#B71C1C", fontWeight:600 }}>
            🚨 We will call you within 5 minutes of receiving this.
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Your location</div>
          <input type="text" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address or nearest landmark" style={{ width:"100%", border:"1.5px solid #FFCDD2", borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
        </>)}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={handleSend} nextDisabled={!canNext} isLast={step===2} accentColor="#C62828" />
      </div>
    </>
  );
}

// ── SERVICE BOOKING MODAL ROUTER ─────────────────────────────
function ServiceBookingModal({ service, pet, onClose }) {
  const { fire } = useConcierge({ pet, pillar: 'care' });
  const sendToConcierge = useCallback(async (flowData) => {
    const petName = pet?.name || 'your dog';
    const allergies = (pet?.allergies || []).join(', ') || 'none recorded';
    const isEmergency = service.id === 'emergency';
    await fire({
      type: isEmergency ? 'urgent' : 'service',
      name: service.name,
      urgency: isEmergency ? 'emergency' : 'normal',
      channel: `care_service_flow_${service.id}`,
      note: flowData.summary || '',
      metadata: {
        service_id: service.id,
        service_name: service.name,
        pet_breed: pet?.breed,
        pet_allergies: allergies,
        flow_selections: flowData,
      },
    });
  }, [fire, pet, service]);
  const FlowComponent = { grooming:GroomingFlow, vet:VetFlow, boarding:BoardingFlow, sitting:SittingFlow, behaviour:BehaviourFlow, senior:SeniorFlow, nutrition:NutritionFlow, emergency:EmergencyFlow }[service.id];
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"min(580px,100%)", maxHeight:"90vh", background:"#fff", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.30)" }}>
        {FlowComponent ? <FlowComponent pet={pet} service={service} onClose={onClose} sendToConcierge={sendToConcierge} /> : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARE CONCIERGE SECTION
// ─────────────────────────────────────────────────────────────
function CareConcierge({ pet }) {
  const [activeService, setActiveService] = useState(null);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  return (
    <div style={{ background:`linear-gradient(135deg,${G.cream},#E8F5EE)`, borderRadius:20, border:`1px solid ${G.border}`, padding:24, marginBottom:32 }} data-testid="care-concierge">
      {activeService && (
        <ServiceBookingModal service={CARE_SERVICES.find(s=>s.id===activeService)} pet={pet} onClose={()=>setActiveService(null)} />
      )}
      {conciergeOpen && (
        <CareConciergeModal
          isOpen={conciergeOpen}
          onClose={() => setConciergeOpen(false)}
          petName={pet?.name}
          petId={pet?.id}
        />
      )}
      <div style={{ fontSize:20, fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>Care Concierge® Services</div>
      <div style={{ fontSize:13, color:G.mutedText, marginBottom:20 }}>Concierge®-led care coordination — from finding the right groomer to making sure {pet.name} is comfortable every step of the way.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }} className="care-svc-grid">
        <style>{`@media(max-width:640px){.care-svc-grid{grid-template-columns:repeat(2,1fr);}}`}</style>
        {CARE_SERVICES.map(svc => (
          <div key={svc.id} style={{ background:"#fff", borderRadius:16, border:`1px solid ${svc.urgent?"#FFCDD2":G.borderLight}`, overflow:"hidden", transition:"transform 0.15s,box-shadow 0.15s", cursor:"pointer" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
            data-testid={`care-service-${svc.id}`}
          >
            <div style={{ height:76, background:svc.illustrationBg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              <span style={{ fontSize:34 }}>{svc.icon}</span>
              {svc.urgent && <div style={{ position:"absolute", top:8, right:8, background:"#C62828", color:"#fff", fontSize:9, fontWeight:700, borderRadius:20, padding:"2px 7px" }}>URGENT</div>}
            </div>
            <div style={{ padding:"12px 14px 14px" }}>
              {svc.free && <div style={{ display:"inline-block", background:"#E8F5E9", color:"#2E7D32", fontSize:10, fontWeight:700, borderRadius:8, padding:"2px 8px", marginBottom:6 }}>Complimentary</div>}
              <div style={{ fontSize:12, color:G.hintText, marginBottom:3 }}>{svc.tagline}</div>
              <div style={{ fontSize:13, fontWeight:700, color:svc.urgent?"#C62828":G.darkText, marginBottom:5, lineHeight:1.3 }}>{svc.name}</div>
              <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.5, marginBottom:10 }}>{svc.desc.replace(/\{petName\}/g, pet.name)}</div>
              <button style={{ fontSize:12, color:svc.urgent?"#C62828":G.sage, fontWeight:700, background:"none", border:"none", padding:0, cursor:"pointer" }} onClick={()=>setActiveService(svc.id)}>
                {svc.urgent?"Get help now →":`Book ${svc.steps}-step flow →`}
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Dark CTA card */}
      <div style={{ background:G.deep, borderRadius:20, padding:28, display:"flex", alignItems:"flex-start", gap:24 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(116,198,157,0.20)", border:"1px solid rgba(116,198,157,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
            🌿 Care Concierge®
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:10, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
            Care for <span style={{ color:G.light }}>{pet.name}</span> the way only you know how.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
            {["Grooming","Vet Visits","Boarding & Daycare","Pet Sitting","Behaviour Support","Senior Care","Nutrition","Emergency"].map(chip => (
              <span key={chip} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 12px", color:"#fff", fontSize:11 }}>{chip}</span>
            ))}
          </div>
          <div style={{ fontSize:13, color:G.whiteDim, lineHeight:1.7, marginBottom:20 }}>
            You tell us what {pet.name} needs. We find the right person, make the booking, follow up after, and keep the records. Every time.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div>
              <span style={{ fontSize:26, fontWeight:900, color:G.light }}>45,000+</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.50)", marginLeft:6 }}>care moments arranged</span>
            </div>
            <button onClick={()=>setConciergeOpen(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${G.sage},${G.light})`, color:G.deep, border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:800, cursor:"pointer" }} data-testid="care-talk-concierge-btn">
              🌿 Talk to your Care Concierge®
            </button>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.40)" }}>48h response promise · Emergency: 5 min</span>
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"center", minWidth:100 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(116,198,157,0.20)", border:`2px solid rgba(116,198,157,0.40)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 8px" }}>🌿</div>
          <div style={{ fontSize:22, fontWeight:900, color:G.light }}>100%</div>
          <div style={{ fontSize:11, color:G.whiteDim, marginBottom:6 }}>handled for you</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.30)", lineHeight:1.5 }}>Every call.<br/>Every detail.</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SOUL CHIP
// ─────────────────────────────────────────────────────────────
function SoulChip({ children }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:20, padding:"4px 10px", fontSize:11, color:"#fff", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.10)" }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function CareSoulPage() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components


  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("care");
  const [openDim, setOpenDim]     = useState(null);
  const [petData, setPetData]     = useState(null);
  const [soulScore, setSoulScore] = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [conciergeToast, setConciergeToast] = useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  // ── tdc page visit tracking ──────────────────────────────────────────────
  usePlatformTracking({ pillar: "care", pet: currentPet });

  // handleNearMeBook — wires "Book via Concierge®" on CareNearMe cards
  const handleNearMeBook = useCallback(async (provider, city) => {
    const venueName = provider?.name || (city ? `a provider in ${city}` : "a grooming/care provider");
    // Fire tdc intent
    tdc.nearme({ query: venueName, pillar: "care", pet: petData, channel: "care_nearme" });
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const ticketResp = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "care_guest",
          pet_id:    petData?.id || "",
          pillar:    "care",
          intent_primary: "GROOMING_BOOKING",
          life_state: "PLAN",
          initial_message: {
            sender: "parent",
            source: "Mira_OS",
            text: `Please help book ${venueName} for ${petData?.name || "my dog"}.`,
          },
        }),
      });
      if (ticketResp.ok) {
        const tData = await ticketResp.json();
        await fetch(`${API_URL}/api/service_desk/handoff_to_concierge`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            ticket_id: tData.ticket_id,
            concierge_queue: "GROOMING",
            latest_mira_summary: `${petData?.name || "Dog"} owner wants to book: ${venueName}.`,
          }),
        });
        setConciergeToast({ name: venueName, ticketId: tData.ticket_id, pillar: "care" });
      }
    } catch (err) {
      console.error("[CareSoulPage] handleNearMeBook:", err);
      setConciergeToast({ name: provider?.name, pillar: "care" });
    }
  }, [petData, token]);

  // Fetch all care products on mount — grouped by dimension / sub_category, breed-filtered for soul items
  useEffect(() => {
    if (!petData) return;
    const petBreed = (petData?.breed || "indie").toLowerCase().trim();

    fetch(`${API_URL}/api/admin/pillar-products?pillar=care&limit=600`)
      .then(r => r.ok ? r.json() : null)
      .then(async data => {
        if (!data?.products?.length) return;
        const grouped = {};
        data.products.forEach(p => {
          // Skip soul/breed products for other breeds
          const productBreeds = (p.breed_tags || []).map(b => b.toLowerCase().trim());
          if (productBreeds.length > 0 && !productBreeds.includes(petBreed)) return;

          const dim = p.dimension || "";
          const sub = p.sub_category || "Other";
          if (!dim) return;
          if (!grouped[dim]) grouped[dim] = {};
          if (!grouped[dim][sub]) grouped[dim][sub] = [];
          grouped[dim][sub].push(p);
        });

        // Merge breed-specific soul products from breed_products
        try {
          const breedRes = await fetch(`${API_URL}/api/breed-catalogue/products?pillar=care&breed=${encodeURIComponent(petData.breed)}&limit=30`);
          if (breedRes.ok) {
            const breedData = await breedRes.json();
            (breedData.products || []).forEach(p => {
              const dimKey = "Soul Care Products";
              if (!grouped[dimKey]) grouped[dimKey] = {};
              if (!grouped[dimKey]["soul"]) grouped[dimKey]["soul"] = [];
              if (!grouped[dimKey]["soul"].find(x => x.name === p.name)) {
                grouped[dimKey]["soul"].push({ ...p, sub_category: "soul", pillar: "care" });
              }
            });
          }
        } catch (e) { /* non-critical */ }

        setApiProducts(grouped);
      }).catch(err => console.error("[CareSoulPage] products:", err));
  }, [petData]);

  // Sync pet from context
  useEffect(() => {
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) {
      setPetData(currentPet);
      setSoulScore(currentPet.overall_score || currentPet.soul_score || 0);
    } else if (contextPets !== undefined) {
      setPetData(null);
    }
  }, [currentPet, contextPets]);

  // Listen for soul score updates
  useEffect(() => {
    const handle = async e => {
      if (e.detail?.petId !== petData?.id) return;
      if (e.detail?.score !== undefined) setSoulScore(e.detail.score);
      try {
        const fresh = await fetch(`${API_URL}/api/pets/${e.detail.petId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.ok ? r.json() : null);
        if (fresh) { setPetData(fresh); setCurrentPet(fresh); }
      } catch {}
    };
    window.addEventListener("soulScoreUpdated", handle);
    return () => window.removeEventListener("soulScoreUpdated", handle);
  }, [petData?.id, token, setCurrentPet]);

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/care");
  }, [isAuthenticated, navigate]);

  // Mobile detection — serve mobile page on small screens
  if (!isDesktop) return <CareMobilePage />;

  if (loading) return <PillarPageLayout pillar="care" hideHero hideNavigation><LoadingState /></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="care" hideHero hideNavigation><NoPetState onAddPet={handleAddPet} /></PillarPageLayout>;

  const careDims = getCareDims(petData);
  const activeDim = careDims.find(d => d.id === openDim);
  const flowPet   = normalizePetForFlow(petData);

  return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <Helmet>
        <title>Care · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Everything for ${petData.name}'s care, filtered and matched by Mira.`} />
      </Helmet>

      <CareHero pet={petData} soulScore={soulScore} />

      <div style={{ background:G.pageBg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:"60vh" }}>
        <CareCategoryStrip pet={petData} onDimSelect={id => setOpenDim(prev => prev===id?null:id)} activeDim={openDim} onSoulMade={() => setSoulMadeOpen(true)} />

        <CareTabBar active={activeTab} onChange={setActiveTab} />

        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

          {activeTab === "care" && (
            <>
              {/* Wellness Profile bar */}
              <WellnessProfile pet={petData} token={token} />

              {/* ── Beautiful PillarSoulProfile + Health Vault (moved from top) ── */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {/* Soul Profile — full component with drawer */}
                <div style={{ paddingTop: 16 }}>
                  <PillarSoulProfile pet={petData} token={token} pillar="care" />
                </div>

                {/* Health Vault — styled like WellnessProfile card */}
                {petData?.id && (
                  <div
                    data-testid="health-vault-card-lower"
                    onClick={() => navigate(`/pet-vault/${petData.id}`)}
                    style={{
                      background:'#fff', border:`2px solid ${G.pale}`, borderRadius:16,
                      padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                      boxShadow:'0 2px 12px rgba(45,106,79,0.08)', transition:'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(45,106,79,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 12px rgba(45,106,79,0.08)'}
                  >
                    <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:'linear-gradient(135deg,#E8F5E9,#A5D6A7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏥</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petData.name}'s Health Vault</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:4 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:'#00695C', background:'#E0F2F1', border:'1px solid #80CBC4', borderRadius:20, padding:'2px 8px' }}>💉 Vaccines</span>
                        <span style={{ fontSize:10, fontWeight:600, color:'#1565C0', background:'#E3F2FD', border:'1px solid #90CAF9', borderRadius:20, padding:'2px 8px' }}>💊 Medications</span>
                        <span style={{ fontSize:10, fontWeight:600, color:'#AD1457', background:'#FCE4EC', border:'1px solid #F48FB1', borderRadius:20, padding:'2px 8px' }}>⚕ Allergies</span>
                        <span style={{ fontSize:10, fontWeight:600, color:'#1B4332', background:'#D8F3DC', border:'1px solid #74C69D', borderRadius:20, padding:'2px 8px' }}>🩺 Vet visits</span>
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:G.sage, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>open →</span>
                  </div>
                )}
              </div>

              {/* Section header */}
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:"clamp(1.375rem,3vw,1.875rem)", fontWeight:800, color:G.darkText, marginBottom:6, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
                  How would <span style={{ color:G.sage }}>{petData.name}</span> love to be cared for?
                </h2>
                <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
                  Choose a dimension — everything inside is personalised to {petData.name}'s wellness profile.{" "}
                  <span style={{ color:G.deepMid, fontWeight:600 }}>Glowing ones match what {petData.name} needs most.</span>
                </p>
              </div>

              {/* Mira's Picks */}
              <MiraPicksSection pet={petData} />

              {/* Soul Made handled inside PersonalisedBreedSection */}

              {/* "Care & Nourish" label — mirrors "Eat & Nourish" in DineSoulPage */}
              <div style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>
                Care for <span style={{ color:G.sage }}>{petData.name}</span>
              </div>
              <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>
                8 dimensions, matched to {petData.name}'s coat and health
              </div>

              {/* Dimension grid — cards only (mirrors DineSoulPage pattern) */}
              <div style={{ display:"grid", gap:10, marginBottom:8 }} className="care-dims-grid">
                <style>{`
                  .care-dims-grid{grid-template-columns:repeat(2,1fr);}
                  @media(min-width:480px){.care-dims-grid{grid-template-columns:repeat(4,1fr);}}
                  @media(min-width:768px){.care-dims-grid{grid-template-columns:repeat(4,1fr);}}
                  @keyframes spin{to{transform:rotate(360deg)}}
                `}</style>
                {careDims.map(dim => {
                  const isOpen = openDim === dim.id;
                  return (
                    <div
                      key={dim.id}
                      onClick={() => {
                        if (dim.id === "soul_made") { setSoulMadeOpen(true); return; }
                        setOpenDim(isOpen ? null : dim.id);
                      }}
                      style={{
                        background: dim.glow ? G.cream : "#fff",
                        border: isOpen ? `2px solid ${G.sage}` : "2px solid transparent",
                        borderRadius: 12,
                        padding:"16px 12px", cursor:"pointer",
                        textAlign:"center", transition:"all 0.15s",
                        minHeight:154,
                        boxShadow: dim.glow && !isOpen ? `0 4px 20px ${dim.glowColor}` : "none",
                        position:"relative",
                        opacity: dim.glow ? 1 : 0.72,
                      }}
                      data-testid={`care-dim-${dim.id}`}
                    >
                      {dim.glow && !isOpen && (
                        <div style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:"50%", background:G.light, boxShadow:`0 0 6px ${G.light}` }} />
                      )}
                      <div style={{ fontSize:28, marginBottom:10 }}>{dim.icon}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:G.darkText, marginBottom:4 }}>{dim.label}</div>
                      <div style={{ fontSize:11, color:G.mutedText, marginBottom:8, lineHeight:1.3 }}>{t(dim.sub, petData.name)}</div>
                      {dim.badge && (
                        <div style={{ display:"inline-flex", alignItems:"center", background:dim.badgeBg, color:"#fff", borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700 }}>
                          {t(dim.badge, petData.name)}
                        </div>
                      )}
                      <span style={{ position:"absolute", bottom:8, right:10, fontSize:14, color:"rgba(0,0,0,0.25)", transition:"transform 0.2s", transform:isOpen?"rotate(90deg)":"none" }}>›</span>
                    </div>
                  );
                })}
              </div>

              {/* Expanded panel — OUTSIDE grid, full width (mirrors DineSoulPage) */}
              {activeDim && activeDim.id !== "soul_made" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr", marginBottom:8 }}>
                  <DimExpanded dim={activeDim} pet={petData} onClose={() => setOpenDim(null)} apiProducts={apiProducts} />
                </div>
              )}

              {/* Soul Made Modal */}
              {soulMadeOpen && (
                <SoulMadeModal
                  pet={petData}
                  pillar="care"
                  pillarColor={G.sage}
                  pillarLabel="Wellness"
                  onClose={() => setSoulMadeOpen(false)}
                />
              )}

              <div style={{ marginTop:32 }}>
                <GuidedCarePaths pet={flowPet} />
              </div>
              <CareConciergeSection pet={flowPet} />
            </>
          )}

          {activeTab === "services" && (
            <>
              <CareConcierge pet={flowPet} token={token} />
              <CareConciergeSection pet={flowPet} />
            </>
          )}

          {activeTab === "find-care" && (
            <CareNearMe pet={petData} token={token} onBook={handleNearMeBook} />
          )}

        </div>
      </div>
    <ConciergeToast toast={conciergeToast} onClose={() => setConciergeToast(null)} />
    </PillarPageLayout>
  );
}
