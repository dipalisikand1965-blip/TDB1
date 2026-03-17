/**
 * GoCategoryStrip.jsx — /go pillar category pills
 * Mirrors CareCategoryStrip.jsx exactly — 6 go dimensions
 *
 * Props: pet — pet object
 */
import { useState } from "react";

const G = { deep:"#0D3349", teal:"#1ABC9C", light:"76D7C4", pale:"#D1F2EB", cream:"#E8F8F5", deepMid:"#1A5276", mutedText:"#5D6D7E" };

const GO_STRIPS = [
  { id:"safety",   icon:"🛡️", label:"Safety" },
  { id:"calming",  icon:"😌", label:"Calming" },
  { id:"carriers", icon:"🎒", label:"Carriers" },
  { id:"feeding",  icon:"🥣", label:"Feeding" },
  { id:"health",   icon:"💊", label:"Health & Docs" },
  { id:"stay",     icon:"🏡", label:"Stay & Board" },
];

export default function GoCategoryStrip({ pet }) {
  const [active, setActive] = useState(null);

  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"16px 0 12px", scrollbarWidth:"none", marginBottom:4 }} className="go-strip">
      <style>{`.go-strip::-webkit-scrollbar{display:none}`}</style>
      {GO_STRIPS.map(s => {
        const sel = active === s.id;
        return (
          <button key={s.id}
            onClick={() => setActive(sel ? null : s.id)}
            style={{ display:"inline-flex", alignItems:"center", gap:6, flexShrink:0, padding:"8px 16px", borderRadius:9999, border:`1.5px solid ${sel?"#1ABC9C":"rgba(26,188,156,0.25)"}`, background:sel?"#1ABC9C":"#fff", color:sel?G.deep:G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
            <span style={{ fontSize:14 }}>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
