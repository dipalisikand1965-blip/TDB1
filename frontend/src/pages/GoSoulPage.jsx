/**
 * GoSoulPage.jsx — /go pillar (Travel + Stay merged)
 * The Doggy Company
 *
 * Architecture mirrors CareSoulPage.jsx exactly:
 *   - usePillarContext for real pet data
 *   - useAuth for token
 *   - PillarPageLayout wrapper
 *   - Helmet for SEO
 *   - Real API calls for products, soul questions, Mira picks
 *   - SharedProductCard + ProductDetailModal
 *   - applyMiraIntelligence (client-side)
 *   - LoadingState + NoPetState
 *   - 8 service booking flows (Flight, Road, Boarding, Sitting, Relocation, Taxi, Planning, Emergency)
 *
 * Colour world: Deep teal + travel gold
 *   /care = sage green  /dine = amber  /celebrate = purple  /go = teal
 *
 * WIRING:
 *   1. Route:   <Route path="/go" element={<GoSoulPage/>}/>
 *   2. Pet:     auto — usePillarContext
 *   3. Products: GET /api/admin/pillar-products?pillar=go&category=...
 *   4. Booking:  POST /api/concierge/go-booking
 *   5. Paths:    POST /api/concierge/go-path
 */

import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import GoHero from "../components/go/GoHero";
import GoCategoryStrip from "../components/go/GoCategoryStrip";
import GuidedGoPaths from "../components/go/GuidedGoPaths";
import GoConciergeSection from "../components/go/GoConciergeSection";
import PetFriendlyStays from "../components/go/PetFriendlyStays";
import ConciergeToast from "../components/common/ConciergeToast";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { bookViaConcierge } from "../utils/MiraCardActions";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import MiraImaginesBreed from "../components/common/MiraImaginesBreed";import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeCollection from "../components/SoulMadeCollection";
import { usePlatformTracking } from "../hooks/usePlatformTracking";

// ─────────────────────────────────────────────────────────────
// COLOUR SYSTEM — Deep Teal + Travel Gold
// ─────────────────────────────────────────────────────────────
const G = {
  deep:        "#0D3349",
  deepMid:     "#1A5276",
  teal:        "#1ABC9C",
  light:       "#76D7C4",
  pale:        "#D1F2EB",
  cream:       "#E8F8F5",
  gold:        "#C9973A",
  goldLight:   "#F0C060",
  pageBg:      "#F0F9FF",
  border:      "rgba(26,188,156,0.18)",
  borderLight: "rgba(26,188,156,0.10)",
  darkText:    "#0D3349",
  mutedText:   "#5D6D7E",
  hintText:    "#85929E",
  whiteDim:    "rgba(255,255,255,0.65)",
  tealBg:      "rgba(26,188,156,0.12)",
  tealBorder:  "rgba(26,188,156,0.30)",
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name || "your dog") : ""; }

const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|n\/a)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v && !CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.allergies);
  return [...s].filter(Boolean);
}

function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(", ") : String(raw);
  return str.toLowerCase() === "none" || str.trim() === "" ? null : str;
}

function getPetSize(pet) {
  return pet?.doggy_soul_answers?.size || pet?.size || null;
}

function getTravelAnxiety(pet) {
  const triggers = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
  const arr = Array.isArray(triggers) ? triggers : [triggers];
  return arr.some(t => t && (String(t).toLowerCase().includes("car") || String(t).toLowerCase().includes("travel")));
}

// ─────────────────────────────────────────────────────────────
// GO DIMENSION CONFIG — dynamic per pet
// ─────────────────────────────────────────────────────────────
function getGoDims(pet) {
  const size      = getPetSize(pet);
  const condition = getHealthCondition(pet);
  const anxious   = getTravelAnxiety(pet);
  const breed     = pet?.breed || pet?.doggy_soul_answers?.breed || null;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  return [
    {
      id: "safety", icon: "🛡️", label: "Safety & Security",
      sub: size ? `${cap(size)} dog · GPS, harness, ID tags` : "GPS, harness & crash-tested gear",
      badge: "Essential", badgeBg: G.deepMid, glowColor: "rgba(26,188,156,0.25)", glow: true,
      mira: size
        ? `Everything here is sized for a ${size.toLowerCase()} dog like {name}. I've prioritised the crash-tested harness and GPS tracker.`
        : `These are the safety essentials I'd insist on for every trip with {name}.`,
    },
    {
      id: "calming", icon: "😌", label: "Calming & Comfort",
      sub: anxious ? `{name} has travel anxiety — calming essentials` : "Anxiety relief for a calm journey",
      badge: anxious ? "High priority" : "Comfort",
      badgeBg: anxious ? "#AD1457" : "#00695C",
      glowColor: "rgba(0,105,92,0.22)", glow: anxious,
      mira: anxious
        ? `{name} has travel anxiety — I've put the most effective calming options first. The spray + chew combination works best.`
        : `These calming products help {name} stay relaxed during car, train, or air travel.`,
    },
    {
      id: "carriers", icon: "🎒", label: "Carriers & Crates",
      sub: size ? `IATA-approved, sized for ${size.toLowerCase()} dogs` : "Cabin-ready, IATA-approved",
      badge: size ? `${cap(size)} dog` : "IATA approved",
      badgeBg: G.teal, glowColor: "rgba(26,188,156,0.22)", glow: true,
      mira: size
        ? `I've filtered to carriers sized for ${size.toLowerCase()} dogs. Everything here is IATA-compliant for cabin or cargo.`
        : `These carriers are IATA-approved and accepted on most domestic and international flights.`,
    },
    {
      id: "feeding", icon: "🥣", label: "Feeding & Hydration",
      sub: "Collapsible bowls, water bottles, food containers",
      badge: "Travel essential", badgeBg: G.gold, glowColor: "rgba(201,151,58,0.22)", glow: true,
      mira: `Hydration is critical on long journeys. These are the feeding and water essentials I'd pack for {name}.`,
    },
    {
      id: "health", icon: "💊", label: "Health & Documents",
      sub: condition ? `First aid + ${condition} safe` : "First aid, vet records & motion sickness",
      badge: condition ? "Health priority" : "Be prepared",
      badgeBg: condition ? "#AD1457" : "#1565C0",
      glowColor: "rgba(21,101,192,0.18)", glow: !!condition,
      mira: condition
        ? `I've made sure everything here is safe for {name}'s ${condition}. The travel first aid kit is non-negotiable.`
        : `Travel health essentials — first aid, motion sickness, and document organiser for {name}'s records.`,
    },
    {
      id: "stay", icon: "🏡", label: "Stay & Board",
      sub: "Boarding, daycare, pet sitting & hotel discovery",
      badge: "Explore", badgeBg: "rgba(0,0,0,0.07)", glowColor: "rgba(0,0,0,0.05)", glow: false,
      mira: `When you travel, {name} needs the right stay. I can find boarding, arrange a sitter at home, or discover pet-friendly hotels.`,
    },
  ];
}

const DIM_ID_TO_KEYWORDS = {
  safety:   ["safety"],
  calming:  ["calm"],
  carriers: ["carrier"],
  feeding:  ["feed"],
  health:   ["health"],
  stay:     ["boarding", "stay"],
};

// ─────────────────────────────────────────────────────────────
// MIRA INTELLIGENCE — mirrors CareSoulPage exactly
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

function applyMiraIntelligence(products, allergies, size, condition, pet) {
  const petName = pet?.name || "your dog";
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const sizeLower = (size || "").toLowerCase();
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
      const sizeMatch  = sizeLower && (text.includes(sizeLower) || tag.includes("size match"));
      const healthSafe = condition && (tag.includes("treatment") || free.includes("treatment-safe"));
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (sizeMatch)    mira_hint = `Sized for ${petName}'s ${size} build`;
        else if (healthSafe) mira_hint = `Safe for ${petName}'s ${condition}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _sizeMatch: !!sizeMatch, _healthSafe: !!healthSafe };
    })
    .sort((a, b) => {
      if (a._sizeMatch && !b._sizeMatch) return -1;
      if (!a._sizeMatch && b._sizeMatch) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      if (!a._healthSafe && b._healthSafe) return 1;
      return 0;
    });
}

// ─────────────────────────────────────────────────────────────
// MIRA IMAGINES CARD — mirrors CareSoulPage MiraImagineCard
// ─────────────────────────────────────────────────────────────
function MiraImagineCard({ card, pet, token }) {
  const [sending,   setSending]   = useState(false);
  const [requested, setRequested] = useState(false);
  const [imgUrl,    setImgUrl]    = useState(null);
  const breedKey = (pet?.breed||"indie").toLowerCase().replace(/\s+/g,"_").replace(/-/g,"_").replace(/\s*\(.*\)/,"");

  useEffect(() => {
    fetch(`${API_URL}/api/ai-images/pipeline/mira-imagines/go/${breedKey}`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d?.url) setImgUrl(d.url); }).catch(()=>{});
  }, [breedKey]);

  const handleRequest = async () => {
    setSending(true);
    let user = {};
    try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}
    try {
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: user?.id || user?.email || "go_guest",
          pet_id: pet?.id || "unknown",
          pillar: "go",
          intent_primary: "mira_imagines_product",
          intent_secondary: [card.name, "custom_go_product"],
          life_state: "go",
          channel: "go_mira_imagines",
          initial_message: { sender: "parent", source: "go_page", text: `Hi! I'd love to get "${card.name}" for ${pet?.name}. ${card.reason}. Can you arrange this?` },
        }),
      });
    } catch (err) { console.error("[MiraImagineCard]", err); }
    setSending(false);
    setRequested(true);
  };

  return (
    <div style={{ borderRadius:16, overflow:"hidden", position:"relative", background:card.bg||`linear-gradient(135deg,${G.deep},${G.deepMid})`, border:`1px solid ${G.tealBorder}`, display:"flex", flexDirection:"column" }}>
      <div style={{ position:"absolute", top:12, left:12, zIndex:2, borderRadius:20, padding:"4px 12px", fontSize:10, fontWeight:700, background:`linear-gradient(135deg,${G.teal},${G.light})`, color:G.deep }}>
        Mira Imagines
      </div>
      <div style={{ height:150, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, paddingTop:28, overflow:"hidden", position:"relative" }}>
        {imgUrl
          ? <img src={imgUrl} alt={card.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1}} onError={()=>setImgUrl(null)}/>
          : <span style={{zIndex:2}}>{card.emoji}</span>}
        {imgUrl && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.25)",zIndex:1}}/>}
      </div>
      <div style={{ padding:"12px 16px 16px", textAlign:"center", flex:1, display:"flex", flexDirection:"column" }}>
        <p style={{ fontWeight:700, color:"#fff", fontSize:14, marginBottom:6, lineHeight:1.3 }}>{card.name}</p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.60)", marginBottom:6, lineHeight:1.5, flex:1 }}>{card.desc}</p>
        <p style={{ fontSize:11, fontWeight:600, color:G.light, fontStyle:"italic", marginBottom:12 }}>{card.reason}</p>
        {requested
          ? <div style={{ borderRadius:10, padding:8, fontSize:11, fontWeight:700, background:`rgba(26,188,156,0.20)`, border:`1px solid ${G.light}40`, color:G.light, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Check size={13} /> Sent to Concierge!
            </div>
          : <button onClick={handleRequest} disabled={sending} style={{ width:"100%", borderRadius:10, padding:8, fontSize:11, fontWeight:700, background:sending?`${G.teal}60`:`linear-gradient(135deg,${G.teal},${G.deepMid})`, border:"none", color:"#fff", cursor:sending?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, opacity:sending?0.7:1 }}>
              {sending && <Loader2 size={11} style={{ animation:"spin 1s linear infinite" }} />}
              Request a Quote →
            </button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MIRA'S PICKS — mirrors CareSoulPage MiraPicksSection
// ─────────────────────────────────────────────────────────────
function resolvePickImage(pick) {
  const candidates = [pick.image_url, pick.image, pick.media?.primary_image, ...(pick.images || [])];
  return candidates.find(url => url && url.startsWith("http")) || null;
}

function MiraPicksSection({ pet }) {
  const [picks, setPicks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPick, setSelectedPick] = useState(null);
  const [conciergeService, setConciergeService] = useState(null);
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeSent, setConciergeSent]       = useState(false);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const intelligenceLine = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);

  // Generate Mira Imagines from pet profile
  const miraImagines = (() => {
    const size    = getPetSize(pet);
    const anxious = getTravelAnxiety(pet);
    const breed   = pet?.breed || pet?.doggy_soul_answers?.breed || null;
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    const cards = [];
    if (size) cards.push({ emoji:"🎒", bg:`linear-gradient(135deg,${G.deep},#0a2a3a)`, name:`${cap(size)} Breed Flight Kit`, desc:`Everything ${petName} needs for cabin or cargo travel — sized for ${size.toLowerCase()} dogs`, reason:`Because ${petName} is a ${size.toLowerCase()} dog` });
    if (anxious) cards.push({ emoji:"😌", bg:`linear-gradient(135deg,#0a2a18,${G.deepMid})`, name:"Anxious Traveller Pack", desc:`Complete calming system for ${petName} — spray, chews, compression wrap + Mira's pre-travel protocol`, reason:`Because ${petName} has travel anxiety` });
    if (breed) cards.push({ emoji:"✈️", bg:`linear-gradient(135deg,${G.deep},#1a3a5c)`, name:`${breed} Travel Bundle`, desc:`Personalised travel kit for ${breed}s — carrier, safety harness, and calming treats sized and matched`, reason:`Mira knows ${breed}s have specific travel needs` });
    cards.push({ emoji:"🗺️", bg:`linear-gradient(135deg,#0a1a2a,#0d3349)`, name:"Complete Travel Co-ordination", desc:`Mira handles everything — flights, boarding, documentation, and a vet-checked kit for ${petName}`, reason:`Because travel with a dog deserves a Concierge` });
    return cards.slice(0, 4);
  })();

  const handleServiceConcierge = async service => {
    setConciergeSending(true);
    // Fire tdc.book immediately
    tdc.book({ service: service.name || service.entity_name, pillar: "go", pet, channel: "go_miras_picks", amount: service.price });
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ parent_id: storedUser?.id || storedUser?.email || "guest", pet_id: pet?.id || "unknown", pillar: "go", intent_primary: "service_request", intent_secondary: [service.name || service.entity_name], life_state: "go", channel: "miras_picks", initial_message: { sender: "parent", source: "go_miras_picks", text: `I'd like "${service.name || service.entity_name}" for ${petName}. Mira scored it ${service.mira_score || "?"}/100.` } }),
      });
    } catch {}
    setConciergeSending(false);
    setConciergeSent(true);
    setTimeout(() => { setConciergeSent(false); setConciergeService(null); }, 2000);
  };

  useEffect(() => {
    if (!pet?.id) { setLoading(false); return; }
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=go&limit=12&min_score=60&entity_type=product${pet?.breed?`&breed=${encodeURIComponent(pet.breed)}`:"" }`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=go&limit=6&min_score=60&entity_type=service`).then(r => r.ok ? r.json() : null),
    ])
      .then(([pData, sData]) => {
        // Keep all products for go pillar — travel items are NOT breed-specific
        const prods = pData?.picks || [];
        const svcs  = sData?.picks || [];
        const merged = [];
        let pi = 0, si = 0;
        while (pi < prods.length || si < svcs.length) {
          if (pi < prods.length) merged.push(prods[pi++]);
          if (pi < prods.length) merged.push(prods[pi++]);
          if (si < svcs.length)  merged.push(svcs[si++]);
        }
        setPicks(merged.slice(0, 16)); // always set (empty → imagines show)
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pet?.id]);

  const showImagines = !loading && picks.length === 0;

  return (
    <section style={{ marginBottom: 32 }} data-testid="go-mira-picks-section">
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
          Mira's Go Picks for <span style={{ color:G.teal }}>{petName}</span>
        </h3>
        <span style={{ fontSize:11, background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>AI Scored</span>
      </div>
      <p style={{ fontSize:12, color:"#888", marginBottom:16, lineHeight:1.5 }}>
        Products &amp; services matched by Mira to {petName}'s travel profile.
      </p>

      {loading ? (
        /* Loading skeleton — prevents blank gap while AI picks load */
        <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:10 }}>
          <style>{`@keyframes go-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flexShrink:0, width:168, background:"#fff", borderRadius:14, border:`1.5px solid ${G.borderLight}`, overflow:"hidden" }}>
              <div style={{ height:130, background:`linear-gradient(90deg,${G.cream} 25%,${G.pale} 50%,${G.cream} 75%)`, backgroundSize:"200% 100%", animation:"go-shimmer 1.5s infinite" }} />
              <div style={{ padding:"10px 11px 12px" }}>
                <div style={{ height:12, background:G.cream, borderRadius:6, marginBottom:8, width:"80%" }} />
                <div style={{ height:8, background:G.cream, borderRadius:6, marginBottom:6, width:"60%" }} />
                <div style={{ height:8, background:G.pale, borderRadius:6, width:"40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : showImagines ? (
        <MiraImaginesBreed pet={pet} pillar="go" colour={G.teal} onConcierge={()=>{}}/>
      ) : (
        <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:10, scrollbarWidth:"thin" }} className="go-picks-scroll">
          <style>{`.go-picks-scroll::-webkit-scrollbar{height:4px}.go-picks-scroll::-webkit-scrollbar-thumb{background:${G.teal}50;border-radius:4px}`}</style>
          {picks.map((pick, i) => {
            const isService = pick.entity_type === "service";
            const img = resolvePickImage(pick);
            const score = pick.mira_score || 0;
            const scoreColor = score >= 80 ? "#16A34A" : score >= 70 ? G.teal : "#6B7280";
            return (
              <div key={pick.id || i}
                style={{ flexShrink:0, width:168, background:"#fff", borderRadius:14, border:`1.5px solid ${G.borderLight}`, overflow:"hidden", cursor:"pointer", transition:"transform 0.15s" }}
                onClick={() => isService ? setConciergeService(pick) : setSelectedPick(pick)}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform=""; }}
                data-testid={`go-pick-card-${i}`}>
                <div style={{ width:"100%", height:130, background:G.cream, overflow:"hidden", position:"relative" }}>
                  {img
                    ? <img src={img} alt={pick.name || ""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:isService?`linear-gradient(135deg,${G.deep},${G.deepMid})`:`linear-gradient(135deg,${G.deepMid},${G.teal})`, color:"#fff", fontSize:12, fontWeight:700, padding:8, textAlign:"center" }}>
                        {(pick.name || pick.entity_name || "").slice(0,18)}
                      </div>}
                  <span style={{ position:"absolute", top:7, left:7, fontSize:9, fontWeight:700, background:isService?G.deepMid:G.teal, color:"#fff", borderRadius:20, padding:"2px 7px" }}>
                    {isService?"SERVICE":"PRODUCT"}
                  </span>
                </div>
                <div style={{ padding:"10px 11px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:G.darkText, lineHeight:1.3, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {pick.name || pick.entity_name || "—"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                    <div style={{ flex:1, height:4, background:G.pale, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:4 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:800, color:scoreColor, minWidth:26 }}>{score}</span>
                  </div>
                  {pick.mira_reason && <p style={{ fontSize:10, color:"#888", lineHeight:1.4, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontStyle:"italic" }}>{pick.mira_reason}</p>}
                  <p style={{ fontSize:9, color:isService?G.deepMid:G.teal, fontWeight:700, margin:"6px 0 0" }}>
                    {isService?"Tap → Book via Concierge":"Tap → View & Add"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPick && <ProductDetailModal product={selectedPick} pillar="go" selectedPet={pet} onClose={() => setSelectedPick(null)} />}

      {conciergeService && (
        <div onClick={() => !conciergeSending && setConciergeService(null)} style={{ position:"fixed", inset:0, zIndex:10003, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"min(420px,100%)", borderRadius:20, background:"#fff", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", overflow:"hidden" }}>
            <div style={{ background:`linear-gradient(135deg,${G.deep},${G.deepMid})`, padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, background:G.teal, color:G.deep, borderRadius:20, padding:"3px 10px" }}>SERVICE · Mira Scored {conciergeService.mira_score || "—"}</span>
                <button onClick={() => setConciergeService(null)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:20, width:28, height:28, cursor:"pointer", color:"rgba(255,255,255,0.7)", fontSize:16 }}>✕</button>
              </div>
              <p style={{ fontWeight:800, color:"#fff", fontSize:16, margin:"0 0 6px" }}>{conciergeService.name || conciergeService.entity_name}</p>
              {conciergeService.mira_reason && <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12, margin:0, fontStyle:"italic" }}>{conciergeService.mira_reason}</p>}
            </div>
            <div style={{ padding:"20px 24px" }}>
              <p style={{ fontSize:13, color:"#555", marginBottom:16 }}>Our concierge team will reach out within 48 hours for <strong>{petName}</strong>.</p>
              {conciergeSent
                ? <div style={{ textAlign:"center", padding:12, borderRadius:12, background:`rgba(26,188,156,0.08)`, border:`1px solid rgba(26,188,156,0.3)` }}><Check size={20} style={{ color:G.teal, margin:"0 auto 6px" }} /><p style={{ fontWeight:700, color:G.teal, margin:0 }}>Sent to Concierge!</p></div>
                : <button onClick={() => handleServiceConcierge(conciergeService)} disabled={conciergeSending} style={{ width:"100%", background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:"#fff", border:"none", borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:conciergeSending?"wait":"pointer" }}>
                    {conciergeSending?"Sending…":`Book this for ${petName} →`}
                  </button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BREED TRAVEL TIPS — lookup table (mirrors Care's BREED_CARE_INSIGHTS)
// ─────────────────────────────────────────────────────────────
const GO_BREED_TRAVEL_TIPS = {
  default: {
    tagline: "adaptable traveller · standard travel kit",
    journey_desc: "Most dogs adjust well to travel with proper preparation and the right kit.",
    tips: [
      "Use a crash-tested harness for car travel — never let them roam free",
      "Offer water every 2 hours; avoid food 2h before a long journey",
      "Bring a familiar blanket or toy for comfort in new environments",
      "Stop every 2–3 hours on road trips for a short walk and toilet break",
    ],
    watch_for: "Signs of motion sickness: drooling, yawning, lethargy — start with short trips to condition",
    docs: "Carry vaccination certificate, health cert, and vet contact on every trip",
  },
  indie: {
    tagline: "hardy street dog · natural traveller · heat-aware",
    journey_desc: "Indies are adaptable and resilient, but their short coat means heat management is essential on long journeys.",
    tips: [
      "Short coat — manage heat: use a cooling mat on long car journeys, park in shade",
      "Natural foragers — keep snacks in the carrier to reduce anxiety in new places",
      "Highly alert and curious — a well-ventilated carrier helps them feel secure",
      "Acclimatise to the carrier at home first — Indies bond strongly to familiar spaces",
    ],
    watch_for: "Heat stroke risk in confined spaces or long boot journeys — windows cracked, not AC blasting",
    docs: "Vaccination certificate + microchip ID essential — Indies may be mistaken for strays at checkpoints",
  },
  'golden retriever': {
    tagline: "eager traveller · loves new experiences · heat-sensitive",
    journey_desc: "Goldens love adventure but their thick double coat makes them heat-sensitive. Plan rest stops wisely.",
    tips: [
      "Thick double coat — pre-cool the car before loading; avoid travel in peak afternoon heat",
      "Very social — they do well in boarding if introduced gradually",
      "Prone to motion sickness as puppies; condition with short trips first",
      "Bring their own food for stays — diet changes cause digestive upset",
    ],
    watch_for: "Overheating and panting excessively — ensure plenty of cool water and air circulation",
    docs: "Health certificate for air travel + vaccination records at all times",
  },
  labrador: {
    tagline: "enthusiastic traveller · pack dog · water-prone",
    journey_desc: "Labs love to travel and adapt quickly. Their enthusiasm means they need good containment in vehicles.",
    tips: [
      "Use a crash-tested harness or crate — Labs move around a lot and can distract the driver",
      "Very food-motivated — keep treats accessible to reward calm behaviour during travel",
      "Love water — pack a portable water bottle; they'll drink more than you expect",
      "Boarding is usually easy — Labs are sociable and friendly with other dogs",
    ],
    watch_for: "Overeating before travel — Labs are prone to bloat; no food 2h before departure",
    docs: "Standard vaccination records + microchip certificate",
  },
  beagle: {
    tagline: "nose-led explorer · can be anxious · ear care critical",
    journey_desc: "Beagles are curious and love exploring, but their nose-led behaviour means they need secure carriers.",
    tips: [
      "Secure carrier or boot barrier — Beagles will follow their nose and bolt if a door opens",
      "Prone to separation anxiety — bring their favourite toy or worn clothing for comfort",
      "Floppy ears trap moisture — clean ears before and after travel, especially in humid climates",
      "Frequent toilet stops — Beagles have high sniff instinct and do better with short walks en route",
    ],
    watch_for: "Howling and barking when anxious — calming spray 15 min before journey helps significantly",
    docs: "Vaccination and microchip records — Beagles are a commonly stolen breed",
  },
  'shih tzu': {
    tagline: "brachycephalic · cabin-only travel · temperature-sensitive",
    journey_desc: "Shih Tzus cannot be checked as cargo due to breathing risks. Cabin-only, temperature-controlled travel is essential.",
    tips: [
      "CABIN ONLY — never check Shih Tzus as cargo; flat faces cause breathing difficulty at altitude",
      "Temperature-sensitive — avoid direct AC blasting; keep ambient temperature moderate",
      "Short walks only at rest stops — overexertion in heat causes breathing distress",
      "Well-padded carrier — they love comfort and familiar smells; line with a worn T-shirt",
    ],
    watch_for: "Brachycephalic breathing distress: snoring, laboured breathing, blue-tinged gums — vet immediately",
    docs: "Vet health certificate confirming fitness to fly — required by all airlines for brachycephalic breeds",
  },
  pug: {
    tagline: "brachycephalic · comfort-first travel · heat danger",
    journey_desc: "Pugs are heat-sensitive and prone to breathing difficulties. Every travel decision must prioritise airflow and cool temperatures.",
    tips: [
      "Keep car fully air-conditioned; NEVER leave in a parked car even for minutes",
      "Cabin-only air travel — cargo hold temperatures can be fatal for brachycephalic breeds",
      "Short-distance trips preferred — build up tolerance gradually with short drives first",
      "Wipe facial folds after travel — sweat and debris accumulate and cause infections",
    ],
    watch_for: "CRITICAL: heat stroke and respiratory distress — carry a cooling towel and wet cloth on all trips",
    docs: "Vet fitness-to-travel certificate required for flights; brachycephalic breed documentation",
  },
  'german shepherd': {
    tagline: "natural traveller · needs structure · large-crate required",
    journey_desc: "GSDs travel well when given clear structure. Their size and intelligence mean they need the right containment and mental stimulation.",
    tips: [
      "Large IATA crate required for cargo — ensure at least 2 crate sessions at home before travel",
      "Give a long walk before travel to reduce energy and anxiety in confined spaces",
      "GSDs bond deeply — they may be anxious in boarding; pack familiar bedding",
      "Check hips before long car trips — dysplasia risk means ergonomic seating matters",
    ],
    watch_for: "Bloat risk after eating near travel time — no food 3h before departure",
    docs: "Vaccination, health cert, and proof of rabies vaccine — some regions require for large breeds",
  },
  husky: {
    tagline: "high energy · adventure ready · never leave in warm car",
    journey_desc: "Huskies are natural explorers but their thick double coat makes them temperature-sensitive, especially in warm climates.",
    tips: [
      "NEVER in a hot car — thick double coat means they overheat rapidly; always use AC",
      "High energy pre-travel — a vigorous 45-min run before departure makes car travel calmer",
      "Huskies howl and vocalise — bring headphones for other passengers on long trips",
      "Strong prey drive — always on leash at rest stops; they can bolt in a second",
    ],
    watch_for: "Overheating despite cool environment — Huskies hide discomfort; watch for excessive panting",
    docs: "Vaccination and health certificates; breed documentation for international travel",
  },
  poodle: {
    tagline: "intelligent traveller · low-shedding · adaptable",
    journey_desc: "Poodles are among the best travel companions — intelligent, adaptable, and low-shedding.",
    tips: [
      "Train carrier acceptance early — Poodles learn fast and carrier comfort becomes second nature",
      "They read owner anxiety — stay calm during travel; they'll mirror your mood",
      "Groom before boarding stays — matted coats at boarding facilities get stressed",
      "Highly social — boarding with other dogs is generally very positive for Poodles",
    ],
    watch_for: "Ear infections from moisture in humid travel environments — dry ears after any water contact",
    docs: "Standard vaccination and health certificates; toy Poodles fit cabin size requirements easily",
  },
  dachshund: {
    tagline: "back-care essential · short trips preferred · ramp not stairs",
    journey_desc: "Dachshund spines are fragile — every travel decision must eliminate jumping and rough handling.",
    tips: [
      "USE A RAMP — never allow jumping in/out of car; spine injuries are the #1 health risk for Dachshunds",
      "Support the back when carrying to and from the carrier — always support the hindquarters",
      "Short, frequent trips recommended — long journeys in awkward positions increase spinal strain",
      "Boarding: inform the facility about no-stairs policy and low-level sleeping arrangements",
    ],
    watch_for: "Back pain, dragging hind legs — immediate vet attention; IVDD is a veterinary emergency",
    docs: "Health certificate with any known IVDD history noted — some vets require a spine clearance for air travel",
  },
  'cocker spaniel': {
    tagline: "gentle traveller · ear care critical · emotionally sensitive",
    journey_desc: "Cocker Spaniels travel well but need extra ear care in transit and emotionally thrive with familiar comforts.",
    tips: [
      "Clean and dry ears the day before travel — long ear canals trap moisture during journeys",
      "Emotionally sensitive — keep voice calm and use familiar blanket in carrier or boarding",
      "Medium-sized, adaptable — fit in cabin-approved carriers for short-haul flights",
      "Give gentle exercise before travel — they're energetic and calmer after a good walk",
    ],
    watch_for: "Ear infections and eye discharge after long journeys — inspect and clean on arrival",
    docs: "Standard vaccination records; ear health certificate useful for international travel",
  },
  rottweiler: {
    tagline: "confident traveller · large crate needed · socialisation matters",
    journey_desc: "Rottweilers are naturally confident but their size and breed-specific restrictions require extra planning for air travel.",
    tips: [
      "Extra-large IATA crate required — ensure crate is well-ventilated and familiar before travel",
      "Some airlines/countries have breed-specific restrictions — verify well in advance",
      "Keep calm and assertive during travel — Rotties mirror owner confidence",
      "Pre-book boarding carefully — some facilities have breed restrictions; call ahead",
    ],
    watch_for: "Bloat and overheating in warm conditions — large deep-chested breeds are high-risk",
    docs: "Vaccination, health cert, microchip, and breed-specific clearance letters for airlines/countries",
  },
};

function getGoBreedInsight(pet) {
  const breedRaw = (pet?.breed || '').trim().toLowerCase();
  return GO_BREED_TRAVEL_TIPS[breedRaw] || GO_BREED_TRAVEL_TIPS['default'];
}

// ─────────────────────────────────────────────────────────────
// BREED TRAVEL INSIGHTS — always-visible section in TripProfile drawer
// ─────────────────────────────────────────────────────────────
function GoBreedTravelInsights({ pet }) {
  const insight = getGoBreedInsight(pet);
  const breed   = pet?.breed || "Your Dog";
  const icons   = ["🎒", "💧", "🏡", "✈️"];

  return (
    <div style={{ marginBottom:22, borderRadius:16, overflow:"hidden", border:"1.5px solid rgba(26,188,156,0.30)" }}>
      {/* Dark teal header */}
      <div style={{ background:"linear-gradient(135deg,#081a26,#0D3349)", padding:"14px 18px 12px" }}>
        <p style={{ margin:0, fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.10em", color:"#76D7C4" }}>
          Travel Tips · {breed}
        </p>
        <p style={{ margin:"4px 0 0", fontSize:11, color:"rgba(255,255,255,0.55)" }}>{insight.journey_desc}</p>
      </div>
      {/* Tips grid */}
      <div style={{ background:"#E8F8F5", padding:"14px 18px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
          {insight.tips.map((tip, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", borderRadius:10, background:"#fff", border:"1px solid rgba(26,188,156,0.20)" }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{icons[i] || "✦"}</span>
              <p style={{ margin:0, fontSize:11, color:"#0D3349", lineHeight:1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {insight.watch_for && (
            <div style={{ flex:1, padding:"8px 12px", borderRadius:10, background:"#FFF3E0", border:"1px solid #FFCC80" }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#E65100", marginBottom:3 }}>Watch for</p>
              <p style={{ margin:0, fontSize:10, color:"#BF360C", lineHeight:1.4 }}>{insight.watch_for}</p>
            </div>
          )}
          {insight.docs && (
            <div style={{ flex:1, padding:"8px 12px", borderRadius:10, background:"#E3F2FD", border:"1px solid #90CAF9" }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#1565C0", marginBottom:3 }}>Documents</p>
              <p style={{ margin:0, fontSize:10, color:"#0D47A1", lineHeight:1.4 }}>{insight.docs}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRIP PROFILE — compact bar + soul questions modal
// Mirrors WellnessProfile in CareSoulPage exactly
// ─────────────────────────────────────────────────────────────
function TripProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore]   = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [qLoading, setQLoading]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted]   = useState({});
  const [qPts, setQPts]             = useState({});
  const [totalPts, setTotalPts]     = useState(0);

  const allergies = getAllergies(pet);
  const size      = getPetSize(pet);
  const anxious   = getTravelAnxiety(pet);
  const condition = getHealthCondition(pet);
  const petName   = pet?.name || "your dog";

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=go`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) setLiveScore(data.current_score);
        }
      })
      .catch(err => { if (err.name !== "AbortError") console.error("[TripProfile]", err); })
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
        if (data.scores?.overall !== undefined) {
          setLiveScore(data.scores.overall);
          window.dispatchEvent(new CustomEvent("soulScoreUpdated", { detail: { petId: pet.id, score: data.scores.overall } }));
        }
        setTimeout(() => loadQuestions(), 800);
      }
    } catch (err) { console.error("[TripProfile submit]", err); }
    finally { setSubmitting(p => ({ ...p, [q.question_id]: false })); }
  };

  const visibleQ = questions.filter(q => !submitted[q.question_id]);

  return (
    <>
      {/* Compact bar */}
      <div onClick={() => setDrawerOpen(true)} data-testid="trip-profile"
        style={{ background:"#fff", border:`2px solid ${G.pale}`, borderRadius:16, padding:"14px 18px", marginBottom:20, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, fontSize:20, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center" }}>✈️</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petName}'s Trip Profile</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
            {pet?.breed && <span style={{ fontSize:10, fontWeight:600, color:G.deepMid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>🐕 {pet.breed}</span>}
            {size && <span style={{ fontSize:10, fontWeight:600, color:G.deepMid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>🐾 {size}</span>}
            {(pet?.city || pet?.doggy_soul_answers?.city) && <span style={{ fontSize:10, fontWeight:600, color:G.deepMid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>📍 {pet?.city || pet?.doggy_soul_answers?.city}</span>}
            {anxious && <span style={{ fontSize:10, fontWeight:600, color:"#AD1457", background:"#FCE4EC", border:"1px solid #F48FB1", borderRadius:20, padding:"2px 8px" }}>✗ Travel anxiety</span>}
            {condition && <span style={{ fontSize:10, fontWeight:600, color:"#AD1457", background:"#FCE4EC", border:"1px solid #F48FB1", borderRadius:20, padding:"2px 8px" }}>⚕ {condition}</span>}
            {allergies.map(a => <span key={a} style={{ fontSize:10, fontWeight:600, color:"#C62828", background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:20, padding:"2px 8px" }}>✗ {a}</span>)}
            {!pet?.breed && !size && !(pet?.city || pet?.doggy_soul_answers?.city) && !anxious && allergies.length === 0 && <span style={{ fontSize:10, color:"#999" }}>Tap to build {petName}'s travel profile — Mira personalises everything</span>}
          </div>
        </div>
        <span style={{ fontSize:11, color:G.teal, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>Mira's picks →</span>
      </div>

      {/* Modal — mirrors WellnessProfile modal */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position:"fixed", inset:0, zIndex:10002, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} data-testid="trip-drawer"
            style={{ width:"min(780px,100%)", maxHeight:"90vh", overflowY:"auto", borderRadius:24, background:"#fff", boxShadow:"0 24px 80px rgba(0,0,0,0.55)", display:"flex", flexDirection:"column" }}>

            {/* Dark teal header */}
            <div style={{ borderRadius:"24px 24px 0 0", padding:"24px 28px 20px", background:`linear-gradient(135deg,#081a26 0%,${G.deep} 60%,${G.deepMid} 100%)`, flexShrink:0, position:"sticky", top:0, zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <p style={{ fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:`${G.light}E6`, fontSize:10, marginBottom:5 }}>
                    ✦ GROW {petName.toUpperCase()}'S TRIP PROFILE
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.50)", fontSize:12 }}>Answer quick questions · Mira tailors every recommendation to {petName}</p>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:2 }}>
                  <span style={{ fontSize:72, fontWeight:900, lineHeight:1, color:liveScore>=80?G.pale:G.light }}>{liveScore??"—"}</span>
                  <span style={{ color:"rgba(255,255,255,0.40)", fontSize:18, marginBottom:8 }}>%</span>
                </div>
              </div>
              <div style={{ height:5, borderRadius:5, background:"rgba(255,255,255,0.10)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${liveScore||0}%`, borderRadius:5, background:`linear-gradient(90deg,${G.teal},${G.light})`, transition:"width 0.9s ease-out" }} />
              </div>
              <button onClick={() => setDrawerOpen(false)} data-testid="trip-drawer-close"
                style={{ position:"absolute", top:16, right:20, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer", color:"rgba(255,255,255,0.70)" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:"24px 28px", background:"#fff" }}>
              {totalPts > 0 && (
                <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, background:G.tealBg, border:`1px solid ${G.tealBorder}` }}>
                  <Check size={14} style={{ color:G.teal, flexShrink:0 }} />
                  <p style={{ fontSize:13, fontWeight:600, color:G.teal }}>+{totalPts} pts added · Mira is learning {petName}'s travel preferences</p>
                </div>
              )}

              {/* ── BREED TRAVEL INSIGHTS — always visible ── */}
              <GoBreedTravelInsights pet={pet} />

              {qLoading ? (
                <div style={{ textAlign:"center", padding:"32px 0", color:"#888", fontSize:13 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
                  Loading {petName}'s questions…
                </div>
              ) : visibleQ.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>✈️</div>
                  <p style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>{petName}'s trip profile is complete!</p>
                  <p style={{ fontSize:12, color:"#888" }}>Mira has everything she needs to plan the perfect trip</p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
                  {visibleQ.map(q => {
                    const isSub  = submitted[q.question_id];
                    const isSend = submitting[q.question_id];
                    const ans    = answers[q.question_id];
                    const hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : true);
                    if (isSub) return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:140, background:`linear-gradient(135deg,#081a26,${G.deep})`, border:`2px solid ${G.light}70` }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:G.tealBg, border:`2px solid ${G.light}80`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Check size={20} style={{ color:G.light }} />
                        </div>
                        <p style={{ fontWeight:800, color:G.light, fontSize:14, textAlign:"center" }}>Soul score growing!</p>
                        <div style={{ borderRadius:20, padding:"4px 12px", fontWeight:700, fontSize:11, background:G.tealBg, color:G.light, border:`1px solid ${G.light}50` }}>+{qPts[q.question_id]||3} pts</div>
                      </div>
                    );
                    return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:14, background:`linear-gradient(135deg,#081a26,${G.deep})`, border:`1.5px solid ${G.tealBorder}`, minHeight:140 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12 }}>{q.folder_icon||"✦"}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:`${G.light}DD` }}>{q.folder_name}</span>
                          </div>
                          <span style={{ borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, background:G.tealBg, color:G.light, border:`1px solid ${G.tealBorder}` }}>+{q.weight||3} pts</span>
                        </div>
                        <p style={{ fontWeight:700, fontSize:12, color:"rgba(255,255,255,0.92)", marginBottom:10, lineHeight:1.4 }}>{q.question}</p>
                        {q.type === "select" && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).map(opt => (
                              <button key={opt} onClick={() => handleAnswer(q.question_id, opt, "select")} style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, background:ans===opt?"rgba(26,188,156,0.25)":"rgba(255,255,255,0.07)", border:ans===opt?`1.5px solid ${G.teal}`:"1px solid rgba(255,255,255,0.15)", color:ans===opt?G.pale:"rgba(255,255,255,0.72)", cursor:"pointer" }}>{opt}</button>
                            ))}
                          </div>
                        )}
                        {q.type === "multi_select" && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).slice(0,6).map(opt => {
                              const selArr = ans || [];
                              return <button key={opt} onClick={() => handleAnswer(q.question_id, opt, "multi_select")} style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, background:selArr.includes(opt)?"rgba(26,188,156,0.25)":"rgba(255,255,255,0.07)", border:selArr.includes(opt)?`1.5px solid ${G.teal}`:"1px solid rgba(255,255,255,0.15)", color:selArr.includes(opt)?G.pale:"rgba(255,255,255,0.72)", cursor:"pointer" }}>{opt}</button>;
                            })}
                          </div>
                        )}
                        {q.type === "text" && (
                          <textarea value={ans||""} onChange={e => handleAnswer(q.question_id, e.target.value, "text")} rows={2} placeholder="Type here…"
                            style={{ width:"100%", borderRadius:10, padding:"8px 12px", fontSize:12, background:"rgba(255,255,255,0.08)", border:`1px solid ${G.tealBorder}`, color:"rgba(255,255,255,0.88)", outline:"none", resize:"none", boxSizing:"border-box" }} />
                        )}
                        <button onClick={() => handleSubmit(q)} disabled={isSend||!hasAns}
                          style={{ marginTop:8, width:"100%", borderRadius:10, padding:8, fontSize:12, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:!hasAns?`${G.teal}33`:`linear-gradient(135deg,${G.teal},${G.deepMid})`, border:"none", cursor:isSend?"wait":!hasAns?"not-allowed":"pointer" }}>
                          {isSend ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> : <Check size={12} />}
                          Save +{q.weight||3} pts
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ textAlign:"center" }}>
                <a href={`/pet-soul/${pet?.id}`} style={{ fontSize:12, fontWeight:600, color:`${G.teal}BB`, textDecoration:"none" }}>See full soul profile →</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// DIM EXPANDED — mirrors CareSoulPage DimExpanded exactly
// ─────────────────────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts = {} }) {
  const petName   = pet?.name || "your dog";
  // apiProducts keyed by dim.id now
  const rawByTab  = apiProducts[dim.id] || {};
  const allRaw    = Object.values(rawByTab).flat();
  const allergies = getAllergies(pet);
  const size      = getPetSize(pet);
  const condition = getHealthCondition(pet);
  const intelligent = applyMiraIntelligence(allRaw, allergies, size, condition, pet);
  const tabList   = ["All", ...Object.keys(rawByTab)];
  const [activeTab, setActiveTab] = useState("All");
  const [dimTab, setDimTab] = useState("products");
  const miraCtx   = { includeText: "Add to Cart" };

  const products = activeTab === "All"
    ? intelligent
    : intelligent.filter(p => p.sub_category === activeTab);

  return (
    <div style={{ background:"#fff", border:`2px solid ${G.teal}`, borderRadius:18, padding:22, marginBottom:16, gridColumn:"1 / -1" }} data-testid={`go-dim-expanded-${dim.id}`}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${G.pale}` }}>
        <span style={{ fontSize:28 }}>{dim.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:G.darkText }}>{dim.label}</div>
          <div style={{ fontSize:11, color:"#888" }}>
            {allergies.map(a=>`${a}-free`).join(" · ")}{allergies.length>0?" · ":""}
            {condition?"Treatment-safe":`Personalised for ${petName}`}
            {size?` · ${size} dog`:""}
          </div>
        </div>
        <button onClick={onClose} style={{ background:G.pale, border:"none", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, color:G.darkText, cursor:"pointer" }}>Close ✕</button>
      </div>

      <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:`linear-gradient(135deg,${G.pale},${G.light}40)`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:"50%", background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <p style={{ fontSize:12, color:G.darkText, fontStyle:"italic", lineHeight:1.5, margin:0 }}>"{t(dim.mira, petName)}"</p>
          <span style={{ fontSize:10, color:G.teal, fontWeight:600 }}>♥ Mira knows {petName}</span>
        </div>
      </div>

      {/* Products / Personalised tab toggle */}
      <div style={{ display:"flex", borderBottom:`1px solid ${G.light}40`, marginBottom:14 }}>
        {[["products","🎯 All Products"],["personalised","✦ Personalised"]].map(([tid,label]) => (
          <button key={tid} onClick={() => setDimTab(tid)} data-testid={`go-dim-tab-${tid}`}
            style={{ flex:1, padding:"9px 0", background:"none", border:"none", borderBottom:dimTab===tid?`2.5px solid ${G.teal}`:"2.5px solid transparent", color:dimTab===tid?G.teal:"#888", fontSize:12, fontWeight:dimTab===tid?700:400, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {dimTab === "personalised" ? (
        <div>
          <PersonalisedBreedSection pet={pet} pillar="go" />
          <div style={{ borderTop:"1px solid #f0f0f0", marginTop:16, paddingTop:16 }}>
            <SoulMadeCollection pillar="travel" maxItems={8} showTitle={true} />
          </div>
        </div>
      ) : (
        <>
          {tabList.length > 1 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {tabList.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${activeTab===tab?G.teal:G.light}`, background:activeTab===tab?G.teal:G.cream, fontSize:11, fontWeight:600, color:activeTab===tab?"#fff":G.teal, cursor:"pointer" }}>
                  {tab.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}

          {allRaw.length > 0 && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14, fontSize:11, color:"#888" }}>
              <span style={{ color:"#27AE60", fontWeight:700 }}>✓ {intelligent.length} safe for {petName}</span>
              {allRaw.length-intelligent.length>0 && <span style={{ color:"#AD1457" }}>✗ {allRaw.length-intelligent.length} filtered</span>}
              {intelligent.filter(p=>p._sizeMatch).length>0 && <span style={{ color:G.deepMid, fontWeight:700 }}>🎒 {intelligent.filter(p=>p._sizeMatch).length} size-matched</span>}
            </div>
          )}

          {products.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"#888", fontSize:13 }}>
              {allRaw.length===0 ? `Loading ${dim.label} products for ${petName}…` : `No products available for this filter.`}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))", gap:12 }}>
              {products.map(p => (
                <div key={p.id} style={{ position:"relative" }} data-testid={`go-product-${p.id}`}>
                  {p._sizeMatch && <div style={{ position:"absolute", top:-6, right:-6, zIndex:2, background:G.teal, borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff" }}>🎒</div>}
                  <SharedProductCard product={p} pillar="go" selectedPet={pet} miraContext={miraCtx} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GO SERVICES — 8 booking flows
// ─────────────────────────────────────────────────────────────
const GO_SERVICES = [
  { id:"flight",     icon:"✈️", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#E3F2FD,#BBDEFB)`, free:false, name:"Flight Coordination",  tagline:"Cabin policy, docs & airport day", desc:"We handle airline policy, documentation, and airport coordination for {petName}'s flight.", accentColor:"#1565C0", steps:5 },
  { id:"roadtrip",   icon:"🚗", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#E8F5E9,#C8E6C9)`, free:false, name:"Road & Train Travel",    tagline:"Route planning & safety kit", desc:"Complete road or train journey planning — route, safety kit, rest stops, and vet check.", accentColor:"#2E7D32", steps:4 },
  { id:"boarding",   icon:"🏡", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,${G.pale},${G.light})`, free:false, name:"Boarding & Daycare",    tagline:"When you travel — we find the best stay", desc:"We find and book the right boarding or daycare for {petName} while you're away.", accentColor:G.deepMid, steps:4 },
  { id:"sitting",    icon:"🏠", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#FFF8E1,#FFE082)`, free:false, name:"Pet Sitting",             tagline:"{petName} stays home — we find the sitter", desc:"A trusted sitter comes to {petName}'s home. We find, vet, and coordinate everything.", accentColor:"#E65100", steps:4 },
  { id:"relocation", icon:"📦", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#F3E5F5,#E1BEE7)`, free:false, name:"Relocation",              tagline:"Domestic or international move", desc:"Complete relocation coordination for {petName} — documentation, transport, and new home settling.", accentColor:"#6A1B9A", steps:5 },
  { id:"taxi",       icon:"🚕", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#FFF8E1,#FFE0B2)`, free:false, name:"Pet Taxi",                tagline:"Safe city transport for {petName}", desc:"Trusted pet taxi for vet visits, grooming appointments, or airport transfers.", accentColor:G.gold, steps:3 },
  { id:"planning",   icon:"🗺️", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#E0F2F1,#B2DFDB)`, free:true,  name:"Travel Planning",         tagline:"Complete trip coordination", desc:"We plan the entire trip — hotel, transport, documentation, and a vet-checked kit.", accentColor:"#00695C", steps:4 },
  { id:"emergency",  icon:"🚨", illustrationUrl:null, illustrationBg:`linear-gradient(135deg,#FFEBEE,#FFCDD2)`, free:true,  name:"Emergency Travel",        tagline:"Urgent help — now", desc:"Lost pet, missed flight, or emergency vet abroad. We handle it immediately.", accentColor:"#C62828", steps:2, urgent:true },
];

// ── Shared booking step components (mirrors CareSoulPage) ────
function StepCard({ label, selected, onClick, sub, icon }) {
  return (
    <div onClick={onClick} style={{ border:`1.5px solid ${selected?G.teal:"#E8E0D8"}`, borderRadius:12, padding:"14px 16px", background:selected?G.cream:"#fff", cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"flex-start", gap:12 }}>
      {icon && <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:G.mutedText, marginTop:2 }}>{sub}</div>}
      </div>
      {selected && <div style={{ width:22, height:22, borderRadius:"50%", background:G.teal, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, accentColor = G.teal }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.label;
        const sel = Array.isArray(selected) ? selected.includes(val) : selected === val;
        return (
          <button key={val} onClick={() => onToggle(val)} style={{ border:`1.5px solid ${sel?accentColor:"#E8E0D8"}`, borderRadius:20, padding:"8px 16px", background:sel?`${accentColor}15`:"#fff", color:sel?accentColor:"#555", fontSize:13, fontWeight:sel?600:400, cursor:"pointer" }}>
            {sel?"✓ ":""}{val}
          </button>
        );
      })}
    </div>
  );
}

function MiraKnows({ text }) {
  return (
    <div style={{ background:G.pale, border:`1px solid ${G.tealBorder}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:20 }}>
      <span style={{ fontSize:14, flexShrink:0 }}>ⓘ</span>
      <div style={{ fontSize:13, color:G.deepMid }}><strong>Mira knows:</strong>{" "}{text}</div>
    </div>
  );
}

function ProgressBar({ step, total, accentColor }) {
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
        Arranged around {pet.name}'s profile and travel needs
      </div>
      <ProgressBar step={step} total={totalSteps} accentColor={service.accentColor} />
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Step {step} of {totalSteps}</div>
    </div>
  );
}

function PetBadge({ pet }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", marginBottom:16, borderBottom:`1px solid ${G.borderLight}` }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, overflow:"hidden", flexShrink:0 }}>
        {pet.photo_url ? <img src={pet.photo_url} alt={pet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="eager" decoding="sync" /> : "🐕"}
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
      {onBack && <button onClick={onBack} style={{ flex:1, background:"#fff", border:`1.5px solid ${G.border}`, borderRadius:12, padding:"12px", fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>← Back</button>}
      <button onClick={isLast?onSend:onNext} disabled={nextDisabled}
        style={{ flex:2, background:nextDisabled?"#E8E0D8":isLast?`linear-gradient(135deg,${accentColor},${accentColor}99)`:`linear-gradient(135deg,${G.teal},${G.light})`, color:nextDisabled?"#999":isLast?"#fff":G.deep, border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:800, cursor:nextDisabled?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
        {sending?"Sending…":isLast?"✦ Send to Concierge®":"Continue →"}
      </button>
    </div>
  );
}

function BookingConfirmed({ service, pet, onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 32px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${service.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>
        {service.urgent?"🚨":"✦"}
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>
        {service.urgent?"Our Concierge® team will call you within 5 minutes.":`Your ${service.name.toLowerCase()} request for ${pet.name} has been received. We'll get back to you shortly.`}
      </div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid ${G.border}`, borderRadius:20, padding:"6px 16px", fontSize:13, color:G.teal, fontWeight:600, marginBottom:24 }}>
        📥 Added to your Inbox
      </div>
      <div>
        <button onClick={onClose} style={{ background:G.teal, color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          View in Concierge® Inbox
        </button>
      </div>
    </div>
  );
}

// ── FLIGHT COORDINATION FLOW (5 steps) ──────────────────────
function FlightFlow({ pet, service, onClose }) {
  const [step, setStep]         = useState(1);
  const [route, setRoute]       = useState(null);
  const [cabinOrCargo, setCabinOrCargo] = useState(null);
  const [docs, setDocs]         = useState([]);
  const [airport, setAirport]   = useState(null);
  const [notes, setNotes]       = useState("");
  const [sent, setSent]         = useState(false);

  const toggleDoc = v => setDocs(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);
  const canNext = [!!route, !!cabinOrCargo, docs.length>0, !!airport, true][step-1];
  const size = getPetSize(pet);

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${size?`${pet.name} is a ${size} dog — I know which carriers and crates are right for this size.`:"I'll check airline policies based on "+pet.name+"'s size and breed."}`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What kind of flight is this?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"domestic",icon:"🇮🇳",l:"Domestic",s:"Within India"},{v:"international",icon:"✈️",l:"International",s:"Abroad"},{v:"return",icon:"↩️",l:"Return Trip",s:"Both ways covered"},{v:"relocation",icon:"📦",l:"Relocation",s:"Permanent move"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={route===o.v} onClick={()=>setRoute(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Cabin or cargo?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"cabin",icon:"💺",l:"Cabin",s:`Under-seat travel — small dogs only`},{v:"cargo",icon:"✈️",l:"Cargo Hold",s:"Checked as special baggage"},{v:"unsure",icon:"❓",l:"Not sure yet",s:"Mira will advise based on breed & airline"},{v:"petttransport",icon:"🚐",l:"Pet Transport Service",s:"We handle end-to-end"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={cabinOrCargo===o.v} onClick={()=>setCabinOrCargo(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Which documents do you need help with?</div>
            <ChipSelect options={["Health Certificate","Vaccination Records","NOC from Vet","Airline Pet Approval","Import/Export Permit","Microchip Certificate","All of the above"]} selected={docs} onToggle={toggleDoc} accentColor={service.accentColor} />
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Airport assistance needed?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"checkin",icon:"🎫",l:"Check-in support",s:"Help at the counter"},{v:"pickup",icon:"🚗",l:"Airport pickup",s:"We meet you at arrival"},{v:"both",icon:"⭐",l:"Both",s:"Full airport assistance"},{v:"none",icon:"✗",l:"No thanks",s:"Just the coordination"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={airport===o.v} onClick={()=>setAirport(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===5 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Anything else? <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Flight date, airline, destination, special requirements for ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===5} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── ROAD & TRAIN TRAVEL FLOW (4 steps) ──────────────────────
function RoadTripFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [mode, setMode]   = useState(null);
  const [distance, setDistance] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [notes, setNotes] = useState("");
  const [sent, setSent]   = useState(false);

  const toggleNeed = v => setNeeds(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!mode, !!distance, true, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`I'll plan rest stops, vet locations along the route, and the right safety kit for ${pet.name}'s size and anxiety level.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How are you travelling?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"car",icon:"🚗",l:"Car",s:"Self-drive"},{v:"train",icon:"🚂",l:"Train",s:"Rail journey"},{v:"bus",icon:"🚌",l:"Bus",s:"Long-distance bus"},{v:"hired",icon:"🚕",l:"Hired cab",s:"Ola/Uber/outstation"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={mode===o.v} onClick={()=>setMode(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How long is the journey?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[{v:"short",l:"Under 3 hrs",s:"Local trip"},{v:"medium",l:"3–8 hrs",s:"Half day"},{v:"long",l:"8+ hrs",s:"Overnight or multi-day"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={distance===o.v} onClick={()=>setDistance(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What do you need help with?</div>
            <ChipSelect options={["Route planning","Rest stop locations","Vet locations en route","Safety harness recommendation","Car seat / barrier","Calming for the journey","Food & water management","Emergency kit"]} selected={needs} onToggle={toggleNeed} accentColor={service.accentColor} />
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Additional notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Origin, destination, travel date, anything specific about ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── BOARDING FLOW (4 steps — same as CareSoulPage) ──────────
function BoardingFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [type, setType]   = useState(null);
  const [dates, setDates] = useState({ from:"", to:"", flexible:false });
  const [reqs, setReqs]   = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [sent, setSent]   = useState(false);

  const toggleReq  = v => setReqs(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const togglePref = v => setPrefs(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!type, dates.flexible||(dates.from&&dates.to), true, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s health profile is already shared with all vetted boarding facilities we recommend.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of boarding?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"overnight",icon:"🌙",l:"Overnight",s:"One or more nights"},{v:"daycare",icon:"☀️",l:"Daycare only",s:"Daytime supervision"},{v:"multiday",icon:"📅",l:"Multi-day stay",s:"Extended stay"},{v:"emergency",icon:"🚨",l:"Emergency boarding",s:"Needed urgently"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When?</div>
            {!dates.flexible && (
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
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
            <button onClick={()=>setDates(p=>({...p,flexible:!p.flexible}))} style={{ border:`1.5px solid ${dates.flexible?G.teal:"#E8E0D8"}`, borderRadius:20, padding:"8px 16px", background:dates.flexible?G.cream:"#fff", color:dates.flexible?G.deepMid:"#555", fontSize:13, fontWeight:dates.flexible?600:400, cursor:"pointer" }}>
              {dates.flexible?"✓ Dates are flexible":"Dates are flexible"}
            </button>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Special requirements?</div>
            <ChipSelect options={["Medication administration","Special diet","Separation anxiety","Breed-specific handling","Senior care","Post-surgery recovery","Highly active dog","Shy / slow intro"]} selected={reqs} onToggle={toggleReq} accentColor={service.accentColor} />
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Facility preferences?</div>
            <ChipSelect options={["Near my home","Near my vet","Luxury / premium suite","Standard accommodation","Outdoor run","Indoor only","Small dogs only","24/7 vet on site"]} selected={prefs} onToggle={togglePref} accentColor={service.accentColor} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── PET SITTING FLOW (4 steps) ───────────────────────────────
function SittingFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [type, setType]   = useState(null);
  const [when, setWhen]   = useState({ date:"", time:null });
  const [needs, setNeeds] = useState([]);
  const [notes, setNotes] = useState("");
  const [sent, setSent]   = useState(false);

  const toggleNeed = v => setNeeds(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!type, when.time, needs.length>0, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name} stays home and the sitter comes to ${pet.name}. Mira finds and vets the right sitter for your area.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of sitting?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"hourly",icon:"⏰",l:"A few hours",s:"While you're out"},{v:"fullday",icon:"☀️",l:"Full day",s:"Morning to evening"},{v:"overnight",icon:"🌙",l:"Overnight",s:"Sitter stays the night"},{v:"regular",icon:"📅",l:"Regular / weekly",s:"Ongoing schedule"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>When?</div>
            <input type="date" value={when.date} onChange={e=>setWhen(p=>({...p,date:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>Preferred time</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Flexible"].map(v=>(
                <button key={v} onClick={()=>setWhen(p=>({...p,time:v}))} style={{ border:`1.5px solid ${when.time===v?G.teal:"#E8E0D8"}`, borderRadius:20, padding:"7px 14px", background:when.time===v?G.cream:"#fff", color:when.time===v?G.deepMid:"#555", fontSize:12, fontWeight:when.time===v?600:400, cursor:"pointer" }}>{when.time===v?"✓ ":""}{v}</button>
              ))}
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does {pet.name} need?</div>
            <ChipSelect options={["Feeding","Fresh water","Walks","Playtime","Medication administration","Companionship","Potty breaks","Training reinforcement"]} selected={needs} onToggle={toggleNeed} accentColor={service.accentColor} />
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Home access notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Key safe, gate code, anything the sitter should know about ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── RELOCATION FLOW (5 steps) ────────────────────────────────
function RelocationFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [scope, setScope]   = useState(null);
  const [docs, setDocs]     = useState([]);
  const [transport, setTransport] = useState(null);
  const [timeline, setTimeline]   = useState(null);
  const [notes, setNotes]   = useState("");
  const [sent, setSent]     = useState(false);

  const toggleDoc = v => setDocs(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!scope, true, !!transport, !!timeline, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Relocation is the most complex journey. Mira handles every step — documentation, transport, and ${pet.name} settling into the new home.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What kind of move?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"domestic",icon:"🏠",l:"Domestic relocation",s:"Within India"},{v:"international",icon:"🌍",l:"International move",s:"To another country"},{v:"citychange",icon:"🏙️",l:"City change",s:"Same country, new city"},{v:"temporary",icon:"⏳",l:"Temporary relocation",s:"Coming back in 3–12 months"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={scope===o.v} onClick={()=>setScope(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Documents needed?</div>
            <ChipSelect options={["Health Certificate","Vaccination Records","NOC from Vet","Microchip Certificate","Import/Export Permit","Quarantine Arrangement","Airline Pet Approval","All — Mira handles everything"]} selected={docs} onToggle={toggleDoc} accentColor={service.accentColor} />
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How will {pet.name} travel?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"flight",icon:"✈️",l:"By flight",s:"Cabin or cargo"},{v:"drive",icon:"🚗",l:"By road",s:"Car or pet transport"},{v:"train",icon:"🚂",l:"By train",s:"Rail journey"},{v:"petrelocation",icon:"📦",l:"Pet relocation service",s:"Specialist end-to-end service"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={transport===o.v} onClick={()=>setTransport(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When is the move?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[{v:"asap",l:"As soon as possible",s:"Within 2 weeks"},{v:"month",l:"Within a month",s:"Planning ahead"},{v:"flexible",l:"Flexible",s:"No fixed date yet"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={timeline===o.v} onClick={()=>setTimeline(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===5 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Additional notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Destination city/country, current city, special requirements for ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===5} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── PET TAXI FLOW (3 steps) ──────────────────────────────────
function TaxiFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [purpose, setPurpose] = useState(null);
  const [when, setWhen]     = useState({ date:"", time:null });
  const [notes, setNotes]   = useState("");
  const [sent, setSent]     = useState(false);

  const canNext = [!!purpose, when.time&&when.date, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={3} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Pet taxis are pet-only vehicles — no strangers' scents, clean and safe for ${pet.name}.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What's the ride for?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"vet",icon:"🏥",l:"Vet visit",s:"Clinic or home vet"},{v:"grooming",icon:"✂️",l:"Grooming appointment",s:"Salon or mobile groomer"},{v:"airport",icon:"✈️",l:"Airport drop/pickup",s:"Flight connection"},{v:"other",icon:"📍",l:"Other destination",s:"Boarding, daycare, friend's home"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={purpose===o.v} onClick={()=>setPurpose(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>When?</div>
            <input type="date" value={when.date} onChange={e=>setWhen(p=>({...p,date:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>Preferred pickup time</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Morning (8–12pm)","Afternoon (12–5pm)","Evening (5–9pm)"].map(v=>(
                <button key={v} onClick={()=>setWhen(p=>({...p,time:v}))} style={{ border:`1.5px solid ${when.time===v?G.teal:"#E8E0D8"}`, borderRadius:20, padding:"7px 14px", background:when.time===v?G.cream:"#fff", color:when.time===v?G.deepMid:"#555", fontSize:12, fontWeight:when.time===v?600:400, cursor:"pointer" }}>{when.time===v?"✓ ":""}{v}</button>
              ))}
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Pickup address & notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Pickup location, destination address, anything the driver should know about ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===3} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── TRAVEL PLANNING FLOW (4 steps) ──────────────────────────
function TravelPlanningFlow({ pet, service, onClose }) {
  const [step, setStep]       = useState(1);
  const [destination, setDestination] = useState(null);
  const [duration, setDuration]       = useState(null);
  const [needs, setNeeds]     = useState([]);
  const [notes, setNotes]     = useState("");
  const [sent, setSent]       = useState(false);

  const toggleNeed = v => setNeeds(p => p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!destination, !!duration, true, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Tell us where you're going and Mira will research pet rules, find pet-friendly stays, and build a complete trip plan for ${pet.name}.`} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Where are you going?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"beach",icon:"🏖️",l:"Beach / resort",s:"Goa, Kerala, Andamans"},{v:"hills",icon:"⛰️",l:"Hills / mountains",s:"Himachal, Uttarakhand, Coorg"},{v:"city",icon:"🏙️",l:"Another city",s:"Domestic travel"},{v:"international",icon:"🌍",l:"International",s:"Outside India"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={destination===o.v} onClick={()=>setDestination(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How long?</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[{v:"weekend",l:"Weekend",s:"2–3 days"},{v:"week",l:"A week",s:"5–7 days"},{v:"longer",l:"Longer",s:"8+ days"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={duration===o.v} onClick={()=>setDuration(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What do you need Mira to arrange?</div>
            <ChipSelect options={["Pet-friendly hotel","All-in-one travel kit","Flight or transport booking","Vet near destination","Activity recommendations","Emergency contacts at destination","Full trip coordination"]} selected={needs} onToggle={toggleNeed} accentColor={service.accentColor} />
          </>
        )}
        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Specific destination & dates <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`e.g. "Goa, 15–18 April, need pet-friendly beach resort and travel harness for ${pet.name}"…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── EMERGENCY TRAVEL FLOW (2 steps — fast) ──────────────────
function EmergencyTravelFlow({ pet, service, onClose }) {
  const [step, setStep]         = useState(1);
  const [situation, setSituation] = useState(null);
  const [location, setLocation]   = useState("");
  const [sent, setSent]         = useState(false);

  const canNext = [!!situation, true][step-1];

  if (sent) return (
    <div style={{ textAlign:"center", padding:"40px 32px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#C62828", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>🚨</div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:15, color:"#C62828", fontWeight:700, marginBottom:8 }}>We will call you within 5 minutes.</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>Our emergency travel team is routing assistance for {pet.name} now.</div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:20, padding:"6px 16px", fontSize:13, color:"#C62828", fontWeight:600, marginBottom:24 }}>📥 Added to your Inbox</div>
      <div><button onClick={onClose} style={{ background:"#C62828", color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
    </div>
  );

  return (
    <>
      <div style={{ background:"linear-gradient(135deg,#C62828,#B71C1C)", padding:"20px 24px 16px", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
            <span style={{ fontSize:14 }}>🚨</span><span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>Emergency Travel</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:4 }}>Emergency for {pet.name}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:10 }}>Tell us what's happening. We'll route help immediately.</div>
        <ProgressBar step={step} total={2} accentColor="#C62828" />
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Step {step} of 2</div>
      </div>
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What's the emergency?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"lost",icon:"🔍",l:"Lost pet",s:"Can't find or locate them"},{v:"vet",icon:"🏥",l:"Emergency vet needed",s:"Injury or illness while travelling"},{v:"flight",icon:"✈️",l:"Missed flight / stranded",s:"Travel plans broken down"},{v:"docs",icon:"📄",l:"Documentation problem",s:"Rejected at border/airport"},{v:"transport",icon:"🚐",l:"Transport breakdown",s:"Stuck en route"},{v:"other",icon:"⚠️",l:"Other urgent issue",s:"Tell us what's happening"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={situation===o.v} onClick={()=>setSituation(o.v)} />
              ))}
            </div>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:12, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#B71C1C", fontWeight:600 }}>
              🚨 We will call you within 5 minutes of receiving this.
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Your current location</div>
            <input type="text" value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, airport, address, or nearest landmark" style={{ width:"100%", border:"1.5px solid #FFCDD2", borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ await bookViaConcierge({service:service.name,pillar:"go",pet,token:localStorage.getItem("tdb_auth_token"),channel:"go_service_booking",notes:notes||null,onSuccess:()=>setSent(true)}); }} nextDisabled={!canNext} isLast={step===2} accentColor="#C62828" />
      </div>
    </>
  );
}

// ── SERVICE BOOKING MODAL ROUTER ────────────────────────────
function ServiceBookingModal({ service, pet, onClose }) {
  const FlowMap = { flight:FlightFlow, roadtrip:RoadTripFlow, boarding:BoardingFlow, sitting:SittingFlow, relocation:RelocationFlow, taxi:TaxiFlow, planning:TravelPlanningFlow, emergency:EmergencyTravelFlow };
  const FlowComponent = FlowMap[service.id];
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"min(580px,100%)", maxHeight:"90vh", background:"#fff", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.30)" }}>
        {FlowComponent ? <FlowComponent pet={pet} service={service} onClose={onClose} /> : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GO CONCIERGE — 8 service cards + dark CTA
// Mirrors CareConcierge in CareSoulPage exactly
// ─────────────────────────────────────────────────────────────
function GoConcierge({ pet, token }) {
  const [activeService, setActiveService] = useState(null);
  const [bookingVenue, setBookingVenue] = useState(null);
  const petName = pet?.name || "your dog";

  const handleStayBook = (spot, city) => {
    // Opens the planning flow pre-filled with the stay info
    setActiveService("planning");
  };

  return (
    <div style={{ background:`linear-gradient(135deg,${G.cream},#E8F8F5)`, borderRadius:20, border:`1px solid ${G.border}`, padding:24, marginBottom:32 }}>
      {activeService && (
        <ServiceBookingModal service={GO_SERVICES.find(s=>s.id===activeService)} pet={pet} onClose={() => setActiveService(null)} />
      )}

      <div style={{ fontSize:20, fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>Go, Personally</div>
      <div style={{ fontSize:13, color:G.mutedText, marginBottom:20 }}>Tell us what you want {petName}'s trip to feel like. We'll handle every detail.</div>

      {/* 8 service cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {GO_SERVICES.map(svc => (
          <div key={svc.id}
            style={{ background:"#fff", borderRadius:16, border:`1px solid ${svc.urgent?"#FFCDD2":G.borderLight}`, overflow:"hidden", cursor:"pointer", transition:"transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform="none"}>
            <div style={{ height:100, background:svc.illustrationBg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              {svc.illustrationUrl
                ? <img src={svc.illustrationUrl} alt={svc.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:36 }}>{svc.icon}</span>}
              {svc.urgent && <div style={{ position:"absolute", top:8, right:8, background:"#C62828", color:"#fff", fontSize:9, fontWeight:700, borderRadius:20, padding:"2px 7px" }}>URGENT</div>}
            </div>
            <div style={{ padding:"10px 12px 14px" }}>
              {svc.free && <div style={{ display:"inline-block", background:"#E8F5E9", color:"#2E7D32", fontSize:10, fontWeight:700, borderRadius:8, padding:"2px 8px", marginBottom:6 }}>Complimentary</div>}
              <div style={{ fontSize:11, color:G.hintText, marginBottom:3 }}>{svc.tagline.replace("{petName}", petName)}</div>
              <div style={{ fontSize:13, fontWeight:700, color:svc.urgent?"#C62828":G.darkText, marginBottom:5 }}>{svc.name}</div>
              <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.5, marginBottom:10 }}>{svc.desc.replace("{petName}", petName)}</div>
              <button style={{ fontSize:12, color:svc.urgent?"#C62828":G.teal, fontWeight:700, background:"none", border:"none", padding:0, cursor:"pointer" }} onClick={() => setActiveService(svc.id)}>
                {svc.urgent?"Get help now →":`Book ${svc.steps}-step flow →`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dark CTA */}
      <div style={{ background:G.deep, borderRadius:20, padding:28, display:"flex", alignItems:"flex-start", gap:24 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(26,188,156,0.20)", border:"1px solid rgba(26,188,156,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
            ✈️ Go Concierge®
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:10, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
            Travel with <span style={{ color:G.light }}>{petName}</span> the way only you know how.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
            {["Flights","Road & Train","Boarding","Pet Sitting","Relocation","Pet Taxi","Trip Planning","Emergency"].map(chip=>(
              <span key={chip} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 12px", color:"#fff", fontSize:11 }}>{chip}</span>
            ))}
          </div>
          <div style={{ fontSize:13, color:G.whiteDim, lineHeight:1.7, marginBottom:20 }}>
            You tell us where {petName} is going. We handle the documentation, transport, boarding, and everything in between. Every time.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div>
              <span style={{ fontSize:26, fontWeight:900, color:G.light }}>12,000+</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.50)", marginLeft:6 }}>trips arranged</span>
            </div>
            <button onClick={() => setActiveService("planning")} style={{ display:"inline-flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${G.teal},${G.light})`, color:G.deep, border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:800, cursor:"pointer" }}>
              ✈️ Talk to your Go Concierge
            </button>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.40)" }}>48h response · Emergency: 5 min</span>
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"center", minWidth:100 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(26,188,156,0.20)", border:`2px solid rgba(26,188,156,0.40)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 8px" }}>✈️</div>
          <div style={{ fontSize:22, fontWeight:900, color:G.light }}>100%</div>
          <div style={{ fontSize:11, color:G.whiteDim, marginBottom:6 }}>handled for you</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GO TAB BAR — centered pill tabs (mirrors CareTabBar)
// ─────────────────────────────────────────────────────────────
function GoTabBar({ active, onChange }) {
  const tabs = [
    { id: "go",       label: "✈️ Go Essentials" },
    { id: "stay",     label: "🏡 Find a Stay" },
    { id: "services", label: "🗺️ Book a Service" },
  ];
  return (
    <div style={{ background:"#fff", borderBottom:`1px solid rgba(26,188,156,0.10)`, padding:"16px 16px 0", display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
      {tabs.map(tab => {
        const sel = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            data-testid={`go-tab-${tab.id}`}
            style={{ padding:"10px 24px", borderRadius:9999, border:"none", background:sel?`linear-gradient(135deg,${G.teal},${G.deepMid})`:`rgba(26,188,156,0.08)`, color:sel?"#fff":G.mutedText, fontSize:14, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s", marginBottom:0 }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING / NO PET STATES
// ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 50%,${G.teal} 100%)` }} data-testid="go-loading">
      <div style={{ textAlign:"center", color:"#fff" }}>
        <div style={{ fontSize:32, marginBottom:12, animation:"spin 1s linear infinite" }}>✈️</div>
        <p style={{ color:"rgba(255,255,255,0.70)" }}>Loading Mira's travel guide…</p>
      </div>
    </div>
  );
}

function NoPetState({ onAddPet }) {
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 16px", background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 50%,${G.teal} 100%)` }} data-testid="go-no-pet">
      <div style={{ textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:24 }}>✈️</div>
        <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:800, color:"#fff", marginBottom:16, fontFamily:"Georgia,serif" }}>Travel &amp; Stay<br/>with your dog</h1>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.70)", marginBottom:32 }}>Add your pet to unlock a personalised travel experience — flights, boarding, and hotels all arranged by Mira.</p>
        <button onClick={onAddPet} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:9999, fontWeight:600, fontSize:16, cursor:"pointer", background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:"#fff", border:"none" }} data-testid="go-add-pet-btn">
          <span>✦</span><span>Add your dog to begin</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE — mirrors CareSoulPage exactly
// ─────────────────────────────────────────────────────────────
const GoSoulPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated }                    = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();

  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("go");
  const [goConciergOpen, setGoConciergOpen] = useState(false);
  const [openDim, setOpenDim]       = useState(null);
  const [petData, setPetData]       = useState(null);
  const [soulScore, setSoulScore]   = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [conciergeToast, setConciergeToast] = useState(null);

  // handleNearMeBook — wires "Book via Concierge" on any nearby place card
  const handleNearMeBook = useCallback(async (spot, city) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const venueName = spot?.name || (city ? `a spot in ${city}` : "a travel stay");
      const ticketResp = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "go_guest",
          pet_id:    petData?.id || "unknown",
          pillar:    "go",
          intent_primary: "STAY_BOOKING",
          life_state: "active",
          initial_message: {
            sender: "parent",
            source: "Mira_OS",
            text: `Please help book or enquire about ${venueName} for ${petData?.name || "my dog"}.`,
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
            concierge_queue: "TRAVEL",
            latest_mira_summary: `${petData?.name || "Dog"} owner wants to stay at: ${venueName}.`,
          }),
        });
        setConciergeToast({ name: venueName, ticketId: tData.ticket_id, pillar: "go" });
      }
    } catch (err) {
      console.error("[GoSoulPage] handleNearMeBook:", err);
      setConciergeToast({ name: spot?.name, pillar: "go" });
    }
  }, [petData, token]);

  // Fetch Go products — group by dim.id, filter soul products by breed
  useEffect(() => {
    if (!petData) return;
    const petBreed = (petData?.breed || "indie").toLowerCase().trim();

    fetch(`${API_URL}/api/admin/pillar-products?pillar=go&limit=300`)
      .then(r => r.ok ? r.json() : null)
      .then(async data => {
        if (!data?.products?.length) return;
        const grouped = {};
        data.products.forEach(p => {
          // Skip soul/breed products for other breeds
          const productBreeds = (p.breed_tags || []).map(b => b.toLowerCase().trim());
          if (productBreeds.length > 0 && !productBreeds.includes(petBreed)) return;

          const catLower = (p.category || "").toLowerCase();
          let matched = false;
          Object.entries(DIM_ID_TO_KEYWORDS).forEach(([dimId, keywords]) => {
            if (keywords.some(kw => catLower.includes(kw))) {
              if (!grouped[dimId]) grouped[dimId] = {};
              const sub = p.sub_category || "General";
              if (!grouped[dimId][sub]) grouped[dimId][sub] = [];
              grouped[dimId][sub].push(p);
              matched = true;
            }
          });
          if (!matched) {
            if (!grouped["safety"]) grouped["safety"] = {};
            const sub = p.sub_category || "Other";
            if (!grouped["safety"][sub]) grouped["safety"][sub] = [];
            grouped["safety"][sub].push(p);
          }
        });

        // Breed-specific soul products for Go appear through GoContentModal's Personalised tab
        // (no soul dim in goDims — handled by GoCategoryStrip → GoContentModal → PersonalisedBreedSection)
        setApiProducts(grouped);
      }).catch(e => console.error("[GoSoulPage] products fetch:", e));
  }, [petData]);

  useEffect(() => {
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) { setPetData(currentPet); setSoulScore(currentPet.overall_score || currentPet.soul_score || 0); }
  }, [currentPet]);

  // Auto-trigger Mira scoring for Go pillar on first visit
  useEffect(() => {
    if (!petData?.id) return;
    // Fire and forget — triggers background scoring, picks available next visit
    fetch(`${API_URL}/api/mira/score-for-pet`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ pet_id: petData.id, pillar: "go", entity_types: ["product", "service"] }),
    }).catch(() => {}); // silent — non-critical
  }, [petData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = async e => {
      if (e.detail?.petId !== petData?.id) return;
      if (e.detail?.score !== undefined) setSoulScore(e.detail.score);
      try {
        const freshPet = await fetch(`${API_URL}/api/pets/${e.detail.petId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.ok ? r.json() : null);
        if (freshPet) { setPetData(freshPet); setCurrentPet(freshPet); }
      } catch {}
    };
    window.addEventListener("soulScoreUpdated", handle);
    return () => window.removeEventListener("soulScoreUpdated", handle);
  }, [petData?.id, token]);

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/go");
  }, [isAuthenticated, navigate]);

  if (loading)  return <PillarPageLayout pillar="go" hideHero hideNavigation><LoadingState /></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="go" hideHero hideNavigation><NoPetState onAddPet={handleAddPet} /></PillarPageLayout>;

  const goDims   = getGoDims(petData);
  const activeDim = goDims.find(d => d.id === openDim);

  return (
    <PillarPageLayout pillar="go" hideHero hideNavigation>
      <Helmet>
        <title>Go · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Everything ${petData.name} needs for travel and stays — flights, boarding, and hotels arranged by Mira.`} />
      </Helmet>

      <GoHero pet={petData} soulScore={soulScore} />

      <div style={{ background:G.pageBg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:"60vh" }}>
        <GoCategoryStrip pet={petData} />

        <GoTabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === "go" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Trip Profile — mirrors WellnessProfile */}
            <TripProfile pet={petData} token={token} />

            {/* Section header */}
            <section style={{ paddingBottom:16 }} data-testid="go-how-would-section">
              <h2 style={{ fontSize:"clamp(1.375rem,3vw,1.875rem)", fontWeight:800, color:G.darkText, marginBottom:6, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
                How would <span style={{ color:G.teal }}>{petData.name}</span> love to travel?
              </h2>
              <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
                Choose a dimension — everything inside is matched to {petData.name}'s size, anxiety level, and travel needs.{" "}
                <span style={{ color:G.deepMid, fontWeight:600 }}>Glowing ones match what {petData.name} needs most.</span>
              </p>
            </section>

            {/* Mira's Picks */}
            <MiraPicksSection pet={petData} />

            {/* "Go for [name]" label */}
            <div style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>
              Go for <span style={{ color:G.teal }}>{petData.name}</span>
            </div>
            <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>
              6 dimensions, matched to {petData.name}'s size and travel profile
            </div>

            {/* Dimension grid — 2→3→6 col */}
            <div style={{ display:"grid", gap:10, marginBottom:8 }} className="go-dims-grid">
              <style>{`
                .go-dims-grid{grid-template-columns:repeat(2,1fr)}
                @media(min-width:480px){.go-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @media(min-width:768px){.go-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @keyframes spin{to{transform:rotate(360deg)}}
              `}</style>
              {goDims.map(dim => {
                const isOpen = openDim === dim.id;
                return (
                  <div key={dim.id}
                    onClick={() => setOpenDim(isOpen ? null : dim.id)}
                    style={{
                      background: dim.glow ? G.cream : "#fff",
                      border: isOpen ? `2px solid ${G.teal}` : "2px solid transparent",
                      borderRadius:12, padding:"16px 12px", cursor:"pointer",
                      textAlign:"center", transition:"all 0.15s", minHeight:154,
                      boxShadow: dim.glow && !isOpen ? `0 4px 20px ${dim.glowColor}` : "none",
                      position:"relative", opacity: dim.glow ? 1 : 0.72,
                    }}
                    data-testid={`go-dim-${dim.id}`}>
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

            {/* Expanded panel */}
            {activeDim && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr", marginBottom:8 }}>
                <DimExpanded dim={activeDim} pet={petData} onClose={() => setOpenDim(null)} apiProducts={apiProducts} />
              </div>
            )}

            {/* Guided Go Paths */}
            <div style={{ marginTop:32 }}>
              <GuidedGoPaths pet={petData} />
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <GoConcierge pet={petData} token={token} />
            <GoConciergeSection pet={petData} />
            {/* Guided Go Paths — shown after personal services */}
            <div style={{ marginTop:40 }}>
              <GuidedGoPaths pet={petData} />
            </div>
          </div>
        )}

        {activeTab === "stay" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <PetFriendlyStays
              pet={petData}
              onBook={handleNearMeBook}
            />
          </div>
        )}

      </div>
    <ConciergeToast toast={conciergeToast} onClose={() => setConciergeToast(null)} />

    {/* Go Concierge Modal — Care-style chip selector */}
    {goConciergOpen && (
      <div onClick={()=>setGoConciergOpen(false)}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.50)",zIndex:10006,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:"#fff",borderRadius:20,padding:32,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
          <button onClick={()=>setGoConciergOpen(false)}
            style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(26,188,156,0.10)",border:"1px solid rgba(26,188,156,0.30)",borderRadius:9999,padding:"4px 14px",marginBottom:20}}>
            <span style={{fontSize:11,fontWeight:600,color:"#0d6e5a",letterSpacing:"0.06em",textTransform:"uppercase"}}>★ {petData?.name||"your dog"}'s Go Concierge</span>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:"#0d2b22",fontFamily:"Georgia,serif",lineHeight:1.2,marginBottom:8}}>
            Where is <span style={{color:G.teal}}>{petData?.name||"your dog"}</span> heading?
          </h2>
          <p style={{fontSize:14,color:"#888",marginBottom:24}}>Three questions. Then your Concierge takes over.</p>
          <p style={{fontSize:13,fontWeight:700,color:G.deep,marginBottom:12}}>What are we planning?</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
            {["Pet-friendly hotel","Overnight boarding","Day care","Road trip","Flight with pet","Pet sitter at home","International travel","Local staycation","Just exploring"].map(opt=>(
              <button key={opt} id={`go-opt-${opt.replace(/\s+/g,'-')}`}
                style={{borderRadius:9999,padding:"8px 16px",fontSize:13,cursor:"pointer",background:"#E8FBF7",border:"1.5px solid #A7DFCF",color:G.deep}}
                onClick={e=>{
                  document.querySelectorAll('[id^="go-opt-"]').forEach(b=>{b.style.background="#E8FBF7";b.style.color=G.deep;});
                  e.currentTarget.style.background=G.teal;e.currentTarget.style.color="#fff";
                  e.currentTarget.dataset.selected="true";
                }}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={async ()=>{
            const sel = document.querySelector('[id^="go-opt-"][data-selected="true"]');
            const choice = sel?.innerText || "Travel service";
            const u=JSON.parse(localStorage.getItem('user')||'{}');
            await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
              method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
              body:JSON.stringify({parent_id:u?.id||u?.email||'guest',pet_id:petData?.id||'unknown',
                pillar:'go',intent_primary:'service_booking',intent_secondary:[choice],
                life_state:'go',channel:'go_concierge_modal',
                initial_message:{sender:'parent',text:`I'd like: ${choice} for ${petData?.name||'my dog'}`}})
            }).catch(()=>{});
            setGoConciergOpen(false);
          }}
            style={{width:"100%",background:`linear-gradient(135deg,${G.teal},${G.deep})`,color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer"}}>
            ✦ Send to {petData?.name||"your dog"}'s Concierge
          </button>
        </div>
      </div>
    )}
    </PillarPageLayout>
  );
};

export default GoSoulPage;
