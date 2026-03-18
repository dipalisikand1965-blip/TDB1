/**
 * PlayHero.jsx — /play pillar hero
 * Mirrors GoHero.jsx — vibrant green + energetic orange colour world
 * Props: pet, soulScore, activeTab, onTabChange
 */
import { useState } from "react";

const G = {
  deep:     "#1B4332", mid:      "#2D6A4F", green:    "#52B788",
  light:    "#95D5B2", pale:     "#D8F3DC", cream:    "#F0FFF4",
  orange:   "#E76F51", yellow:   "#FFB703", darkText: "#1B4332",
  mutedText:"#4A7C6A", whiteDim: "rgba(255,255,255,0.65)",
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function SoulChip({ children }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:20, padding:"4px 10px", fontSize:11, color:"#fff", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.12)", margin:"3px 3px 0 0" }}>
      {children}
    </div>
  );
}

function getPlayChips(pet) {
  const chips = [];
  const size   = pet?.doggy_soul_answers?.size || pet?.size;
  const breed  = pet?.breed || pet?.doggy_soul_answers?.breed;
  const energy = pet?.doggy_soul_answers?.energy_level;
  const age    = pet?.doggy_soul_answers?.age_years;
  const health = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  const senior = age && parseInt(age) >= 7;

  if (energy) chips.push(`⚡ ${energy} energy`);
  else if (size) chips.push(`🐾 ${size} dog`);
  if (breed) chips.push(`🐕 ${breed}`);
  if (senior) chips.push("🌸 Senior dog");
  if (health && String(health).toLowerCase() !== "none") chips.push(`⚕ ${String(health).split(",")[0]}`);
  return chips.slice(0, 4);
}

export default function PlayHero({ pet, soulScore, activeTab, onTabChange }) {
  const petName  = pet?.name || "your dog";
  const photoUrl = pet?.photo_url || pet?.avatar_url || null;
  const chips    = pet ? getPlayChips(pet) : [];
  const energy   = pet?.doggy_soul_answers?.energy_level || null;

  const miraQuote = energy === "high" || energy === "very high"
    ? `${petName} has high energy — every recommendation here is built around burning it well. Parks, runs, agility, and swim sessions first.`
    : energy === "low"
    ? `${petName} prefers calm play — gentle walks, sniff sessions, and low-impact activities that feel good without overdoing it.`
    : `Tell me about ${petName}'s energy and I'll build a play life that keeps them happy, healthy, and thoroughly tired out.`;

  return (
    <div style={{ background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 55%,${G.green} 100%)`, padding:"32px 32px 0", position:"relative", overflow:"hidden" }}>
      {/* Glow orbs */}
      <div style={{ position:"absolute", top:-50, right:-50, width:240, height:240, background:"radial-gradient(circle,rgba(149,213,178,0.20) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:0, left:"30%", width:180, height:180, background:"radial-gradient(circle,rgba(231,111,81,0.12) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:28, marginBottom:24 }}>

          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.green})`, border:"3px solid rgba(255,255,255,0.30)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>
              {photoUrl
                ? <img src={photoUrl} alt={petName} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                : <span>🐕</span>}
            </div>
            <div style={{ position:"absolute", bottom:-4, right:-4, background:G.yellow, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:G.deep, border:"2px solid #fff" }}>
              {soulScore || 0}%
            </div>
          </div>

          {/* Hero text */}
          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(149,213,178,0.20)", border:"1px solid rgba(149,213,178,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
              🌳 Play with {petName}
            </div>
            <div style={{ fontSize:34, fontWeight:900, color:"#FFFFFF", fontFamily:"Georgia,serif", marginBottom:10, lineHeight:1.1 }}>
              Let <span style={{ color:G.yellow }}>{petName}</span> play.
            </div>
            <div style={{ marginBottom:18 }}>
              {chips.length > 0
                ? chips.map((c,i) => <SoulChip key={i}>{c}</SoulChip>)
                : <SoulChip>✦ Tell Mira about {petName}'s energy</SoulChip>}
            </div>

            {/* Mira quote */}
            <div style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0, marginTop:1 }}>✦</div>
              <div>
                <p style={{ fontSize:13, color:"#fff", lineHeight:1.55, fontStyle:"italic", margin:0 }}>"{miraQuote}"</p>
                <span style={{ fontSize:10, color:G.light, display:"block", marginTop:4, fontWeight:600 }}>♥ Mira knows {petName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background:"#fff", borderBottom:`1px solid rgba(45,106,79,0.10)`, display:"flex", overflowX:"auto" }}>
          {[
            { id:"play",       label:"🌳 Play & Explore" },
            { id:"find-play",  label:"📍 Find Play" },
            { id:"services",   label:"💪 Book a Service" },
          ].map(tab => (
            <button key={tab.id} onClick={() => onTabChange?.(tab.id)}
              style={{ padding:"14px 20px", background:"none", border:"none", borderBottom: activeTab===tab.id?`2.5px solid ${G.green}`:"2.5px solid transparent", color: activeTab===tab.id?G.mid:G.mutedText, fontSize:13, fontWeight: activeTab===tab.id?700:400, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.12s" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
