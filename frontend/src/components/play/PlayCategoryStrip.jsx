/**
 * PlayCategoryStrip.jsx — /play pillar
 * Mirrors GoCategoryStrip.jsx — 6 play dimensions
 */
import { useState } from "react";

const G = { green:"#E76F51", mid:"#7B3F00", pale:"#FFF0EA", mutedText:"#8B4513" };

const PLAY_STRIPS = [
  { id:"outings",   icon:"🌳", label:"Outings & Parks" },
  { id:"playdates", icon:"🐾", label:"Playdates" },
  { id:"walking",   icon:"🦮", label:"Dog Walking" },
  { id:"fitness",   icon:"💪", label:"Fitness" },
  { id:"swimming",  icon:"🏊", label:"Swimming" },
  { id:"soul",      icon:"✨", label:"Soul Play" },
];

export default function PlayCategoryStrip({ pet }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"16px 12px 12px", scrollbarWidth:"none", marginBottom:4, justifyContent:"center" }} className="play-strip">
      <style>{`.play-strip::-webkit-scrollbar{display:none}`}</style>
      {PLAY_STRIPS.map(s => {
        const sel = active === s.id;
        return (
          <button key={s.id} onClick={() => setActive(sel ? null : s.id)}
            style={{ display:"inline-flex", alignItems:"center", gap:6, flexShrink:0, padding:"8px 16px", borderRadius:9999, border:`1.5px solid ${sel?"#E76F51":"rgba(231,111,81,0.28)"}`, background:sel?"#E76F51":"#fff", color:sel?"#fff":G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
            <span style={{ fontSize:14 }}>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
