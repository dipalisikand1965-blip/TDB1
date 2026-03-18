/**
 * PersonalisedBreedSection.jsx
 * Shared component — shows breed-specific soul products in a "Personalised" tab
 * Used by: DineSoulPage, CareSoulPage, GoSoulPage, PlaySoulPage modal panels
 *
 * Props:
 *  pet     — the selected pet object (must have pet.breed or pet.doggy_soul_answers.breed)
 *  pillar  — "dine" | "care" | "go" | "play"
 *  accentColor — hex for the pillar (optional, defaults sensibly)
 */
import { useState, useEffect } from "react";
import { API_URL } from "../../utils/api";

const PILLAR_COLORS = {
  dine:      { deep:"#1A2F1A", orange:"#C9973A", pale:"#FFF8EE" },
  care:      { deep:"#0A2A1A", orange:"#2D9D78", pale:"#F0FFF8" },
  go:        { deep:"#0D3349", orange:"#1ABC9C", pale:"#F0FDFA" },
  play:      { deep:"#7B2D00", orange:"#E76F51", pale:"#FFF0EA" },
  celebrate: { deep:"#1A0A2E", orange:"#C9973A", pale:"#FFF8EE" },
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function SoulChip({ children, bg, color }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", background:bg||"rgba(155,89,182,0.12)", color:color||"#9B59B6", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, marginRight:4 }}>
      {children}
    </span>
  );
}

export default function PersonalisedBreedSection({ pet, pillar = "play" }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const breed    = pet?.doggy_soul_answers?.breed || pet?.breed || "Indie";
  const petName  = pet?.name || "your dog";
  const C        = PILLAR_COLORS[pillar] || PILLAR_COLORS.play;

  useEffect(() => {
    if (!breed) { setLoading(false); return; }
    const breedEncoded = encodeURIComponent(breed);
    fetch(`${API_URL}/api/breed-catalogue/products?pillar=${pillar}&breed=${breedEncoded}&limit=20`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products?.length) setProducts(data.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [breed, pillar]);

  if (loading) {
    return (
      <div style={{ padding:"32px 0", textAlign:"center" }}>
        <div style={{ width:28, height:28, border:`3px solid ${C.pale}`, borderTop:`3px solid ${C.orange}`, borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }} />
        <div style={{ fontSize:12, color:"#888" }}>Finding personalised picks for {petName}…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div style={{ padding:"32px 24px", textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:10 }}>🌟</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.deep, marginBottom:6 }}>Soul Products for {breed}s</div>
        <div style={{ fontSize:12, color:"#888", lineHeight:1.6, maxWidth:300, margin:"0 auto" }}>
          We're curating breed-specific products for {petName}. Check back soon — Mira is working on it.
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:16 }} data-testid="personalised-breed-section">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, paddingBottom:10, borderBottom:`1px solid ${C.pale}` }}>
        <div style={{ width:22, height:22, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.deep }}>Made for {breed}s</div>
          <div style={{ fontSize:11, color:"#888" }}>{products.length} personalised picks by Mira</div>
        </div>
        <SoulChip bg={`${C.orange}20`} color={C.orange}>Soul Made</SoulChip>
      </div>

      {/* Product grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(160px,100%),1fr))", gap:12 }}>
        {products.map((p, i) => {
          const imgUrl = p.mockup_url || p.primary_image || p.image || p.images?.[0];
          return (
            <div key={p.id || i}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              data-testid={`personalised-product-${p.id}`}
              style={{ background:"#fff", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1.5px solid ${selected?.id===p.id ? C.orange : C.pale}`, transition:"all 0.15s", boxShadow: selected?.id===p.id ? `0 4px 16px ${C.orange}22` : "none" }}
            >
              <div style={{ height:120, background:`linear-gradient(135deg,${C.pale},${C.orange}22)`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {imgUrl
                  ? <img src={imgUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                  : <span style={{ fontSize:36 }}>🌟</span>}
              </div>
              <div style={{ padding:"10px 12px 12px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.deep, marginBottom:3, lineHeight:1.3 }}>{p.name || p.title}</div>
                {p.mira_hint && <div style={{ fontSize:10, color:C.orange, lineHeight:1.4, marginBottom:6 }}>{p.mira_hint}</div>}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, fontWeight:800, color:C.deep }}>₹{p.price?.toLocaleString?.() ?? p.price}</span>
                  <button
                    onClick={e => { e.stopPropagation(); /* Add to cart */ }}
                    style={{ background:C.orange, color:"#fff", border:"none", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, cursor:"pointer" }}
                  >
                    Add →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected product detail */}
      {selected && (
        <div style={{ marginTop:14, background:C.pale, borderRadius:14, padding:"14px 16px", border:`1px solid ${C.orange}30` }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", flexShrink:0, marginTop:2 }}>✦</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.deep, marginBottom:4 }}>{selected.name}</div>
              <div style={{ fontSize:12, color:"#555", lineHeight:1.55 }}>{selected.short_description || selected.description}</div>
              {selected.soul_tier === "soul_made" && (
                <div style={{ marginTop:8 }}>
                  <SoulChip bg={`${C.orange}18`} color={C.orange}>Soul Made</SoulChip>
                  <span style={{ fontSize:10, color:"#888" }}> Handcrafted for {breed}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
