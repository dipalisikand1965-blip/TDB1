/**
 * GoHero.jsx — /go pillar hero
 * Mirrors CareHero.jsx exactly — teal/travel colour world.
 * NO tab bar here — tabs are rendered separately as GoTabBar in GoSoulPage.
 *
 * Props: pet — pet object, soulScore — number (0–100)
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const G = {
  deep:"#0D3349", deepMid:"#1A5276", teal:"#1ABC9C",
  light:"#76D7C4", pale:"#D1F2EB", cream:"#E8F8F5",
  gold:"#C9973A", darkText:"#0D3349", mutedText:"#5D6D7E",
};

const SoulChip = ({ icon, label, value, chipStyle }) => (
  <motion.div
    initial={{ opacity:0, scale:0.9 }}
    animate={{ opacity:1, scale:1 }}
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white"
    style={chipStyle}
  >
    <span>{icon}</span>
    {label && <span style={{ opacity:0.75 }}>{label}:</span>}
    <span>{value}</span>
  </motion.div>
);

function MiraQuoteCard({ pet }) {
  const petName = pet?.name || "your dog";
  const quote = useMemo(() => {
    const size    = pet?.doggy_soul_answers?.size || pet?.size;
    const breed   = (pet?.breed || "").trim();
    const anxious = (() => {
      const t = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
      return (Array.isArray(t)?t:[t]).some(x=>x&&(String(x).toLowerCase().includes("car")||String(x).toLowerCase().includes("travel")));
    })();
    const condition = (() => {
      const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
      if (!raw) return null;
      const s = Array.isArray(raw)?raw.join(", "):String(raw);
      return s.toLowerCase()==="none"||!s.trim()?null:s;
    })();
    if (anxious && breed) return `${petName} is a ${breed} with travel anxiety — every recommendation here is built around keeping journeys calm and stress-free.`;
    if (anxious) return `${petName} has travel anxiety — I've built every recommendation around keeping journeys calm and stress-free.`;
    if (size && breed) return `${petName} is a ${size.toLowerCase()} ${breed} — all carriers, safety gear, and boarding recommendations are sized and matched.`;
    if (size) return `${petName} is a ${size.toLowerCase()} dog — all carriers, safety gear, and boarding recommendations are sized right.`;
    if (condition) return `I've taken ${petName}'s ${condition} into account for every travel recommendation here.`;
    return `Tell me where ${petName} is going and I'll arrange everything — flights, boarding, and the perfect travel kit.`;
  }, [pet]);

  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay:0.3 }}
      className="inline-flex items-start gap-2.5 rounded-xl p-3 mt-4"
      style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", maxWidth:640, display:"flex" }}
    >
      <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:G.deep, flexShrink:0, marginTop:1 }}>✦</div>
      <div>
        <p style={{ fontSize:13, color:"#fff", lineHeight:1.55, fontStyle:"italic", margin:0 }}>"{quote}"</p>
        <span style={{ fontSize:10, color:G.light, display:"block", marginTop:4, fontWeight:600 }}>♥ Mira knows {petName}</span>
      </div>
    </motion.div>
  );
}

export default function GoHero({ pet, soulScore }) {
  const petName  = pet?.name || "your dog";
  const breed    = pet?.breed || pet?.doggy_soul_answers?.breed || "";
  const size     = pet?.doggy_soul_answers?.size || pet?.size || null;
  const anxious  = (() => {
    const t = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
    return (Array.isArray(t)?t:[t]).some(x=>x&&(String(x).toLowerCase().includes("car")||String(x).toLowerCase().includes("travel")));
  })();
  const condition = (() => {
    const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
    if (!raw) return null;
    const s = Array.isArray(raw)?raw.join(", "):String(raw);
    return s.toLowerCase()==="none"||!s.trim()?null:s;
  })();
  const vaccinated = pet?.vaccinated;
  const city = pet?.city || pet?.doggy_soul_answers?.city || null;
  const photoUrl = pet?.photo_url || pet?.avatar_url || null;

  const chipStyle = { background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)" };

  return (
    <div style={{ background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 55%,${G.teal} 100%)`, padding:"32px 32px 28px", position:"relative", overflow:"hidden" }}>
      {/* Glow orbs */}
      <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, background:"radial-gradient(circle,rgba(26,188,156,0.18) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-40, left:80, width:180, height:180, background:"radial-gradient(circle,rgba(201,151,58,0.12) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:28 }}>
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
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(26,188,156,0.18)", border:"1px solid rgba(26,188,156,0.42)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:10 }}>
              ✈️ Go with {petName}
            </div>
            <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.625rem)", fontWeight:900, color:"#fff", fontFamily:"Georgia,serif", marginBottom:12, lineHeight:1.1, margin:"0 0 12px" }}>
              for <span style={{ color:G.light }}>{petName}</span>
            </h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.65)", marginBottom:14, lineHeight:1.5, maxWidth:520 }}>
              Everything {petName} needs for the perfect journey — flights, boarding, carriers, and stays.{" "}
              <span style={{ color:G.light, fontWeight:600 }}>Arranged by Mira.</span>
            </p>

            {/* Soul chips */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:4 }}>
              {breed && <SoulChip icon="🐕" value={breed} chipStyle={chipStyle} />}
              {size  && <SoulChip icon="🐾" value={size}  chipStyle={chipStyle} />}
              {city  && <SoulChip icon="📍" value={city}  chipStyle={chipStyle} />}
              {anxious   && <SoulChip icon="✗" label="Travel anxiety" value="" chipStyle={{ ...chipStyle, background:"rgba(173,20,87,0.20)", border:"1px solid rgba(244,143,177,0.40)" }} />}
              {condition && <SoulChip icon="⚕" value={condition} chipStyle={{ ...chipStyle, background:"rgba(173,20,87,0.20)" }} />}
              {vaccinated && <SoulChip icon="💉" value="Vaccinated" chipStyle={chipStyle} />}
            </div>

            <MiraQuoteCard pet={pet} />
          </div>
        </div>

        {/* Scroll chevron */}
        <div style={{ textAlign:"center", marginTop:20 }}>
          <ChevronDown size={20} color="rgba(255,255,255,0.35)" />
        </div>
      </div>
    </div>
  );
}
