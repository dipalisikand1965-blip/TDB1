/**
 * PlaySoulPage.jsx — /play pillar (Enjoy + Fit merged)
 * The Doggy Company
 *
 * Architecture mirrors GoSoulPage.jsx exactly.
 * Colour world: vibrant green #2D6A4F + energetic orange #E76F51
 *
 * WIRING:
 *   1. Route:   <Route path="/play" element={<PlaySoulPage/>}/>
 *   2. Pet:     usePillarContext
 *   3. Products: GET /api/admin/pillar-products?pillar=play&category=...
 *   4. Booking:  POST /api/concierge/play-booking
 *   5. Paths:    POST /api/concierge/play-path
 *
 * 8 Service flows (4 Enjoy + 4 Fit):
 *   Enjoy: parks(3) · events(3) · social(4) · weekend(4)
 *   Fit:   walking(3) · fitness(4) · swimming(4) · agility(4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import PlayHero from "../components/play/PlayHero";
import PlayCategoryStrip from "../components/play/PlayCategoryStrip";
import PlayContentModal from "../components/play/PlayContentModal";
import GuidedPlayPaths from "../components/play/GuidedPlayPaths";
import PlayConciergeSection from "../components/play/PlayConciergeSection";
import PlayNearMe from "../components/play/PlayNearMe";
import ConciergeToast from "../components/common/ConciergeToast";
import { API_URL } from "../utils/api";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeCollection from "../components/SoulMadeCollection";

// ─────────────────────────────────────────────────────────────
// COLOUR SYSTEM — Vibrant Green + Orange
// ─────────────────────────────────────────────────────────────
const G = {
  deep:       "#7B2D00",
  mid:        "#7B3F00",
  green:      "#E76F51",
  light:      "#FFAD9B",
  pale:       "#FFF0EA",
  cream:      "#FFF8F5",
  orange:     "#E76F51",
  yellow:     "#FFB703",
  pageBg:     "#FFF8F5",
  border:     "rgba(231,111,81,0.18)",
  borderLight:"rgba(231,111,81,0.10)",
  darkText:   "#7B2D00",
  mutedText:  "#8B4513",
  hintText:   "#8B4513",
  whiteDim:   "rgba(255,255,255,0.65)",
  greenBg:    "rgba(231,111,81,0.10)",
  greenBorder:"rgba(231,111,81,0.28)",
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }

const CLEAN_NONE = /^(no|none|none_confirmed|n\/a)$/i;
function getAllergies(pet) {
  const s = new Set();
  const add = v => { if (Array.isArray(v)) v.forEach(x=>{if(x&&!CLEAN_NONE.test(String(x).trim()))s.add(x);}); else if(v&&!CLEAN_NONE.test(String(v).trim()))s.add(v); };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies); add(pet?.allergies);
  return [...s].filter(Boolean);
}
function getHealth(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw)?raw.join(", "):String(raw);
  return str.toLowerCase()==="none"||str.trim()===""?null:str;
}
function getSize(pet)   { return pet?.doggy_soul_answers?.size   || pet?.size          || null; }
function getEnergy(pet) { return pet?.doggy_soul_answers?.energy_level                  || null; }
function getAge(pet)    { return parseInt(pet?.doggy_soul_answers?.age_years||"0")||0; }
function isSenior(pet)  { return getAge(pet) >= 7; }

// ─────────────────────────────────────────────────────────────
// PLAY DIMENSION CONFIG
// ─────────────────────────────────────────────────────────────
function getPlayDims(pet) {
  const size    = getSize(pet);
  const energy  = getEnergy(pet);
  const health  = getHealth(pet);
  const senior  = isSenior(pet);
  const breed   = pet?.breed || pet?.doggy_soul_answers?.breed || null;
  const cap = s => s?s.charAt(0).toUpperCase()+s.slice(1).toLowerCase():"";

  return [
    {
      id:"outings", icon:"🌳", label:"Outings & Parks",
      sub: energy ? `${cap(energy)} energy · parks & trails` : "Parks, beaches & adventures",
      badge:"Explore", badgeBg:G.mid, glowColor:"rgba(231,111,81,0.28)", glow:true,
      mira: energy
        ? `${energy==="high"||energy==="very high"?"I've prioritised off-lead parks and adventure trails for {name}'s high energy.":"I've found calm parks and gentle trails that match {name}'s pace."}`
        : `Tell me {name}'s energy level and I'll find the perfect parks and trails nearby.`,
    },
    {
      id:"playdates", icon:"🐾", label:"Playdates",
      sub: breed ? `${breed} playdates & social` : "Dog friends & socialisation",
      badge:"Social", badgeBg:"#9B59B6", glowColor:"rgba(155,89,182,0.20)", glow:true,
      mira: breed
        ? `I know ${breed}s — I'll find breed-matched playdates and social events near {name}.`
        : `Playdates make a real difference. I'll coordinate the right match for {name}'s personality.`,
    },
    {
      id:"walking", icon:"🦮", label:"Dog Walking",
      sub: senior ? "Gentle senior walks" : energy ? `${cap(energy)} energy walks` : "Daily walks & running",
      badge: senior ? "Gentle pace" : energy === "high" ? "Energy drain" : "Daily",
      badgeBg: senior ? "#1565C0" : G.orange, glowColor:"rgba(231,111,81,0.20)", glow:true,
      mira: senior
        ? `{name} is a senior — consistent gentle walks are better than long exhausting ones. I've curated the right routine.`
        : energy === "high"
        ? `High energy needs proper outlets. I've built a walking routine that actually tires {name} out.`
        : `The right daily walk routine changes everything. Products and services matched to {name}'s pace.`,
    },
    {
      id:"fitness", icon:"💪", label:"Fitness & Training",
      sub: health ? `${health} safe fitness` : senior ? "Low-impact senior fitness" : "Agility, strength & training",
      badge: health ? "Health-safe" : senior ? "Senior fit" : "Active",
      badgeBg: health ? "#AD1457" : senior ? "#1565C0" : G.deep,
      glowColor:"rgba(27,67,50,0.22)", glow:!!(health||senior),
      mira: health
        ? `Every product here is safe for {name}'s ${health}. No joint impact or intensity contraindications.`
        : senior
        ? `Senior fitness is about staying mobile and comfortable. I've chosen low-impact options perfect for {name}'s age.`
        : `Mira builds {name}'s 4-week fitness plan. Products and services matched to breed and energy level.`,
    },
    {
      id:"swimming", icon:"🏊", label:"Swimming & Hydro",
      sub: health ? "Joint-safe swim options" : "Pool, beach & hydrotherapy",
      badge: health ? "Therapeutic" : "Splash!", badgeBg:"#1565C0",
      glowColor:"rgba(21,101,192,0.20)", glow:!!(health&&String(health).toLowerCase().includes("joint")),
      mira: health&&String(health).toLowerCase().includes("joint")
        ? `Hydrotherapy is one of the best things for {name}'s joint health. Everything here is low-impact and therapeutic.`
        : `Swimming is the best full-body workout for dogs. Products and sessions for every confidence level.`,
    },
    {
      id:"soul", icon:"✨", label:"Soul Play",
      sub: breed ? `${breed} bandana & playdate card` : "Breed bandana & playdate card",
      badge:"Made for you", badgeBg:G.mid, glowColor:"rgba(231,111,81,0.22)", glow:true,
      mira:`{name}'s breed bandana and personalised playdate card — wear on every outing, send before every playdate.`,
    },
  ];
}

const DIM_ID_TO_CATEGORY = {
  outings:   "Play Essentials",
  playdates: "Play Essentials",
  walking:   "Play Essentials",
  fitness:   "Fitness & Training",
  swimming:  "Fitness & Training",
  soul:      "Soul Play Products",
};

// ─────────────────────────────────────────────────────────────
// MIRA INTELLIGENCE
// ─────────────────────────────────────────────────────────────
function isSafeFromAllergen(a, text, free) {
  return free.includes(`${a}-free`)||free.includes(`${a} free`)||text.includes(`${a}-free`)||text.includes(`${a} free`);
}
function containsAllergen(a, text) {
  return text.replace(new RegExp(`${a}[- ]free`,"gi"),"").includes(a);
}
function applyMiraIntelligence(products, allergies, size, health, pet) {
  const petName    = pet?.name || "your dog";
  const allergyT   = allergies.map(a=>a.toLowerCase().trim());
  const sizeL      = (size||"").toLowerCase();
  const energyL    = (getEnergy(pet)||"").toLowerCase();
  return products
    .filter(p => {
      if (!allergyT.length) return true;
      const text = `${p.name} ${p.description||""}`.toLowerCase();
      const free = (p.allergy_free||"").toLowerCase();
      return !allergyT.some(a => { if(isSafeFromAllergen(a,text,free))return false; return containsAllergen(a,text); });
    })
    .map(p => {
      const text = `${p.name} ${p.description||""} ${p.sub_category||""}`.toLowerCase();
      const tag  = (p.mira_tag||"").toLowerCase();
      const sizeMatch   = sizeL && (text.includes(sizeL)||tag.includes("size match"));
      const energyMatch = energyL && (text.includes(energyL)||tag.includes("energy"));
      let mira_hint = p.mira_hint||null;
      if (!mira_hint) {
        if (sizeMatch)    mira_hint = `Sized for ${petName}'s ${size} build`;
        else if (energyMatch) mira_hint = `Matched for ${energyL} energy dogs`;
        else if (p.mira_tag)  mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _sizeMatch:!!sizeMatch, _energyMatch:!!energyMatch };
    })
    .sort((a,b) => {
      if (a._sizeMatch&&!b._sizeMatch) return -1;
      if (!a._sizeMatch&&b._sizeMatch) return 1;
      if (a._energyMatch&&!b._energyMatch) return -1;
      if (!a._energyMatch&&b._energyMatch) return 1;
      return 0;
    });
}

// ─────────────────────────────────────────────────────────────
// MIRA IMAGINES CARD
// ─────────────────────────────────────────────────────────────
function MiraImagineCard({ card, pet, token }) {
  const [sending, setSending]     = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    setSending(true);
    let user = {};
    try { user = JSON.parse(localStorage.getItem("user")||"{}"); } catch {}
    try {
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method:"POST", headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({ parent_id:user?.id||user?.email||"play_guest", pet_id:pet?.id||"unknown", pillar:"play", intent_primary:"mira_imagines_product", intent_secondary:[card.name,"custom_play_product"], life_state:"play", channel:"play_mira_imagines", initial_message:{sender:"parent",source:"play_page",text:`Hi! I'd love to get "${card.name}" for ${pet?.name}. ${card.reason}. Can you arrange this?`} }),
      });
    } catch {}
    setSending(false); setRequested(true);
  };

  return (
    <div style={{ borderRadius:16, overflow:"hidden", position:"relative", background:card.bg||`linear-gradient(135deg,${G.deep},${G.mid})`, border:`1px solid ${G.greenBorder}`, display:"flex", flexDirection:"column" }}>
      <div style={{ position:"absolute", top:12, left:12, zIndex:2, borderRadius:20, padding:"4px 12px", fontSize:10, fontWeight:700, background:`linear-gradient(135deg,${G.light},${G.green})`, color:G.deep }}>Mira Imagines</div>
      <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, paddingTop:28 }}>{card.emoji}</div>
      <div style={{ padding:"12px 16px 16px", textAlign:"center", flex:1, display:"flex", flexDirection:"column" }}>
        <p style={{ fontWeight:700, color:"#fff", fontSize:14, marginBottom:6, lineHeight:1.3 }}>{card.name}</p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.60)", marginBottom:6, lineHeight:1.5, flex:1 }}>{card.desc}</p>
        <p style={{ fontSize:11, fontWeight:600, color:G.light, fontStyle:"italic", marginBottom:12 }}>{card.reason}</p>
        {requested
          ? <div style={{ borderRadius:10, padding:8, fontSize:11, fontWeight:700, background:"rgba(255,173,155,0.20)", border:`1px solid ${G.light}40`, color:G.light, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Check size={13} /> Sent to Concierge!
            </div>
          : <button onClick={handleRequest} disabled={sending} style={{ width:"100%", borderRadius:10, padding:8, fontSize:11, fontWeight:700, background:sending?`${G.green}60`:`linear-gradient(135deg,${G.green},${G.mid})`, border:"none", color:"#fff", cursor:sending?"wait":"pointer", opacity:sending?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {sending && <Loader2 size={11} style={{ animation:"spin 1s linear infinite" }} />}
              Request a Quote →
            </button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MIRA PICKS SECTION
// ─────────────────────────────────────────────────────────────
function MiraPicksSection({ pet }) {
  const [picks, setPicks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedPick, setSelectedPick] = useState(null);
  const [conciergeService, setConciergeService] = useState(null);
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeSent, setConciergeSent]       = useState(false);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";
  const energy  = getEnergy(pet);
  const size    = getSize(pet);
  const senior  = isSenior(pet);

  const miraImagines = [
    energy==="high"||energy==="very high"
      ? { emoji:"⚡", bg:`linear-gradient(135deg,${G.deep},#4A1800)`, name:`High-Energy Outlet Pack`, desc:`Agility set, longline lead, and fetch launcher — built to drain ${petName}'s energy the right way`, reason:`Because ${petName} has high energy` }
      : { emoji:"🌳", bg:`linear-gradient(135deg,${G.deep},${G.mid})`, name:`Park Day Starter Pack`, desc:`Everything for a perfect park day — bowl, treats, lead, and a toy`, reason:`Because every dog deserves a great park day` },
    senior
      ? { emoji:"🌸", bg:`linear-gradient(135deg,#4A1800,${G.deep})`, name:`Senior Active Living Kit`, desc:`Balance disc, paw wax, and post-swim towel — keeping ${petName} mobile and comfortable`, reason:`Because ${petName} is a senior dog` }
      : { emoji:"💪", bg:`linear-gradient(135deg,#4A1800,#7B2D00)`, name:`Fitness Starter Kit`, desc:`4-week fitness plan + agility starter set — Mira's programme for ${petName}`, reason:`Because fitness changes everything` },
    { emoji:"🐾", bg:`linear-gradient(135deg,${G.deep},#4A1800)`, name:`Playdate Ready Bundle`, desc:`Playdate starter pack + personalised bandana + invitation cards — ${petName}'s social starter kit`, reason:`Because ${petName} deserves dog friends` },
    { emoji:"🏊", bg:`linear-gradient(135deg,#0a1a26,#0d2a4a)`, name:`Swimming Safety Bundle`, desc:`Life jacket, microfibre towel, and ear protectors — swim safely anywhere`, reason:`Because swimming is the best workout` },
  ].filter(Boolean).slice(0,4);

  const handleServiceConcierge = async service => {
    setConciergeSending(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method:"POST", headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({ parent_id:storedUser?.id||storedUser?.email||"guest", pet_id:pet?.id||"unknown", pillar:"play", intent_primary:"service_request", intent_secondary:[service.name||service.entity_name], life_state:"play", channel:"miras_picks", initial_message:{sender:"parent",source:"play_miras_picks",text:`I'd like "${service.name||service.entity_name}". Mira scored it ${service.mira_score||"?"}/100.`} }),
      });
    } catch {}
    setConciergeSending(false); setConciergeSent(true);
    setTimeout(()=>{setConciergeSent(false);setConciergeService(null);},2000);
  };

  useEffect(() => {
    if (!pet?.id) { setLoading(false); return; }
    const makeAbortable = (url) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      return fetch(url, { signal: ctrl.signal })
        .then(r => r.ok ? r.json() : null)
        .finally(() => clearTimeout(timer))
        .catch(() => null);
    };
    Promise.allSettled([
      makeAbortable(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=play&limit=12&min_score=60&entity_type=product`),
      makeAbortable(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=play&limit=6&min_score=60&entity_type=service`),
    ]).then(([pRes, sRes]) => {
      const pData = pRes.status === "fulfilled" ? pRes.value : null;
      const sData = sRes.status === "fulfilled" ? sRes.value : null;
      const prods=pData?.picks||[]; const svcs=sData?.picks||[];
      const merged=[]; let pi=0,si=0;
      while(pi<prods.length||si<svcs.length){
        if(pi<prods.length) merged.push(prods[pi++]);
        if(pi<prods.length) merged.push(prods[pi++]);
        if(si<svcs.length)  merged.push(svcs[si++]);
      }
      if(merged.length) setPicks(merged.slice(0,16));
      setLoading(false);
    });
  }, [pet?.id]);

  const showImagines = !loading && picks.length === 0;

  return (
    <section style={{ marginBottom:32 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
          Mira's Play Picks for <span style={{ color:G.green }}>{petName}</span>
        </h3>
        <span style={{ fontSize:11, background:`linear-gradient(135deg,${G.green},${G.mid})`, color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>AI Scored</span>
      </div>
      <p style={{ fontSize:12, color:"#888", marginBottom:16 }}>Products and services matched to {petName}'s energy, size, and play style.</p>

      {showImagines ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))", gap:14 }}>
          {miraImagines.map((card,i) => <MiraImagineCard key={i} card={card} pet={pet} token={token} />)}
        </div>
      ) : (
        <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:10, scrollbarWidth:"thin" }} className="play-picks-scroll">
          <style>{`.play-picks-scroll::-webkit-scrollbar{height:4px}.play-picks-scroll::-webkit-scrollbar-thumb{background:${G.green}50;border-radius:4px}`}</style>
          {picks.map((pick,i) => {
            const isService = pick.entity_type==="service";
            const img = [pick.image_url,pick.image,pick.media?.primary_image,...(pick.images||[])].find(u=>u&&u.startsWith("http"))||null;
            const score = pick.mira_score||0;
            const scoreColor = score>=80?"#16A34A":score>=70?G.green:"#6B7280";
            return (
              <div key={pick.id||i}
                style={{ flexShrink:0, width:168, background:"#fff", borderRadius:14, border:`1.5px solid ${G.borderLight}`, overflow:"hidden", cursor:"pointer", transition:"transform 0.15s" }}
                onClick={() => isService?setConciergeService(pick):setSelectedPick(pick)}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform=""; }}
                data-testid={`play-pick-card-${i}`}>
                <div style={{ width:"100%", height:130, background:G.cream, overflow:"hidden", position:"relative" }}>
                  {img
                    ? <img src={img} alt={pick.name||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:isService?`linear-gradient(135deg,${G.deep},${G.mid})`:`linear-gradient(135deg,${G.mid},${G.green})`, color:"#fff", fontSize:12, fontWeight:700, padding:8, textAlign:"center" }}>
                        {(pick.name||pick.entity_name||"").slice(0,18)}
                      </div>}
                  <span style={{ position:"absolute", top:7, left:7, fontSize:9, fontWeight:700, background:isService?G.mid:G.green, color:"#fff", borderRadius:20, padding:"2px 7px" }}>
                    {isService?"SERVICE":"PRODUCT"}
                  </span>
                </div>
                <div style={{ padding:"10px 11px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:G.darkText, lineHeight:1.3, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{pick.name||pick.entity_name||"—"}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                    <div style={{ flex:1, height:4, background:G.pale, borderRadius:4, overflow:"hidden" }}><div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:4 }} /></div>
                    <span style={{ fontSize:10, fontWeight:800, color:scoreColor, minWidth:26 }}>{score}</span>
                  </div>
                  {pick.mira_reason && <p style={{ fontSize:10, color:"#888", lineHeight:1.4, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontStyle:"italic" }}>{pick.mira_reason}</p>}
                  <p style={{ fontSize:9, color:isService?G.mid:G.green, fontWeight:700, margin:"6px 0 0" }}>{isService?"Tap → Book via Concierge":"Tap → View & Add"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPick && <ProductDetailModal product={selectedPick} pillar="play" selectedPet={pet} onClose={() => setSelectedPick(null)} />}
      {conciergeService && (
        <div onClick={() => !conciergeSending&&setConciergeService(null)} style={{ position:"fixed", inset:0, zIndex:10003, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"min(420px,100%)", borderRadius:20, background:"#fff", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", overflow:"hidden" }}>
            <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, background:G.green, color:G.deep, borderRadius:20, padding:"3px 10px" }}>SERVICE · Mira Scored {conciergeService.mira_score||"—"}</span>
                <button onClick={() => setConciergeService(null)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:20, width:28, height:28, cursor:"pointer", color:"rgba(255,255,255,0.7)", fontSize:16 }}>✕</button>
              </div>
              <p style={{ fontWeight:800, color:"#fff", fontSize:16, margin:"0 0 6px" }}>{conciergeService.name||conciergeService.entity_name}</p>
              {conciergeService.mira_reason && <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12, margin:0, fontStyle:"italic" }}>{conciergeService.mira_reason}</p>}
            </div>
            <div style={{ padding:"20px 24px" }}>
              <p style={{ fontSize:13, color:"#555", marginBottom:16 }}>Our concierge team will reach out within 48 hours for <strong>{petName}</strong>.</p>
              {conciergeSent
                ? <div style={{ textAlign:"center", padding:12, borderRadius:12, background:G.greenBg, border:`1px solid ${G.greenBorder}` }}><Check size={20} style={{ color:G.green, margin:"0 auto 6px" }} /><p style={{ fontWeight:700, color:G.green, margin:0 }}>Sent to Concierge!</p></div>
                : <button onClick={() => handleServiceConcierge(conciergeService)} disabled={conciergeSending} style={{ width:"100%", background:`linear-gradient(135deg,${G.green},${G.mid})`, color:"#fff", border:"none", borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:conciergeSending?"wait":"pointer" }}>
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
// ACTIVITY PROFILE — mirrors TripProfile / WellnessProfile
// ─────────────────────────────────────────────────────────────
function ActivityProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore]   = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [qLoading, setQLoading]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted]   = useState({});
  const [qPts, setQPts]             = useState({});
  const [totalPts, setTotalPts]     = useState(0);

  const energy  = getEnergy(pet);
  const size    = getSize(pet);
  const health  = getHealth(pet);
  const senior  = isSenior(pet);
  const petName = pet?.name || "your dog";

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=play`, { signal:controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) { setQuestions((data.questions||[]).map(q=>({...q,pet_id:pet.id}))); if(data.current_score!==undefined)setLiveScore(data.current_score); }
      })
      .catch(err=>{ if(err.name!=="AbortError")console.error("[ActivityProfile]",err); })
      .finally(()=>{ clearTimeout(timer); setQLoading(false); });
  }, [pet?.id]);

  useEffect(() => { if (drawerOpen) loadQuestions(); }, [drawerOpen, loadQuestions]);

  const handleAnswer = (qId, val, type) => {
    setAnswers(prev => {
      if (type==="multi_select") {
        const cur=prev[qId]||[];
        return {...prev,[qId]:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};
      }
      return {...prev,[qId]:val};
    });
  };

  const handleSubmit = async q => {
    const answer = answers[q.question_id];
    if (!answer||(Array.isArray(answer)&&answer.length===0)) return;
    setSubmitting(p=>({...p,[q.question_id]:true}));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({ question_id:q.question_id, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        const weight = q.weight||3;
        setQPts(p=>({...p,[q.question_id]:weight}));
        setTotalPts(p=>p+weight);
        setSubmitted(p=>({...p,[q.question_id]:true}));
        if (data.scores?.overall!==undefined) {
          setLiveScore(data.scores.overall);
          window.dispatchEvent(new CustomEvent("soulScoreUpdated",{detail:{petId:pet.id,score:data.scores.overall}}));
        }
        setTimeout(()=>loadQuestions(),800);
      }
    } catch(err){console.error("[ActivityProfile submit]",err);}
    finally{setSubmitting(p=>({...p,[q.question_id]:false}));}
  };

  const visibleQ = questions.filter(q=>!submitted[q.question_id]);

  return (
    <>
      {/* Compact bar */}
      <div onClick={() => setDrawerOpen(true)} data-testid="activity-profile"
        style={{ background:"#fff", border:`2px solid ${G.pale}`, borderRadius:16, padding:"14px 18px", marginBottom:20, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, fontSize:20, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center" }}>🌳</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petName}'s Activity Profile</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
            {energy && <span style={{ fontSize:10, fontWeight:600, color:G.mid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>⚡ {energy} energy</span>}
            {size   && <span style={{ fontSize:10, fontWeight:600, color:G.mid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"2px 8px" }}>🐾 {size}</span>}
            {senior && <span style={{ fontSize:10, fontWeight:600, color:"#1565C0", background:"#E3F2FD", border:"1px solid #90CAF9", borderRadius:20, padding:"2px 8px" }}>🌸 Senior</span>}
            {health && <span style={{ fontSize:10, fontWeight:600, color:"#AD1457", background:"#FCE4EC", border:"1px solid #F48FB1", borderRadius:20, padding:"2px 8px" }}>⚕ {health.split(",")[0]}</span>}
            {!energy && !size && !health && <span style={{ fontSize:10, color:"#999" }}>Tap to tell Mira about {petName}'s play life</span>}
          </div>
        </div>
        <span style={{ fontSize:11, color:G.green, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>Mira's picks →</span>
      </div>

      {/* Drawer modal */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position:"fixed", inset:0, zIndex:10002, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ width:"min(780px,100%)", maxHeight:"90vh", overflowY:"auto", borderRadius:24, background:"#fff", boxShadow:"0 24px 80px rgba(0,0,0,0.55)", display:"flex", flexDirection:"column" }}>

            {/* Dark green header */}
            <div style={{ borderRadius:"24px 24px 0 0", padding:"24px 28px 20px", background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 60%,${G.green} 100%)`, flexShrink:0, position:"sticky", top:0, zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <p style={{ fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:`${G.light}E6`, fontSize:10, marginBottom:5 }}>
                    ✦ GROW {petName.toUpperCase()}'S ACTIVITY PROFILE
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.50)", fontSize:12 }}>Answer quick questions · Mira tailors every play and fitness recommendation to {petName}</p>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:2 }}>
                  <span style={{ fontSize:72, fontWeight:900, lineHeight:1, color:liveScore>=80?G.pale:G.light }}>{liveScore??"—"}</span>
                  <span style={{ color:"rgba(255,255,255,0.40)", fontSize:18, marginBottom:8 }}>%</span>
                </div>
              </div>
              <div style={{ height:5, borderRadius:5, background:"rgba(255,255,255,0.10)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${liveScore||0}%`, borderRadius:5, background:`linear-gradient(90deg,${G.green},${G.light})`, transition:"width 0.9s ease-out" }} />
              </div>
              <button onClick={() => setDrawerOpen(false)}
                style={{ position:"absolute", top:16, right:20, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer", color:"rgba(255,255,255,0.70)" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:"24px 28px", background:"#fff" }}>
              {totalPts > 0 && (
                <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, background:G.greenBg, border:`1px solid ${G.greenBorder}` }}>
                  <Check size={14} style={{ color:G.green, flexShrink:0 }} />
                  <p style={{ fontSize:13, fontWeight:600, color:G.green }}>+{totalPts} pts added · Mira is learning {petName}'s play preferences</p>
                </div>
              )}
              {qLoading ? (
                <div style={{ textAlign:"center", padding:"32px 0", color:"#888", fontSize:13 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.green, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
                  Loading {petName}'s questions…
                </div>
              ) : visibleQ.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>🌳</div>
                  <p style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>{petName}'s activity profile is complete!</p>
                  <p style={{ fontSize:12, color:"#888" }}>Mira has everything she needs to plan the perfect play life</p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
                  {visibleQ.map(q => {
                    const isSub  = submitted[q.question_id];
                    const isSend = submitting[q.question_id];
                    const ans    = answers[q.question_id];
                    const hasAns = ans&&(Array.isArray(ans)?ans.length>0:true);
                    if (isSub) return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:140, background:`linear-gradient(135deg,${G.deep},${G.mid})`, border:`2px solid ${G.light}70` }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:G.greenBg, border:`2px solid ${G.light}80`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Check size={20} style={{ color:G.light }} />
                        </div>
                        <p style={{ fontWeight:800, color:G.light, fontSize:14, textAlign:"center" }}>Soul score growing!</p>
                        <div style={{ borderRadius:20, padding:"4px 12px", fontWeight:700, fontSize:11, background:G.greenBg, color:G.light, border:`1px solid ${G.light}50` }}>+{qPts[q.question_id]||3} pts</div>
                      </div>
                    );
                    return (
                      <div key={q.question_id} style={{ borderRadius:16, padding:14, background:`linear-gradient(135deg,${G.deep},${G.mid})`, border:`1.5px solid ${G.greenBorder}`, minHeight:140 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12 }}>{q.folder_icon||"✦"}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:`${G.light}DD` }}>{q.folder_name}</span>
                          </div>
                          <span style={{ borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, background:G.greenBg, color:G.light, border:`1px solid ${G.greenBorder}` }}>+{q.weight||3} pts</span>
                        </div>
                        <p style={{ fontWeight:700, fontSize:12, color:"rgba(255,255,255,0.92)", marginBottom:10, lineHeight:1.4 }}>{q.question}</p>
                        {q.type==="select" && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).map(opt => (
                              <button key={opt} onClick={()=>handleAnswer(q.question_id,opt,"select")} style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, background:ans===opt?"rgba(231,111,81,0.25)":"rgba(255,255,255,0.07)", border:ans===opt?`1.5px solid ${G.green}`:"1px solid rgba(255,255,255,0.15)", color:ans===opt?G.pale:"rgba(255,255,255,0.72)", cursor:"pointer" }}>{opt}</button>
                            ))}
                          </div>
                        )}
                        {q.type==="multi_select" && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                            {(q.options||[]).slice(0,6).map(opt => {
                              const selArr=ans||[];
                              return <button key={opt} onClick={()=>handleAnswer(q.question_id,opt,"multi_select")} style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, background:selArr.includes(opt)?"rgba(231,111,81,0.25)":"rgba(255,255,255,0.07)", border:selArr.includes(opt)?`1.5px solid ${G.green}`:"1px solid rgba(255,255,255,0.15)", color:selArr.includes(opt)?G.pale:"rgba(255,255,255,0.72)", cursor:"pointer" }}>{opt}</button>;
                            })}
                          </div>
                        )}
                        {q.type==="text" && (
                          <textarea value={ans||""} onChange={e=>handleAnswer(q.question_id,e.target.value,"text")} rows={2} placeholder="Type here…"
                            style={{ width:"100%", borderRadius:10, padding:"8px 12px", fontSize:12, background:"rgba(255,255,255,0.08)", border:`1px solid ${G.greenBorder}`, color:"rgba(255,255,255,0.88)", outline:"none", resize:"none", boxSizing:"border-box" }} />
                        )}
                        <button onClick={() => handleSubmit(q)} disabled={isSend||!hasAns}
                          style={{ marginTop:8, width:"100%", borderRadius:10, padding:8, fontSize:12, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:!hasAns?`${G.green}33`:`linear-gradient(135deg,${G.green},${G.mid})`, border:"none", cursor:isSend?"wait":!hasAns?"not-allowed":"pointer" }}>
                          {isSend?<Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} />:<Check size={12} />}
                          Save +{q.weight||3} pts
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ textAlign:"center" }}>
                <a href={`/pet-soul/${pet?.id}`} style={{ fontSize:12, fontWeight:600, color:`${G.green}BB`, textDecoration:"none" }}>See full soul profile →</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// DIM EXPANDED — inline panel (exactly mirrors DineSoulPage DimExpanded)
// ─────────────────────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts = {}, apiLoading = false }) {
  const petName = pet?.name || "your dog";

  // Use pre-fetched products from parent — no internal fetch (same as Dine)
  const rawByTab = apiProducts[dim.id] || {};
  const allRaw   = Object.values(rawByTab).flat();

  const allergies   = getAllergies(pet);
  const size        = getSize(pet);
  const health      = getHealth(pet);
  const intelligent = applyMiraIntelligence(allRaw, allergies, size, health, pet);

  // Dynamic tabs from actual sub_categories in pre-fetched data
  const tabList = ["All", ...Object.keys(rawByTab)];
  const [activeTab, setActiveTab] = useState("All");
  const [dimTab, setDimTab]       = useState("products");

  const products = activeTab === "All"
    ? intelligent
    : intelligent.filter(p => p.sub_category === activeTab);

  const miraCtx = { includeText: "Add to Cart" };

  return (
    <div
      style={{ background:"#fff", border:`2px solid ${G.orange}`, borderRadius:18, padding:22, marginBottom:16, gridColumn:"1 / -1" }}
      data-testid={`play-dim-expanded-${dim.id}`}
    >
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${G.pale}` }}>
        <span style={{ fontSize:28 }}>{dim.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:G.darkText }}>{dim.label}</div>
          <div style={{ fontSize:11, color:"#888" }}>Personalised for {petName}</div>
        </div>
        <button onClick={onClose} style={{ background:G.pale, border:"none", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, color:G.mid, cursor:"pointer" }}>
          Close ✕
        </button>
      </div>

      {/* Mira quote */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:`linear-gradient(135deg,${G.pale},${G.cream})`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <p style={{ fontSize:12, color:G.darkText, fontStyle:"italic", lineHeight:1.5, margin:0 }}>"{t(dim.mira, petName)}"</p>
          <span style={{ fontSize:10, color:G.mid, fontWeight:600 }}>♥ Mira knows {petName}</span>
        </div>
      </div>

      {/* Products / Personalised tab toggle — hidden for mira dim */}
      {dim.id !== "mira" && (
        <div style={{ display:"flex", borderBottom:`1px solid ${G.pale}`, marginBottom:14 }}>
          {[["products","🎯 All Products"],["personalised","✦ Personalised"]].map(([tid,label]) => (
            <button key={tid} onClick={() => setDimTab(tid)} data-testid={`play-dim-tab-${tid}`}
              style={{ flex:1, padding:"9px 0", background:"none", border:"none", borderBottom:dimTab===tid?`2.5px solid ${G.orange}`:"2.5px solid transparent", color:dimTab===tid?G.mid:"#888", fontSize:12, fontWeight:dimTab===tid?700:400, cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {dim.id === "mira" ? (
        <MiraPicksSection pet={pet} />
      ) : dimTab === "personalised" ? (
        <div>
          <PersonalisedBreedSection pet={pet} pillar="play" />
          <div style={{ borderTop:"1px solid #f0f0f0", marginTop:16, paddingTop:16 }}>
            <SoulMadeCollection pillar="enjoy" maxItems={8} showTitle={true} />
          </div>
        </div>
      ) : (
        <>
          {/* Sub-category filter pills */}
          {tabList.length > 1 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {tabList.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${activeTab===tab?G.orange:G.light}`, background:activeTab===tab?G.orange:G.cream, fontSize:11, fontWeight:600, color:activeTab===tab?"#fff":G.mid, cursor:"pointer" }}>
                  {tab.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}

          {/* Mira stats bar */}
          {allRaw.length > 0 && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14, fontSize:11, color:"#888" }}>
              <span style={{ color:"#27AE60", fontWeight:700 }}>✓ {intelligent.length} safe for {petName}</span>
              {allRaw.length - intelligent.length > 0 && (
                <span style={{ color:G.mid }}>✗ {allRaw.length - intelligent.length} filtered (allergens)</span>
              )}
              {intelligent.filter(p => p._energyMatch).length > 0 && (
                <span style={{ color:G.mid, fontWeight:700 }}>⚡ energy-matched</span>
              )}
            </div>
          )}

          {/* Product grid */}
          {apiLoading ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#888" }}>
              <div style={{ width:28, height:28, border:`3px solid ${G.pale}`, borderTopColor:G.orange, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
              <div style={{ fontSize:13 }}>Loading products for {petName}…</div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"#888", fontSize:13 }}>
              {allRaw.length === 0
                ? <><div style={{ fontSize:28, marginBottom:10 }}>📦</div>No products found for {petName} in this category.</>
                : "No products match this filter."}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))", gap:12 }}>
              {products.map(p => (
                <div key={p.id||p._id} style={{ position:"relative", opacity:p._dimmed?0.4:1 }} data-testid={`play-product-${p.id||p._id}`}>
                  {p._energyMatch && (
                    <div style={{ position:"absolute", top:-6, right:-6, zIndex:2, background:G.orange, borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff" }}>⚡</div>
                  )}
                  {p.mira_score >= 75 && (
                    <div style={{ position:"absolute", top:-6, left:-6, zIndex:2, background:G.mid, borderRadius:20, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#fff" }}>★ {p.mira_score}</div>
                  )}
                  <SharedProductCard product={p} pillar="play" selectedPet={pet} miraContext={miraCtx} />
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
// PLAY SERVICES — 8 flows (4 enjoy + 4 fit)
// ─────────────────────────────────────────────────────────────
const PLAY_SERVICES = [
  // ENJOY
  { id:"parks",    icon:"🌳", name:"Park & Playdate",      tagline:"Find parks & coordinate playdates",  desc:"Mira finds the best parks near you and coordinates playdates matched to {petName}'s energy and breed.", accentColor:"#2D6A4F", steps:3, illustrationBg:`linear-gradient(135deg,#D8F3DC,#95D5B2)`, category:"enjoy" },
  { id:"events",   icon:"🎪", name:"Events & Experiences",  tagline:"Pet events near {petName}",          desc:"Curated pet events, dog meetups, and experiences in your city — Mira finds and books them.", accentColor:"#E76F51", steps:3, illustrationBg:`linear-gradient(135deg,#FFF3EE,#FFD6C8)`, category:"enjoy" },
  { id:"social",   icon:"🤝", name:"Socialisation",         tagline:"Build {petName}'s social life",      desc:"From first playdate to regular social calendar — Mira plans {petName}'s social life methodically.", accentColor:"#9B59B6", steps:4, illustrationBg:`linear-gradient(135deg,#F3E5F5,#E1BEE7)`, category:"enjoy" },
  { id:"weekend",  icon:"🌄", name:"Weekend Outing",        tagline:"Plan the perfect day out",           desc:"Beach, hills, forest or city — Mira plans the route, rest stops, and what to pack for {petName}.", accentColor:"#C9973A", steps:4, illustrationBg:`linear-gradient(135deg,#FFFDE7,#FFE082)`, category:"enjoy" },
  // FIT
  { id:"walking",  icon:"🦮", name:"Dog Walking",           tagline:"Daily, monthly & running options",   desc:"Book a professional dog walker or let Mira build {petName}'s perfect walking routine.", accentColor:"#2D6A4F", steps:3, illustrationBg:`linear-gradient(135deg,#D8F3DC,#95D5B2)`, free:true, category:"fit" },
  { id:"fitness",  icon:"💪", name:"Fitness Assessment",    tagline:"Mira's personalised 4-week plan",    desc:"Complete fitness assessment → personalised programme → weekly check-ins. Built for {petName}.", accentColor:"#7B2D00", steps:4, illustrationBg:`linear-gradient(135deg,#E8F5E9,#A5D6A7)`, category:"fit" },
  { id:"swimming", icon:"🏊", name:"Swimming & Hydro",      tagline:"Pool, open water & hydrotherapy",    desc:"From first swim to therapeutic hydrotherapy — Mira finds the right session for {petName}.", accentColor:"#1565C0", steps:4, illustrationBg:`linear-gradient(135deg,#E3F2FD,#90CAF9)`, category:"fit" },
  { id:"agility",  icon:"🏃", name:"Agility & Training",    tagline:"Obstacle courses & sport training",  desc:"Foundation course to competition — Mira builds {petName}'s agility journey step by step.", accentColor:"#E76F51", steps:4, illustrationBg:`linear-gradient(135deg,#FFF3EE,#FFD6C8)`, category:"fit" },
];

// ── Shared booking step primitives ───────────────────────────
function StepCard({ label, selected, onClick, sub, icon }) {
  return (
    <div onClick={onClick} style={{ border:`1.5px solid ${selected?G.green:"#E8E0D8"}`, borderRadius:12, padding:"12px 14px", background:selected?G.pale:"#fff", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:10, marginBottom:8, transition:"all 0.12s" }}>
      {icon && <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.darkText }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:G.mutedText, marginTop:2 }}>{sub}</div>}
      </div>
      {selected && <div style={{ width:20, height:20, borderRadius:"50%", background:G.green, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, flexShrink:0 }}>✓</div>}
    </div>
  );
}
function ChipSelect({ options, selected, onToggle, accentColor=G.green }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(opt => {
        const val = typeof opt==="string"?opt:opt.label;
        const sel = Array.isArray(selected)?selected.includes(val):selected===val;
        return (
          <button key={val} onClick={() => onToggle(val)} style={{ border:`1.5px solid ${sel?accentColor:"#E8E0D8"}`, borderRadius:20, padding:"7px 14px", background:sel?`${accentColor}15`:"#fff", color:sel?accentColor:"#555", fontSize:12, fontWeight:sel?600:400, cursor:"pointer" }}>
            {sel?"✓ ":""}{val}
          </button>
        );
      })}
    </div>
  );
}
function MiraKnows({ text }) {
  return (
    <div style={{ background:G.pale, border:`1px solid ${G.greenBorder}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:18 }}>
      <span style={{ fontSize:14, flexShrink:0 }}>ⓘ</span>
      <div style={{ fontSize:13, color:G.mid }}><strong>Mira knows:</strong> {text}</div>
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
function BookingHeader({ service, step, total, onClose, pet }) {
  return (
    <div style={{ background:`linear-gradient(135deg,${service.accentColor},${service.accentColor}CC)`, padding:"18px 20px 14px", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
          <span style={{ fontSize:14 }}>{service.icon}</span>
          <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{service.name}</span>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>
      <div style={{ fontSize:16, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:4 }}>
        {service.name} for {pet?.name||"your dog"}
      </div>
      <ProgressBar step={step} total={total} />
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)" }}>Step {step} of {total}</div>
    </div>
  );
}
function PetBadge({ pet }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", marginBottom:16, borderBottom:`1px solid ${G.borderLight}` }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, overflow:"hidden", flexShrink:0 }}>
        {pet?.photo_url?<img src={pet.photo_url} alt={pet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />:"🐕"}
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:G.darkText }}>For {pet?.name||"your dog"}</div>
        <div style={{ fontSize:13, color:G.mutedText }}>{pet?.breed||""}</div>
      </div>
    </div>
  );
}
function NavButtons({ onBack, onNext, onSend, nextDisabled, isLast, accentColor, sending }) {
  return (
    <div style={{ display:"flex", gap:10, paddingTop:14, borderTop:`1px solid ${G.borderLight}` }}>
      {onBack && <button onClick={onBack} style={{ flex:1, background:"#fff", border:`1.5px solid ${G.border}`, borderRadius:12, padding:"11px", fontSize:12, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>← Back</button>}
      <button onClick={isLast?onSend:onNext} disabled={nextDisabled}
        style={{ flex:2, background:nextDisabled?"#E8E0D8":isLast?`linear-gradient(135deg,${accentColor},${accentColor}99)`:`linear-gradient(135deg,${G.green},${G.light})`, color:nextDisabled?"#999":isLast?"#fff":G.deep, border:"none", borderRadius:12, padding:"11px", fontSize:13, fontWeight:800, cursor:nextDisabled?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
        {sending?"Sending…":isLast?"✦ Send to Concierge®":"Continue →"}
      </button>
    </div>
  );
}
function BookingConfirmed({ service, pet, onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 28px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${service.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>{service.icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>Your {service.name.toLowerCase()} request for {pet?.name||"your dog"} has been received.<br/>We'll reach out within 48 hours. ♥</div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid ${G.greenBorder}`, borderRadius:20, padding:"6px 16px", fontSize:13, color:G.green, fontWeight:600, marginBottom:24 }}>📥 Added to your Inbox</div>
      <div><button onClick={onClose} style={{ background:service.accentColor, color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
    </div>
  );
}

// ── Generic 3-step flow (parks, events, walking) ─────────────
function GenericFlow3({ pet, service, onClose }) {
  const [step, setStep] = useState(1);
  const [q1, setQ1]     = useState(null);
  const [q2, setQ2]     = useState(null);
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  const configs = {
    parks:   { q1:"What kind of park day?", opts1:["Solo outing","One-on-one playdate","Group meetup","Breed-specific playdate"], q2:"Energy level?", opts2:["Calm & slow","Moderate play","High energy — needs space","Reactive — needs careful intro"] },
    events:  { q1:"What kind of event?", opts1:["Dog meetup / social","Agility competition","Pet festival","Breed show / specialty","Any — Mira finds the best"], q2:"Location preference?", opts2:["Near my home","Happy to travel 1 hour","City centre","Outdoor only"] },
    walking: { q1:"Walk type?", opts1:["Casual daily walk","Brisk exercise walk","Running / jogging","Training walk with commands"], q2:"Frequency needed?", opts2:["Daily","Every other day","Book a professional walker","Build me a full programme"] },
  };
  const cfg = configs[service.id]||configs.parks;
  const canNext = [!!q1, !!q2, true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={3} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`I already know ${pet?.name||"your dog"}'s energy and profile — this will only take a moment.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>{cfg.q1}</div>{cfg.opts1.map(o=><StepCard key={o} label={o} selected={q1===o} onClick={()=>setQ1(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>{cfg.q2}</div>{cfg.opts2.map(o=><StepCard key={o} label={o} selected={q2===o} onClick={()=>setQ2(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Anything else? <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div><textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={`Location, date, specific needs for ${pet?.name||"your dog"}…`} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} /></>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{q1,q2,notes}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===3} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Social Flow (4 steps) ────────────────────────────────────
function SocialFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [exp, setExp]     = useState(null);
  const [type, setType]   = useState(null);
  const [goal, setGoal]   = useState(null);
  const [notes, setNotes] = useState("");
  const [sent, setSent]   = useState(false);
  const canNext = [!!exp, !!type, !!goal, true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={4} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet?.name||"your dog"}'s social confidence grows with the right match. I'll find it.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How social is {pet?.name||"your dog"}?</div>{["Never socialised properly","Limited — known dogs only","Good with most dogs","Fully social — loves everyone"].map(o=><StepCard key={o} label={o} selected={exp===o} onClick={()=>setExp(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What kind of social?</div>{["One-on-one playdate","Small group (3-5 dogs)","Dog park meetup","Breed-specific event","Pet festival"].map(o=><StepCard key={o} label={o} selected={type===o} onClick={()=>setType(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Social goal?</div>{["Build confidence","Find a regular playmate","Exercise through play","Reduce reactive behaviour","All of the above"].map(o=><StepCard key={o} label={o} selected={goal===o} onClick={()=>setGoal(o)} />)}</>}
        {step===4 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div><textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Location, breed preferences, any concerns…" style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} /></>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{exp,type,goal,notes}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Weekend Flow (4 steps) ────────────────────────────────────
function WeekendFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [adventure, setAdv] = useState(null);
  const [distance, setDist] = useState(null);
  const [who, setWho]       = useState(null);
  const [prep, setPrep]     = useState([]);
  const [sent, setSent]     = useState(false);
  const togglePrep = v => setPrep(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!adventure, !!distance, !!who, true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={4} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Tell me the adventure and I'll research the route, find pet-friendly stops, and build ${pet?.name||"your dog"}'s kit.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What kind of adventure?</div>{["Beach day","Hill hike / trail","Forest walk","Lake or river","City exploration","Camping overnight"].map(o=><StepCard key={o} label={o} selected={adventure===o} onClick={()=>setAdv(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How far?</div>{["Short & easy (under 3km)","Medium (3–8km)","Long (8km+)","Let Mira decide by breed"].map(o=><StepCard key={o} label={o} selected={distance===o} onClick={()=>setDist(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Who's coming?</div>{["Just me and "+( pet?.name||"my dog"),"Partner too","Kids joining","Another dog too","Full group"].map(o=><StepCard key={o} label={o} selected={who===o} onClick={()=>setWho(o)} />)}</>}
        {step===4 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What to prepare?</div><ChipSelect options={["Route planning","Emergency vet en route","Pet-friendly cafe stops","First aid kit","Activity gear","Overnight pack","Mira handles everything"]} selected={prep} onToggle={togglePrep} accentColor={service.accentColor} /></>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{adventure,distance,who,prep}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Fitness Flow (4 steps) ────────────────────────────────────
function FitnessFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [goal, setGoal]   = useState(null);
  const [current, setCurrent] = useState(null);
  const [health, setHealth]   = useState(null);
  const [types, setTypes]     = useState([]);
  const [sent, setSent]   = useState(false);
  const toggleType = v => setTypes(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!goal, !!current, !!health, true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={4} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`I'll build a 4-week programme matched to ${pet?.name||"your dog"}'s age, breed, and health. Everything here is vet-informed.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Fitness goal?</div>{["General health & vitality","Weight loss","Build muscle & stamina","Senior mobility","Agility sport prep","Post-surgery recovery"].map(o=><StepCard key={o} label={o} selected={goal===o} onClick={()=>setGoal(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Current activity level?</div>{["Barely any exercise","Short walks only","Moderate activity","Very active — needs more structure"].map(o=><StepCard key={o} label={o} selected={current===o} onClick={()=>setCurrent(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Any health conditions?</div>{["None — fully healthy","Joint issues / arthritis","Overweight","Post-surgery / recovering","Vet-supervised only"].map(o=><StepCard key={o} label={o} selected={health===o} onClick={()=>setHealth(o)} />)}</>}
        {step===4 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Favourite activities?</div><ChipSelect options={["Agility course","Nose work","Balance training","Weighted walks","Swimming","Treadmill","Let Mira decide"]} selected={types} onToggle={toggleType} accentColor={service.accentColor} /></>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{goal,current,health,types}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Swimming Flow (4 steps) ───────────────────────────────────
function SwimmingFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [exp, setExp]       = useState(null);
  const [why, setWhy]       = useState(null);
  const [safety, setSafety] = useState(null);
  const [type, setType]     = useState(null);
  const [sent, setSent]     = useState(false);
  const canNext = [!!exp, !!why, !!safety, !!type][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={4} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Swimming is one of the best full-body workouts for dogs. I'll find the right session for ${pet?.name||"your dog"}'s confidence and health.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Swim experience?</div>{["Never swum before","Tried once or twice","Loves water","Professional hydro needed"].map(o=><StepCard key={o} label={o} selected={exp===o} onClick={()=>setExp(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Why swimming?</div>{["Fun & fitness","Weight management","Joint recovery","Post-surgery rehab","Beat the heat","Just to try it"].map(o=><StepCard key={o} label={o} selected={why===o} onClick={()=>setWhy(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Safety equipment?</div>{["Has a life jacket","Needs one — help me choose","Not sure yet","Professional pool only"].map(o=><StepCard key={o} label={o} selected={safety===o} onClick={()=>setSafety(o)} />)}</>}
        {step===4 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Session preference?</div>{["Open water / beach","Private pool session","Hydrotherapy centre","Home paddling pool","Mira recommends best option"].map(o=><StepCard key={o} label={o} selected={type===o} onClick={()=>setType(o)} />)}</>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{exp,why,safety,type}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Agility Flow (4 steps) ────────────────────────────────────
function AgilityFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [level, setLevel] = useState(null);
  const [goal, setGoal]   = useState(null);
  const [types, setTypes] = useState([]);
  const [notes, setNotes] = useState("");
  const [sent, setSent]   = useState(false);
  const toggleType = v => setTypes(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!level, !!goal, true, true][step-1];
  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;
  return (
    <>
      <BookingHeader service={service} step={step} total={4} onClose={onClose} pet={pet} />
      <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Agility is both physical exercise and mental stimulation. I'll build ${pet?.name||"your dog"}'s programme from foundation to competition level.`} />
        {step===1 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Current level?</div>{["Complete beginner","Some training experience","Intermediate — knows basic commands","Advanced — ready for sport"].map(o=><StepCard key={o} label={o} selected={level===o} onClick={()=>setLevel(o)} />)}</>}
        {step===2 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Agility goal?</div>{["Fun & mental stimulation","Fitness through training","Compete in agility sport","Channel high energy","Bond with my dog"].map(o=><StepCard key={o} label={o} selected={goal===o} onClick={()=>setGoal(o)} />)}</>}
        {step===3 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Which activities?</div><ChipSelect options={["Obstacle course","Weave poles","Tunnels","Jumps","Nose work","Balance board","Scent training"]} selected={types} onToggle={toggleType} accentColor={service.accentColor} /></>}
        {step===4 && <><div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div><textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Location preference, schedule, any breed-specific concerns…" style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} /></>}
      </div>
      <div style={{ padding:"0 20px 18px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={async()=>{ try{await fetch(`${API_URL}/api/concierge/play-booking`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({petId:pet?.id,serviceId:service.id,steps:{level,goal,types,notes}})})}catch{}setSent(true); }} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── Service Booking Modal Router ─────────────────────────────
function ServiceBookingModal({ service, pet, onClose }) {
  const FlowMap = {
    social:   SocialFlow,
    weekend:  WeekendFlow,
    fitness:  FitnessFlow,
    swimming: SwimmingFlow,
    agility:  AgilityFlow,
  };
  const Flow = FlowMap[service.id] || GenericFlow3;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"min(560px,100%)", maxHeight:"90vh", background:"#fff", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.30)" }}>
        <Flow pet={pet} service={service} onClose={onClose} />
      </div>
    </div>
  );
}

// ── Play Concierge section ────────────────────────────────────
function PlayConcierge({ pet, token }) {
  const [activeService, setActiveService] = useState(null);
  const petName = pet?.name || "your dog";

  return (
    <div style={{ background:`linear-gradient(135deg,${G.cream},${G.pale})`, borderRadius:20, border:`1px solid ${G.border}`, padding:24, marginBottom:32 }}>
      {activeService && (
        <ServiceBookingModal service={PLAY_SERVICES.find(s=>s.id===activeService)} pet={pet} onClose={() => setActiveService(null)} />
      )}

      <div style={{ fontSize:20, fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>Play, Personally</div>
      <div style={{ fontSize:13, color:G.mutedText, marginBottom:20 }}>Tell us what {petName} loves. We'll plan the outings, book the walks, and build the fitness routine.</div>

      {/* 8 service cards in 2 rows — enjoy top, fit bottom */}
      {["enjoy","fit"].map(cat => (
        <div key={cat} style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:G.mutedText, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
            {cat === "enjoy" ? "🌳 Enjoy — Outings & Social" : "💪 Fit — Active & Healthy"}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {PLAY_SERVICES.filter(s=>s.category===cat).map(svc => (
              <div key={svc.id}
                style={{ background:"#fff", borderRadius:14, border:`1px solid ${G.borderLight}`, overflow:"hidden", cursor:"pointer", transition:"transform 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                <div style={{ height:80, background:svc.illustrationBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{svc.icon}</div>
                <div style={{ padding:"10px 12px 14px" }}>
                  {svc.free && <div style={{ display:"inline-block", background:"#E8F5E9", color:"#2E7D32", fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 7px", marginBottom:5 }}>Complimentary</div>}
                  <div style={{ fontSize:12, fontWeight:700, color:G.darkText, marginBottom:4 }}>{svc.name}</div>
                  <div style={{ fontSize:10, color:G.mutedText, lineHeight:1.5, marginBottom:8 }}>{svc.tagline.replace("{petName}",petName)}</div>
                  <button style={{ fontSize:11, color:svc.accentColor, fontWeight:700, background:"none", border:"none", padding:0, cursor:"pointer" }} onClick={() => setActiveService(svc.id)}>
                    Book {svc.steps}-step →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Dark CTA */}
      <div style={{ background:G.deep, borderRadius:16, padding:24, display:"flex", alignItems:"flex-start", gap:20, marginTop:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,173,155,0.20)", border:"1px solid rgba(255,173,155,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>🌳 Play Concierge®</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:10, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
            Let <span style={{ color:G.yellow }}>{petName}</span> play. Every. Single. Day.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
            {["Parks","Playdates","Dog Walking","Events","Fitness","Swimming","Agility","Weekend Adventures"].map(chip=>(
              <span key={chip} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, padding:"3px 10px", color:"#fff", fontSize:11 }}>{chip}</span>
            ))}
          </div>
          <div style={{ fontSize:13, color:G.whiteDim, lineHeight:1.7, marginBottom:20 }}>
            You tell us what {petName} loves. We plan the parks, coordinate playdates, build the fitness programme, and arrange everything.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div><span style={{ fontSize:22, fontWeight:900, color:G.yellow }}>8,400+</span><span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginLeft:6 }}>play sessions arranged</span></div>
            <button onClick={() => setActiveService("parks")} style={{ background:`linear-gradient(135deg,${G.green},${G.light})`, color:G.deep, border:"none", borderRadius:10, padding:"11px 20px", fontSize:13, fontWeight:800, cursor:"pointer" }}>
              🌳 Talk to your Play Concierge
            </button>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.40)" }}>48h response guaranteed</span>
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"center", minWidth:80 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,173,155,0.20)", border:`2px solid rgba(255,173,155,0.40)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 8px" }}>🌳</div>
          <div style={{ fontSize:18, fontWeight:900, color:G.yellow }}>100%</div>
          <div style={{ fontSize:10, color:G.whiteDim }}>joyful</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING / NO PET
// ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 50%,${G.green} 100%)` }}>
      <div style={{ textAlign:"center", color:"#fff" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🌳</div>
        <p style={{ color:"rgba(255,255,255,0.70)" }}>Loading {"{petName}"}'s play world…</p>
      </div>
    </div>
  );
}

function NoPetState({ onAddPet }) {
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 16px", background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 50%,${G.green} 100%)` }}>
      <div style={{ textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:24 }}>🌳</div>
        <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:800, color:"#fff", marginBottom:16, fontFamily:"Georgia,serif" }}>Let your dog play.</h1>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.70)", marginBottom:32 }}>Add your pet to unlock parks, playdates, fitness plans, and a full play life — all arranged by Mira.</p>
        <button onClick={onAddPet} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:9999, fontWeight:600, fontSize:16, cursor:"pointer", background:`linear-gradient(135deg,${G.green},${G.mid})`, color:"#fff", border:"none" }}>
          <span>🌳</span><span>Add your dog to begin</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLAY TAB BAR — mirrors GoTabBar, separate from hero
// ─────────────────────────────────────────────────────────────
function PlayTabBar({ active, onChange }) {
  const tabs = [
    { id: "play",      label: "🌳 Play & Explore" },
    { id: "find-play", label: "📍 Find Play" },
    { id: "services",  label: "💪 Book a Service" },
  ];
  return (
    <div style={{ background:"#fff", borderBottom:"1px solid #F0F0F0", display:"flex", justifyContent:"center", position:"sticky", top:58, zIndex:100, overflowX:"auto" }}>
      {tabs.map(tab => {
        const sel = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            data-testid={`play-tab-${tab.id}`}
            style={{ padding:"14px 20px", background:"none", border:"none", borderBottom:sel?`2.5px solid ${G.orange}`:"2.5px solid transparent", color:sel?G.mid:G.hintText, fontSize:13, fontWeight:sel?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const PlaySoulPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated }                     = useAuth();
  const { currentPet, setCurrentPet, pets:contextPets } = usePillarContext();

  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("play");
  const [openDim, setOpenDim]         = useState(null);
  const [miraPicksModal, setMiraPicksModal]   = useState(false);
  const [modalCategory, setModalCategory]     = useState(null); // PlayContentModal category
  const [petData, setPetData]         = useState(null);
  const [soulScore, setSoulScore]     = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [apiLoading, setApiLoading]   = useState(true);
  const [conciergeToast, setConciergeToast] = useState(null);

  // handleNearMeBook — wires "Book via Concierge" on PlayNearMe cards
  const handlePlayBook = useCallback(async (spot, city) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const venueName = spot?.name || (city ? `a park in ${city}` : "a play spot");
      const ticketResp = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "play_guest",
          pet_id:    petData?.id || "unknown",
          pillar:    "play",
          intent_primary: "PLAY_BOOKING",
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
            concierge_queue: "PLAY",
            latest_mira_summary: `${petData?.name || "Dog"} owner wants to visit: ${venueName}.`,
          }),
        });
        setConciergeToast({ name: venueName, ticketId: tData.ticket_id, pillar: "play" });
      }
    } catch (err) {
      console.error("[PlaySoulPage] handlePlayBook:", err);
      setConciergeToast({ name: spot?.name, pillar: "play" });
    }
  }, [petData, token]);

  // Fetch ALL play products — 3 parallel pages for faster load
  useEffect(() => {
    if (!petData) return;
    const petBreed = (petData?.breed || "indie").toLowerCase().trim();
    setApiLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=100&page=1`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=100&page=2`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=100&page=3`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(async ([d1, d2, d3]) => {
        const all = [
          ...(d1?.products||[]),
          ...(d2?.products||[]),
          ...(d3?.products||[]),
        ];
        if (!all.length) { setApiLoading(false); return; }
        const DIM_IDS = ["outings", "playdates", "walking", "fitness", "swimming", "soul"];
        const grouped = {};

        all.forEach(p => {
          const productBreeds = (p.breed_tags || []).map(b => b.toLowerCase().trim());
          const isAllBreeds = productBreeds.includes('all_breeds') || productBreeds.includes('all');
          if (productBreeds.length > 0 && !isAllBreeds && !productBreeds.includes(petBreed)) return;

          const cat = (p.category || "").toLowerCase().trim();
          const sub = (p.sub_category || "").toLowerCase().trim();
          let dimId = null;
          if (sub === "soul") dimId = "soul";
          else if (DIM_IDS.includes(sub)) dimId = sub;
          else if (cat === "soul") dimId = "soul";
          else if (DIM_IDS.includes(cat)) dimId = cat;
          else if (cat === "breed-play_bandanas" || cat === "breed-playdate_cards") dimId = "soul";
          else if (cat === "enjoy") dimId = "outings";
          else if (cat === "fit") dimId = "fitness";
          else if (cat === "toys" || cat === "gear" || cat === "accessories") dimId = "outings";
          else dimId = "outings";
          if (!grouped[dimId]) grouped[dimId] = {};
          const subKey = p.sub_category || "General";
          if (!grouped[dimId][subKey]) grouped[dimId][subKey] = [];
          grouped[dimId][subKey].push(p);
        });

        // Also fetch breed-specific soul products
        try {
          const breedRes = await fetch(`${API_URL}/api/breed-catalogue/products?pillar=play&breed=${encodeURIComponent(petData.breed)}&limit=30`);
          if (breedRes.ok) {
            const breedData = await breedRes.json();
            (breedData.products || []).forEach(p => {
              if (!grouped["soul"]) grouped["soul"] = {};
              if (!grouped["soul"]["soul"]) grouped["soul"]["soul"] = [];
              if (!grouped["soul"]["soul"].find(x => x.name === p.name)) {
                grouped["soul"]["soul"].push({ ...p, sub_category: "soul", pillar: "play" });
              }
            });
          }
        } catch (e) { /* non-critical */ }

        setApiProducts(grouped);
        setApiLoading(false);
      }).catch(e => { console.error("[PlaySoulPage] products fetch:", e); setApiLoading(false); });
  }, [petData]); // eslint-disable-line

  useEffect(() => {
    if (contextPets?.length>0&&!currentPet) setCurrentPet(contextPets[0]);
    if (contextPets!==undefined) setLoading(false);
  }, [contextPets,currentPet,setCurrentPet]);

  useEffect(() => {
    if (currentPet) { setPetData(currentPet); setSoulScore(currentPet.soul_score||currentPet.overall_score||0); }
  }, [currentPet]);

  useEffect(() => {
    const handle = async e => {
      if (e.detail?.petId!==petData?.id) return;
      if (e.detail?.score!==undefined) setSoulScore(e.detail.score);
      try {
        const fresh = await fetch(`${API_URL}/api/pets/${e.detail.petId}`,{headers:token?{Authorization:`Bearer ${token}`}:{}}).then(r=>r.ok?r.json():null);
        if (fresh) { setPetData(fresh); setCurrentPet(fresh); }
      } catch {}
    };
    window.addEventListener("soulScoreUpdated",handle);
    return () => window.removeEventListener("soulScoreUpdated",handle);
  }, [petData?.id,token]);

  // Auto-trigger Mira scoring for play pillar on first visit
  useEffect(() => {
    if (!petData?.id) return;
    fetch(`${API_URL}/api/mira/score-for-pet`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ pet_id: petData.id, pillar: "play", entity_types: ["product", "service"] }),
    }).catch(() => {});
  }, [petData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/play");
  }, [isAuthenticated,navigate]);

  if (loading)  return <PillarPageLayout pillar="play" hideHero hideNavigation><LoadingState /></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="play" hideHero hideNavigation><NoPetState onAddPet={handleAddPet} /></PillarPageLayout>;

  const playDims  = getPlayDims(petData);
  const activeDim = playDims.find(d=>d.id===openDim);

  return (
    <PillarPageLayout pillar="play" hideHero hideNavigation>
      <Helmet>
        <title>Play · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Parks, playdates, fitness and adventures for ${petData.name} — all arranged by Mira.`} />
      </Helmet>

      <PlayHero pet={petData} soulScore={soulScore} />

      <div style={{ background:G.pageBg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:"60vh" }}>

        <PlayCategoryStrip pet={petData} openDim={modalCategory} onSelect={(id) => {
          setModalCategory(id); // opens PlayContentModal
        }} onMiraPicks={() => setModalCategory('miras-picks')} />

        <PlayTabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === "play" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <ActivityProfile pet={petData} token={token} />

            {/* Mira's Picks — AI scored, same as Dine */}
            <MiraPicksSection pet={petData} />

            <section style={{ paddingBottom:16 }} data-testid="play-explore-section">
              <h2 style={{ fontSize:"clamp(1.375rem,3vw,1.875rem)", fontWeight:800, color:G.darkText, marginBottom:6, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
                How does <span style={{ color:G.orange }}>{petData.name}</span> love to play?
              </h2>
              <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
                Choose a dimension — everything inside is matched to {petData.name}'s energy, size, and play style.{" "}
                <span style={{ color:G.mid, fontWeight:600 }}>Glowing ones match what {petData.name} needs most.</span>
              </p>
            </section>

            {/* "Play for [name]" label */}
            <div style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>
              Play for <span style={{ color:G.orange }}>{petData.name}</span>
            </div>
            <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>
              6 dimensions, matched to {petData.name}'s energy and play profile
            </div>

            {/* Dimension grid — 2→4 col, inline expand like Dine */}
            <div style={{ display:"grid", gap:10, marginBottom:openDim ? 10 : 28 }} className="play-dims-grid">
              <style>{`
                .play-dims-grid{grid-template-columns:repeat(2,1fr)}
                @media(min-width:480px){.play-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @media(min-width:768px){.play-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @keyframes spin{to{transform:rotate(360deg)}}
              `}</style>
              {playDims.map(dim => {
                const isOpen = openDim === dim.id;
                return (
                  <div key={dim.id}
                    onClick={() => setOpenDim(isOpen ? null : dim.id)}
                    style={{
                      background: dim.glow ? G.cream : "#fff",
                      border: isOpen ? `2px solid ${G.orange}` : "2px solid transparent",
                      borderRadius:12, padding:"16px 12px", cursor:"pointer",
                      textAlign:"center", transition:"all 0.15s", minHeight:154,
                      boxShadow: dim.glow && !isOpen ? `0 4px 20px ${dim.glowColor}` : "none",
                      position:"relative", opacity: dim.glow ? 1 : 0.72,
                    }}
                    data-testid={`play-dim-${dim.id}`}>
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

            {/* Inline expanded panel — exactly like Dine */}
            {activeDim && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr", marginBottom:28 }}>
                <DimExpanded dim={activeDim} pet={petData} onClose={() => setOpenDim(null)} apiProducts={apiProducts} apiLoading={apiLoading} />
              </div>
            )}

            <div style={{ marginTop: activeDim ? 0 : 32 }}>
              <GuidedPlayPaths pet={petData} />
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <PlayConciergeSection pet={petData} />
          </div>
        )}

        {activeTab === "find-play" && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <PlayNearMe pet={petData} token={token} onBook={handlePlayBook} />
          </div>
        )}

      </div>

      <ConciergeToast toast={conciergeToast} onClose={() => setConciergeToast(null)} />

      {/* PlayContentModal — opens when category strip pill is clicked (mirrors DineContentModal) */}
      <PlayContentModal
        isOpen={!!modalCategory}
        category={modalCategory}
        pet={petData}
        onClose={() => setModalCategory(null)}
      />
    </PillarPageLayout>
  );
};

export default PlaySoulPage;
