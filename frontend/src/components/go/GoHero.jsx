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
  const score = Math.round(soulScore || pet?.soul_score || pet?.overall_score || 0);

  const soulEyebrow = score >= 100
    ? `✦ ${petName}'s soul is fully known. Mira knows everything.`
    : `✦ Travel & Go for ${petName}`;

  const chipStyle = { background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)" };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 40%,${G.teal} 100%)`,
        minHeight:360,
        padding:"40px 32px 0 32px",
      }}
      data-testid="go-hero"
    >
      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{ width:400, height:400, top:-100, right:-80, borderRadius:"50%", background:"radial-gradient(circle,rgba(26,188,156,0.30) 0%,transparent 70%)", zIndex:1 }} />
      <div className="absolute pointer-events-none" style={{ width:250, height:250, bottom:0, left:80, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,151,58,0.18) 0%,transparent 70%)", zIndex:1 }} />

      {/* Inner layout — centered column, matches DineHero */}
      <div
        className="relative flex flex-col items-center gap-5 max-w-5xl mx-auto pb-8"
        style={{ zIndex:2 }}
      >
        {/* Avatar — centered at top */}
        <motion.div
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          className="flex-shrink-0 flex flex-col items-center"
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width:96, height:96, borderRadius:"50%",
              border:"3px solid transparent",
              background:`linear-gradient(${G.deepMid},${G.deepMid}) padding-box, linear-gradient(135deg,${G.light},${G.teal}) border-box`,
              overflow:"hidden",
            }}
          >
            {photoUrl
              ? <img src={photoUrl} alt={petName} style={{ width:84, height:84, borderRadius:"50%", objectFit:"cover" }} />
              : <span style={{ fontSize:44 }}>🐕</span>}
            <div
              className="absolute whitespace-nowrap rounded-full text-white font-bold"
              style={{ bottom:-8, left:"50%", transform:"translateX(-50%)", background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, fontSize:10, fontWeight:700, padding:"2px 8px" }}
            >
              Soul {score}%
            </div>
          </div>
        </motion.div>

        {/* Content — centered text */}
        <div className="flex-1 flex flex-col items-center text-center">
          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-xs"
            style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"rgba(255,255,255,0.85)" }}
          >
            {soulEyebrow}
          </motion.div>

          {/* Title — two stacked lines, centered */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            style={{ lineHeight:1.1, marginBottom:8 }}
          >
            <span className="block font-extrabold"
              style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", color:G.light, fontFamily:"Georgia,'Times New Roman',serif" }}>
              Travel &amp; Go
            </span>
            <span className="block font-extrabold"
              style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontFamily:"Georgia,'Times New Roman',serif" }}>
              <span style={{ color:"#FFFFFF" }}>for </span>
              <span style={{ color:"#E0F7FA" }}>{petName}</span>
            </span>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.1 }}
            className="text-sm mb-4"
            style={{ color:"rgba(255,255,255,0.65)" }}
          >
            Everything {petName} needs for the perfect journey — carriers, stays, and boarding. Arranged by Mira.
          </motion.p>

          {/* Soul chips */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-2"
          >
            {breed && <SoulChip icon="🐕" value={breed} chipStyle={chipStyle} />}
            {size  && <SoulChip icon="🐾" value={size}  chipStyle={chipStyle} />}
            {city  && <SoulChip icon="📍" value={city}  chipStyle={chipStyle} />}
            {anxious   && <SoulChip icon="✗" label="Travel anxiety" value="" chipStyle={{ background:"rgba(173,20,87,0.20)", border:"1px solid rgba(244,143,177,0.40)" }} />}
            {condition && <SoulChip icon="⚕" value={condition} chipStyle={{ background:"rgba(173,20,87,0.20)", border:"1px solid rgba(244,143,177,0.30)" }} />}
            {vaccinated && <SoulChip icon="💉" value="Vaccinated" chipStyle={chipStyle} />}
          </motion.div>

          {/* Mira quote */}
          <MiraQuoteCard pet={pet} />
        </div>
      </div>

      {/* Scroll chevron */}
      <motion.div
        className="flex justify-center pb-4 relative"
        style={{ zIndex:2 }}
        animate={{ y:[0,5,0] }}
        transition={{ repeat:Infinity, duration:1.5 }}
      >
        <ChevronDown className="w-5 h-5" style={{ color:"rgba(255,255,255,0.40)" }} />
      </motion.div>
    </section>
  );
}
