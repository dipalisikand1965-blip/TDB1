/**
 * LearnSoulPage.jsx — /learn pillar
 * The Doggy Company
 *
 * NEW PAGE — same design language as Care/Go/Dine
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
import { Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeCollection from "../components/SoulMadeCollection";
import ConciergeToast from "../components/common/ConciergeToast";
import { API_URL } from "../utils/api";

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
function getAge(pet)    { return parseInt(pet?.doggy_soul_answers?.age_years||"0")||0; }
function isSenior(pet)  { return getAge(pet) >= 7; }
function isPuppy(pet)   { return getAge(pet) <= 1; }
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
  foundations: "Learn Foundations",
  behaviour:   "Behaviour & Mind",
  training:    "Training & Skills",
  tricks:      "Tricks & Enrichment",
  enrichment:  "Tricks & Enrichment",
  breed:       "Breed Knowledge",
  soul:        "Soul Learn Products",
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
  "labrador":       { style:"Food-motivated — fastest learner with treats", path:"Retrieval + obedience; eager to please any task", enrichment:"Needs mental challenges daily to prevent boredom destruction", watch:"Distracted by food; short focused sessions work best" },
  "indie":          { style:"Independent thinker — best with patience and positive reinforcement", path:"Nose work and exploration; calm confident guidance", enrichment:"Natural foraging — snuffle mats and nose work ideal", watch:"Can be stubborn; never respond to harsh training" },
  "golden retriever":{ style:"One of the most trainable breeds — loves learning", path:"Any method works; excellent at complex multi-step tasks", enrichment:"Advanced puzzles + trick chains; needs mental outlet", watch:"Matures slowly; keep sessions playful not serious" },
  "german shepherd":{ style:"Highly intelligent — needs a job or becomes anxious", path:"Structured obedience, tracking, protection sport", enrichment:"Advanced puzzles + scent work + agility daily", watch:"Under-stimulation causes destructive behaviour; 2h+ mental work needed" },
  "shih tzu":       { style:"Can be independent — patience and small treats work best", path:"Short 5-10 min sessions; very food-motivated", enrichment:"Indoor puzzle toys; not highly driven for active enrichment", watch:"Stubborn streak; quit if sessions too long or harsh" },
  "poodle":         { style:"Exceptionally intelligent — learns complex tasks quickly", path:"Trick training, agility, advanced commands; learns very fast", enrichment:"Level 2-3 puzzles; mental challenge is essential", watch:"Gets bored with repetition; rotate exercises frequently" },
  "beagle":         { style:"Scent-driven — nose overrides most training commands", path:"Scent work and nose work is the natural training path", enrichment:"Snuffle mats, nose work kits — 30+ min daily", watch:"Recall very difficult due to scent; always practise in enclosed area" },
  "border collie":  { style:"Most intelligent breed — needs constant mental stimulation", path:"Agility, herding, complex command chains, advanced tricks", enrichment:"Level 3+ puzzles, nose work, agility every day", watch:"Without 2h+ mental work daily → anxiety, obsessive behaviour" },
  "french bulldog": { style:"Moderate intelligence — learns basics quickly", path:"Short positive sessions; clicker training works well", enrichment:"Food puzzles + interactive toys; not highly active", watch:"Brachycephalic — no extended training in heat" },
  "husky":          { style:"Intelligent but will test every boundary", path:"Challenging; high patience needed; never punish", enrichment:"Complex scent work, running with owner", watch:"Will ignore commands if uninterested; make training genuinely fun" },
};

// ─── LEARN PROFILE COMPONENT ──────────────────────────────────
function LearnProfile({ pet, token }) {
  const petName    = pet?.name || "your dog";
  const breedKey   = (pet?.breed||"indie").toLowerCase().replace(/\s*\(.*\)/,"").trim();
  const breedLabel = (pet?.breed||"Indie").split("(")[0].trim();
  const tip        = BREED_LEARN_TIPS[breedKey] || BREED_LEARN_TIPS["indie"];

  const [answers,    setAnswers]    = useState({});
  const [saved,      setSaved]      = useState({});
  const [submitting, setSubmitting] = useState({});
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
    } catch { setSaved(p=>({...p,[q.id]:true})); }
    finally { setSubmitting(p=>({...p,[q.id]:false})); }
  };

  return (
    <>
      {/* Header bar */}
      <div style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,borderRadius:"16px 16px 0 0",padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
              ✦ GROW {petName.toUpperCase()}'S LEARNING PROFILE
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginBottom:10}}>
              Answer quick questions · Mira tailors every recommendation to {petName}
            </div>
            <div style={{width:"100%",height:4,background:"rgba(255,255,255,0.15)",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.max(liveScore,4)}%`,background:`linear-gradient(90deg,${G.light},${G.violet})`,borderRadius:4,transition:"width 0.4s"}}/>
            </div>
          </div>
          <div style={{textAlign:"right",marginLeft:16}}>
            <span style={{fontSize:48,fontWeight:900,color:G.light,lineHeight:1}}>{liveScore}</span>
            <span style={{fontSize:16,color:G.light,fontWeight:700}}>%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{background:"#0F0C29",borderRadius:"0 0 16px 16px",padding:"16px 20px 20px",maxHeight:"70vh",overflowY:"auto"}}>
        {/* Breed tips — always shown */}
        <div style={{background:`linear-gradient(135deg,#1A1363,#0F0C29)`,border:`1px solid ${G.greenBorder}`,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
            📚 LEARNING TIPS · {breedLabel.toUpperCase()}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"🎓 Learning style",value:tip.style,col:G.violet},
              {label:"🏆 Training path",value:tip.path,col:G.mid},
              {label:"🧩 Enrichment",value:tip.enrichment,col:"#1565C0"},
            ].map(({label,value,col})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.80)",lineHeight:1.4}}>{value}</div>
              </div>
            ))}
            <div style={{background:"rgba(255,179,0,0.10)",border:"1px solid rgba(255,179,0,0.25)",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,fontWeight:700,color:"#FFB300",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>⚠️ Watch for</div>
              <div style={{fontSize:11,color:"rgba(255,220,100,0.85)",lineHeight:1.4}}>{tip.watch}</div>
            </div>
          </div>
        </div>

        {/* Questions */}
        {remaining.length===0 ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:32,marginBottom:8}}>✦</div>
            <div style={{fontSize:14,fontWeight:700,color:G.light,marginBottom:4}}>Mira knows {petName}'s learning style</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.50)"}}>Learning profile complete · {liveScore}% soul score</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.40)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>
              {remaining.length} questions remaining
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {remaining.slice(0,4).map(q => {
                const qAns=answers[q.id]||[], isSaved=saved[q.id], isSend=submitting[q.id];
                const label=q.question.replace(/{name}/g,petName), hasAns=qAns.length>0;
                if (isSaved) return (
                  <div key={q.id} style={{borderRadius:16,padding:16,minHeight:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:`linear-gradient(135deg,#0F0C29,${G.deep})`,border:`2px solid ${G.light}60`}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(167,139,250,0.18)",border:`2px solid ${G.light}80`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{color:G.light,fontSize:16}}>✓</span>
                    </div>
                    <p style={{fontWeight:800,color:G.light,fontSize:13,textAlign:"center"}}>Soul score growing!</p>
                    <div style={{borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,background:"rgba(167,139,250,0.20)",color:G.light,border:`1px solid ${G.light}50`}}>+{q.pts} pts</div>
                  </div>
                );
                return (
                  <div key={q.id} style={{borderRadius:16,padding:"14px 14px 12px",background:`linear-gradient(135deg,#0F0C29,${G.deep})`,border:`1.5px solid ${G.greenBorder}`,minHeight:120}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:10,fontWeight:600,color:"rgba(167,139,250,0.85)"}}>{q.chapter}</span>
                      <span style={{borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,background:"rgba(124,58,237,0.20)",color:G.light,border:`1px solid rgba(124,58,237,0.35)`}}>+{q.pts} pts</span>
                    </div>
                    <p style={{fontWeight:700,fontSize:12,color:"rgba(255,255,255,0.92)",marginBottom:10,lineHeight:1.4}}>{label}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                      {q.options.map(opt => {
                        const sel=q.type==="single"?qAns[0]===opt:qAns.includes(opt);
                        return (
                          <button key={opt} onClick={()=>toggle(q.id,opt,q.type==="single")}
                            style={{borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:sel?600:400,cursor:"pointer",background:sel?"rgba(124,58,237,0.25)":"rgba(255,255,255,0.07)",border:sel?`1.5px solid ${G.violet}`:"1px solid rgba(255,255,255,0.15)",color:sel?G.pale:"rgba(255,255,255,0.72)",transition:"all 0.12s"}}>
                            {opt.replace(/{name}/g,petName)}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={()=>save(q)} disabled={isSend||!hasAns}
                      style={{marginTop:4,width:"100%",borderRadius:10,padding:"8px",fontSize:12,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:!hasAns?`${G.violet}22`:`linear-gradient(135deg,${G.violet},${G.mid})`,border:"none",cursor:isSend?"wait":!hasAns?"not-allowed":"pointer",opacity:isSend?0.7:1}}>
                      {isSend?"Saving…":`Save +${q.pts} pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div style={{textAlign:"center",marginTop:14}}>
          <a href={`/pet-soul/${pet?.id}`} style={{fontSize:12,fontWeight:600,color:`${G.light}BB`,textDecoration:"none"}}>
            See full soul profile →
          </a>
        </div>
      </div>
    </>
  );
}

// ─── VIDEO CARD ───────────────────────────────────────────────
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

  // Products from pre-fetched apiProducts
  const catName = DIM_ID_TO_CATEGORY[dim.id]||"Learn Foundations";
  const catData = apiProducts[catName]||{};
  const allRaw  = Object.values(catData).flat().filter(p => {
    const sub=(p.sub_category||"").toLowerCase();
    const cat=(p.category||"").toLowerCase();
    if (dim.id==="soul")       return sub==="soul"||cat.includes("training_log")||cat.includes("treat_pouch")||cat.includes("treat_jar");
    if (dim.id==="breed")      return sub==="breed_guides"||cat.includes("care_guide");
    if (dim.id==="tricks")     return sub==="tricks";
    if (dim.id==="enrichment") return sub==="enrichment";
    return sub===dim.id||cat===dim.id||cat==="learn-essentials";
  });

  const intelligent = applyMiraIntelligence(allRaw, allergies, pet);
  const subCats     = [...new Set(allRaw.map(p=>p.sub_category).filter(Boolean))];
  const tabList     = ["All",...subCats];
  const products    = activeTab==="All" ? intelligent : intelligent.filter(p=>p.sub_category===activeTab);

  // Services for this dim
  const dimServices = services.filter(s => s.category===dim.id||(s.pillar==="learn"&&!s.category));

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
                  <SharedProductCard product={p} pillar="learn" selectedPet={pet} miraContext={miraCtx}/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PERSONALISED TAB (Fix 7+8) ── */}
      {dimTab==="personalised" && (
        <div style={{padding:"12px 16px 20px"}}>
          <PersonalisedBreedSection pet={pet} pillar="learn" />
          <div style={{borderTop:"1px solid #f0f0f0",marginTop:16,paddingTop:16}}>
            <SoulMadeCollection pillar="learn" maxItems={6} showTitle={true} />
          </div>
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
      {dimTab==="services" && (
        <div style={{padding:"12px 16px 20px"}}>
          {dimServices.length===0 ? (
            <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:8}}>📋</div>
              Book a session with our concierge team for {petName}'s {dim.label.toLowerCase()} programme.
              <div style={{marginTop:16}}>
                <button style={{background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  Ask Mira →
                </button>
              </div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {dimServices.map((svc,i)=>(
                <div key={svc.id||i} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}}>
                  <div style={{height:110,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                    {(svc.watercolor_image||svc.image_url)
                      ? <img src={svc.watercolor_image||svc.image_url} alt={svc.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                      : <span style={{fontSize:32}}>🎓</span>}
                  </div>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:3}}>{svc.name}</div>
                    <div style={{fontSize:11,color:G.mutedText,marginBottom:10,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{svc.description}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,fontWeight:700,color:G.deep}}>
                        {svc.base_price>0?`₹${parseInt(svc.base_price).toLocaleString("en-IN")}`:"Free"}
                      </span>
                      <button onClick={()=>onBook?.(svc)}
                        style={{background:G.violet,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        Book →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MIRA PICKS ───────────────────────────────────────────────
function MiraPicksSection({ pet }) {
  const [picks, setPicks]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [selectedPick,setSelectedPick] = useState(null);
  const petName = pet?.name || "your dog";

  const miraImagines = [
    {emoji:"🎓",bg:`linear-gradient(135deg,${G.deep},${G.mid})`,name:"Puppy Starter Kit",desc:"Everything to start right",reason:"Because every journey starts here"},
    {emoji:"🧠",bg:`linear-gradient(135deg,#1a0a2e,${G.deep})`,name:"Calm & Confident Bundle",desc:"Anxiety wrap + diffuser + journal",reason:"Because understanding comes first"},
    {emoji:"🏆",bg:`linear-gradient(135deg,${G.deep},#1a2a4a)`,name:"Training Essentials Kit",desc:"Pouch + target stick + log + flashcards",reason:"Because the right tools matter"},
    {emoji:"🧩",bg:`linear-gradient(135deg,#0a1a2a,${G.mid})`,name:"Mental Gym Bundle",desc:"Puzzle + snuffle mat + nose work",reason:"Because a tired mind is a happy dog"},
  ];

  useEffect(()=>{
    if(!pet?.id){setLoading(false);return;}
    const breed=encodeURIComponent(pet?.breed?.toLowerCase().trim()||"");
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn&limit=12&min_score=60&entity_type=product&breed=${breed}`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn&limit=6&min_score=60&entity_type=service`).then(r=>r.ok?r.json():null),
    ]).then(([pD,sD])=>{
      const prods=pD?.picks||[],svcs=sD?.picks||[];
      const merged=[];let pi=0,si=0;
      while(pi<prods.length||si<svcs.length){
        if(pi<prods.length)merged.push(prods[pi++]);
        if(pi<prods.length)merged.push(prods[pi++]);
        if(si<svcs.length)merged.push(svcs[si++]);
      }
      if(merged.length)setPicks(merged.slice(0,16));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[pet?.id]);

  return (
    <section style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>
          Mira's Learn Picks for <span style={{color:G.violet}}>{petName}</span>
        </h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>AI Scored</span>
      </div>
      <p style={{fontSize:12,color:"#888",marginBottom:16}}>Products and sessions matched to {petName}'s learning level and style.</p>

      {!loading && picks.length===0 ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:14}}>
          {miraImagines.map((c,i)=>(
            <div key={i} style={{background:c.bg,borderRadius:16,padding:"20px 16px 16px",position:"relative"}}>
              <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.18)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff"}}>Mira Imagines</div>
              <div style={{fontSize:44,textAlign:"center",marginTop:20,marginBottom:12}}>{c.emoji}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",textAlign:"center",marginBottom:5}}>{c.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.60)",textAlign:"center",marginBottom:4}}>{c.desc}</div>
              <div style={{fontSize:11,color:G.light,fontStyle:"italic",textAlign:"center",marginBottom:14}}>{c.reason}</div>
              <button style={{width:"100%",background:`linear-gradient(135deg,${G.violet},${G.mid})`,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Request a Quote →</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>
          {picks.map((pick,i)=>{
            const isService=pick.entity_type==="service";
            const img=[pick.image_url,pick.image,...(pick.images||[])].find(u=>u&&u.startsWith("http"))||null;
            const score=pick.mira_score||0;
            const scoreColor=score>=80?"#16A34A":score>=70?G.violet:"#6B7280";
            return (
              <div key={pick.id||i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}} onClick={()=>!isService&&setSelectedPick(pick)}>
                <div style={{width:"100%",height:130,background:G.cream,overflow:"hidden",position:"relative"}}>
                  {img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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
      {selectedPick&&<ProductDetailModal product={selectedPick} pillar="learn" selectedPet={pet} onClose={()=>setSelectedPick(null)}/>}
    </section>
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

  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("learn");
  const [openDim,     setOpenDim]     = useState(null);
  const [petData,     setPetData]     = useState(null);
  const [soulScore,   setSoulScore]   = useState(0);
  const [apiProducts, setApiProducts] = useState({});
  const [services,    setServices]    = useState([]);
  const [toastVisible,setToastVisible]= useState(false);
  const [toastSvc,    setToastSvc]    = useState("");
  const miraPicksRef = useRef(null);

  const handleBook = useCallback(async (svc) => {
    const petName = petData?.name || "your dog";
    const svcName = svc?.name || "this service";
    const text = `Hi! ${petName}'s parent would like to book ${svcName}. Please arrange and confirm.`;
    try {
      const user = JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({
          parent_id: user?.id||user?.email||"guest",
          pet_id:    petData?.id||"unknown",
          pillar:    "learn",
          intent_primary:   "service_request",
          intent_secondary: [svcName, "learn_booking"],
          life_state:  "learn",
          channel:     "learn_booking",
          initial_message: { sender:"parent", source:"learn_page", text },
        }),
      });
    } catch(e) { console.error("[LearnSoulPage] handleBook", e); }
    setToastSvc(svcName);
    setToastVisible(true);
  }, [petData, token]);

  // Pre-fetch everything on page load
  useEffect(()=>{
    const CATS=["Learn Foundations","Behaviour & Mind","Training & Skills","Tricks & Enrichment","Breed Knowledge","Soul Learn Products","bundles"];
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

      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,${G.violet} 100%)`,padding:"32px 20px 0",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:20,right:20,width:48,height:48,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 0 24px rgba(155,89,182,0.50)"}}>✦</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.12)",borderRadius:20,padding:"4px 14px",marginBottom:16}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>✦ {petName}'s Learning Journey</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.70)"}}>·</span>
          <span style={{fontSize:13,fontWeight:900,color:G.light}}>{soulScore}%</span>
        </div>
        <h1 style={{fontSize:"clamp(1.6rem,5vw,2.4rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif"}}>
          Grow <span style={{color:G.light}}>{petName}</span><br/>one skill at a time
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.65)",marginBottom:16,maxWidth:480}}>
          Training, behaviour, tricks, and enrichment —{" "}
          <span style={{color:G.light,fontWeight:600}}>all personalised for {breed||petName}.</span>
        </p>
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 16px",marginBottom:20,maxWidth:520}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.55,margin:0}}>
                "Every dog can learn. I've built {petName}'s programme around {breed?`what works for ${breed}s`:"their personality and energy"}."
              </p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:0,marginTop:4}}>
          {[["learn","🎓 Learn & Grow"],["services","📋 Book a Session"]].map(([id,label])=>{
            const a=activeTab===id;
            return(
              <button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,padding:"12px 0",background:"none",border:"none",borderBottom:a?`3px solid ${G.light}`:"3px solid transparent",color:a?"#fff":"rgba(255,255,255,0.50)",fontSize:13,fontWeight:a?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

        {/* Category strip */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",padding:"16px 0 12px",marginBottom:4}}>
          {[
            {id:"foundations",icon:"🎓",label:"Foundations"},
            {id:"behaviour",  icon:"🧠",label:"Behaviour"},
            {id:"training",   icon:"🏆",label:"Training"},
            {id:"tricks",     icon:"✨",label:"Tricks & Fun"},
            {id:"enrichment", icon:"🧩",label:"Enrichment"},
            {id:"breed",      icon:"📚",label:"Know Your Breed"},
            {id:"soul",       icon:"🌟",label:"Soul Learn"},
            {id:"mira",       icon:"✦", label:"Mira's Picks"},
          ].map(s=>{
            const sel=openDim===s.id;
            return(
              <button key={s.id}
                onClick={()=>{
                  if(s.id==="mira"){miraPicksRef.current?.scrollIntoView({behavior:"smooth",block:"start"});return;}
                  setOpenDim(sel?null:s.id);
                }}
                style={{display:"inline-flex",alignItems:"center",gap:6,flexShrink:0,padding:"8px 16px",borderRadius:9999,border:`1.5px solid ${sel?G.violet:"rgba(124,58,237,0.28)"}`,background:sel?G.violet:"#fff",color:sel?"#fff":G.mutedText,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                <span style={{fontSize:14}}>{s.icon}</span>{s.label}
              </button>
            );
          })}
        </div>

        {activeTab==="learn" && (
          <>
            {/* Learn Profile */}
            <div style={{marginBottom:24}}>
              <LearnProfile pet={petData} token={token}/>
            </div>

            {/* Mira Picks */}
            <div ref={miraPicksRef}><MiraPicksSection pet={petData}/></div>

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
            <div style={{display:"grid",gap:10,marginBottom:28}} className="learn-dims-grid">
              <style>{`
                .learn-dims-grid{grid-template-columns:repeat(2,1fr)}
                @media(min-width:640px){.learn-dims-grid{grid-template-columns:repeat(4,1fr)}}
                @media(min-width:1024px){.learn-dims-grid{grid-template-columns:repeat(7,1fr)}}
              `}</style>
              {learnDims.map(dim=>{
                const isOpen=openDim===dim.id;
                return(
                  <div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                    <div onClick={()=>setOpenDim(isOpen?null:dim.id)}
                      style={{background:"#fff",borderRadius:isOpen?"14px 14px 0 0":12,padding:"14px 10px",cursor:"pointer",position:"relative",textAlign:"center",opacity:dim.glow?1:0.65,boxShadow:dim.glow&&!isOpen?`0 0 18px ${dim.glowColor}`:"none",border:isOpen?`2px solid ${G.violet}`:"2px solid transparent",transition:"all 0.15s"}}
                      data-testid={`learn-dim-${dim.id}`}>
                      {dim.glow&&<div style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:G.light}}/>}
                      <div style={{fontSize:22,marginBottom:8}}>{dim.icon}</div>
                      <div style={{fontSize:12,fontWeight:700,color:G.darkText,marginBottom:3,lineHeight:1.2}}>{dim.label}</div>
                      <div style={{fontSize:10,color:G.mutedText,lineHeight:1.3,marginBottom:6}}>{t(dim.sub,petName)}</div>
                      <span style={{fontSize:9,fontWeight:700,borderRadius:20,padding:"2px 7px",display:"inline-block",background:`${dim.badgeBg}22`,color:dim.badgeBg}}>{dim.badge}</span>
                      <span style={{position:"absolute",bottom:8,right:8,fontSize:12,color:"rgba(0,0,0,0.20)",transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                    </div>
                    {isOpen&&<DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} services={services} onBook={handleBook}/>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab==="services" && (
          <div style={{marginTop:24}}>
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:16,fontFamily:"Georgia,serif"}}>
              Book a learning experience for <span style={{color:G.violet}}>{petName}</span>
            </h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {services.map((svc,i)=>(
                <div key={svc.id||i} style={{background:"#fff",borderRadius:16,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}}>
                  <div style={{height:120,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                    {(svc.watercolor_image||svc.image_url)?<img src={svc.watercolor_image||svc.image_url} alt={svc.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:36}}>🎓</span>}
                  </div>
                  <div style={{padding:"12px 14px 14px"}}>
                    <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:4}}>{svc.name}</div>
                    <div style={{fontSize:11,color:G.mutedText,lineHeight:1.4,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{svc.description}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,fontWeight:700,color:G.deep}}>{svc.base_price>0?`₹${parseInt(svc.base_price).toLocaleString("en-IN")}`:"Free"}</span>
                      <button onClick={()=>handleBook(svc)}
                        style={{background:G.violet,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Book →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PillarPageLayout>
    <ConciergeToast
      toast={toastVisible ? { name: toastSvc, pillar: "learn" } : null}
      onClose={()=>setToastVisible(false)}
    />
    </>
  );
};

export default LearnSoulPage;
