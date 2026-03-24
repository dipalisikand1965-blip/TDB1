/**
 * PlayHero.jsx — /play pillar hero
 * Mirrors GoHero.jsx — orange + rust colour world
 * NO tab bar here — tabs are rendered separately as PlayTabBar in PlaySoulPage.
 * Props: pet, soulScore
 */

const G = {
  deep:     "#7B2D00", mid:      "#7B3F00", orange:   "#E76F51",
  light:    "#FFAD9B", pale:     "#FFF0EA", cream:    "#FFF8F5",
  yellow:   "#FFB703", darkText: "#7B2D00",
  mutedText:"#8B4513", whiteDim: "rgba(255,255,255,0.65)",
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

export default function PlayHero({ pet, soulScore }) {
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
    <section
      style={{
        background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 55%,${G.orange} 100%)`,
        padding:"40px 32px 32px",
        position:"relative", overflow:"hidden",
      }}
      data-testid="play-hero"
    >
      {/* Glow orbs */}
      <div style={{ position:"absolute", top:-50, right:-50, width:240, height:240, background:"radial-gradient(circle,rgba(255,173,155,0.20) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"absolute", bottom:0, left:"30%", width:180, height:180, background:"radial-gradient(circle,rgba(231,111,81,0.12) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:1 }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:16 }}>

        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.orange})`, border:"3px solid rgba(255,255,255,0.30)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>
            {photoUrl
              ? <img src={photoUrl} alt={petName} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
              : <span>🐕</span>}
          </div>
          <div style={{ position:"absolute", bottom:-4, right:-4, background:G.yellow, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:G.deep, border:"2px solid #fff" }}>
            {soulScore || 0}%
          </div>
        </div>

        {/* Eyebrow */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,173,155,0.20)", border:"1px solid rgba(255,173,155,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600 }}>
          🌳 Play & Explore for {petName}
        </div>

        {/* Title */}
        <div style={{ lineHeight:1.1 }}>
          <span style={{ display:"block", fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:900, color:G.light, fontFamily:"Georgia,serif" }}>Play & Explore</span>
          <span style={{ display:"block", fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:900, fontFamily:"Georgia,serif" }}>
            <span style={{ color:"#FFFFFF" }}>for </span>
            <span style={{ color:"#FFE4DC" }}>{petName}</span>
          </span>
        </div>

        {/* Subtitle */}
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.65)", maxWidth:540, margin:0 }}>
          Parks, playdates, fitness & adventures — all personalised and arranged by Mira.
        </p>

        {/* Soul chips */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6 }}>
          {chips.length > 0
            ? chips.map((c,i) => <SoulChip key={i}>{c}</SoulChip>)
            : <SoulChip>✦ Tell Mira about {petName}'s energy</SoulChip>}
        </div>

        {/* Mira quote */}
        <div style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:8, maxWidth:640, width:"100%" }}>
          <div style={{ width:26, height:26, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0, marginTop:1 }}>✦</div>
          <div style={{ textAlign:"left" }}>
            <p style={{ fontSize:13, color:"#fff", lineHeight:1.55, fontStyle:"italic", margin:0 }}>"{miraQuote}"</p>
            <span style={{ fontSize:13, color:G.light, display:"block", marginTop:4, fontWeight:600 }}>♥ Mira knows {petName}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
