/**
 * GoHero.jsx — /go pillar hero
 * Mirrors CareHero.jsx exactly — teal/travel colour world
 *
 * Props:
 *   pet        — pet object from usePillarContext
 *   soulScore  — number (0–100)
 *   activeTab  — "go" | "services"
 *   onTabChange — (tab: string) => void
 */

import { useState, useEffect } from "react";

const G = {
  deep:    "#0D3349", deepMid: "#1A5276", teal: "#1ABC9C",
  light:   "#76D7C4", pale: "#D1F2EB", cream: "#E8F8F5",
  gold:    "#C9973A", goldLight: "#F0C060",
  darkText:"#0D3349", mutedText: "#5D6D7E", whiteDim:"rgba(255,255,255,0.65)",
};

function SoulChip({ children }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:20, padding:"4px 10px", fontSize:11, color:"#fff", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.10)", margin:"3px 3px 0 0" }}>
      {children}
    </div>
  );
}

function getPetSize(pet) {
  return pet?.doggy_soul_answers?.size || pet?.size || null;
}
function getTravelAnxiety(pet) {
  const t = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
  return (Array.isArray(t)?t:[t]).some(x => x && (String(x).toLowerCase().includes("car")||String(x).toLowerCase().includes("travel")));
}
function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw)?raw.join(", "):String(raw);
  return str.toLowerCase()==="none"||str.trim()===""?null:str;
}

export default function GoHero({ pet, soulScore, activeTab, onTabChange }) {
  const petName   = pet?.name || "your dog";
  const breed     = pet?.breed || pet?.doggy_soul_answers?.breed || "";
  const size      = getPetSize(pet);
  const anxious   = getTravelAnxiety(pet);
  const condition = getHealthCondition(pet);
  const photoUrl  = pet?.photo_url || pet?.avatar_url || null;

  const miraQuote = (() => {
    if (anxious) return `${petName} has travel anxiety — I've built every recommendation around keeping journeys calm and stress-free.`;
    if (size)    return `${petName} is a ${size.toLowerCase()} dog — all carriers, safety gear, and boarding recommendations are sized right.`;
    if (condition) return `I've taken ${petName}'s ${condition} into account for every travel recommendation here.`;
    return `Tell me where ${petName} is going and I'll arrange everything — flights, boarding, and the perfect travel kit.`;
  })();

  return (
    <div style={{ background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 55%,${G.teal} 100%)`, padding:"32px 32px 0", position:"relative", overflow:"hidden" }}>
      {/* Glow orb */}
      <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, background:"radial-gradient(circle,rgba(26,188,156,0.18) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:28, marginBottom:24 }}>

          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.teal})`, border:"3px solid rgba(255,255,255,0.30)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>
              {photoUrl
                ? <img src={photoUrl} alt={petName} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                : <span>🐕</span>}
            </div>
            <div style={{ position:"absolute", bottom:-4, right:-4, background:G.light, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:G.deep, border:"2px solid #fff" }}>
              {soulScore || 0}%
            </div>
          </div>

          {/* Hero text */}
          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(26,188,156,0.18)", border:"1px solid rgba(26,188,156,0.42)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
              ✈️ Go with {petName}
            </div>
            <div style={{ fontSize:34, fontWeight:900, color:"#FFFFFF", fontFamily:"Georgia,serif", marginBottom:10, lineHeight:1.1 }}>
              How would <span style={{ color:G.light }}>{petName}</span> love to travel?
            </div>
            <div style={{ marginBottom:18 }}>
              {size && <SoulChip>🐾 {size}</SoulChip>}
              {breed && <SoulChip>🐕 {breed}</SoulChip>}
              {anxious && <SoulChip>✗ Travel anxiety</SoulChip>}
              {condition && <SoulChip>⚕ {condition}</SoulChip>}
              {pet?.vaccinated && <SoulChip>💉 Vaccinated</SoulChip>}
            </div>

            {/* Mira quote */}
            <div style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:G.deep, flexShrink:0, marginTop:1 }}>✦</div>
              <div>
                <p style={{ fontSize:13, color:"#fff", lineHeight:1.55, fontStyle:"italic", margin:0 }}>"{miraQuote}"</p>
                <span style={{ fontSize:10, color:G.light, display:"block", marginTop:4, fontWeight:600 }}>♥ Mira knows {petName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background:"#fff", borderBottom:`1px solid rgba(26,188,156,0.10)`, display:"flex", padding:0, overflowX:"auto" }}>
          {[
            { id:"go",       label:"✈️ Go Essentials" },
            { id:"services", label:"🗺️ Book a Service" },
          ].map(tab => (
            <button key={tab.id} onClick={() => onTabChange?.(tab.id)}
              style={{ padding:"14px 20px", background:"none", border:"none", borderBottom: activeTab===tab.id?`2.5px solid ${G.teal}`:"2.5px solid transparent", color: activeTab===tab.id?G.teal:G.mutedText, fontSize:13, fontWeight: activeTab===tab.id?700:400, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.12s" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
