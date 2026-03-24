/**
 * LearnSoulPage.jsx — /learn pillar
 * The Doggy Company
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LOCKED — DO NOT TOUCH — AUDITED Mar 24, 2026              ║
 * ║  8-phase audit complete. Concierge wiring verified.         ║
 * ║  Content modal footer CTAs, breed guide, Pet Wrapped card.  ║
 * ║  Testing: iteration_202.json — 13/13 passed.               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Colour world: Deep Indigo #1A1363 + Violet #7C3AED
 * Replaces the old topic-card Learn page entirely.
 *
 * WIRING:
 *   1. Route:    <Route path="/learn" element={<LearnSoulPage/>}/>
 *   2. Products: GET /api/admin/pillar-products?pillar=learn&category=...
 *   3. Videos:   GET /api/test/youtube?query=...&max_results=6 (already built)
 *   4. Booking:  POST /api/concierge/learn-booking
 *   5. Services: GET /api/service-box/services?pillar=learn
 *
 * 7 dims: Foundations · Behaviour · Training · Tricks & Fun
 *         Enrichment · Know Your Breed · Soul Learn
 * Each dim has 3 tabs: Products | Videos | Services
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeCollection from "../components/SoulMadeCollection";
import SoulMadeModal from "../components/SoulMadeModal";
import ConciergeToast from "../components/common/ConciergeToast";
import LearnNearMe from "../components/learn/LearnNearMe";
import GuidedLearnPaths, { buildPaths as buildLearnGuidedPaths, PathFlowModal as LearnPathFlowModal } from "../components/learn/GuidedLearnPaths";
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from "../hooks/useMiraIntelligence";
import MiraImaginesCard from "../components/common/MiraImaginesCard";
import MiraImaginesBreed from "../components/common/MiraImaginesBreed";
import { API_URL } from "../utils/api";
import { MiraPicksSkeleton, ProductGridSkeleton } from "../components/common/ProductSkeleton";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";

// ─── SOUL CHIP (hero chips — same as CareHero) ───────────────
function SoulChip({ icon, label, value }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,borderRadius:9999,
      padding:"4px 12px",fontSize:11,fontWeight:600,color:"#fff",
      background:"rgba(255,255,255,0.14)",border:"1px solid rgba(255,255,255,0.25)"}}>
      {icon && <span>{icon}</span>}
      {label && <span style={{opacity:0.75}}>{label}:</span>}
      <span>{value}</span>
    </span>
  );
}

// ─── COLOUR SYSTEM ───────────────────────────────────────────
const G = {
  deep:       "#1A1363",
  mid:        "#3730A3",
  violet:     "#7C3AED",
  light:      "#A78BFA",
  pale:       "#EDE9FE",
  cream:      "#F5F3FF",
  pageBg:     "#F5F3FF",
  darkText:   "#1A1363",
  mutedText:  "#5B21B6",
  border:     "rgba(124,58,237,0.18)",
  borderLight:"rgba(124,58,237,0.10)",
  greenBorder:"rgba(124,58,237,0.28)",
  whiteDim:   "rgba(255,255,255,0.65)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── HELPERS ─────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }
const CLEAN_NONE = /^(no|none|none_confirmed|n\/a)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if(x&&!CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v&&!CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.allergies); add(pet?.allergies);
  return [...s].filter(Boolean);
}
function getHealth(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw.join(", ") : String(raw);
  return s.toLowerCase()==="none"||s.trim()===""?null:s;
}
function getAge(pet)    { 
  const raw = pet?.doggy_soul_answers?.age_years ?? pet?.age ?? null;
  if (raw === null || raw === undefined || raw === "" || raw === 0) return null;
  return parseInt(raw) || null;
}
function isSenior(pet)  { const a = getAge(pet); return a !== null && a >= 7; }
function isPuppy(pet)   { const a = getAge(pet); return a !== null && a <= 1; }
function getEnergy(pet) { return pet?.doggy_soul_answers?.energy_level||null; }
function isRescue(pet)  { return !!(pet?.doggy_soul_answers?.is_rescue||(""+pet?.origin).toLowerCase().includes("rescue")); }

// ─── DIM CONFIG ──────────────────────────────────────────────
function getLearnDims(pet) {
  const health = getHealth(pet);
  const senior = isSenior(pet);
  const puppy  = isPuppy(pet);
  const rescue = isRescue(pet);
  const energy = getEnergy(pet);
  const breed  = pet?.breed||pet?.doggy_soul_answers?.breed||null;
  const cap    = s => s?s[0].toUpperCase()+s.slice(1).toLowerCase():"";

  return [
    {
      id:"foundations", icon:"🎓", label:"Foundations",
      sub: puppy ? `First skills for ${pet?.name||"your puppy"}` : "First commands, recall & basics",
      badge: puppy?"Puppy priority":"Start here", badgeBg: puppy?G.violet:G.mid,
      glowColor:"rgba(124,58,237,0.30)", glow:true,
      mira: puppy
        ? `${pet?.name||"your puppy"} is at the perfect age — the first weeks shape everything. I've built the right start.`
        : `Every dog benefits from strong foundations. I've matched the essentials to {name}'s age and temperament.`,
      ytQuery:"puppy training basics dog commands",
    },
    {
      id:"behaviour", icon:"🧠", label:"Behaviour",
      sub: rescue?"Rescue dog support & understanding":health?"Behaviour support during treatment":"Understand, not just obey",
      badge: rescue?"Rescue support":health?"Health-aware":"Understand",
      badgeBg: rescue?"#C62828":health?"#AD1457":"#4A1D96",
      glowColor:"rgba(124,58,237,0.30)", glow:rescue||!!health,
      mira: rescue
        ? `Rescue dogs need patience and understanding, not commands. Everything here is trauma-aware for {name}.`
        : `Understanding why {name} does what they do changes everything. Products and sessions for every challenge.`,
      ytQuery:"dog behaviour modification calm anxiety understanding",
    },
    {
      id:"training", icon:"🏆", label:"Training",
      sub: energy==="high"||energy==="very high" ? `${cap(energy)} energy — channel it with training`
         : senior ? "Gentle senior refresher" : "Obedience, recall & commands",
      badge: energy==="high"||energy==="very high"?"Channel energy":senior?"Gentle pace":"Obedience",
      badgeBg: energy==="high"||energy==="very high"?G.violet:senior?"#1565C0":G.mid,
      glowColor:"rgba(124,58,237,0.22)", glow:energy==="high"||energy==="very high",
      mira: senior
        ? `Senior dogs can still learn — gentle refreshers keep the mind sharp and the bond strong.`
        : `I've built {name}'s training plan around their breed traits and current skill level.`,
      ytQuery:"dog obedience training recall sit stay commands",
    },
    {
      id:"tricks", icon:"✨", label:"Tricks & Fun",
      sub:"Fun skills, games & creative learning",
      badge:"Fun first", badgeBg:G.violet, glowColor:"rgba(124,58,237,0.20)", glow:false,
      mira:`Tricks aren't just fun — they build confidence and deepen the bond. I've picked the right complexity for {name}.`,
      ytQuery:"fun dog tricks clicker training step by step",
    },
    {
      id:"enrichment", icon:"🧩", label:"Enrichment",
      sub: senior||health?"Gentle mental enrichment":"Mental gym — puzzles & nose work",
      badge: senior||health?"Mental wellbeing":"Mental gym",
      badgeBg:senior||health?"#1565C0":G.violet,
      glowColor:"rgba(124,58,237,0.25)", glow:!!(senior||health),
      mira: senior||health
        ? `Mental enrichment is as important as physical — especially for {name}. Low-intensity, high-reward.`
        : `A mentally tired dog is a happy dog. I've matched the puzzle level to {name}'s drive.`,
      ytQuery:"dog mental enrichment puzzle snuffle nose work",
    },
    {
      id:"breed", icon:"📚", label:"Know Your Breed",
      sub: breed?`${breed} — everything you need to know`:"Breed guide, care & intelligence",
      badge:"Your breed", badgeBg:G.mid,
      glowColor:"rgba(124,58,237,0.25)", glow:true,
      mira: breed
        ? `I've curated everything specific to ${breed}s — care guide, training approach, what to watch for.`
        : `Every breed thinks differently. Understanding {name}'s breed unlocks everything.`,
      ytQuery: breed ? `${breed} dog care training tips` : "dog breed care training tips",
    },
    {
      id:"soul", icon:"🌟", label:"Soul Learn",
      sub: breed?`${breed} training journal, treat pouch & treat jar`:"Training journal, treat pouch & treat jar",
      badge:"Made for you", badgeBg:G.violet,
      glowColor:"rgba(124,58,237,0.22)", glow:true,
      mira:`{name}'s breed training journal, treat pouch, and treat jar — personalised for every session and milestone.`,
      ytQuery:null, // no videos for soul dim
    },
  ];
}

const DIM_ID_TO_CATEGORY = {
  foundations: "training",
  behaviour:   "behavior",
  training:    "training",
  tricks:      "tricks",
  enrichment:  "enrichment",
  breed:       "breed-training_logs",
  soul:        "breed-treat_pouchs",
  bundles:     "bundles",
};

// ─── MIRA INTELLIGENCE ───────────────────────────────────────
function applyMiraIntelligence(products, allergies, pet) {
  return products
    .filter(p => {
      if (!allergies.length) return true;
      const txt = `${p.name} ${p.description||""}`.toLowerCase();
      const free = (p.allergy_free||"").toLowerCase();
      return !allergies.some(a => {
        if (free.includes(`${a.toLowerCase()}-free`)||txt.includes(`${a.toLowerCase()}-free`)) return false;
        return txt.replace(new RegExp(`${a.toLowerCase()}[- ]free`,"gi"),"").includes(a.toLowerCase());
      });
    })
    .sort((a,b) => (b.mira_score||0)-(a.mira_score||0));
}

// ─── LEARN QUESTIONS ─────────────────────────────────────────
const LEARN_QUESTIONS = [
  { id:"learn_level",      chapter:"🎓 Current Level",   question:"What can {name} do right now?",              options:["Never been trained","Sit only","Sit, stay, come","Multiple commands","Advanced trained"], type:"single", pts:5 },
  { id:"learn_motivation", chapter:"🏆 Motivation",      question:"What motivates {name} most?",                options:["High-value treats","Praise and affection","Toys and play","Food — anything works","Varies"], type:"single", pts:4 },
  { id:"learn_focus",      chapter:"⏱ Focus span",       question:"How long can {name} focus in a session?",    options:["Under 5 min","5–10 min","10–15 min","15+ min"], type:"single", pts:3 },
  { id:"learn_challenges", chapter:"🧠 Behaviour",       question:"Any behaviour challenges?",                  options:["Pulling on lead","Jumping on people","Barking","Anxiety or fear","Recall issues","None currently"], type:"multi", pts:5 },
  { id:"learn_history",    chapter:"📋 Training history", question:"Has {name} done formal training before?",   options:["Puppy class","Obedience class","Private trainer","Self-taught at home","Never"], type:"single", pts:3 },
  { id:"learn_style",      chapter:"✨ Learns best by",  question:"How does {name} respond?",                   options:["Trick training","Nose work","Active movement","Calm structured work","Social/group learning"], type:"multi", pts:4 },
  { id:"learn_rescue",     chapter:"🐾 Background",      question:"Is {name} a rescue dog?",                   options:["Yes — recently adopted","Yes — settled in","No","Unsure of background"], type:"single", pts:3 },
  { id:"learn_goals",      chapter:"🌟 Your goals",       question:"What do you most want to achieve?",         options:["Basic obedience","Solve a behaviour","Build confidence","Fun tricks","Off-lead reliability","Better bond"], type:"multi", pts:5 },
];

// ─── BREED LEARN TIPS ─────────────────────────────────────────
const BREED_LEARN_TIPS = {
  "labrador":             { style:"Food-motivated — fastest learner with treats", path:"Retrieval + obedience; eager to please any task", enrichment:"Mental challenges daily to prevent boredom destruction", watch:"Distracted by food; short focused sessions work best" },
  "labrador retriever":   { style:"Food-motivated — fastest learner with treats", path:"Retrieval + obedience; eager to please any task", enrichment:"Mental challenges daily to prevent boredom destruction", watch:"Distracted by food; short focused sessions work best" },
  "indie":                { style:"Independent thinker — patience and positive reinforcement", path:"Nose work and exploration; calm confident guidance", enrichment:"Natural foraging — snuffle mats and nose work ideal", watch:"Can be stubborn; never respond to harsh training" },
  "indian street dog":    { style:"Independent thinker — patience and positive reinforcement", path:"Nose work and exploration; calm confident guidance", enrichment:"Natural foraging — snuffle mats and nose work ideal", watch:"Can be stubborn; never respond to harsh training" },
  "golden retriever":     { style:"One of the most trainable breeds — loves learning", path:"Any method works; excellent at complex multi-step tasks", enrichment:"Advanced puzzles + trick chains; needs mental outlet", watch:"Matures slowly; keep sessions playful not serious" },
  "german shepherd":      { style:"Highly intelligent — needs a job or becomes anxious", path:"Structured obedience, tracking, protection sport", enrichment:"Advanced puzzles + scent work + agility daily", watch:"Under-stimulation causes destructive behaviour" },
  "shih tzu":             { style:"Can be independent — patience and small treats work best", path:"Short 5-10 min sessions; very food-motivated", enrichment:"Indoor puzzle toys; not highly driven for active enrichment", watch:"Stubborn streak; quit if sessions too long" },
  "poodle":               { style:"Exceptionally intelligent — learns complex tasks quickly", path:"Trick training, agility, advanced commands; learns very fast", enrichment:"Level 2-3 puzzles; mental challenge is essential", watch:"Gets bored with repetition; rotate exercises frequently" },
  "beagle":               { style:"Scent-driven — nose overrides most training commands", path:"Scent work and nose work is the natural training path", enrichment:"Snuffle mats, nose work kits — 30+ min daily", watch:"Recall very difficult due to scent; always use enclosed area" },
  "border collie":        { style:"Most intelligent breed — needs constant mental stimulation", path:"Agility, herding, complex command chains, advanced tricks", enrichment:"Level 3+ puzzles, nose work, agility every day", watch:"Without 2h+ mental work daily → anxiety, obsessive behaviour" },
  "french bulldog":       { style:"Moderate intelligence — learns basics quickly", path:"Short positive sessions; clicker training works well", enrichment:"Food puzzles + interactive toys; not highly active", watch:"Brachycephalic — no extended training in heat" },
  "husky":                { style:"Intelligent but will test every boundary", path:"Challenging; high patience needed; never punish", enrichment:"Complex scent work, running with owner", watch:"Will ignore commands if uninterested; make training genuinely fun" },
  "rottweiler":           { style:"Confident and intelligent — needs clear leadership", path:"Obedience, impulse control, structured leadership programme", enrichment:"Nose work, advanced obedience, weight pull activities", watch:"Needs consistent, firm but positive handling" },
  "boxer":                { style:"Playful and energetic — responds well to fun training", path:"Obedience through play; trick training keeps them engaged", enrichment:"Physical + mental combo — fetch + puzzles", watch:"Can be boisterous; impulse control is priority" },
  "cocker spaniel":       { style:"Eager to please — gentle and responsive", path:"Basic obedience; responds to quiet, positive guidance", enrichment:"Nose work and gentle enrichment; very scent-driven", watch:"Can be sensitive; harsh corrections cause shutdown" },
  "doberman":             { style:"Highly intelligent and alert — takes to training very quickly", path:"Advanced obedience, agility, protection sport", enrichment:"Complex nose work + agility + trick chains", watch:"Needs early socialisation; boredom leads to anxiety" },
  "chihuahua":            { style:"Intelligent but can be wilful — small dog big personality", path:"Short 5-min sessions; high-value treats essential", enrichment:"Mini puzzles, lick mats, indoor nose work", watch:"Can develop fear-based behaviour; never force socialisation" },
  "pug":                  { style:"Food-motivated but low endurance — make it fun and short", path:"Positive reinforcement with treats; basic obedience", enrichment:"Puzzle feeders and lick mats; no vigorous activity", watch:"Brachycephalic — monitor breathing during all activity" },
  "maltese":              { style:"Smart and eager to please — learns quickly with praise", path:"Trick training and basic obedience; responds to voice + treats", enrichment:"Indoor puzzles and gentle enrichment", watch:"Can be anxious; calm training environment essential" },
  "yorkshire terrier":    { style:"Alert and feisty — more capable than their size suggests", path:"Short consistent sessions; trick training works well", enrichment:"Puzzle toys and indoor nose work", watch:"Stubborn streak; patience and positive only" },
  "dachshund":            { style:"Independent and persistent — was bred to think alone", path:"Short 5-10 min sessions; scent work natural for them", enrichment:"Snuffle mats + nose work + burrowing activities", watch:"Back problems — avoid high-jump tricks; recall challenging" },
  "lhasa apso":           { style:"Independent and watchful — takes time to trust", path:"Patience-first; build trust before commands", enrichment:"Indoor puzzles; not highly active", watch:"Can be aloof; never force; let them come to you" },
  "dalmatian":            { style:"High energy and intelligent — needs physical + mental", path:"Active obedience + agility; needs an outlet", enrichment:"Running + complex tasks + agility", watch:"Can be hyperactive; exercise BEFORE training sessions" },
  "great dane":           { style:"Gentle giant — responds to calm, consistent guidance", path:"Basic obedience + impulse control; size management important", enrichment:"Slow-feeder puzzles + calm enrichment", watch:"Short sessions; joints vulnerable; no high-impact tricks" },
  "american bully":       { style:"Eager to please — strong food drive makes training rewarding", path:"Positive reinforcement obedience; impulse control priority", enrichment:"Tug + food puzzles + structured play", watch:"Needs early socialisation with people and dogs" },
  "jack russell":         { style:"High energy, quick learner — can be wilful without structure", path:"Fast-paced trick training + recall + agility", enrichment:"High-energy enrichment: agility, fetch, nose work", watch:"Boredom causes destruction; 30+ min mental work daily" },
  "jack russell terrier": { style:"High energy, quick learner — can be wilful without structure", path:"Fast-paced trick training + recall + agility", enrichment:"High-energy enrichment: agility, fetch, nose work", watch:"Boredom causes destruction; 30+ min mental work daily" },
  "cavalier":             { style:"Gentle and eager to please — responds beautifully to positive training", path:"Basic obedience and trick training; calm environment", enrichment:"Gentle enrichment + sniff walks + lick mats", watch:"Can be very sensitive; gentle approach always" },
  "cavalier king charles":{ style:"Gentle and eager to please — responds beautifully to positive training", path:"Basic obedience and trick training; calm environment", enrichment:"Gentle enrichment + sniff walks + lick mats", watch:"Can be very sensitive; gentle approach always" },
  "samoyed":              { style:"Friendly and intelligent — distracted by everything interesting", path:"Obedience + nose work + agility; keep varied", enrichment:"Scent games + pulling activities (if fit)", watch:"Easily distracted outdoors; indoor training first" },
  "corgi":                { style:"Intelligent herder — learns quickly, has strong opinions", path:"Herding instinct outlets + advanced obedience + agility", enrichment:"High-energy mental tasks + nose work", watch:"Can be bossy; set clear boundaries early" },
  "akita":                { style:"Independent and strong-willed — requires experienced handling", path:"Basic obedience + impulse control; respect-based training", enrichment:"Nose work and calm enrichment", watch:"Needs experienced handler; not for first-time owners" },
  "shiba inu":            { style:"Cat-like independence — will only engage if they see value", path:"Short sessions; high-value reward; recall is challenging", enrichment:"Puzzle feeders + indoor nose work", watch:"Escape artists; never off-lead without recall mastered" },
  "australian shepherd":  { style:"Highly intelligent working dog — needs purpose every day", path:"Agility, herding, advanced tricks, complex command chains", enrichment:"2h+ mental work minimum; level 3 puzzles", watch:"Without a job becomes anxious and destructive" },
  "chow chow":            { style:"Aloof and independent — bonds strongly with family only", path:"Trust-building first; gentle consistent guidance", enrichment:"Calm indoor enrichment; not highly active", watch:"Can be aggressive with strangers; heavy socialisation needed" },
  "pomeranian":           { style:"Alert and intelligent — bigger personality than body", path:"Trick training + basic obedience; thrives on praise", enrichment:"Indoor puzzles + trick chains", watch:"Barky if under-stimulated; nose work helps" },
  "schnauzer":            { style:"Smart and spirited — responds well to consistent guidance", path:"Obedience + nose work + agility; versatile learner", enrichment:"Scent work + complex puzzles", watch:"Can be stubborn; clear leadership needed" },
};

// ─── LEARN PROFILE COMPONENT (collapsed bar → modal, matches Care's WellnessProfile) ──
function LearnProfile({ pet, token }) {
  const petName    = pet?.name || "your dog";
  const breedKey   = (pet?.breed||"indie").toLowerCase().replace(/\s*\(.*\)/,"").trim();
  const breedLabel = (pet?.breed||"Indie").split("(")[0].trim();
  const tip        = BREED_LEARN_TIPS[breedKey] || BREED_LEARN_TIPS["indie"];
  const energy     = getEnergy(pet);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [answers,    setAnswers]    = useState({});
  const [saved,      setSaved]      = useState({});
  const [submitting, setSubmitting] = useState({});
  const [totalPts,   setTotalPts]   = useState(0);
  const [liveScore,  setLiveScore]  = useState(pet?.overall_score||pet?.soul_score||0);

  const remaining = LEARN_QUESTIONS.filter(q => !saved[q.id]);

  const toggle = (qId, val, single) => {
    setAnswers(prev => {
      const cur = prev[qId]||[];
      if (single) return { ...prev, [qId]: cur[0]===val?[]:[val] };
      return { ...prev, [qId]: cur.includes(val)?cur.filter(v=>v!==val):[...cur,val] };
    });
  };

  const save = async (q) => {
    const ans = answers[q.id];
    if (!ans||(Array.isArray(ans)&&ans.length===0)) return;
    setSubmitting(p=>({...p,[q.id]:true}));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({question_id:q.id,answer:ans}),
      });
      if (res.ok) { const d=await res.json(); if(d.scores?.overall) setLiveScore(d.scores.overall); }
      setSaved(p=>({...p,[q.id]:true}));
      tdc.request({ text: `Soul answer for ${petName}: ${q.text || q.id}`, pillar: 'learn', pet, channel: 'learn_soul_profile' });
      setTotalPts(p => p + q.pts);
    } catch { setSaved(p=>({...p,[q.id]:true})); }
    finally { setSubmitting(p=>({...p,[q.id]:false})); }
  };

  return (
    <>
      {/* ── COLLAPSED BAR (always visible) ── */}
      <div onClick={() => setDrawerOpen(true)} data-testid="learn-profile-bar"
        style={{ background:"#fff", border:`2px solid ${G.pale}`, borderRadius:16,
          padding:"14px 18px", marginBottom:20, cursor:"pointer",
          display:"flex", alignItems:"center", gap:14,
          boxShadow:`0 2px 12px rgba(124,58,237,0.08)` }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, fontSize:20,
          background:`linear-gradient(135deg,${G.pale},${G.light})`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>🎓</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText }}>{petName}'s Learning Profile</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:5 }}>
            {pet?.breed && <span style={{ fontSize:11, fontWeight:600, color:"#1A1363", background:"#EDE9FE", border:"1px solid #A78BFA", borderRadius:20, padding:"3px 10px" }}>🐾 {pet.breed} · {tip.style.slice(0,28)}…</span>}
            {energy && <span style={{ fontSize:11, fontWeight:600, color:G.mid, background:G.pale, border:`1px solid ${G.light}`, borderRadius:20, padding:"3px 10px" }}>⚡ {energy}</span>}
            {isPuppy(pet) && <span style={{ fontSize:11, fontWeight:600, color:"#1565C0", background:"#E3F2FD", border:"1px solid #90CAF9", borderRadius:20, padding:"3px 10px" }}>🐾 Puppy programme</span>}
            {isSenior(pet) && <span style={{ fontSize:11, fontWeight:600, color:"#C62828", background:"#FFEBEE", border:"1px solid #EF9A9A", borderRadius:20, padding:"3px 10px" }}>🐾 Senior enrichment</span>}
            {!pet?.breed && !energy && <span style={{ fontSize:12, color:"#999" }}>Tap to tell Mira about {petName}'s learning style</span>}
          </div>
        </div>
        <span style={{ fontSize:11, color:G.violet, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>Mira's picks →</span>
      </div>

      {/* ── MODAL ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:10002, background:"rgba(0,0,0,0.72)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} data-testid="learn-profile-drawer"
            style={{ width:"min(780px,100%)", maxHeight:"90vh", overflowY:"auto",
              borderRadius:24, background:"#fff",
              boxShadow:"0 24px 80px rgba(0,0,0,0.55)",
              display:"flex", flexDirection:"column" }}>

            {/* Dark indigo header — sticky */}
            <div style={{ borderRadius:"24px 24px 0 0", padding:"24px 28px 20px",
              background:`linear-gradient(135deg,#0A0A3C 0%,${G.deep} 60%,${G.mid} 100%)`,
              flexShrink:0, position:"sticky", top:0, zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <p style={{ fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em",
                    color:`${G.light}E6`, fontSize:10, marginBottom:5 }}>
                    ✦ GROW {petName.toUpperCase()}'S LEARNING PROFILE
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.50)", fontSize:12 }}>
                    {liveScore >= 95
                      ? `${petName}'s learning profile is complete — Mira has everything she needs`
                      : liveScore >= 70
                        ? `Answer a few more · ${petName}'s profile is looking great`
                        : `Answer quick questions · ${petName}'s learning profile is being built`}
                  </p>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:2 }}>
                  <span style={{ fontSize:72, fontWeight:900, lineHeight:1,
                    color:liveScore>=80?G.pale:G.light,
                    textShadow:`0 0 20px ${G.light}80` }}>
                    {liveScore ?? "—"}
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.40)", fontSize:18, marginBottom:8 }}>%</span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height:5, borderRadius:5, background:"rgba(255,255,255,0.10)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${liveScore||0}%`, borderRadius:5,
                  background:`linear-gradient(90deg,${G.violet},${G.light})`,
                  transition:"width 0.9s ease-out" }} />
              </div>
              {/* Close button */}
              <button onClick={() => setDrawerOpen(false)} data-testid="learn-profile-drawer-close"
                style={{ position:"absolute", top:16, right:20,
                  background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)",
                  borderRadius:20, width:32, height:32, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:16, cursor:"pointer",
                  color:"rgba(255,255,255,0.70)" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:"24px 28px", background:"#fff" }}>
              {totalPts > 0 && (
                <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8,
                  padding:"10px 14px", borderRadius:12,
                  background:"rgba(124,58,237,0.08)", border:`1px solid rgba(124,58,237,0.25)` }}>
                  <Check size={14} style={{ color:G.light, flexShrink:0 }} />
                  <p style={{ fontSize:13, fontWeight:600, color:G.light }}>Answers saved · +{totalPts} pts added to soul score</p>
                </div>
              )}

              {/* Breed tips */}
              <div style={{ marginBottom:22, borderRadius:16, overflow:"hidden", border:`1.5px solid ${G.borderLight}` }}>
                <div style={{ background:`linear-gradient(135deg,#0A0A3C,${G.deep})`, padding:"14px 18px 12px" }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:11, textTransform:"uppercase", letterSpacing:"0.10em", color:G.light }}>Learning Tips · {breedLabel}</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"rgba(255,255,255,0.55)" }}>{tip.style}</p>
                </div>
                <div style={{ background:G.cream, padding:"14px 18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
                    {[
                      {label:"🏆 Training path",  text:tip.path,       color:"#7C3AED"},
                      {label:"🧩 Enrichment",     text:tip.enrichment, color:"#1565C0"},
                    ].map((item,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", borderRadius:10, background:"#fff", border:`1px solid ${G.borderLight}` }}>
                        <p style={{ margin:0, fontSize:11, color:G.darkText, lineHeight:1.5 }}><strong style={{color:item.color}}>{item.label}</strong><br/>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  {tip.watch && (
                    <div style={{ padding:"8px 12px", borderRadius:10, background:"#FFF3E0", border:"1px solid #FFCC80" }}>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#E65100", marginBottom:3 }}>Watch for</p>
                      <p style={{ margin:0, fontSize:10, color:"#BF360C", lineHeight:1.4 }}>{tip.watch}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions */}
              {remaining.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>🎓</div>
                  <p style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>
                    {liveScore >= 95 ? `${petName}'s learning profile is complete!` : `All current questions answered for ${petName}`}
                  </p>
                  <p style={{ fontSize:12, color:"#888" }}>
                    {liveScore >= 95 ? "Mira has everything she needs" : `Score: ${liveScore}%`}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:11, fontWeight:600, color:"#999", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>
                    {remaining.length} questions remaining
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(320px,100%),1fr))", gap:14 }}>
                    {remaining.slice(0,6).map(q => {
                      const qAns=answers[q.id]||[], isSaved=saved[q.id], isSend=submitting[q.id];
                      const label=q.question.replace(/{name}/g,petName), hasAns=qAns.length>0;
                      if (isSaved) return (
                        <div key={q.id} style={{ borderRadius:14, padding:16, background:G.cream, border:`2px solid ${G.light}60`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, minHeight:100 }}>
                          <Check size={18} style={{color:G.violet}} />
                          <p style={{ fontWeight:700, color:G.violet, fontSize:13, textAlign:"center" }}>Soul score growing!</p>
                          <div style={{ borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, background:G.pale, color:G.mid }}>+{q.pts} pts</div>
                        </div>
                      );
                      return (
                        <div key={q.id} style={{ borderRadius:14, padding:"14px 16px 12px", background:"#fff", border:`1.5px solid ${G.borderLight}` }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                            <span style={{ fontSize:10, fontWeight:600, color:G.mutedText }}>{q.chapter}</span>
                            <span style={{ borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, background:G.pale, color:G.violet }}>+{q.pts} pts</span>
                          </div>
                          <p style={{ fontWeight:700, fontSize:13, color:G.darkText, marginBottom:10, lineHeight:1.4 }}>{label}</p>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                            {q.options.map(opt => {
                              const sel = q.type==="single"?qAns[0]===opt:qAns.includes(opt);
                              return (
                                <button key={opt} onClick={e=>{e.stopPropagation();e.preventDefault();toggle(q.id,opt,q.type==="single");}}
                                  style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:sel?700:400,
                                    cursor:"pointer", background:sel?G.pale:"#F5F5F5",
                                    border:sel?`1.5px solid ${G.violet}`:"1px solid #E0E0E0",
                                    color:sel?G.violet:"#555", transition:"all 0.12s" }}>
                                  {opt.replace(/{name}/g,petName)}
                                </button>
                              );
                            })}
                          </div>
                          <button onClick={e=>{e.stopPropagation();e.preventDefault();save(q);}} disabled={isSend||!hasAns}
                            style={{ width:"100%", borderRadius:10, padding:"9px", fontSize:12, fontWeight:700,
                              color:"#fff", border:"none", cursor:isSend?"wait":!hasAns?"not-allowed":"pointer",
                              background:!hasAns?`${G.violet}44`:`linear-gradient(135deg,${G.violet},${G.mid})`,
                              opacity:isSend?0.7:1 }}>
                            {isSend ? "Saving…" : `Save +${q.pts} pts`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <div style={{ textAlign:"center", marginTop:16 }}>
                <a href={`/pet-soul/${pet?.id}`} style={{ fontSize:12, fontWeight:600, color:G.violet, textDecoration:"none" }}>
                  See full soul profile →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ─── BREED FILTER (matches Care/Play exactly — never show wrong breeds) ──────
const KNOWN_BREEDS = [
  'american bully','beagle','border collie','boxer','cavalier','chihuahua',
  'chow chow','cocker spaniel','dachshund','dalmatian','doberman',
  'english bulldog','french bulldog','german shepherd','golden retriever',
  'great dane','husky','indie','irish setter','italian greyhound',
  'jack russell','labrador','lhasa apso','maltese','pomeranian',
  'poodle','pug','rottweiler','schnoodle','scottish terrier',
  'shih tzu','st bernard','saint bernard','yorkshire',
  'akita','australian shepherd','corgi','samoyed','spitz',
  'bernese mountain dog','bulldog','shiba inu','weimaraner',
];

function filterBreedProducts(products, petBreed) {
  const petLower = (petBreed || '').trim().toLowerCase();
  const petWords = petLower.split(/\s+/).filter(w => w.length > 2);
  return products.filter(p => {
    const nameLower = (p.name || '').toLowerCase();
    for (const breed of KNOWN_BREEDS) {
      if (nameLower.includes(breed)) {
        if (!petLower) return false;
        if (nameLower.includes(petLower)) return true;
        if (petWords.some(w => breed.includes(w) || breed.startsWith(w))) return true;
        return false;
      }
    }
    return true;
  });
}

// ─── LEARN CATEGORY CONFIG (strip pills + content modal) ────────────────────
// dbCategory must match actual 'category' field in MongoDB (not dimension, which is unset until DB scripts run)
const LEARN_CATS = [
  { id:"foundations", icon:"🎓", label:"Foundations",    dbCategory:"training",                bg:"#EDE9FE", accent:"#7C3AED" },
  { id:"behaviour",   icon:"🧠", label:"Behaviour",      dbCategory:"behavior",                bg:"#FFF3E0", accent:"#F57C00" },
  { id:"training",    icon:"🏆", label:"Training",       dbCategory:"training",                bg:"#E3F2FD", accent:"#1565C0" },
  { id:"tricks",      icon:"✨", label:"Tricks & Fun",   dbCategory:"tricks",                  bg:"#FCE4EC", accent:"#C2185B" },
  { id:"enrichment",  icon:"🧩", label:"Enrichment",     dbCategory:"classes",                 bg:"#E8F5E9", accent:"#2E7D32" },
  { id:"breed",       icon:"📚", label:"Know Your Breed",dbCategory:"breed-training_logs",     bg:"#FFF8E1", accent:"#FF8F00" },
  { id:"soul",        icon:"🌟", label:"Soul Learn",     dbCategory:"breed-treat_pouchs",      bg:"#F3E5F5", accent:"#7B1FA2" },
  { id:"bundles",     icon:"🎁", label:"Bundles",        dbCategory:"bundles",                 bg:"#E8F5E9", accent:"#2E7D32" },
  { id:"mira",        icon:"✦",  label:"Mira's Picks",  dbCategory:null,                      bg:"#E8EAF6", accent:"#3949AB" },
  { id:"soul_made",   icon:"✦",  label:"Soul Made™",    dbCategory:null,                      bg:"#F3E5F5", accent:"#7C3AED" },
];

const LEARN_MIRA_QUOTES = {
  foundations: (n,b) => b ? `I built ${n}'s foundation plan around ${b} traits — short, rewarding sessions.` : `Every great learner starts here. ${n}'s foundation programme is ready.`,
  behaviour:   (n) => `Behaviour shapes everything. I picked the gentlest, most effective tools for ${n}.`,
  training:    (n,b) => b ? `${b}s respond best to specific techniques — I filtered everything for ${n}.` : `Training unlocks connection. These are ranked for ${n}'s energy and age.`,
  tricks:      (n) => `Learning through play is the fastest path. ${n} will love these.`,
  enrichment:  (n) => `Mental enrichment is as important as physical. These are top-rated for ${n}'s IQ.`,
  breed:       (n,b) => b ? `Everything I know about ${b}s — in one place, personalised for ${n}.` : `Know your breed, know your dog. Personalised for ${n}.`,
  soul:        (n,b) => b ? `${n}'s ${b} soul — journals, pouches, and guides made just for your breed.` : `Soulful learning tools made just for ${n}.`,
  mira:        (n) => `My top learning picks for ${n} — ranked by fit, not popularity.`,
  soul_made:   (n) => `Want something truly one-of-a-kind for ${n}? Upload a photo — Concierge® creates it.`,
};

// ─── LEARN CONTENT MODAL (opens from category strip pill) ───────────────────
function LearnContentModal({ isOpen, onClose, category, pet }) {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [selProd,  setSelProd]    = useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [guidedPath, setGuidedPath] = useState(null);
  const { token } = useAuth();
  const catCfg = LEARN_CATS.find(c => c.id === category) || {};
  const petName = pet?.name || "your dog";
  const breed   = pet?.breed ? pet.breed.split("(")[0].trim() : "";
  const miraQ   = LEARN_MIRA_QUOTES[category];
  const quote   = miraQ ? miraQ(petName, breed) : `Personalised for ${petName}.`;

  // Category → guided path mapping (only for categories that have a guided path)
  const CAT_TO_PATH = {
    foundations: "new_puppy",
    behaviour:  "behaviour",
    training:   "basic_training",
    tricks:     "enrichment",
    enrichment: "enrichment",
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    if (category === "soul_made") {
      const breedParam = encodeURIComponent((pet?.breed || '').trim().toLowerCase());
      fetch(`${API_URL}/api/mockups/breed-products?breed=${breedParam}&pillar=learn`)
        .then(r => r.ok ? r.json() : { products: [] })
        .then(data => setProducts(data.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
      return;
    }
    if (category === "mira") {
      if (!pet?.id) { setLoading(false); return; }
      const breedParam = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : "";
      // Try claude-picks first; fall back to pillar-products sorted by mira_score
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn&limit=16&min_score=40&entity_type=product${breedParam}`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r => r.json())
        .then(d => {
          const scored = filterBreedProducts(d.picks || [], pet?.breed);
          if (scored.length > 0) { setProducts(scored); setLoading(false); return; }
          // Fallback: fetch all learn products, sort by mira_score
          return fetch(`${API_URL}/api/admin/pillar-products?pillar=learn&limit=400`, {
            headers: token ? { Authorization:`Bearer ${token}` } : {}
          })
            .then(r => r.json())
            .then(pd => {
              const all = filterBreedProducts(pd.products || [], pet?.breed);
              const withScore = all.filter(p => p.mira_score || p.mira_tag);
              const sorted = withScore.length > 0
                ? withScore.sort((a,b)=>(b.mira_score||0)-(a.mira_score||0)).slice(0,16)
                : filterBreedProducts(all, pet?.breed).slice(0,16);
              setProducts(sorted);
            });
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
      return;
    }
    // Bundles — fetch and deduplicate by name
    if (category === "bundles") {
      fetch(`${API_URL}/api/bundles?pillar=learn&active_only=true&limit=30`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r => r.json())
        .then(d => {
          const all = d.bundles || d.items || [];
          // Deduplicate by name (keep first occurrence)
          const seen = new Set();
          const deduped = all.filter(b => {
            const key = (b.name||"").toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setProducts(deduped.map(b=>({...b, isBundle:true})));
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
      return;
    }
    // Use larger limit for breed-specific categories so filterBreedProducts finds the right breed
    const breedLimit = ["breed-training_logs","breed-treat_pouchs","breed-treat_jars","breed-care-guide"].includes(catCfg.dbCategory) ? 100 : 12;
    const params = new URLSearchParams({ pillar:"learn", category:catCfg.dbCategory, limit:breedLimit });
    // Don't pass breed to API — filterBreedProducts handles it client-side by product name
    fetch(`${API_URL}/api/admin/pillar-products?${params}`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => setProducts(filterBreedProducts(d.products || [], pet?.breed)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isOpen, category, pet?.id, pet?.breed]);

  if (!isOpen) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.72)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} data-testid={`learn-cat-modal-${category}`}
        style={{width:"min(700px,100%)",maxHeight:"88vh",overflowY:"auto",borderRadius:20,
          background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.45)",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{borderRadius:"20px 20px 0 0",padding:"20px 22px 16px",
          background:`linear-gradient(135deg,#1A1363 0%,${G.deep} 70%,${G.mid} 100%)`,
          flexShrink:0,position:"sticky",top:0,zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:catCfg.bg||"#EDE9FE",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                {catCfg.icon}
              </div>
              <div>
                <p style={{fontWeight:800,color:"#fff",fontSize:15,margin:0}}>{catCfg.label}</p>
                <p style={{color:"rgba(255,255,255,0.55)",fontSize:11,margin:0}}>For {petName}{breed?` · ${breed}`:""}</p>
              </div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:20,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",color:"rgba(255,255,255,0.70)",fontSize:16}}>✕</button>
          </div>
          {/* Mira quote */}
          <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:13,color:G.light,flexShrink:0}}>✦</span>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.80)",fontStyle:"italic",margin:0,lineHeight:1.5}}>{quote}</p>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:"18px 20px"}}>
          {loading && (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <Loader2 size={24} style={{color:G.violet,animation:"spin 1s linear infinite"}}/>
            </div>
          )}

          {/* MIRA PICKS — imagines AT TOP (PET FIRST, BREED NEXT), then real products */}
          {!loading && category === "mira" && (
            <>
              {/* Imagines at top — always show in Mira Picks modal */}
              <div style={{marginBottom:20}}>
                <p style={{fontSize:11,fontWeight:700,color:G.violet,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>✦ Mira Imagines for {petName}</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(160px,100%),1fr))",gap:10}}>
                  {[
                    {id:"mi-1",emoji:"🎓",name:`${petName}'s ${isPuppy(pet)?"Puppy":"Adult"} Foundations Kit`,description:`Clicker, treat pouch, training log — ${breed?`built for ${breed}s`:"built for "+petName}.`},
                    ...(breed?[{id:"mi-2",emoji:"📚",name:`${breed} Learning Pack`,description:`Breed-specific flashcards, care guide, and enrichment toys — because ${petName} is a ${breed}.`}]:[{id:"mi-2",emoji:"📚",name:`${petName}'s Brain Games Set`,description:`Puzzle feeder, snuffle mat, IQ toy — Mira's weekly enrichment picks for ${petName}.`}]),
                    {id:"mi-3",emoji:"🌟",name:`${petName}'s Soul Learn Kit`,description:breed?`Training journal, treat jar, and ${breed} breed guide.`:`Training journal, treat jar, and enrichment guide.`},
                  ].map(item=>(
                    <MiraLearnImagineCard key={item.id} item={item} pet={pet} token={token}/>
                  ))}
                </div>
              </div>
              {/* Divider */}
              {products.length > 0 && (
                <div style={{borderTop:`1px solid ${G.borderLight}`,paddingTop:16,marginBottom:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:G.mutedText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Mira's Scored Products for {petName}</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>
                    {products.map(p=>(
                      <SharedProductCard key={p.id||p._id} product={p} pet={pet}
                        onViewDetails={()=>setSelProd(p)} accentColor={G.violet}/>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* BUNDLES display */}
          {!loading && category === "bundles" && products.length > 0 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>
              {products.map(b=>(
                <div key={b.id||b._id} style={{borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",background:"#fff"}}>
                  {/* Bundle watercolour image */}
                  {(b.watercolor_image||b.image_url||b.mockup_url) ? (
                    <div style={{height:120,overflow:"hidden"}}>
                      <img src={b.watercolor_image||b.image_url||b.mockup_url} alt={b.name}
                        style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                    </div>
                  ) : (
                    <div style={{height:100,background:`linear-gradient(135deg,${G.violet}22,${G.mid}11)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>{b.icon||"🎁"}</div>
                  )}
                  <div style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div>
                      <p style={{fontWeight:800,fontSize:14,color:G.darkText,margin:0}}>{b.name}</p>
                      {b.discount>0&&<span style={{fontSize:10,fontWeight:700,color:"#16A34A",background:"#DCFCE7",borderRadius:20,padding:"2px 8px"}}>{b.discount}% off</span>}
                    </div>
                  </div>
                  <p style={{fontSize:12,color:G.mutedText,lineHeight:1.5,marginBottom:10}}>{b.description}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      {/* Bundle prices hidden — concierge-first model */}
                    </div>
                    <button
                      onClick={async () => {
                        // Bundles are bespoke — request via concierge, not add to cart
                        const { sendToAdminInbox } = await import('../utils/sendToAdminInbox');
                        await sendToAdminInbox({
                          service: `Bundle: ${b.name}`,
                          pillar: "learn",
                          pet,
                          channel: "learn_bundle_add",
                          notes: `Bundle price: ₹${b.bundle_price}. ${b.description || ''}`,
                          urgency: "high",
                        });
                        tdc.cart({ product: b, pillar: "learn", pet, channel: "learn_bundles", amount: b.bundle_price });
                        // Show confirmation
                        const btn = document.querySelector(`[data-testid="learn-bundle-add-${b.id||b._id}"]`);
                        if (btn) { btn.textContent = "✓ Requested!"; btn.style.background = "#10B981"; setTimeout(() => { if(btn){btn.textContent="Add →";btn.style.background=`linear-gradient(135deg,${G.violet},${G.mid})`;}},2000); }
                      }}
                      data-testid={`learn-bundle-add-${b.id||b._id}`}
                      style={{background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",border:"none",borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                      Add →
                    </button>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}

          {/* Standard category products */}
          {!loading && category !== "mira" && category !== "bundles" && category !== "soul_made" && products.length === 0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:"#888"}}>
              <div style={{fontSize:32,marginBottom:10}}>📦</div>
              <p style={{fontWeight:600,marginBottom:4}}>Products being added</p>
              <p style={{fontSize:13}}>Mira is curating {petName}'s {catCfg.label} kit — check back soon.</p>
            </div>
          )}
          {!loading && category !== "mira" && category !== "bundles" && category !== "soul_made" && products.length > 0 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>
              {products.map(p => (
                <SharedProductCard key={p.id||p._id} product={p} pet={pet}
                  onViewDetails={() => setSelProd(p)} accentColor={catCfg.accent||G.violet}/>
              ))}
            </div>
          )}

          {/* ── Breed-only sections: Mira's Breed Guide + Pet Wrapped ── */}
          {!loading && category === 'breed' && (
            <>
              {/* Section 1: Mira's Breed Guide */}
              <div style={{
                margin: '24px 0',
                background: 'linear-gradient(135deg, #1a0a2e, #2d0a4e)',
                border: '1px solid rgba(196,77,255,0.2)',
                borderRadius: 16, padding: '20px 24px'
              }}>
                <div style={{fontSize:10, fontWeight:700, color:'#C44DFF',
                  letterSpacing:'0.12em', marginBottom:12}}>
                  {`\u2726 MIRA ON ${(pet?.breed || 'YOUR BREED').toUpperCase()}`}
                </div>
                <div style={{fontSize:18, fontWeight:700, color:'#F5F0E8',
                  fontFamily:'Georgia,serif', marginBottom:16}}>
                  What makes {pet?.breed || 'your dog'} special
                </div>
                <MiraImaginesBreed pet={pet} pillar="learn" colour="#C44DFF"
                  onConcierge={(product) => {
                    tdc.book({ service: product?.name || 'Breed Guide', pillar: 'learn',
                      pet, channel: 'learn_breed_guide' });
                  }}
                />
              </div>

              {/* Section 2: Pet Wrapped Card */}
              <div
                data-testid="learn-breed-wrapped-card"
                onClick={() => { window.location.href = `/wrapped/${pet?.id}`; }}
                style={{
                  margin: '16px 0 24px',
                  background: 'linear-gradient(135deg, #0F0A1E 0%, #1a0a2e 50%, #2d1045 100%)',
                  border: '1.5px solid rgba(201,151,58,0.4)',
                  borderRadius: 18, padding: '20px 24px',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; }}
              >
                <div style={{position:'absolute', top:-40, right:-40, width:160, height:160,
                  background:'radial-gradient(circle,rgba(201,151,58,0.15) 0%,transparent 70%)',
                  pointerEvents:'none'}}/>
                <div style={{fontSize:10, fontWeight:800, letterSpacing:'0.15em',
                  color:'#C9973A', marginBottom:8}}>
                  PET WRAPPED · 2026
                </div>
                <div style={{fontSize:20, fontWeight:800, color:'#F5F0E8',
                  fontFamily:'Georgia,serif', marginBottom:6}}>
                  {petName}'s year in full.
                </div>
                <div style={{fontSize:13, color:'rgba(245,240,232,0.5)', marginBottom:16}}>
                  Soul score · Milestones · Mira's letter · Everything {petName} lived this year
                </div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'linear-gradient(135deg, #C9973A, #A07020)',
                  borderRadius:30, padding:'10px 22px',
                  fontSize:13, fontWeight:700, color:'#fff',
                }}>
                  See {petName}'s 2026 Wrapped →
                </div>
              </div>
            </>
          )}

          {/* Soul Made™ section */}
          {!loading && category === "soul_made" && (
            <>
              {products.length > 0 ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>
                  {products.map(p => (
                    <SharedProductCard key={p.id||p._id} product={p} pet={pet}
                      onViewDetails={() => setSelProd(p)} accentColor={G.violet}/>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:"center",padding:"32px 0",color:"#888"}}>
                  <div style={{fontSize:28,marginBottom:10}}>✦</div>
                  <p style={{fontSize:14}}>We're curating breed-specific items for {petName}. Check back soon!</p>
                </div>
              )}
              <div data-testid="soul-made-trigger" onClick={() => setSoulMadeOpen(true)} style={{
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
              {soulMadeOpen && <SoulMadeModal pet={pet} pillar="learn" pillarColor={G.violet} pillarLabel="Learning" onClose={() => setSoulMadeOpen(false)} />}
            </>
          )}
        </div>
        {/* ── Footer CTA — category-specific guided path (mirrors Play pattern) ── */}
        {!['bundles', 'soul', 'mira', 'soul_made', 'breed'].includes(category) && (
          <div style={{flexShrink:0, padding:'14px 20px', borderTop:`1px solid ${G.borderLight}`, background:'#FAFAFE', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <p style={{fontSize:12, color:'#888', margin:0}}>Personalised for {petName}</p>
            <button
              onClick={() => {
                const pathId = CAT_TO_PATH[category];
                if (pathId) {
                  const paths = buildLearnGuidedPaths(pet);
                  const match = paths.find(p => p.id === pathId);
                  if (match) { setGuidedPath(match); return; }
                }
                // Fallback: fire concierge and close
                tdc.book({ service: catCfg.label, pillar: 'learn', pet, channel: 'learn_content_modal_footer' });
                onClose();
              }}
              style={{background:`linear-gradient(135deg,${G.violet},#FF6B9D)`, color:'#fff', border:'none', borderRadius:12, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer'}}
              data-testid="learn-modal-cta">
              {CAT_TO_PATH[category]
                ? `Start ${petName}'s ${catCfg.label} Path →`
                : `Book ${catCfg.label} for ${petName} →`}
            </button>
          </div>
        )}
      </div>
      {/* Guided Path Flow Modal (opens on CTA click) */}
      {guidedPath && <LearnPathFlowModal path={guidedPath} pet={pet} onClose={() => setGuidedPath(null)} />}
      {selProd && <ProductDetailModal product={selProd} pet={pet} onClose={()=>setSelProd(null)}/>}
    </div>
  );
}
function VideoCard({ video, onPlay }) {
  const views = video.view_count
    ? parseInt(video.view_count)>1000000 ? `${(parseInt(video.view_count)/1000000).toFixed(1)}M views`
      : parseInt(video.view_count)>1000 ? `${Math.round(parseInt(video.view_count)/1000)}K views` : `${video.view_count} views`
    : "";

  return (
    <div onClick={()=>onPlay(video)}
      style={{cursor:"pointer",borderRadius:12,overflow:"hidden",background:"#fff",border:`1px solid ${G.borderLight}`,transition:"transform 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
      <div style={{position:"relative",paddingTop:"56.25%",background:G.pale}}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />
          : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.mid})`,fontSize:32}}>▶</div>}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>▶</div>
        </div>
      </div>
      <div style={{padding:"10px 12px"}}>
        <div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {video.title}
        </div>
        {(video.channel_title||views) && (
          <div style={{fontSize:10,color:G.mutedText}}>
            {video.channel_title}{views?` · ${views}`:""}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DIM EXPANDED ─────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts={}, services=[], onBook }) {
  const petName   = pet?.name || "your dog";
  const allergies = getAllergies(pet);
  const miraCtx   = { includeText:"Add to Cart" };

  const [dimTab,    setDimTab]    = useState("products");
  const [activeTab, setActiveTab] = useState("All");
  const [videos,    setVideos]    = useState([]);
  const [vLoading,  setVLoading]  = useState(false);
  const [playing,   setPlaying]   = useState(null);
  const [selProd,   setSelProd]   = useState(null); // ProductDetailModal

  // Products from pre-fetched apiProducts
  const catName = DIM_ID_TO_CATEGORY[dim.id]||"Learn Foundations";
  const catData = apiProducts[catName]||{};
  const allRaw  = filterBreedProducts(
    Object.values(catData).flat().filter(p => {
    const sub=(p.sub_category||"").toLowerCase();
    const cat=(p.category||"").toLowerCase();
    if (dim.id==="soul")       return cat.includes("treat_pouch")||cat.includes("treat_jar")||cat.includes("training_log")||sub==="soul";
    if (dim.id==="breed")      return cat.includes("breed-training_log")||cat.includes("breed-care")||sub==="breed_guides";
    if (dim.id==="tricks")     return cat==="tricks"||sub==="tricks";
    if (dim.id==="enrichment") return cat==="enrichment"||sub==="enrichment"||cat==="classes";
    if (dim.id==="behaviour")  return cat==="behavior"||sub==="behaviour";
    if (dim.id==="foundations") return sub==="foundations"||cat==="training";
    if (dim.id==="training")   return cat==="training"||sub==="foundations"||sub==="training";
    return true; // catch-all
  }), pet?.breed);

  const intelligent = applyMiraIntelligence(allRaw, allergies, pet);
  const subCats     = [...new Set(allRaw.map(p=>p.sub_category).filter(Boolean))];
  const tabList     = ["All",...subCats];
  const products    = activeTab==="All" ? intelligent : intelligent.filter(p=>p.sub_category===activeTab);

  // Services for this dim
  const dimServices = services.filter(s => {
    if (s.dim === dim.id) return true;
    if (s.category === DIM_ID_TO_CATEGORY[dim.id]) return true;
    // Fallback: show untagged learn services only in foundations
    if (!s.dim && !s.category && dim.id === "foundations") return true;
    return false;
  });

  // YouTube fetch — only when Videos tab is clicked
  const fetchVideos = useCallback(async () => {
    if (!dim.ytQuery) return;
    setVLoading(true);
    try {
      const breed  = pet?.breed ? encodeURIComponent(pet.breed) : "";
      let query    = dim.id==="breed"&&breed ? `${pet.breed} dog care training tips` : dim.ytQuery;
      const res    = await fetch(`${API_URL}/api/test/youtube?query=${encodeURIComponent(query)}&max_results=6`);
      const data   = await res.json();
      setVideos((data?.videos||data?.items||data?.results||[]).map(v=>({
        ...v,
        embed_url: v.embed_url || `https://www.youtube.com/embed/${v.id}`,
        channel_title: v.channel_title || v.channel || "",
      })));
    } catch { setVideos([]); }
    setVLoading(false);
  }, [dim.id, dim.ytQuery, pet?.breed]);

  useEffect(() => {
    if (dimTab==="videos" && videos.length===0) fetchVideos();
  }, [dimTab]);

  const tabs = [
    { id:"products",    label:"📦 Products" },
    ...( dim.ytQuery ? [{ id:"videos", label:"🎬 Videos" }] : [] ),
    { id:"personalised",label:"✦ Personalised" },
    ...( dim.id !== "soul" ? [{ id:"find", label:"📍 Find" }] : [] ),
    { id:"services",    label:"📋 Book" },
  ];

  return (
    <div style={{background:"#fff",border:`2px solid ${G.violet}`,borderTop:"none",borderRadius:"0 0 14px 14px",marginBottom:8}}
         data-testid={`learn-dim-${dim.id}`}>

      {/* Mira bar */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:`linear-gradient(135deg,${G.pale},${G.cream})`,padding:"10px 16px",borderBottom:`1px solid ${G.pale}`}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
        <p style={{fontSize:12,color:G.darkText,fontStyle:"italic",margin:0,lineHeight:1.5,flex:1}}>"{t(dim.mira,petName)}"</p>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#BBB",cursor:"pointer",flexShrink:0,padding:"0 4px"}}>✕</button>
      </div>

      {/* Tab bar: Products | Videos | Book */}
      <div style={{display:"flex",borderBottom:"1px solid #F0F0F0"}}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={()=>setDimTab(tab.id)}
            style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:dimTab===tab.id?`2.5px solid ${G.violet}`:"2.5px solid transparent",color:dimTab===tab.id?G.mid:"#888",fontSize:12,fontWeight:dimTab===tab.id?700:400,cursor:"pointer"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {dimTab==="products" && (
        <div style={{padding:"12px 16px 20px"}}>
          {tabList.length>1 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {tabList.map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeTab===tab?G.violet:G.border}`,background:activeTab===tab?G.violet:G.cream,fontSize:11,fontWeight:600,color:activeTab===tab?"#fff":G.mid,cursor:"pointer"}}>
                  {tab.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}
          {allRaw.length>0 && (
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12,fontSize:11,color:"#888"}}>
              <span style={{color:"#27AE60",fontWeight:700}}>✓ {intelligent.length} safe for {petName}</span>
              {allRaw.length-intelligent.length>0 && <span style={{color:"#AD1457"}}>✗ {allRaw.length-intelligent.length} filtered</span>}
            </div>
          )}
          {products.length===0 ? (
            <div style={{textAlign:"center",padding:"32px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:10}}>📦</div>
              {allRaw.length===0
                ? <>Products for {petName} in this category are being added — check back soon.</>
                : "No products match this filter."}
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:12}}>
              {products.map(p=>(
                <div key={p.id||p._id} style={{position:"relative"}}>
                  {p.mira_score>=75 && <div style={{position:"absolute",top:-6,left:-6,zIndex:2,background:G.mid,borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:700,color:"#fff"}}>★ {p.mira_score}</div>}
                  <SharedProductCard product={p} pillar="learn" selectedPet={pet} miraContext={miraCtx} onViewDetails={(prod)=>setSelProd(prod)}/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PERSONALISED TAB ── */}
      {dimTab==="personalised" && (
        <div style={{padding:"12px 16px 20px"}}>
          {/* Breed tip for this dim */}
          {(() => {
            const breedKey = (pet?.breed||"indie").toLowerCase().replace(/\s*\(.*\)/,"").trim();
            const tip = BREED_LEARN_TIPS[breedKey] || BREED_LEARN_TIPS["indie"];
            const breedLabel = (pet?.breed||"Indie").split("(")[0].trim();
            return (
              <div style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,
                borderRadius:14,padding:"14px 18px",marginBottom:18}}>
                <p style={{fontSize:10,fontWeight:700,color:G.light,textTransform:"uppercase",
                  letterSpacing:"0.08em",marginBottom:6}}>
                  ✦ Personalised for {petName} · {breedLabel}
                </p>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.55,margin:0,fontStyle:"italic"}}>
                  {dim.id==="training"  ? tip.path
                   :dim.id==="enrichment"? tip.enrichment
                   :dim.id==="breed"    ? tip.style
                   :`${breedLabel}s ${dim.id==="behaviour"?"need clear, consistent signals":"thrive with the right approach"}.`}
                </p>
              </div>
            );
          })()}

          {/* Breed-filtered products for this dim */}
          {(() => {
            const catKey = DIM_ID_TO_CATEGORY[dim.id] || "training";
            const catData = apiProducts[catKey] || {};
            const dimProds = filterBreedProducts(
              Object.values(catData).flat().filter(p=>{
                const cat=(p.category||"").toLowerCase();
                const sub=(p.sub_category||"").toLowerCase();
                return cat===catKey || sub===dim.id || sub==="foundations";
              }).slice(0,8),
              pet?.breed
            );
            if (dimProds.length === 0) return (
              <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:12}}>
                <div style={{fontSize:28,marginBottom:8}}>🌟</div>
                <p style={{fontWeight:600}}>Soul products for {petName} coming soon</p>
                <p>Mira is curating breed-specific products for {pet?.breed||"your breed"}.</p>
              </div>
            );
            return (
              <>
                <p style={{fontSize:11,fontWeight:700,color:G.mutedText,textTransform:"uppercase",
                  letterSpacing:"0.06em",marginBottom:12}}>
                  {pet?.breed || "Breed"} picks for {petName}
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:12}}>
                  {dimProds.map(p=>(
                    <SharedProductCard key={p.id||p._id} product={p} pillar="learn" selectedPet={pet} onViewDetails={(prod)=>setSelProd(prod)}/>
                  ))}
                </div>
              </>
            );
          })()}
          {/* ── Soul Made™ via PersonalisedBreedSection ── */}
          <PersonalisedBreedSection pet={pet} pillar="learn" />
        </div>
      )}

      {/* ── VIDEOS TAB ── */}
      {dimTab==="videos" && (
        <div style={{padding:"12px 16px 20px"}}>
          {playing ? (
            <div>
              <div style={{position:"relative",paddingTop:"56.25%",borderRadius:12,overflow:"hidden",marginBottom:14}}>
                <iframe src={playing.embed_url} title={playing.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",borderRadius:12}} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen/>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:G.darkText,flex:1,marginRight:12}}>{playing.title}</div>
                <button onClick={()=>setPlaying(null)} style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,color:G.mid,cursor:"pointer",flexShrink:0}}>← Back</button>
              </div>
            </div>
          ) : null}
          {vLoading ? (
            <div style={{textAlign:"center",padding:"32px 0",color:G.mutedText,fontSize:13}}>
              <Loader2 size={24} style={{animation:"spin 1s linear infinite",color:G.violet,marginBottom:8}}/>
              <div>Finding the best {dim.label.toLowerCase()} videos…</div>
            </div>
          ) : videos.length===0 ? (
            <div style={{textAlign:"center",padding:"32px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:10}}>🎬</div>
              Videos loading — check your internet connection or try again.
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:14}}>
              {videos.map((v,i)=>(
                <VideoCard key={v.id||i} video={v} onPlay={setPlaying}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SERVICES TAB ── */}
      {dimTab==="find" && (
        <div style={{padding:"12px 16px 20px"}}>
          <LearnNearMe pet={pet} dimId={dim.id} onBook={onBook} />
        </div>
      )}
      {dimTab==="services" && (
        <div style={{padding:"12px 16px 20px"}}>
          {/* Dim-specific intro + chip prompt */}
          <div style={{background:G.cream,border:`1px solid ${G.border}`,borderRadius:12,
            padding:"14px 16px",marginBottom:18}}>
            <p style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:4}}>
              What does {petName} need from {dim.label}?
            </p>
            <p style={{fontSize:12,color:G.mutedText,margin:0}}>
              Our Concierge® will arrange the right session and trainer for {petName}'s level and breed.
            </p>
          </div>

          {dimServices.length===0 ? (
            <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:8}}>📋</div>
              <p style={{fontWeight:600,marginBottom:4}}>Book {dim.label} for {petName}</p>
              <p style={{marginBottom:16}}>Our concierge will find the right trainer for {petName}'s level.</p>
              <button onClick={()=>onBook?.({name:dim.label,icon:dim.icon,accentColor:G.violet,base_price:0,description:`${dim.label} session for ${petName}`,steps:3})}
                style={{background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",
                  border:"none",borderRadius:20,padding:"11px 28px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Book {dim.label} for {petName} →
              </button>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {dimServices.map((svc,i)=>{
                const accent = svc.accentColor || G.violet;
                return (
                  <div key={svc.id||i}
                    style={{background:"#fff",borderRadius:14,border:`2px solid rgba(124,58,237,0.12)`,
                      overflow:"hidden",cursor:"pointer",transition:"all 0.15s",
                      boxShadow:"0 2px 8px rgba(124,58,237,0.06)"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${accent}20`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(124,58,237,0.06)";}}>
                    <div style={{height:100,background:`linear-gradient(135deg,${G.pale},${G.cream})`,
                      display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                      {(svc.watercolor_image||svc.image_url) && !(svc.watercolor_image||svc.image_url||"").includes("bandana") && !(svc.watercolor_image||svc.image_url||"").includes("default")
                        ? <img src={svc.watercolor_image||svc.image_url} alt={svc.name}
                            style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                        : <span style={{fontSize:36}}>{svc.icon||dim.icon||"🎓"}</span>}
                      {svc.popular&&<span style={{position:"absolute",top:7,right:7,background:accent,color:"#fff",
                        fontSize:9,fontWeight:700,borderRadius:20,padding:"2px 8px"}}>Popular</span>}
                    </div>
                    <div style={{padding:"12px 14px 14px"}}>
                      <div style={{fontSize:13,fontWeight:800,color:G.darkText,marginBottom:3}}>{svc.name}</div>
                      <div style={{fontSize:11,color:G.mutedText,marginBottom:8,lineHeight:1.4,
                        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                        {svc.description}
                      </div>
                      {svc.miraKnows && (
                        <div style={{background:"#EDE9FE",border:"1px solid rgba(124,58,237,0.20)",borderRadius:8,
                          padding:"6px 9px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:5}}>
                          <span style={{fontSize:11,color:G.violet,flexShrink:0}}>✦</span>
                          <span style={{fontSize:10,color:"#3730A3",lineHeight:1.4}}>
                            {svc.miraKnows.replace(/{petName}/g,petName).replace(/{breed}/g,breed||"your dog")}
                          </span>
                        </div>
                      )}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <span style={{fontSize:13,fontWeight:800,color:G.deep}}>
                            {/* Prices hidden — concierge-first model */}
                          </span>
                          {svc.duration&&<span style={{fontSize:10,color:"#aaa",marginLeft:5}}>{svc.duration}</span>}
                        </div>
                        <button onClick={()=>onBook?.({...svc,accentColor:accent})}
                          style={{background:`linear-gradient(135deg,${accent},${G.mid})`,
                            color:"#fff",border:"none",borderRadius:20,padding:"7px 16px",
                            fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          Book for {petName} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* ProductDetailModal */}
      {selProd && <ProductDetailModal product={selProd} pet={pet} pillar="learn" onClose={()=>setSelProd(null)} onBook={(p)=>{setSelProd(null);onBook(p);}}/>}
    </div>
  );
}

// ─── MIRA PICKS ───────────────────────────────────────────────
// ─── MIRA LEARN IMAGINE CARD (dark indigo + dynamic Cloudinary watercolour) ─
function MiraLearnImagineCard({ item, pet, token }) {
  const [state,    setState]    = useState("idle");
  const [imgUrl,   setImgUrl]   = useState(null);
  const petName  = pet?.name || "your dog";
  const breedKey = (pet?.breed||"indie").toLowerCase().replace(/\s+/g,"_").replace(/-/g,"_").replace(/\s*\(.*\)/,"");
  const pillar   = "learn";

  // Fetch cached watercolour from Cloudinary pipeline
  useEffect(() => {
    fetch(`${API_URL}/api/ai-images/pipeline/mira-imagines/${pillar}/${breedKey}`)
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
        headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || "guest",
          pet_id: pet?.id || "unknown",
          pillar: "learn",
          intent_primary: "mira_imagines_request",
          channel: "learn_mira_picks_imagines",
          initial_message: { sender:"parent", text:`I'd love "${item.name}" for ${petName}. Mira imagined this — please help source it!` },
        }),
      });
    } catch {}
    setState("sent");
  };

  return (
    <div style={{ borderRadius:14, overflow:"hidden",
      background:"linear-gradient(135deg,#0A0A3C,#1A1363)", border:`1.5px solid rgba(124,58,237,0.30)`,
      display:"flex", flexDirection:"column", minHeight:220 }}>
      <div style={{ position:"relative", height:130,
        background: imgUrl ? "transparent" : "linear-gradient(135deg,#1A1363,#2D1B69)",
        display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {imgUrl
          ? <img src={imgUrl} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={()=>setImgUrl(null)}/>
          : <span style={{ fontSize:40 }}>{item.emoji || "🎓"}</span>}
        <div style={{ position:"absolute", top:8, left:8, background:G.violet, color:"#fff",
          fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>Mira Imagines</div>
      </div>
      <div style={{ flex:1, padding:"10px 12px 4px" }}>
        <p style={{ fontWeight:800, color:"#fff", fontSize:12, lineHeight:1.3, marginBottom:4 }}>{item.name}</p>
        <p style={{ color:"rgba(255,255,255,0.50)", fontSize:10, lineHeight:1.4, margin:0, fontStyle:"italic" }}>{item.description}</p>
      </div>
      <div style={{ padding:"0 12px 12px" }}>
        {state === "sent"
          ? <div style={{ fontSize:11, fontWeight:700, color:G.light }}>✓ Sent to Concierge!</div>
          : <button onClick={send} disabled={state==="sending"}
              style={{ width:"100%", background:`linear-gradient(135deg,${G.violet},${G.mid})`,
                color:"#fff", border:"none", borderRadius:10, padding:"9px",
                fontSize:11, fontWeight:700, cursor:"pointer", opacity:state==="sending"?0.7:1 }}>
              {state==="sending" ? "Sending…" : "Tap — Concierge →"}
            </button>}
      </div>
    </div>
  );
}

function MiraPicksSection({ pet }) {
  const [picks,       setPicks]       = useState([]);
  const [picksLoading,setPicksLoading]= useState(true);
  const [selectedPick,setSelectedPick]= useState(null);
  const petName = pet?.name || "your dog";
  const { token } = useAuth();
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const intelligenceSubtitle = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);

  const miraImagines = (() => {
    const breedLabel  = pet?.breed ? pet.breed.split("(")[0].trim() : "";
    const stage       = isPuppy(pet) ? "Puppy" : isSenior(pet) ? "Senior" : "Adult";
    const trainingTip = breedLabel ? `designed around ${breedLabel} learning style` : "personalised to their personality";
    return [
      { id:"learn-imagine-1", isImagined:true, emoji:"🎓",
        name:`${petName}'s ${stage} Foundations Kit`,
        description:`Clicker, treat pouch, training log, and guide — ${trainingTip}.` },
      breedLabel
        ? { id:"learn-imagine-2", isImagined:true, emoji:"📚",
            name:`${breedLabel} Learning Pack`,
            description:`Breed-specific flashcards, care guide, and enrichment toys for ${petName} the ${breedLabel}.` }
        : { id:"learn-imagine-2", isImagined:true, emoji:"📚",
            name:`${petName}'s Brain Games Set`,
            description:`Puzzle feeder, snuffle mat, and IQ toy — Mira imagines ${petName}'s weekly enrichment kit.` },
      { id:"learn-imagine-3", isImagined:true, emoji:"🌟",
        name:`${petName}'s Soul Learn Kit`,
        description: breedLabel
          ? `${petName}'s training journal, treat jar, and ${breedLabel} breed guide — Mira's top soul-building picks.`
          : `${petName}'s training journal, treat jar, and enrichment guide.` },
      { id:"learn-imagine-4", isImagined:true, emoji:"🧠",
        name:`${petName}'s Behaviour Bundle`,
        description:`Calming treats, anxiety wrap, Mira's behaviour guide — ${breedLabel||petName}'s confidence toolkit.` },
      { id:"learn-imagine-5", isImagined:true, emoji:"🧩",
        name:`${petName}'s Mental Gym Box`,
        description:`Snuffle mat, puzzle feeder, lick mat, and nose-work kit — 30 min of daily enrichment sorted.` },
      { id:"learn-imagine-6", isImagined:true, emoji:"✨",
        name:`${petName}'s Tricks & Fun Kit`,
        description:`Target stick, agility cones, frisbee, and trick training cards — learning through play.` },
      { id:"learn-imagine-7", isImagined:true, emoji: isPuppy(pet) ? "🐶" : isSenior(pet) ? "🐕" : "🏆",
        name: isPuppy(pet) ? `${petName}'s Puppy Confidence Kit`
          : isSenior(pet) ? `${petName}'s Senior Enrichment Pack`
          : `${petName}'s Recall & Leash Mastery Set`,
        description: isPuppy(pet)
          ? `First-week essentials: crate liner, puppy journal, socialisation guide, and calming treats.`
          : isSenior(pet) ? `Lick mat, gentle puzzle, senior dog guide, and joint-support treats for ${petName}.`
          : `Long line, treat pouch, whistle, and recall training guide — the freedom to run safely.` },
      { id:"learn-imagine-8", isImagined:true, emoji:"📋",
        name:`Private Training Session for ${petName}`,
        description:`Mira imagines a 1-on-1 session built around ${breedLabel||petName}'s exact level and learning style. Book via Concierge.` },
    ];
  })();

  // Async picks — breed filters applied, refetch when pet OR breed changes
  useEffect(()=>{
    if(!pet?.id){ setPicksLoading(false); return; }
    setPicks([]); setPicksLoading(true); // reset on pet/breed switch
    const breed = encodeURIComponent((pet?.breed||"").toLowerCase().trim()||"");
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn&limit=12&min_score=60&entity_type=product&breed=${breed}`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn&limit=6&min_score=60&entity_type=service`).then(r=>r.ok?r.json():null),
    ]).then(([pD,sD])=>{
      const allProds = filterBreedProducts(pD?.picks||[], pet?.breed);
      const svcs = sD?.picks||[];
      const merged = []; let pi=0, si=0;
      while(pi<allProds.length||si<svcs.length){
        if(pi<allProds.length) merged.push(allProds[pi++]);
        if(pi<allProds.length) merged.push(allProds[pi++]);
        if(si<svcs.length)     merged.push(svcs[si++]);
      }
      if(merged.length) setPicks(merged.slice(0,16));
      setPicksLoading(false);
    }).catch(()=>setPicksLoading(false));
  },[pet?.id, pet?.breed]); // ← both in deps to fix race on pet switch

  return (
    <section style={{marginBottom:32}} data-testid="learn-mira-picks-section">
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>
        Mira's Learn Picks for <span style={{color:G.violet}}>{petName}</span>
      </h3>
      <span style={{fontSize:11,background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>
        AI Scored
      </span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>
        {intelligenceSubtitle}
      </p>

      {/* Breed-intelligent imagines — Maltipoo, Indie, unknown breeds all handled */}
      {!picksLoading && picks.length === 0 && (
        <MiraImaginesBreed pet={pet} pillar="learn" colour={G.violet} onConcierge={()=>{}}/>
      )}
      {picksLoading && (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}>
          <Loader2 size={14} style={{animation:"spin 1s linear infinite",color:G.violet}}/>
          <span style={{fontSize:12}}>Mira is scoring picks for {petName}…</span>
        </div>
      )}
      {/* AI Scored picks — horizontal scroll */}
      {!picksLoading && picks.length > 0 && (
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}} className="learn-picks-scroll">
          <style>{`.learn-picks-scroll::-webkit-scrollbar{height:4px}.learn-picks-scroll::-webkit-scrollbar-thumb{background:${G.violet}50;border-radius:4px}`}</style>
          {picks.map((pick,i)=>{
            const isService=pick.entity_type==="service";
            const img=[pick.image_url,pick.image,...(pick.images||[])].find(u=>u&&u.startsWith("http"))||null;
            const score=pick.mira_score||0;
            const scoreColor=score>=80?"#16A34A":score>=70?G.violet:"#6B7280";
            return (
              <div key={pick.id||i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s,box-shadow 0.15s"}}
                onClick={()=>{
                  if(isService) {
                    // Service pick: create ticket directly (canonical rule)
                    const u=JSON.parse(localStorage.getItem('user')||'{}');
                    fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
                      method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
                      body:JSON.stringify({parent_id:u?.id||u?.email||'guest',pet_id:pet?.id||'unknown',pillar:'learn',
                        intent_primary:'service_booking',intent_secondary:[pick.name||'Learn Service'],
                        life_state:'learn',channel:'learn_mira_picks',
                        initial_message:{sender:'parent',text:`I'd like to book ${pick.name||'this service'} for ${petName}.`}})
                    }).catch(()=>{});
                    setSelectedPick({...pick, _booked:true});
                  } else {
                    setSelectedPick(pick);
                  }
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(124,58,237,0.12)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                <div style={{width:"100%",height:130,background:G.cream,overflow:"hidden",position:"relative"}}>
                  {img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.violet})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,18)}</div>}
                  <span style={{position:"absolute",top:7,left:7,fontSize:9,fontWeight:700,background:isService?G.mid:G.violet,color:"#fff",borderRadius:20,padding:"2px 7px"}}>{isService?"SERVICE":"PRODUCT"}</span>
                </div>
                <div style={{padding:"10px 11px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||pick.entity_name||"—"}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                    <div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:4}}/></div>
                    <span style={{fontSize:10,fontWeight:800,color:scoreColor,minWidth:26}}>{score}</span>
                  </div>
                  {pick.mira_reason&&<p style={{fontSize:10,color:"#888",lineHeight:1.4,margin:0,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",fontStyle:"italic"}}>{pick.mira_reason}</p>}
                  <p style={{fontSize:9,color:isService?G.mid:G.violet,fontWeight:700,margin:"6px 0 0"}}>{isService?"Tap → Book via Concierge":"Tap → View & Add"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedPick && <ProductDetailModal product={selectedPick} pillar="learn" selectedPet={pet} onClose={()=>setSelectedPick(null)}/>}
    </section>
  );
}

// ─── LEARN CONCIERGE MODAL (matches CareConciergeModal exactly) ──────────────
const LEARN_OPTIONS = [
  { id:'basic_training',   label:'Basic Training' },
  { id:'behaviour',        label:'Behaviour & Impulse' },
  { id:'breed_education',  label:'Breed Education' },
  { id:'enrichment',       label:'Mental Enrichment' },
  { id:'tricks',           label:'Tricks & Fun' },
  { id:'recall_leash',     label:'Recall & Leash Mastery' },
  { id:'puppy_foundations',label:'Puppy Foundations' },
  { id:'senior_learning',  label:'Senior Learning' },
  { id:'new_parent',       label:'New Pet Parent' },
  { id:'rescue_rehome',    label:'Rescue & Rehome' },
  { id:'just_because',     label:'Just because' },
];

function LearnConciergeModal({ isOpen, onClose, serviceType, petName, petId, token }) {
  const [selected,    setSelected]    = useState(serviceType || '');
  const [date,        setDate]        = useState('');
  const [notSure,     setNotSure]     = useState(false);
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  useEffect(() => { if (isOpen) { setSelected(serviceType||''); setSubmitted(false); } }, [isOpen, serviceType]);

  if (!isOpen) return null;
  const name = petName || 'your dog';

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const { bookViaConcierge } = await import('../utils/MiraCardActions');
    await bookViaConcierge({
      service: selected,
      pillar: "learn",
      pet: { id: petId, name: petName || 'your pet' },
      token,
      channel: "learn_concierge_modal",
      notes: notes.trim() || null,
      date: notSure ? null : (date || null),
      onSuccess: () => setSubmitted(true),
    });
    setSubmitting(false);
  };

  const handleClose = () => { setSubmitted(false); setSelected(serviceType||''); setDate(''); setNotSure(false); setNotes(''); onClose(); };

  return (
    <div onClick={handleClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.50)', zIndex:10006,
        display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:480, width:'100%',
          maxHeight:'90vh', overflowY:'auto', position:'relative' }}>

        {submitted ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(124,58,237,0.12)',
              border:'2px solid rgba(124,58,237,0.30)', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:28, margin:'0 auto 16px' }}>✦</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:G.deep, marginBottom:10 }}>
              {name}'s learning plan is in good hands.
            </h3>
            <p style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:24 }}>
              Your Concierge has everything they need.<br/>Expect a message within 48 hours. ✦
            </p>
            <button onClick={handleClose}
              style={{ background:`linear-gradient(135deg,${G.violet},${G.mid})`,
                color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Close */}
            <button onClick={handleClose}
              style={{ position:'absolute', top:16, right:16, background:'none', border:'none',
                cursor:'pointer', color:'#999', width:28, height:28, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✕</button>

            {/* Eyebrow */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(124,58,237,0.10)', border:'1px solid rgba(124,58,237,0.25)',
              borderRadius:9999, padding:'4px 14px', marginBottom:20 }}>
              <span style={{ fontSize:11, color:G.violet }}>★</span>
              <span style={{ fontSize:11, fontWeight:600, color:G.violet, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {name}'s Learn Concierge
              </span>
            </div>

            {/* Title */}
            <h2 style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:'Georgia,serif',
              lineHeight:1.2, marginBottom:8 }}>
              What should <span style={{ color:G.violet }}>{name}</span>'s learning experience feel like?
            </h2>
            <p style={{ fontSize:14, color:'#888', lineHeight:1.6, marginBottom:24 }}>
              Three questions. Then your Concierge takes over.
            </p>

            {/* Q1: What are we planning? */}
            <p style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:12 }}>What are we planning?</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {LEARN_OPTIONS.map(opt=>(
                <button key={opt.id} onClick={()=>setSelected(opt.id)}
                  style={{ borderRadius:9999, padding:'8px 16px', fontSize:13, fontWeight:500,
                    cursor:'pointer', transition:'all 0.15s',
                    background: selected===opt.id ? G.pale : '#fff',
                    border: `1.5px solid ${selected===opt.id ? G.violet : 'rgba(124,58,237,0.25)'}`,
                    color: selected===opt.id ? G.violet : '#555' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Q2: When? */}
            <p style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:12 }}>When?</p>
            <div style={{ display:'flex', gap:10, marginBottom:24 }}>
              <input type="date" value={date} onChange={e=>{setDate(e.target.value);setNotSure(false);}}
                disabled={notSure}
                style={{ flex:1, border:'1.5px solid rgba(124,58,237,0.25)', borderRadius:12,
                  padding:'12px 14px', fontSize:14, color:G.darkText, outline:'none',
                  background:notSure?'#F5F5F5':'#fff' }}/>
              <button onClick={()=>{setNotSure(n=>!n);setDate('');}}
                style={{ borderRadius:12, padding:'12px 16px', fontSize:13, fontWeight:600,
                  cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
                  background:notSure?G.pale:'#fff',
                  border:`1.5px solid ${notSure?G.violet:'rgba(124,58,237,0.25)'}`,
                  color:notSure?G.violet:'#555' }}>
                Not sure yet
              </button>
            </div>

            {/* Q3: Notes */}
            <p style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:10 }}>
              Anything about {name} we should know?
            </p>
            <textarea placeholder="Optional — allergies, fears, specific goals, trainer preferences…"
              value={notes} onChange={e=>setNotes(e.target.value)}
              style={{ width:'100%', border:'1.5px solid rgba(124,58,237,0.25)', borderRadius:12,
                padding:'12px 14px', fontSize:13, color:G.darkText, outline:'none', resize:'none',
                minHeight:80, marginBottom:24, boxSizing:'border-box' }}/>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!selected||submitting}
              style={{ width:'100%', background: !selected?'#E0D8F0':`linear-gradient(135deg,${G.violet},${G.mid})`,
                color: !selected?'#999':'#fff', border:'none', borderRadius:12, padding:'14px',
                fontSize:15, fontWeight:800, cursor:!selected?'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {submitting ? 'Sending…' : `✦ Send to ${name}'s Concierge`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function LearnBookingHeader({ service, step, totalSteps, pet, onClose }) {
  const accent = service.accentColor || G.violet;
  return (
    <div style={{ background:`linear-gradient(135deg,${accent},${accent}CC)`,
      padding:'20px 24px 16px', borderRadius:'16px 16px 0 0', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6,
          background:'rgba(255,255,255,0.20)', borderRadius:20, padding:'3px 10px' }}>
          <span style={{ fontSize:14 }}>{service.icon||"🎓"}</span>
          <span style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{service.name}</span>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.20)', border:'none',
          borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#fff',
          fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>
      <div style={{ fontSize:20, fontWeight:800, color:'#fff', fontFamily:'Georgia,serif', marginBottom:4 }}>
        {service.name} for {pet?.name||"your dog"}
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:10 }}>
        Personalised for {pet?.breed||'your dog'} · arranged by Mira
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.25)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
        <div style={{ height:'100%', width:`${(step/totalSteps)*100}%`,
          background:'#fff', borderRadius:4, transition:'width 0.3s' }}/>
      </div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>Step {step} of {totalSteps}</div>
    </div>
  );
}

function LearnPetBadge({ pet }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0',
      marginBottom:16, borderBottom:'1px solid #EDE9FE' }}>
      <div style={{ width:44, height:44, borderRadius:'50%',
        background:'linear-gradient(135deg,#EDE9FE,#A78BFA)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, overflow:'hidden', flexShrink:0 }}>
        {(pet?.photo_url||pet?.avatar_url)
          ? <img src={pet.photo_url||pet.avatar_url} alt={pet?.name||""} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="eager" decoding="sync"/>
          : <span>{pet?.avatar||'🐕'}</span>}
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'#1A1363' }}>For {pet?.name||"your dog"}</div>
        <div style={{ fontSize:13, color:'#5B21B6' }}>{pet?.breed||""}</div>
      </div>
    </div>
  );
}

function LearnMiraKnows({ text }) {
  return (
    <div style={{ background:'#EDE9FE', border:'1px solid rgba(124,58,237,0.28)',
      borderRadius:10, padding:'10px 14px', display:'flex',
      alignItems:'flex-start', gap:8, marginBottom:20 }}>
      <span style={{ fontSize:14, flexShrink:0 }}>✦</span>
      <div style={{ fontSize:13, color:'#3730A3' }}>
        <strong style={{ color:'#1A1363' }}>Mira knows: </strong>{text}
      </div>
    </div>
  );
}

function LearnNavButtons({ onBack, onNext, onSend, nextDisabled, isLast, accentColor, sending }) {
  const col = accentColor || G.violet;
  return (
    <div style={{ display:'flex', gap:10, paddingTop:16, borderTop:'1px solid #EDE9FE' }}>
      {onBack && (
        <button onClick={onBack} style={{ flex:1, background:'#fff',
          border:'1.5px solid rgba(124,58,237,0.25)', borderRadius:12, padding:'12px',
          fontSize:13, fontWeight:600, color:'#5B21B6', cursor:'pointer' }}>
          ← Back
        </button>
      )}
      <button onClick={isLast ? onSend : onNext} disabled={nextDisabled||sending}
        style={{ flex:2, background: nextDisabled ? '#E0D8F0'
          : isLast ? `linear-gradient(135deg,${col},#3730A3)`
          : 'linear-gradient(135deg,#7C3AED,#3730A3)',
          color: nextDisabled ? '#999' : '#fff', border:'none', borderRadius:12,
          padding:'12px', fontSize:14, fontWeight:800,
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        {sending ? 'Sending…' : isLast ? '✦ Send to Concierge®' : 'Continue →'}
      </button>
    </div>
  );
}

function LearnBookingConfirmed({ service, pet, onClose }) {
  const accent = service.accentColor || G.violet;
  return (
    <div style={{ textAlign:'center', padding:'40px 32px' }}>
      <div style={{ width:72, height:72, borderRadius:'50%',
        background:`linear-gradient(135deg,${accent},#7C3AED)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:32, margin:'0 auto 20px' }}>✦</div>
      <div style={{ fontSize:22, fontWeight:800, color:'#1A1363',
        fontFamily:'Georgia,serif', marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:14, color:'#5B21B6', lineHeight:1.7, marginBottom:8 }}>
        Your {service.name.toLowerCase()} request for {pet?.name||"your dog"} has been received.
      </div>
      <div style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:24 }}>
        Our Concierge® team will review and contact you within 2 hours.
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#EDE9FE',
        border:'1px solid rgba(124,58,237,0.25)', borderRadius:20,
        padding:'6px 16px', fontSize:13, color:'#7C3AED', fontWeight:600, marginBottom:24 }}>
        📥 Added to your Inbox
      </div>
      <div>
        <button onClick={onClose} style={{ background:'#7C3AED', color:'#fff', border:'none',
          borderRadius:12, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Done ✓
        </button>
      </div>
    </div>
  );
}

function LearnServiceFlow({ svc, pet, onClose, token }) {
  const [step, setStep]         = useState(1);
  const [level, setLevel]       = useState('');
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes]       = useState('');
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const petName  = pet?.name || 'your dog';
  const totalSteps = svc.steps || 3;
  const canNext  = [!!level, !!schedule, true][step - 1];
  const miraText = (svc.miraKnows || '')
    .replace(/{petName}/g, petName)
    .replace(/{breed}/g, pet?.breed || 'your breed');

  const send = async () => {
    setSending(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method:'POST',
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || 'guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'learn',
          intent_primary: 'service_booking',
          channel: 'learn_book_a_session',
          initial_message: {
            sender:'parent',
            text:`I'd like to book ${svc.name} for ${petName}. Level: ${level}. Schedule: ${schedule}. ${notes ? 'Notes: '+notes : ''}`.trim(),
          },
        }),
      });
    } catch(e) { console.error('[LearnServiceFlow]', e); }
    setSending(false);
    setSent(true);
  };

  if (sent) return <LearnBookingConfirmed service={svc} pet={pet} onClose={onClose} />;

  return (
    <>
      <LearnBookingHeader service={svc} step={step} totalSteps={totalSteps} pet={pet} onClose={onClose}/>
      <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
        <LearnPetBadge pet={pet}/>
        {miraText && <LearnMiraKnows text={miraText}/>}
        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:'#1A1363', marginBottom:12 }}>
              {petName}'s current level?
            </div>
            {['Beginner — starting fresh','Some experience — knows basics','Intermediate — solid commands','Advanced — wants to go further'].map(o=>(
              <div key={o} onClick={()=>setLevel(o)}
                style={{ background:level===o?'#EDE9FE':'#fff',
                  border:`1.5px solid ${level===o?'#7C3AED':'rgba(124,58,237,0.20)'}`,
                  borderRadius:12, padding:'12px 16px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:8, transition:'all 0.12s' }}>
                <span style={{ fontSize:14, fontWeight:500, color:'#1A1363' }}>{o}</span>
                {level===o && <span style={{ color:'#7C3AED', fontWeight:700 }}>✓</span>}
              </div>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:'#1A1363', marginBottom:12 }}>
              When works best for you?
            </div>
            {['Weekday mornings','Weekday evenings','Weekend mornings','Weekend afternoons','Flexible'].map(o=>(
              <div key={o} onClick={()=>setSchedule(o)}
                style={{ background:schedule===o?'#EDE9FE':'#fff',
                  border:`1.5px solid ${schedule===o?'#7C3AED':'rgba(124,58,237,0.20)'}`,
                  borderRadius:12, padding:'12px 16px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:8, transition:'all 0.12s' }}>
                <span style={{ fontSize:14, fontWeight:500, color:'#1A1363' }}>{o}</span>
                {schedule===o && <span style={{ color:'#7C3AED', fontWeight:700 }}>✓</span>}
              </div>
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:'#1A1363', marginBottom:8 }}>Mira's on it ✦</div>
            <div style={{ background:'#EDE9FE', borderRadius:12, padding:'16px', marginBottom:16 }}>
              <div style={{ fontSize:13, color:'#1A1363', lineHeight:1.6 }}>
                Our concierge will contact you within 2 hours to arrange {petName}'s {svc.name}.
              </div>
              <div style={{ fontSize:12, color:'#5B21B6', marginTop:8 }}>
                Level: {level} · Schedule: {schedule}
                {/* Prices hidden — concierge-first model */}
              </div>
            </div>
            <textarea placeholder={`Any notes for Mira? (optional)`}
              value={notes} onChange={e=>setNotes(e.target.value)}
              style={{ width:'100%', border:'1.5px solid rgba(124,58,237,0.25)',
                borderRadius:10, padding:'11px 14px', fontSize:13, color:'#1A1363',
                outline:'none', resize:'none', minHeight:80, boxSizing:'border-box' }}/>
          </>
        )}
      </div>
      <div style={{ padding:'0 24px 20px', flexShrink:0 }}>
        <LearnNavButtons
          onBack={step>1 ? ()=>setStep(s=>s-1) : null}
          onNext={()=>setStep(s=>s+1)}
          onSend={send}
          nextDisabled={!canNext}
          isLast={step===totalSteps}
          accentColor={svc.accentColor||G.violet}
          sending={sending}
        />
      </div>
    </>
  );
}



// ─── LOADING / NO PET ─────────────────────────────────────────
function LoadingState(){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing <span style={{color:G.violet}}>your learning journey…</span></div></div>);}
function NoPetState({onAddPet}){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:48,marginBottom:16}}>🎓</div><div style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:8}}>Add a pet to start learning</div><p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Mira builds a personalised learning programme for every dog.</p><button onClick={onAddPet} style={{background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Add your dog →</button></div>);}

// ─── MAIN PAGE ────────────────────────────────────────────────
const LearnSoulPage = () => {
  const navigate = useNavigate();
  const {token,isAuthenticated}                       = useAuth();
  const {currentPet,setCurrentPet,pets:contextPets}  = usePillarContext();
  const pet = currentPet; // alias for sub-components


  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("learn");
  const [openDim,     setOpenDim]     = useState(null);
  const [catModal,    setCatModal]    = useState(null);
  const [petData,     setPetData]     = useState(null);
  const [soulScore,   setSoulScore]   = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [services,    setServices]    = useState([]);
  const [activeBooking,  setActiveBooking]  = useState(null);
  const [conciergeOpen,  setConciergeOpen]  = useState(false);
  const [conciergeType,  setConciergeType]  = useState('');
  const [toastVisible,   setToastVisible]   = useState(false);
  const [toastSvc,    setToastSvc]    = useState("");
  const miraPicksRef = useRef(null);

  const handleBook = useCallback((svc) => {
    if (!svc) return;
    tdc.book({ service: svc.name || svc.id, pillar: "learn", pet: petData, channel: "learn_pillar", amount: svc.base_price || svc.price });
    setConciergeType(svc.concierge_type || svc.id || svc.category || '');
    setConciergeOpen(true);
  }, [petData]);

  // Pre-fetch everything on page load
  useEffect(()=>{
    const CATS=["training","behavior","tricks","enrichment","classes","breed-training_logs","breed-treat_pouchs","breed-care-guide","breed-treat_jars"];
    Promise.all([
      ...CATS.map(cat=>fetch(`${API_URL}/api/admin/pillar-products?pillar=learn&limit=100&category=${encodeURIComponent(cat)}`).then(r=>r.ok?r.json():null).catch(()=>null)),
      fetch(`${API_URL}/api/service-box/services?pillar=learn`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(results=>{
      const svcData=results[results.length-1];
      if(svcData?.services)setServices(svcData.services);
      const grouped={};
      results.slice(0,-1).forEach(data=>{
        (data?.products||[]).forEach(p=>{
          const c=p.category||"",s=p.sub_category||"";
          if(!grouped[c])grouped[c]={};
          if(!grouped[c][s])grouped[c][s]=[];
          grouped[c][s].push(p);
        });
      });
      setApiProducts(grouped);
    });
  },[]);

  useEffect(()=>{if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);if(contextPets!==undefined)setLoading(false);},[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{if(currentPet){setPetData(currentPet);setSoulScore(currentPet.overall_score||currentPet.soul_score||0);}},[currentPet]);

  usePlatformTracking({ pillar: "learn", pet: currentPet });

  const handleAddPet=useCallback(()=>navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/learn"),[isAuthenticated,navigate]);

  if(loading)  return<PillarPageLayout pillar="learn" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if(!petData) return<PillarPageLayout pillar="learn" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const learnDims = getLearnDims(petData);

  // Hero inline (no separate LearnHero.jsx — self-contained)
  const petName = petData.name;
  const breed   = petData.breed||"";

  return (
    <>
    <PillarPageLayout pillar="learn" hideHero hideNavigation>
      <Helmet>
        <title>Learn · {petName} · The Doggy Company</title>
        <meta name="description" content={`Training, behaviour, and breed knowledge for ${petName} — personalised by Mira.`}/>
      </Helmet>

      {/* ── HERO — centered, Care-style ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,${G.violet} 100%)`,
        padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center"}}>

        {/* Mira ORB — top right */}
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",
          background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20,boxShadow:"0 0 24px rgba(155,89,182,0.50)"}}>✦</div>

        {/* Pet avatar + soul badge */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:10}}>
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",
            border:`3px solid rgba(255,255,255,0.30)`,
            boxShadow:`0 0 0 3px rgba(124,58,237,0.40)`,
            background:`linear-gradient(135deg,${G.pale},${G.violet})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#fff"}}>
            {(petData?.photo_url || petData?.avatar_url)
              ? <img src={petData.photo_url||petData.avatar_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="eager" onError={e=>{e.target.style.display="none";}}/>
              : <span>{petData?.avatar||"🐕"}</span>}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,#1A1363,${G.violet})`,
            borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",
            border:"1.5px solid rgba(255,255,255,0.25)",whiteSpace:"nowrap"}}>
            Soul {soulScore}%
          </div>
        </div>

        {/* Eyebrow chip */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.12)",
          borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>
            {soulScore>=95 ? `✦ ${petName}'s learning profile is complete. Mira knows everything.`
              : `✦ Learn & Grow · ${petName}`}
          </span>
        </div>

        {/* H1 — same size as Care hero */}
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",
          marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif",textAlign:"center"}}>
          Learn & Grow for <span style={{color:G.light}}>{petName}</span>
        </h1>
        {/* Subtitle — matches Care/Play hero height */}
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",textAlign:"center",
          marginBottom:14,maxWidth:480,margin:"0 auto 14px",lineHeight:1.6}}>
          Training, behaviour, tricks & enrichment — all personalised and arranged by Mira.
        </p>

        {/* Breed chips */}
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:18}}>
          {breed && <SoulChip icon="🐾" label="Breed" value={breed}/>}
          {isPuppy(petData) ? <SoulChip value="Puppy Programme"/>
            : isSenior(petData) ? <SoulChip value="Senior Enrichment"/>
            : <SoulChip value="Adult Training"/>}
          {getEnergy(petData) && <SoulChip icon="⚡" label="Energy" value={getEnergy(petData)}/>}
        </div>

        {/* Mira quote */}
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",
          borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 20px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.90)",fontStyle:"italic",lineHeight:1.6,margin:0}}>
                "Every dog can learn. I've built {petName}'s programme around {breed?`what works for ${breed}s`:"their personality and energy"}."
              </p>
              <span style={{fontSize:12,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
            </div>
          </div>
        </div>

        {/* Scroll chevron */}
        <div style={{textAlign:"center",paddingBottom:6}}>
          <ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

        {/* Soul Profile bar */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={petData} token={token} pillar="learn" />
        </div>

        {/* Category strip — Care-style icon+label pills with content modal */}
        <div style={{background:"#fff",borderBottom:`1px solid ${G.borderLight}`,position:"relative"}}>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",gap:4}}>
            {LEARN_CATS.map(cat=>{
              const isActive=openDim===cat.id;
              return(
                <button key={cat.id} data-testid={`learn-cat-${cat.id}`}
                  onClick={()=>{
                    setCatModal(cat.id);
                  }}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,
                    minWidth:82,height:72,padding:"10px 12px",cursor:"pointer",background:"transparent",
                    border:"none",borderBottom:`3px solid ${isActive?G.violet:"transparent"}`,
                    transition:"border-color 150ms ease"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:cat.bg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:18,marginBottom:4,flexShrink:0}}>
                    {cat.icon}
                  </div>
                  <span style={{fontSize:10,fontWeight:isActive?700:500,color:isActive?G.violet:"#555",
                    whiteSpace:"nowrap",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",
                    textAlign:"center",lineHeight:1.2}}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB BAR — 3 tabs, below strip ── */}
        <div style={{display:"flex",background:"#fff",borderBottom:`1.5px solid ${G.borderLight}`,marginBottom:24}}>
          {[
            {id:"learn",        label:"🎓 Learn & Products"},
            {id:"services",     label:"📋 Book a Session"},
            {id:"find-learn",   label:"📍 Find Learn"},
          ].map(tab=>{
            const a=activeTab===tab.id;
            return(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                style={{flex:1,padding:"14px 4px",background:"none",border:"none",
                  borderBottom:a?`3px solid ${G.violet}`:"3px solid transparent",
                  color:a?G.violet:"#888",fontSize:13,fontWeight:a?700:500,
                  cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab==="learn" && (
          <>
            {/* Learn Profile — collapsed bar */}
            <div style={{marginBottom:24}}>
              <LearnProfile pet={petData} token={token}/>
            </div>

            {/* Mira Picks */}
            <div ref={miraPicksRef}><MiraPicksSection pet={petData}/></div>

            {/* Soul Made handled inside PersonalisedBreedSection */}

            {/* Guided Learning Paths */}
            <GuidedLearnPaths pet={petData} />

            {/* Dims section heading */}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.5rem,4vw,2rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,'Times New Roman',serif"}}>
                How does <span style={{color:G.violet}}>{petName}</span> love to learn?
              </h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.5}}>
                Choose a dimension — products, videos, and sessions all matched to {petName}'s level and learning style.{" "}
                <span style={{color:G.mid,fontWeight:600}}>Glowing ones match what {petName} needs most.</span>
              </p>
            </section>

            {/* Dim grid */}
            {/* ── 7 DIMENSION CARDS — GuidedCarePaths-style large cards ── */}
            <div style={{display:"grid",gap:16,marginBottom:32}} className="learn-dims-grid">
              <style>{`
                .learn-dims-grid{grid-template-columns:1fr}
                @media(min-width:560px){.learn-dims-grid{grid-template-columns:repeat(2,1fr)}}
                @media(min-width:900px){.learn-dims-grid{grid-template-columns:repeat(3,1fr)}}
              `}</style>
              {learnDims.map(dim=>{
                const isOpen=openDim===dim.id;
                return(
                  <div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                    {/* Card */}
                    <div onClick={()=>setOpenDim(isOpen?null:dim.id)}
                      data-testid={`learn-dim-${dim.id}`}
                      style={{background:"#fff",borderRadius:isOpen?"16px 16px 0 0":16,
                        cursor:"pointer",position:"relative",overflow:"hidden",
                        border:isOpen?`2px solid ${G.violet}`:`2px solid ${G.borderLight}`,
                        boxShadow:dim.glow&&!isOpen?`0 4px 24px ${dim.glowColor}40`:"0 2px 8px rgba(0,0,0,0.06)",
                        transition:"all 0.2s"}}>
                      {/* Coloured top bar */}
                      <div style={{height:6,background:isOpen?G.violet:(dim.glowColor||G.mid),borderRadius:"16px 16px 0 0"}}/>
                      <div style={{padding:"20px 20px 18px"}}>
                        {/* Icon + badges row */}
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{width:52,height:52,borderRadius:14,
                            background:dim.glow?`linear-gradient(135deg,${dim.glowColor}22,${dim.glowColor}44)`:`${G.pale}`,
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
                            {dim.icon}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <span style={{fontSize:10,fontWeight:700,borderRadius:20,padding:"3px 10px",
                              background:`${dim.badgeBg}20`,color:dim.badgeBg,border:`1px solid ${dim.badgeBg}40`}}>
                              {dim.badge}
                            </span>
                            {dim.glow&&<div style={{width:8,height:8,borderRadius:"50%",background:G.light}}/>}
                          </div>
                        </div>
                        {/* Title */}
                        <h3 style={{fontSize:16,fontWeight:800,color:G.darkText,marginBottom:6,lineHeight:1.25,fontFamily:"Georgia,serif"}}>
                          {dim.label}
                        </h3>
                        {/* Description */}
                        <p style={{fontSize:13,color:G.mutedText,lineHeight:1.55,marginBottom:16,
                          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                          {t(dim.sub,petName)}
                        </p>
                        {/* CTA */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:12,color:G.violet,fontWeight:700}}>
                            {isOpen?"Close ↑":"Explore →"}
                          </span>
                          <span style={{fontSize:11,color:"#aaa"}}>{dim.ytQuery?"Products · Videos · Book":"Products · Book"}</span>
                        </div>
                      </div>
                    </div>
                    {isOpen&&<DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} services={services} onBook={handleBook}/>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab==="find-learn" && (
          <div style={{marginTop:8}}>
            <LearnNearMe pet={petData} onBook={handleBook} />
          </div>
        )}

        {activeTab==="services" && (
          <div style={{marginTop:24}}>
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:4,fontFamily:"Georgia,serif"}}>
              Book a learning experience for <span style={{color:G.violet}}>{petName}</span>
            </h2>
            <p style={{fontSize:13,color:G.mutedText,marginBottom:20}}>Arranged by Concierge® · all sessions are personalised for {petName}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:14}}>
              {services.map((svc,i)=>{
                const accent = svc.accentColor || G.violet;
                return (
                  <div key={svc.id||i} style={{background:"#fff",borderRadius:16,
                    border:`2px solid rgba(124,58,237,0.12)`,
                    overflow:"hidden",cursor:"pointer",transition:"all 0.15s",
                    boxShadow:"0 2px 8px rgba(124,58,237,0.06)"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${accent}20`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(124,58,237,0.06)";}}>
                    {/* Image / Watercolour */}
                    <div style={{height:110,background:`linear-gradient(135deg,${G.pale},${G.cream})`,
                      display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                      {(svc.watercolor_image||svc.image_url) && !(svc.watercolor_image||svc.image_url||"").includes("bandana")
                        ? <img src={svc.watercolor_image||svc.image_url} alt={svc.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                        : <span style={{fontSize:38}}>{svc.icon||"🎓"}</span>}
                      {svc.popular&&<span style={{position:"absolute",top:8,right:8,background:accent,color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"2px 8px"}}>Popular</span>}
                    </div>
                    {/* Content */}
                    <div style={{padding:"14px 16px 16px"}}>
                      <div style={{fontSize:14,fontWeight:800,color:G.darkText,marginBottom:3}}>{svc.name}</div>
                      <div style={{fontSize:11,color:G.mutedText,lineHeight:1.45,marginBottom:10,
                        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{svc.description}</div>
                      {/* Mira knows bar */}
                      {svc.miraKnows && (
                        <div style={{background:"#EDE9FE",border:"1px solid rgba(124,58,237,0.20)",borderRadius:8,
                          padding:"7px 10px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:6}}>
                          <span style={{fontSize:12,flexShrink:0}}>✦</span>
                          <span style={{fontSize:11,color:"#3730A3",lineHeight:1.4}}>
                            {svc.miraKnows.replace(/{petName}/g,petName).replace(/{breed}/g,breed||"your dog")}
                          </span>
                        </div>
                      )}
                      {/* Price + Book */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <span style={{fontSize:14,fontWeight:800,color:G.deep}}>
                            {/* Prices hidden — concierge-first model */}
                          </span>
                          {svc.duration&&<span style={{fontSize:10,color:"#aaa",marginLeft:6}}>{svc.duration}</span>}
                        </div>
                        <button onClick={()=>handleBook(svc)}
                          style={{background:`linear-gradient(135deg,${accent},#3730A3)`,
                            color:"#fff",border:"none",borderRadius:20,padding:"7px 16px",
                            fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          Book for {petName} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {services.length===0 && (
              <div style={{textAlign:"center",padding:"40px 0",color:"#aaa"}}>
                <div style={{fontSize:32,marginBottom:10}}>📋</div>
                <p style={{fontWeight:600}}>Services coming soon</p>
                <p style={{fontSize:12}}>Mira is curating {petName}'s learning service providers.</p>
              </div>
            )}
          </div>
        )}

        {/* ── LEARN CONCIERGE MODAL (Care-parity) ── */}
        <LearnConciergeModal
          isOpen={conciergeOpen}
          onClose={()=>setConciergeOpen(false)}
          serviceType={conciergeType}
          petName={petName}
          petId={petData?.id}
          token={token}
        />
      </div>
    </PillarPageLayout>
    <ConciergeToast
      toast={toastVisible ? { name: toastSvc, pillar: "learn" } : null}
      onClose={()=>setToastVisible(false)}
    />
    <LearnContentModal
      isOpen={!!catModal}
      onClose={()=>setCatModal(null)}
      category={catModal}
      pet={petData}
    />
    </>
  );
};

export default LearnSoulPage;
