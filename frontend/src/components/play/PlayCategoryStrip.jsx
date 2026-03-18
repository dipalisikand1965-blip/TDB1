/**
 * PlayCategoryStrip.jsx — /play pillar
 * Mirrors GoCategoryStrip.jsx — 6 play dimensions
 */
import { useState } from "react";

const G = { green:"#52B788", mid:"#2D6A4F", pale:"#D8F3DC", mutedText:"#4A7C6A" };

const PLAY_STRIPS = [
  { id:"soul",      icon:"✨", label:"Soul Play",     special:true },
  { id:"mira",      icon:"🪄", label:"Mira's Picks",  special:true },
  { id:"outings",   icon:"🌳", label:"Outings & Parks" },
  { id:"playdates", icon:"🐾", label:"Playdates" },
  { id:"walking",   icon:"🦮", label:"Dog Walking" },
  { id:"fitness",   icon:"💪", label:"Fitness" },
  { id:"swimming",  icon:"🏊", label:"Swimming" },
];

export default function PlayCategoryStrip({ pet }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"16px 0 12px", scrollbarWidth:"none", marginBottom:4 }} className="play-strip">
      <style>{`.play-strip::-webkit-scrollbar{display:none}`}</style>
      {PLAY_STRIPS.map(s => {
        const sel = active === s.id;
        return (
          <button key={s.id} onClick={() => setActive(sel ? null : s.id)}
            style={{ display:"inline-flex", alignItems:"center", gap:6, flexShrink:0, padding:"8px 16px", borderRadius:9999, border:`1.5px solid ${sel?"#52B788":"rgba(82,183,136,0.28)"}`, background:sel?"#52B788":"#fff", color:sel?G.mid:G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
            <span style={{ fontSize:14 }}>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
