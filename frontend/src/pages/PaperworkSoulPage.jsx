/**
 * PaperworkSoulPage.jsx — /paperwork pillar
 * The Doggy Company
 *
 * MERGED: Paperwork + Advisory into one pillar
 * Colour world: Deep Slate #1E293B + Teal #0D9488
 * Replaces both /paperwork and /advisory pages.
 *
 * WIRING:
 *   1. Route:    <Route path="/paperwork" element={<PaperworkSoulPage/>}/>
 *   2. Products: GET /api/admin/pillar-products?pillar=paperwork&category=...
 *   3. Docs:     GET /api/documents/completeness/{petId}
 *   4. Upload:   POST /api/documents/upload
 *   5. Booking:  POST /api/service_desk/attach_or_create_ticket
 *
 * 7 Dims: Identity & Safety · Health Records · Travel Documents
 *         Insurance & Finance · Breed & Care Guides · Expert Advisory · Soul Documents
 * 3 tabs per dim: Products | Services | Advisory
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import SharedProductCard, { ConciergeOnlyProductDetailModal, ProductDetailModal } from "../components/ProductCard";
import ServiceBookingModal from "../components/ServiceBookingModal";
import SoulMadeCollection from "../components/SoulMadeCollection";
import SoulMadeModal from "../components/SoulMadeModal";
import PillarServiceSection from "../components/PillarServiceSection";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import ConciergeToast from "../components/common/ConciergeToast";
import GuidedPaperworkPaths from "../components/paperwork/GuidedPaperworkPaths";
import DocumentVault from "../components/paperwork/DocumentVault";
import PaperworkNearMe from "../components/paperwork/PaperworkNearMe";
import { API_URL } from "../utils/api";
import { filterBreedProducts } from "../hooks/useMiraFilter";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import DesktopSoulCard from "../components/common/DesktopSoulCard";
import PaperworkMobilePage from './PaperworkMobilePage';

// ─── COLOUR SYSTEM ─────────────────────────────────────────
const G = {
  deep:        "#1E293B",
  mid:         "#334155",
  teal:        "#0D9488",
  light:       "#99F6E4",
  pale:        "#F0FDFA",
  cream:       "#F8FAFC",
  pageBg:      "#F8FAFC",
  darkText:    "#1E293B",
  mutedText:   "#475569",
  hintText:    "#0D9488",
  border:      "rgba(13,148,136,0.18)",
  borderLight: "rgba(13,148,136,0.10)",
  greenBorder: "rgba(13,148,136,0.28)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── HELPERS ───────────────────────────────────────────────
function t(str, name) {
  if (!str) return "";
  return str
    .replace(/\{name\}/g, name || "your dog")
    .replace(/\{petName\}/g, name || "your dog");
}
function getAge(pet)   { return parseInt(pet?.doggy_soul_answers?.age_years||"0")||0; }
function isSenior(pet) { return getAge(pet)>=7; }
function isPuppy(pet)  { return getAge(pet)<=1; }
function isMultiPet(p) { return !!(p?.doggy_soul_answers?.other_pets||p?.siblings?.length); }
function isRescue(p)   { return !!(p?.doggy_soul_answers?.is_rescue||(""+p?.origin).toLowerCase().includes("rescue")); }

// ─── DOCUMENT COMPLETENESS SCORE ───────────────────────────
function getDocScore(pet) {
  // Until API wired — estimate from soul profile data
  let score = 0;
  if (pet?.vaccinated)                         score += 15;
  if (pet?.doggy_soul_answers?.microchipped)   score += 20;
  if (pet?.doggy_soul_answers?.insurance)      score += 15;
  if (pet?.doggy_soul_answers?.registered)     score += 15;
  if (pet?.doggy_soul_answers?.travel_docs)    score += 10;
  if (pet?.emergency_contact)                  score += 10;
  if (pet?.health?.medical_conditions)         score += 15;
  return score;
}

function getMissingDocs(pet) {
  const missing = [];
  if (!pet?.vaccinated)                           missing.push("Vaccination records");
  if (!pet?.doggy_soul_answers?.microchipped)     missing.push("Microchip registration");
  if (!pet?.doggy_soul_answers?.insurance)        missing.push("Pet insurance");
  if (!pet?.doggy_soul_answers?.registered)       missing.push("Society/municipal registration");
  return missing;
}

// ─── DIM CONFIG ────────────────────────────────────────────
export function getPaperworkDims(pet) {
  const senior  = isSenior(pet);
  const puppy   = isPuppy(pet);
  const multi   = isMultiPet(pet);
  const rescue  = isRescue(pet);
  const breed   = pet?.breed||pet?.doggy_soul_answers?.breed||null;
  const missing = getMissingDocs(pet);

  return [
    {
      id:"identity", icon:"🪪", label:"Identity & Safety",
      sub: missing.includes("Microchip registration") ? "Microchip not registered yet" : "Registration, ID & emergency info",
      badge: missing.includes("Microchip registration") ? "Action needed" : "Protected",
      badgeBg: missing.includes("Microchip registration") ? "#C62828" : G.teal,
      glow: missing.includes("Microchip registration"), glowColor:"rgba(13,148,136,0.30)",
      mira: missing.includes("Microchip registration")
        ? `{name}'s microchip isn't registered yet — this is the most important step. I've flagged what to do first.`
        : `{name}'s identity and safety documents look good. I've curated the essentials for complete protection.`,
    },
    {
      id:"health", icon:"🏥", label:"Health Records",
      sub: pet?.vaccinated ? "Vaccination records on file" : "Vaccination records needed",
      badge: pet?.vaccinated ? "Up to date" : "Needs attention",
      badgeBg: pet?.vaccinated ? G.teal : "#E65100",
      glow: !pet?.vaccinated, glowColor:"rgba(13,148,136,0.28)",
      mira: pet?.vaccinated
        ? `{name}'s vaccination records are in order. I'll remind you when boosters are due.`
        : `{name}'s vaccination records need to be uploaded. This is critical for boarding, travel and kennel entry.`,
    },
    {
      id:"travel", icon:"✈️", label:"Travel Documents",
      sub: breed ? `${breed} travel — passport & health cert` : "Pet passport & international health cert",
      badge: "Travel ready", badgeBg: G.mid,
      glow: false, glowColor:"rgba(13,148,136,0.20)",
      mira:`Planning to travel with {name}? I've organised everything — passport, health cert, airline checklist — for any destination.`,
    },
    {
      id:"insurance", icon:"🛡️", label:"Insurance & Financial",
      sub: missing.includes("Pet insurance") ? "No pet insurance on file" : "Policy + claims + budget",
      badge: missing.includes("Pet insurance") ? "Not covered" : "Covered",
      badgeBg: missing.includes("Pet insurance") ? "#C62828" : G.teal,
      glow: missing.includes("Pet insurance"), glowColor:"rgba(13,148,136,0.25)",
      mira: missing.includes("Pet insurance")
        ? `{name} doesn't have pet insurance yet. I'll help you compare, choose, and set up the right policy.`
        : `{name}'s insurance is active. I track renewals and help with claims when you need it.`,
    },
    {
      id:"breeds", icon:"📚", label:"Breed & Care Guides",
      sub: breed ? `${breed} — breed guide + care tips` : "Breed-specific care, training & health",
      badge:"Know your breed", badgeBg: G.mid,
      glow: true, glowColor:"rgba(13,148,136,0.22)",
      mira: breed
        ? `I've curated everything specific to ${breed}s — care guide, training approach, common health risks to watch for.`
        : `Every breed is different. Understanding {name}'s breed unlocks better care decisions at every stage.`,
    },
    {
      id:"advisory", icon:"💡", label:"Expert Advisory",
      sub: multi ? "Multi-pet household guidance" : puppy ? "New puppy planning" : "Life planning & expert guidance",
      badge: multi ? "Multi-pet" : puppy ? "New puppy" : "Life advice",
      badgeBg: multi ? "#7C3AED" : puppy ? G.teal : G.mid,
      glow: true, glowColor:"rgba(13,148,136,0.25)",
      mira: multi
        ? `Managing multiple pets takes planning. I've built guidance specific to {name}'s household.`
        : puppy
        ? `{name} is a puppy — I've put together everything a new parent needs in one place.`
        : `Expert guidance on pet life planning, housing rules, behaviour, and every stage of {name}'s life.`,
    },
    {
      id:"soul", icon:"🌟", label:"Soul Documents",
      sub: breed ? `${breed} passport holder — made for {name}` : "Breed passport holder",
      badge:"Made for you", badgeBg: G.teal,
      glow: true, glowColor:"rgba(13,148,136,0.22)",
      mira:`{name}'s breed-specific passport holder — carries the identity, soul profile, and story of this dog.`,
    },
    {
      id:"soul_made", icon:"✦", label:"Soul Made™",
      sub: `Custom-made for {name}`,
      badge:"Make it personal", badgeBg: G.teal,
      glow: true, glowColor:"rgba(13,148,136,0.22)",
      mira:`Want something truly one-of-a-kind for {name}? Upload a photo — Concierge® creates it.`,
    },
  ];
}

export const DIM_ID_TO_CATEGORY = {
  identity:  "Identity & Safety",
  health:    "Health Records",
  travel:    "Travel Documents",
  insurance: "Insurance & Finance",
  breeds:    "Breed & Advisory",
  advisory:  "Expert Advisory",
  soul:      "Soul Documents",
  bundles:   "bundles",
};

// ─── PAPERWORK SERVICES ────────────────────────────────────
const PAPER_SERVICES = [
  { id:"registration",  icon:"🪪", name:"Pet Registration Guidance",  tagline:"Society + municipal support",      price:"₹500",   steps:2, dim:"identity",  accentColor:"#0D9488", desc:"Complete registration guidance for {petName} — society forms, municipal licensing, all paperwork handled.", miraKnows:"Registration protects {petName} legally and is required by most housing societies." },
  { id:"microchipping", icon:"🔬", name:"Microchipping Assistance",    tagline:"Permanent identity support",       price:"₹300",   steps:2, dim:"identity",  accentColor:"#1E293B", desc:"Concierge® arranges microchipping and registry — permanent ID for {petName} that can never be lost.", miraKnows:"Microchipping is the single most important thing for {petName}'s safety." },
  { id:"passport",      icon:"✈️", name:"Pet Passport Service",         tagline:"International travel prep",        price:"₹2,999", steps:3, dim:"travel",    accentColor:"#0D9488", desc:"Full pet passport service — vet coordination, health certificates, rabies titres, all documentation.", miraKnows:"International travel requires specific documents — requirements vary by country. Mira handles everything." },
  { id:"travel_docs",   icon:"📋", name:"Travel Documentation",         tagline:"Airline + country guidance",       price:"₹1,500", steps:2, dim:"travel",    accentColor:"#334155", desc:"All travel documents for {petName} — health certificate, airline approval, import permits where needed.", miraKnows:"Airlines have strict pet document requirements. Missing one can mean {petName} can't board." },
  { id:"insurance_rev", icon:"🛡️", name:"Pet Insurance Review",         tagline:"Find the right cover",              price:"Free",   steps:2, dim:"insurance", accentColor:"#0D9488", desc:"Mira compares pet insurance policies and finds the right cover for {petName}'s breed, age and health.", miraKnows:"Pet insurance is most affordable when started young. I'll find the right policy for {petName}." },
  { id:"claim_filing",  icon:"📝", name:"Claim Filing Assistance",      tagline:"We file it for you",                price:"Free",   steps:2, dim:"insurance", accentColor:"#334155", desc:"Concierge® handles the entire claim process — paperwork, follow-up, and settlement tracking.", miraKnows:"Claim rejections often happen due to incorrect paperwork. I handle this for {petName}'s family." },
  { id:"life_planning", icon:"💡", name:"Pet Life Planning",            tagline:"Plan {petName}'s life well",       price:"Free",   steps:2, dim:"advisory",  accentColor:"#1E293B", desc:"A comprehensive life plan for {petName} — every stage from puppy to senior, all guidance in one session.", miraKnows:"Planning ahead for {petName} reduces stress and ensures nothing is missed." },
  { id:"puppy_prep",    icon:"🐶", name:"New Puppy Preparation",        tagline:"Everything for the first year",    price:"₹1,499", steps:3, dim:"advisory",  accentColor:"#0D9488", desc:"Complete first-year guide for {petName} — vet, food, training, grooming, socialisation, documents.", miraKnows:"The first year is the most important. I've built the complete roadmap for {petName}." },
];

// ─── MIRA PICKS ────────────────────────────────────────────
function MiraPicksSection({ pet, token, onOpenService }) {
  const [picks,setPicks]=useState([]); const [picksLoading,setPicksLoading]=useState(true);
  const [selPick,setSelPick]=useState(null);
  const petName=pet?.name||"your dog";

  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    const breed=encodeURIComponent(pet?.breed?.toLowerCase().trim()||"");
    fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=paperwork&limit=12&min_score=40&breed=${breed}`,
      {headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if(!d){setPicksLoading(false);return;}
        const prods=(d.picks||[]).filter(p=>p.entity_type==='product'||p.type==='product'||(!p.entity_type&&!p.type));
        const svcs=(d.picks||[]).filter(p=>p.entity_type==='service'||p.type==='service');
        const merged=[];let pi=0,si=0;
        while(pi<prods.length||si<svcs.length){
          if(pi<prods.length)merged.push(prods[pi++]);
          if(pi<prods.length)merged.push(prods[pi++]);
          if(si<svcs.length)merged.push(svcs[si++]);
        }
        if(merged.length)setPicks(merged.slice(0,12));
        setPicksLoading(false);
      })
      .catch(()=>setPicksLoading(false));
  },[pet?.id,token]);

  const productPicks=picks.filter(p=>p.entity_type==='product'||p.type==='product'||(!p.entity_type&&!p.type));
  const servicePicks=picks.filter(p=>p.entity_type==='service'||p.type==='service');
  const badgeLabel=productPicks.length>0?'AI Scored':servicePicks.length>0?'Concierge® Curated':'Curated';

  return (
    <section style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:G.darkText,margin:0,fontFamily:"Georgia,serif"}}>Mira's Paperwork Picks for <span style={{color:G.teal}}>{petName}</span></h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{badgeLabel}</span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16}}>Documents, identity and services prioritised for {petName}'s protection.</p>
      {picksLoading&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:G.mutedText}}><span style={{fontSize:12}}>Mira is preparing picks…</span></div>}
      {!picksLoading&&picks.length>0&&(
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>
          {picks.map((pick,i)=>{
            const isService=pick.entity_type==='service'||pick.type==='service';
            const score=pick.mira_score||0;
            const col=score>=80?"#16A34A":score>=70?G.teal:"#6B7280";
            const _ri=[pick.cloudinary_url,pick.mockup_url,pick.image_url,pick.image].find(u=>u&&u.startsWith("http"))||null;
            const img=_ri&&(!_ri.includes("ai_generated")||_ri.includes("cloudinary.com"))?_ri:null;
            return(
              <div key={i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer"}}
                onClick={()=>isService?onOpenService?.(pick.name):setSelPick(pick)}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform=""}>
                <div style={{width:"100%",height:130,background:G.pale,overflow:"hidden"}}>
                  {img
                    ?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                    :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${G.deep},${G.teal})`,color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,24)}</div>}
                </div>
                <div style={{padding:"10px 11px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:G.darkText,lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div>
                  {isService
                    ?<p style={{fontSize:11,color:G.teal,lineHeight:1.45,margin:'0 0 8px'}}>Concierge® can arrange this for {petName}.</p>
                    :<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
                      <div style={{flex:1,height:4,background:G.pale,borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:col,borderRadius:4}}/></div>
                      <span style={{fontSize:10,fontWeight:800,color:col,minWidth:26}}>{score}</span>
                    </div>}
                  <button
                    onClick={e=>{e.stopPropagation();
                      if(isService){tdc.book({service:pick.name,pillar:'paperwork',pet,channel:'paperwork_mira_picks_service'});onOpenService?.(pick.name);}
                      else{setSelPick(pick);}
                    }}
                    style={{width:'100%',background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:'#fff',border:'none',borderRadius:10,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    {isService?'Talk to Mira →':'View details →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selPick&&<ProductDetailModal product={selPick} pillar="paperwork" selectedPet={pet} onClose={()=>setSelPick(null)}/>}
    </section>
  );
}

// ─── DIM EXPANDED ──────────────────────────────────────────
export function DimExpanded({ dim, pet, onClose, apiProducts={}, services=[], onBook, onViewDetails }) {
  const petName = pet?.name||"your dog";
  const miraCtx = { includeText:"Add" };
  const [dimTab,    setDimTab]    = useState("products");
  const [activeTab, setActiveTab] = useState("All");

  const catName = DIM_ID_TO_CATEGORY[dim.id]||"Identity & Safety";
  const catData = apiProducts[catName]||{};
  const allRaw  = Object.values(catData).flat().filter(p=>{
    const sub=(p.sub_category||"").toLowerCase();
    if (dim.id==="soul") return sub==="soul"||p.category?.includes("passport_holder");
    if (dim.id==="breeds") return sub==="breed_guides"||p.category?.includes("care_guide");
    return sub===dim.id||p.category===dim.id;
  });

  const subCats  = [...new Set(allRaw.map(p=>p.sub_category).filter(Boolean))];
  const products = activeTab==="All"?allRaw:allRaw.filter(p=>p.sub_category===activeTab);
  const dimSvcs  = PAPER_SERVICES.filter(s=>s.dim===dim.id);

  const tabs = [
    { id:"products",  label:"📦 Products" },
    { id:"services",  label:"🐕 Services" },
    ...( dim.id!=="soul" ? [{ id:"advisory", label:"💡 Advisory" }] : [] ),
  ];

  return (
    <div style={{background:"#fff",border:`2px solid ${G.teal}`,borderTop:"none",borderRadius:"0 0 14px 14px",marginBottom:8}}>
      {/* Mira bar */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:G.pale,padding:"10px 16px",borderBottom:`1px solid ${G.pale}`}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
        <p style={{fontSize:12,color:G.darkText,fontStyle:"italic",margin:0,lineHeight:1.5,flex:1}}>"{t(dim.mira,petName)}"</p>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#BBB",cursor:"pointer",flexShrink:0,padding:"0 4px"}}>✕</button>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid #F0F0F0"}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setDimTab(tab.id)}
            style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:dimTab===tab.id?`2.5px solid ${G.teal}`:"2.5px solid transparent",color:dimTab===tab.id?G.mid:"#888",fontSize:12,fontWeight:dimTab===tab.id?700:400,cursor:"pointer"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {dimTab==="products" && (
        <div style={{padding:"12px 16px 20px"}}>
          {subCats.length>0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["All",...subCats].map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeTab===tab?G.teal:G.border}`,background:activeTab===tab?G.teal:G.cream,fontSize:11,fontWeight:600,color:activeTab===tab?"#fff":G.mid,cursor:"pointer"}}>
                  {tab.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          )}
          {products.length===0 ? (
            <div style={{textAlign:"center",padding:"28px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:8}}>📦</div>
              Products for {petName} in this category are being added — check back soon.
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(170px,100%),1fr))",gap:12}}>
              {products.map(p=>(
                <div key={p.id||p._id}><SharedProductCard product={p} pillar="paperwork" selectedPet={pet} miraContext={miraCtx} onViewDetails={onViewDetails}/></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {dimTab==="services" && (
        <div style={{padding:"12px 16px 20px"}}>
          {dimSvcs.length===0 ? (
            <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:13}}>
              <button onClick={()=>onBook?.(PAPER_SERVICES[0])} style={{background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ask Concierge® →</button>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:14}}>
              {dimSvcs.map(svc=>(
                <div key={svc.id} onClick={()=>onBook?.(svc)}
                  style={{background:"#fff",borderRadius:14,border:`1.5px solid ${G.borderLight}`,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <div style={{height:90,background:`linear-gradient(135deg,${G.pale},${G.cream})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{svc.icon}</div>
                  <div style={{padding:"11px 13px"}}>
                    {svc.tagline&&<div style={{fontSize:10,color:G.mutedText,marginBottom:2}}>{t(svc.tagline,petName)}</div>}
                    <div style={{fontSize:13,fontWeight:700,color:G.darkText,marginBottom:4,lineHeight:1.3}}>{svc.name}</div>
                    <div style={{fontSize:11,color:"#888",lineHeight:1.4,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(svc.desc,petName)}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                      <button data-testid={`paperwork-service-card-${svc.id}`} style={{background:G.teal,color:"#fff",border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Book for {petName} →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advisory */}
      {dimTab==="advisory" && (
        <div style={{padding:"12px 16px 20px"}}>
          <PersonalisedBreedSection pet={pet} pillar="paperwork"/>
        </div>
      )}
    </div>
  );
}

// ─── LOADING / NO PET ──────────────────────────────────────

// ─── PAPERWORK CONTENT MODAL (category pill → products) ──────
export function PaperworkContentModal({ isOpen, onClose, category, pet }) {
  const [products,setProducts]=useState([]); const [loading,setLoading]=useState(false); const [selProd,setSelProd]=useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const { token } = useAuth();
  const petName=pet?.name||"your dog"; const breed=pet?.breed?pet.breed.split("(")[0].trim():"";
  const CAT_CONFIG = {
    identity:  {label:"Identity & Safety",  bg:"#EDE9FE",icon:"🪪", accent:G.mid},
    health:    {label:"Health Records",     bg:"#E0F2FE",icon:"🏥", accent:G.teal},
    travel:    {label:"Travel Documents",   bg:"#E8F5E9",icon:"✈️",  accent:G.mid},
    insurance: {label:"Insurance",         bg:"#FFF3E0",icon:"🛡️", accent:G.teal},
    breeds:    {label:"Breed & Advisory",   bg:"#FFF8E1",icon:"📚", accent:G.mid},
    advisory:  {label:"Expert Advisory",   bg:"#F3E5F5",icon:"💡", accent:G.teal},
    soul:      {label:"Soul Documents",     bg:"#F0FDFA",icon:"🌟", accent:G.teal},
    mira:      {label:"Mira's Picks",       bg:"#E8EAF6",icon:"✦",  accent:G.mid},
    soul_made: {label:"Soul Made™",         bg:"#F3E5F5",icon:"✦",  accent:G.teal},
  };
  const cfg=CAT_CONFIG[category]||CAT_CONFIG.identity;
  const miraQuotes={identity:`I picked these for ${petName}'s complete identity protection.`,health:`${petName}'s health records — organised, accessible, and up to date.`,travel:breed?`Travelling with a ${breed}? I've selected every document you'll need.`:`Everything ${petName} needs for safe, documented travel.`,insurance:`${petName}'s insurance and financial documents — organised and claim-ready.`,breeds:breed?`I've curated the complete ${breed} care guide set for ${petName}.`:`Breed-specific guides tailored to ${petName}'s heritage.`,advisory:`Expert guidance resources and life planning for ${petName}.`,soul:`${petName}'s soul documents — their identity and story, beautifully held.`,mira:`My top picks across all document categories for ${petName}.`,soul_made:`Want something truly one-of-a-kind for ${petName}? Upload a photo — Concierge® creates it.`};
  useEffect(()=>{
    if(!isOpen)return; setLoading(true);
    if(category==="soul_made"){
      const breedParam=encodeURIComponent((pet?.breed||'').trim().toLowerCase());
      fetch(`${API_URL}/api/mockups/breed-products?breed=${breedParam}&pillar=paperwork`)
        .then(r=>r.ok?r.json():{products:[]})
        .then(data=>setProducts(data.products||[]))
        .catch(()=>setProducts([]))
        .finally(()=>setLoading(false));
      return;
    }
    if(category==="mira"){
      if(!pet?.id){setLoading(false);return;}
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=paperwork&limit=16&min_score=40&entity_type=product`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
        .then(r=>r.json()).then(d=>{
          const scored=d.picks||[];
          if(scored.length>0){setProducts(scored);setLoading(false);return;}
          return fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&limit=100`,{headers:token?{Authorization:`Bearer ${token}`}:{}}).then(r=>r.json()).then(pd=>setProducts((pd.products||[]).slice(0,16)));
        }).catch(()=>setProducts([])).finally(()=>setLoading(false));
      return;
    }
    const catLabel={identity:"Identity & Safety",health:"Health Records",travel:"Travel Documents",insurance:"Insurance & Finance",breeds:"Breed & Advisory",advisory:"Expert Advisory",soul:"Soul Documents"}[category]||category;
    // breed-specific categories have 33 variants — fetch all so filter can pick the right breed
    const isBreedCat = category === 'breeds' || category === 'soul';
    const limit = isBreedCat ? 50 : 20;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&category=${encodeURIComponent(catLabel)}&limit=${limit}`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>r.json()).then(d=>{
        const all = d.products || [];
        // For breed-specific categories apply strict breed filter so Mojo (Indie) only sees Indie products
        const filtered = isBreedCat ? filterBreedProducts(all, pet?.breed) : all;
        setProducts(filtered);
      }).catch(()=>setProducts([])).finally(()=>setLoading(false));
  },[isOpen,category,pet?.id,pet?.breed]);
  if(!isOpen)return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      {/* X button — fixed outside the scrollable content so it's always clickable */}
      <button
        type="button"
        onClick={e=>{ e.stopPropagation(); onClose(); }}
        style={{position:"fixed",top:20,right:20,zIndex:11001,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:999,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:18,pointerEvents:"all"}}
        aria-label="Close"
      >✕</button>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(700px,100%)",maxHeight:"88vh",overflowY:"auto",borderRadius:20,background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.45)",display:"flex",flexDirection:"column"}}>
        <div style={{borderRadius:"20px 20px 0 0",padding:"20px 22px 16px",background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 70%,#0F766E 100%)`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{cfg.icon}</div>
              <div><p style={{fontWeight:800,color:"#fff",fontSize:15,margin:0}}>{cfg.label}</p><p style={{color:"rgba(255,255,255,0.55)",fontSize:11,margin:0}}>For {petName}{breed?` · ${breed}`:""}</p></div>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:13,color:G.light,flexShrink:0}}>✦</span>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.80)",fontStyle:"italic",margin:0,lineHeight:1.5}}>{miraQuotes[category]||miraQuotes.identity}</p>
          </div>
        </div>
        <div style={{padding:"18px 20px"}}>
          {loading&&<div style={{textAlign:"center",padding:"32px 0"}}><Loader2 size={24} style={{color:G.teal,animation:"spin 1s linear infinite"}}/></div>}
          {!loading&&products.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#888"}}><div style={{fontSize:32,marginBottom:10}}>📦</div><p style={{fontWeight:600}}>Products being curated</p><p style={{fontSize:13}}>Mira is sourcing {petName}'s {cfg.label} kit — check back soon.</p></div>}
          {!loading&&products.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>{products.map(p=><SharedProductCard key={p.id||p._id} product={p} pet={pet} onViewDetails={()=>setSelProd(p)} accentColor={cfg.accent||G.teal}/>)}</div>}
          {category==="soul_made"&&!loading&&(
            <div data-testid="soul-made-trigger" onClick={()=>setSoulMadeOpen(true)} style={{
              margin:'24px 0 8px',padding:'20px 20px 18px',
              background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
              border:'1.5px solid rgba(196,77,255,0.4)',
              borderRadius:18,cursor:'pointer',position:'relative',overflow:'hidden',
              boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)';}}
            >
              <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>{`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}</div>
              <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>{petName}'s face. On everything.</div>
              <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>{`\u2726 Make something only ${petName} has`}</div>
                <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>Upload a photo · Concierge® creates it</div>
              </div>
            </div>
          )}
          {soulMadeOpen&&<SoulMadeModal pet={pet} pillar="paperwork" pillarColor={G.teal} pillarLabel="Documents" onClose={()=>setSoulMadeOpen(false)}/>}
        </div>
      </div>
      {selProd&&<ConciergeOnlyProductDetailModal product={selProd} selectedPet={pet} pillar="paperwork" onClose={()=>setSelProd(null)}/>} 
    </div>
  );
}


function LoadingState(){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{width:48,height:48,borderRadius:"50%",background:MIRA_ORB,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div><div style={{fontSize:16,color:G.darkText,fontWeight:600}}>Preparing <span style={{color:G.teal}}>your safety documents…</span></div></div>);}
function NoPetState({onAddPet}){return(<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:48,marginBottom:16}}>📋</div><div style={{fontSize:18,fontWeight:800,color:G.darkText,marginBottom:8}}>Add a pet to manage documents</div><p style={{fontSize:14,color:G.mutedText,marginBottom:24}}>Mira keeps every document, record and certificate organised.</p><button onClick={onAddPet} style={{background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:9999,padding:"12px 28px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Add your dog →</button></div>);}

function SoulChip({ icon, label, value, children }){
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(153,246,228,0.20)",border:"1px solid rgba(153,246,228,0.35)",borderRadius:20,padding:"3px 10px",fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:500}}>
      {icon&&<span>{icon}</span>}
      {label&&<span style={{opacity:0.75}}>{label}:</span>}
      {value||children}
    </span>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────
const PaperworkSoulPage = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate = useNavigate();
  const {token,isAuthenticated}                       = useAuth();
  const {currentPet,setCurrentPet,pets:contextPets}  = usePillarContext();
  const pet = currentPet; // alias for sub-components


  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "paperwork", pet: currentPet });

  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("documents");
  const [openDim,       setOpenDim]       = useState(null);
  const [catModal,      setCatModal]      = useState(null);
  const [petData,       setPetData]       = useState(null);
  const [docScore,      setDocScore]      = useState(0);
  const [apiProducts,   setApiProducts]   = useState({});
  const [services,      setServices]      = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastSvc,      setToastSvc]      = useState("");
  const [selProd,       setSelProd]       = useState(null); // ProductDetailModal
  const miraRef = useRef(null);
  const topTabs = [
    { id: 'documents', label: 'Documents' },
    { id: 'advisory', label: 'Advisory' },
    { id: 'find', label: 'Find Help' },
  ];

  const handleBook = useCallback(async (svc) => {
    const petName = petData?.name||"your dog";
    const svcName = svc?.name||"this service";
    // Fire tdc tracking immediately
    tdc.book({ service: svcName, pillar: "paperwork", pet: petData, channel: "paperwork_page", amount: svc?.base_price||svc?.price });
    const knownSvc = PAPER_SERVICES.find(s=>s.name===svcName||s.id===svc?.id);
    if (knownSvc) { setActiveService(knownSvc); return; }
    // Fallback: fire ticket
    try {
      const user = JSON.parse(localStorage.getItem("user")||"{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`,{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({parent_id:user?.id||"guest",pet_id:petData?.id||"",pillar:"paperwork",intent_primary:"service_request",life_state:"PLAN",intent_secondary:[svcName],initial_message:{sender:"parent",source:"paperwork_page",text:`Hi! ${petName}'s parent would like to book ${svcName}. Please arrange and confirm.`}}),
      });
    } catch(e){console.error("[PaperworkSoulPage] handleBook",e);}
    setToastSvc(svcName); setToastVisible(true);
  },[petData,token]);

  useEffect(()=>{
    const CATS=["Identity & Safety","Health Records","Travel Documents","Insurance & Finance","Breed & Advisory","Expert Advisory","Soul Documents","bundles"];
    Promise.all([
      ...CATS.map(cat=>fetch(`${API_URL}/api/admin/pillar-products?pillar=paperwork&limit=100&category=${encodeURIComponent(cat)}`).then(r=>r.ok?r.json():null).catch(()=>null)),
      fetch(`${API_URL}/api/service-box/services?pillar=paperwork`).then(r=>r.ok?r.json():null).catch(()=>null),
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

  useEffect(()=>{
    if(currentPet){
      const normalized={...currentPet,photo_url:currentPet.photo_url||currentPet.avatar_url||null,avatar:currentPet.avatar||"🐕",breed:currentPet.breed||currentPet.doggy_soul_answers?.breed||""};
      setPetData(normalized);
      setDocScore(getDocScore(normalized));
    }
  },[currentPet]);

  const handleAddPet=useCallback(()=>navigate(isAuthenticated?"/dashboard/pets?action=add":"/login?redirect=/paperwork"),[isAuthenticated,navigate]);

  // Mobile detection
  if (!isDesktop) return <PaperworkMobilePage />;

  if(loading)  return<PillarPageLayout pillar="paperwork" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if(!petData) return<PillarPageLayout pillar="paperwork" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const dims    = getPaperworkDims(petData);
  const petName = petData.name;
  const breed   = petData.breed||"";

  return (
    <PillarPageLayout pillar="paperwork" hideHero hideNavigation>
      <Helmet>
        <title>Paperwork · {petName} · The Doggy Company</title>
        <meta name="description" content={`All of ${petName}'s documents, records and expert guidance — organised by Mira.`}/>
      </Helmet>

      {/* ── HERO — centered, Care/Play/Go parity ── */}
      <div style={{background:`linear-gradient(160deg,${G.deep} 0%,${G.mid} 55%,#0F766E 100%)`,padding:"28px 20px 0",position:"relative",overflow:"hidden",textAlign:"center",boxSizing:"border-box",width:"100%"}}>
        <div style={{position:"absolute",top:20,right:20,width:44,height:44,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(13,148,136,0.50)"}}>✦</div>

        {/* Pet avatar + doc score badge */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:10}}>
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,0.30)",boxShadow:`0 0 0 3px rgba(13,148,136,0.40)`,background:`linear-gradient(135deg,${G.light},${G.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:"#fff"}}>
            {petData.photo_url?<img src={petData.photo_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="eager" onError={e=>{e.target.style.display="none";}}/>:<span>{petData.avatar||"🐕"}</span>}
          </div>
          <div style={{marginTop:-8,background:`linear-gradient(135deg,${G.deep},${G.teal})`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)",whiteSpace:"nowrap"}}>
            Protected {docScore}%
          </div>
        </div>

        {/* Eyebrow chip */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(153,246,228,0.18)",borderRadius:20,padding:"4px 14px",marginBottom:14}}>
          <span style={{fontSize:11,color:G.light,fontWeight:700}}>
            {docScore>=80?`✦ ${petName} is fully protected — Mira has everything.`:`📋 Paperwork & Advisory · ${petName}`}
          </span>
        </div>

        {/* H1 — same size as Care/Play/Go */}
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.15,fontFamily:"Georgia,'Times New Roman',serif",textAlign:"center"}}>
          Keep <span style={{color:G.light}}>{petName}</span> safe,<br/>documented & protected
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.72)",textAlign:"center",marginBottom:14,maxWidth:480,margin:"0 auto 14px",lineHeight:1.6}}>
          Identity, health, travel, insurance & expert advisory — all in one place, arranged by Mira.
        </p>

        {/* Breed chips */}
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:16}}>
          {breed&&<SoulChip icon="🐾" label="Breed" value={breed.split("(")[0].trim()}/>}
          {petData?.vaccinated&&<SoulChip value="💉 Vaccinated"/>}
          {petData?.doggy_soul_answers?.microchipped&&<SoulChip value="🔬 Microchipped"/>}
          {petData?.doggy_soul_answers?.insurance&&<SoulChip value="🛡️ Insured"/>}
          {getMissingDocs(petData).length>0&&<SoulChip value={`⚠ ${getMissingDocs(petData).length} action${getMissingDocs(petData).length>1?"s":""} needed`}/>}
        </div>

        {/* Mira quote */}
        <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 18px",maxWidth:480,margin:"0 auto 16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:MIRA_ORB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
            <div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",lineHeight:1.6,margin:0}}>
                "I keep {petName}'s documents organised, flag what's missing, and handle the paperwork so you don't have to."
              </p>
              <span style={{fontSize:11,color:G.light,fontWeight:600}}>♥ Mira knows {petName}</span>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <div style={{textAlign:"center",paddingBottom:6}}>
          <ChevronDown size={22} style={{color:"rgba(255,255,255,0.35)"}}/>
        </div>
      </div>
      {/* ── PAGE BODY ── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{background:G.pageBg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>

        {/* Soul Profile bar — pet/breed info + questions */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={petData} token={token} pillar="paperwork" color="#0D9488" />
        </div>
        <DesktopSoulCard pet={petData} pillarLabel="Paperwork" pillar="paperwork" dataTestId="desktop-paperwork-soul-card" />
        {activeService && <ServiceBookingModal isOpen={true} onClose={()=>setActiveService(null)} serviceType={activeService?.category || 'paperwork'} preselectedService={activeService?.name} />}

        <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'14px 0 18px'}}>
          {topTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`paperwork-top-tab-${tab.id}`}
                style={{
                  border:'none',
                  borderRadius:9999,
                  padding:'10px 16px',
                  background:isActive ? `linear-gradient(135deg,${G.teal},${G.mid})` : '#fff',
                  color:isActive ? '#fff' : G.mid,
                  fontSize:13,
                  fontWeight:700,
                  boxShadow:isActive ? '0 8px 20px rgba(13,148,136,0.18)' : '0 1px 4px rgba(0,0,0,0.05)',
                  cursor:'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Category strip — Care-style 82×72px icon+label pills */}
        {activeTab === 'documents' && <div style={{background:"#fff",borderBottom:`1px solid ${G.borderLight}`,position:"relative"}}>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",gap:4}}>
            {[
              {id:"identity",  icon:"🪪", label:"Identity",       bg:"#EDE9FE", accent:G.mid},
              {id:"health",    icon:"🏥", label:"Health Records", bg:"#E0F2FE", accent:G.teal},
              {id:"travel",    icon:"✈️",  label:"Travel",         bg:"#E8F5E9", accent:G.mid},
              {id:"insurance", icon:"🛡️", label:"Insurance",      bg:"#FFF3E0", accent:G.teal},
              {id:"breeds",    icon:"📚", label:"Breed Guides",   bg:"#FFF8E1", accent:G.mid},
              {id:"advisory",  icon:"💡", label:"Advisory",       bg:"#F3E5F5", accent:G.teal},
              {id:"soul",      icon:"🌟", label:"Soul Docs",      bg:"#F0FDFA", accent:G.teal},
              {id:"mira",      icon:"✦",  label:"Mira's Picks",   bg:"#E8EAF6", accent:G.mid},
              {id:"soul_made", icon:"✦",  label:"Soul Made™",     bg:"#F3E5F5", accent:G.teal},
            ].map(cat=>{
              const isA = catModal===cat.id;
              return(
                <button key={cat.id} data-testid={`paperwork-cat-${cat.id}`}
                  onClick={()=>setCatModal(cat.id)}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,
                    minWidth:82,height:72,padding:"10px 12px",cursor:"pointer",background:"transparent",
                    border:"none",borderBottom:`3px solid ${isA?G.teal:"transparent"}`,
                    transition:"border-color 150ms ease"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:cat.bg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:18,marginBottom:4,flexShrink:0}}>
                    {cat.icon}
                  </div>
                  <span style={{fontSize:10,fontWeight:isA?700:500,color:isA?G.teal:"#555",
                    whiteSpace:"nowrap",textAlign:"center"}}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>}

        {activeTab==="documents" && (
          <>
            <DocumentVault
              pet={petData}
              token={token}
              onConcierge={() => {
                setToastSvc(`${petData?.name}'s Document Vault`);
                setToastVisible(true);
              }}
            />

            {/* Mira picks */}
            <div ref={miraRef}><MiraPicksSection pet={petData} onSelectProd={setSelProd}/></div>

            {/* Soul Made handled inside PersonalisedBreedSection */}

            <GuidedPaperworkPaths pet={petData}/>

            {/* Section heading */}
            <section style={{paddingBottom:16}}>
              <h2 style={{fontSize:"clamp(1.5rem,4vw,2rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,'Times New Roman',serif"}}>
                What does <span style={{color:G.teal}}>{petName}</span> need protected?
              </h2>
              <p style={{fontSize:14,color:"#888",lineHeight:1.5}}>
                Choose a category — everything inside is organised for {petName}.{" "}
                <span style={{color:G.mid,fontWeight:600}}>Glowing ones need your attention.</span>
              </p>
            </section>

            {/* Dim grid */}
            <div style={{display:"grid",gap:16,marginBottom:32}} className="paperwork-dims-grid">
              <style>{`
                .paperwork-dims-grid{grid-template-columns:1fr}
                @media(min-width:560px){.paperwork-dims-grid{grid-template-columns:repeat(2,1fr)}}
                @media(min-width:900px){.paperwork-dims-grid{grid-template-columns:repeat(3,1fr)}}
              `}</style>
              {dims.map(dim=>{
                const isOpen=openDim===dim.id;
                return(
                  <div key={dim.id} style={{gridColumn:isOpen?"1 / -1":"auto"}}>
                    <div onClick={()=>setOpenDim(isOpen?null:dim.id)}
                      data-testid={`paperwork-dim-${dim.id}`}
                      style={{background:"#fff",borderRadius:isOpen?"16px 16px 0 0":16,cursor:"pointer",
                        overflow:"hidden",border:isOpen?`2px solid ${G.teal}`:`2px solid ${G.borderLight}`,
                        boxShadow:dim.glow&&!isOpen?`0 4px 24px ${dim.glowColor}`:"0 2px 8px rgba(0,0,0,0.06)",
                        transition:"all 0.2s"}}>
                      <div style={{height:6,background:isOpen?G.teal:(dim.glowColor||G.mid),borderRadius:"16px 16px 0 0"}}/>
                      <div style={{padding:"20px 20px 18px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{width:52,height:52,borderRadius:14,background:dim.glow?`${G.teal}22`:G.pale,
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{dim.icon}</div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <span style={{fontSize:10,fontWeight:700,borderRadius:20,padding:"3px 10px",
                              background:`${dim.badgeBg}20`,color:dim.badgeBg,border:`1px solid ${dim.badgeBg}40`}}>{t(dim.badge,petName)}</span>
                            {dim.glow&&<div style={{width:8,height:8,borderRadius:"50%",background:G.light}}/>}
                          </div>
                        </div>
                        <h3 style={{fontSize:16,fontWeight:800,color:G.darkText,marginBottom:6,lineHeight:1.25,fontFamily:"Georgia,serif"}}>{dim.label}</h3>
                        <p style={{fontSize:13,color:G.mutedText,lineHeight:1.55,marginBottom:16,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t(dim.sub,petName)}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:12,color:G.teal,fontWeight:700}}>{isOpen?"Close ↑":"Explore →"}</span>
                          <span style={{fontSize:11,color:"#aaa"}}>Products · Services</span>
                        </div>
                      </div>
                    </div>
                    {isOpen&&<DimExpanded dim={dim} pet={petData} onClose={()=>setOpenDim(null)} apiProducts={apiProducts} services={services} onBook={handleBook} onViewDetails={(p)=>setSelProd(p)}/>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab==="advisory" && (
          <div style={{marginTop:24}}>
            {activeService&&<ServiceBookingModal isOpen={true} onClose={()=>setActiveService(null)} serviceType={activeService?.category || 'paperwork'} preselectedService={activeService?.name} />}
            <PillarServiceSection
              pillar="paperwork"
              pet={petData}
              title="Paperwork, Personally"
              accentColor={G.teal}
              darkColor={G.darkText}
            />
          </div>
        )}

        {activeTab==="find" && (
          <div style={{marginTop:24}} data-testid="paperwork-find-help-panel">
            <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:"Georgia,serif"}}>
              Find nearby paperwork help for <span style={{color:G.teal}}>{petName}</span>
            </h2>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>Vets, microchipping clinics, legal support and document guidance — all wired to Concierge®.</p>
            <PaperworkNearMe pet={petData} onBook={handleBook} />
          </div>
        )}

      </div>

      <ConciergeToast
        toast={toastVisible?{name:toastSvc,pillar:"paperwork"}:null}
        onClose={()=>setToastVisible(false)}
      />
      <PaperworkContentModal isOpen={!!catModal} onClose={()=>setCatModal(null)} category={catModal} pet={petData}/>

      {/* ProductDetailModal — opens when card is tapped */}
      {selProd && (
        <ConciergeOnlyProductDetailModal
          product={selProd}
          pillar="paperwork"
          selectedPet={petData}
          onClose={() => setSelProd(null)}
        />
      )}

    </PillarPageLayout>  );
};

export default PaperworkSoulPage;
