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
import SoulMadeModal from "../SoulMadeModal";
import { tdc } from "../../utils/tdc_intent";
import { bookViaConcierge } from "../../utils/MiraCardActions";
import { filterBreedProducts } from "../../hooks/useMiraFilter";

const PILLAR_COLORS = {
  dine:      { deep:"#1A2F1A", orange:"#C9973A", pale:"#FFF8EE" },
  care:      { deep:"#0A2A1A", orange:"#2D9D78", pale:"#F0FFF8" },
  go:        { deep:"#0D3349", orange:"#1ABC9C", pale:"#F0FDFA" },
  play:      { deep:"#7B2D00", orange:"#E76F51", pale:"#FFF0EA" },
  celebrate: { deep:"#1A0A2E", orange:"#C9973A", pale:"#FFF8EE" },
  learn:     { deep:"#1A1363", orange:"#7C3AED", pale:"#F5F3FF" },
  paperwork: { deep:"#042F2E", orange:"#0D9488", pale:"#F0FDFA" },
  shop:      { deep:"#451A03", orange:"#F59E0B", pale:"#FFFBEB" },
  adopt:     { deep:"#1A2E05", orange:"#65A30D", pale:"#F7FEE7" },
  farewell:  { deep:"#2E1065", orange:"#8B5CF6", pale:"#F5F3FF" },
  services:  { deep:"#0C4A6E", orange:"#0EA5E9", pale:"#F0F9FF" },
};
const PILLAR_LABELS = {
  care:"Wellness", dine:"Food", go:"Travel", play:"Play", learn:"Learning",
  celebrate:"Celebration", shop:"Shopping", paperwork:"Documents",
  adopt:"Adoption", farewell:"Farewell", services:"Services",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function SoulChip({ children, bg, color }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", background:bg||"rgba(155,89,182,0.12)", color:color||"#9B59B6", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, marginRight:4 }}>
      {children}
    </span>
  );
}

export default function PersonalisedBreedSection({
  pet,
  pillar = "play",
  hidePrice = false,
  conciergeMode = false,
  onRequestProduct = null,
  onViewProduct = null,
}) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);

  const breed    = pet?.doggy_soul_answers?.breed || pet?.breed || "Indie";
  const petName  = pet?.name || "your dog";
  const handleRequestProduct = async (product) => {
    if (!product) return;
    if (onRequestProduct) {
      onRequestProduct(product);
      return;
    }
    tdc.book({ service: product?.name || 'Personalised pick', pillar, pet, channel: `${pillar}_personalised_pick` });
    await bookViaConcierge({
      service: product?.name || 'Personalised pick',
      pillar,
      pet,
      channel: `${pillar}_personalised_pick`,
      amount: product?.price,
    });
  };
  const handleRequestCollection = async () => {
    tdc.request({ service: `${breed} collection request`, pillar, pet, channel: `${pillar}_breed_collection_request` });
    await bookViaConcierge({
      service: `${breed} Collection — Personalised Products`,
      pillar,
      pet,
      channel: `${pillar}_breed_collection_request`,
      amount: 0,
    });
  };
  const C        = PILLAR_COLORS[pillar] || PILLAR_COLORS.play;
  const isConciergeMode = conciergeMode || pillar === 'paperwork';

  useEffect(() => {
    if (!breed) { setLoading(false); return; }
    const breedEncoded = encodeURIComponent(breed);
    fetch(`${API_URL}/api/breed-catalogue/products?pillar=${pillar}&breed=${breedEncoded}&limit=40`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const raw = data?.products || [];
        // Step 1 — strict breed filter: exclude products named for a different breed
        const breedFiltered = filterBreedProducts(raw, breed);
        // Step 2 — image safety net: only show products with proper mockup images
        const clean = breedFiltered.filter(p => {
          const url = p.cloudinary_url || p.mockup_url || p.image_url || "";
          if (!url) return false;
          return url.split("/").pop().startsWith("breed-");
        });
        if (clean.length) setProducts(clean);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [breed, pillar]);

  if (loading) {
    return (
      <div style={{ padding:"24px 0", textAlign:"center" }}>
        <div style={{
          background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
          borderRadius:20, padding:'28px 20px',
        }}>
          <div style={{ width:28, height:28, border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid rgba(233,30,140,0.8)', borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }} />
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Finding personalised picks for {petName}…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div style={{ padding:"0", textAlign:"center" }}>
        <div style={{
          background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
          borderRadius:20, padding:'24px 20px', position:'relative', overflow:'hidden'
        }}>
          <div style={{ position:'absolute', top:-20, right:-10, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,30,140,0.15) 0%,transparent 70%)' }} />
          <div style={{ fontSize:10, letterSpacing:'0.14em', color:'rgba(233,30,140,0.9)', fontWeight:700, marginBottom:10 }}>✦ PERSONALISED FOR {breed?.toUpperCase()}S</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.3, marginBottom:8 }}>
            We're curating breed-specific products for {petName}.
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6, marginBottom:16 }}>
            Mira is working on {breed}-matched picks. Check back soon.
          </div>
          {/* Request collection CTA */}
          <button
            data-testid="request-breed-collection-btn"
            onClick={handleRequestCollection}
            style={{
              width:'100%', padding:'13px 18px', marginBottom:10,
              background:'linear-gradient(135deg,rgba(233,30,140,0.8),rgba(155,89,182,0.8))',
              border:'1px solid rgba(233,30,140,0.4)', borderRadius:14,
              color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:'inherit', letterSpacing:'0.01em',
            }}
          >
            Request {breed} Collection →
          </button>
          <div
            data-testid="soul-made-trigger"
            onClick={() => setSoulMadeOpen(true)}
            style={{
              padding:'14px 18px', background:'rgba(255,255,255,0.08)',
              border:'1px solid rgba(255,255,255,0.12)', borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              cursor:'pointer', textAlign:'left', transition:'all 0.2s',
            }}
          >
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:3 }}>
                {pillar === 'farewell'
                  ? `✦ In memory of ${petName} — create something meaningful`
                  : '✦ Soul Made™ — Make it personal'}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.4 }}>
                Upload {petName}'s photo · Concierge® creates it · Price on WhatsApp
              </div>
            </div>
            <div style={{ fontSize:20, color:'rgba(255,255,255,0.4)', flexShrink:0, marginLeft:8 }}>›</div>
          </div>
        </div>
        {soulMadeOpen && (
          <SoulMadeModal
            pet={pet}
            pillar={pillar}
            pillarColor={C.orange}
            pillarLabel={PILLAR_LABELS[pillar] || pillar}
            onClose={() => setSoulMadeOpen(false)}
          />
        )}
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
              onClick={() => {
                setSelected(selected?.id === p.id ? null : p);
                tdc.view({ product: p, pillar, pet, channel: `${pillar}_personalised_view` });
                onViewProduct?.(p);
              }}
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
                  <span style={{ fontSize:hidePrice ? 11 : 13, fontWeight:800, color:hidePrice ? '#888' : C.deep }}>
                    {hidePrice ? 'Pricing shared by Concierge®' : `₹${p.price?.toLocaleString?.() ?? p.price}`}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (isConciergeMode) {
                        handleRequestProduct(p);
                      }
                    }}
                    data-testid={`personalised-product-action-${p.id}`}
                    style={{ background:C.orange, color:"#fff", border:"none", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, cursor:"pointer" }}
                  >
                    {isConciergeMode ? 'Ask Concierge® →' : 'Add →'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Soul Made™ Trigger — inside Soul Picks ── */}
      <div
        data-testid="soul-made-trigger"
        onClick={() => setSoulMadeOpen(true)}
        style={{
          margin:'16px 0 12px', padding:'14px 16px',
          background:`${C.orange}08`, border:`1px solid ${C.orange}20`,
          borderRadius:14, display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
        }}
      >
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.orange, marginBottom:3 }}>
            {pillar === 'farewell'
              ? `✦ In memory of ${petName} — create something meaningful`
              : '✦ Soul Made™ — Make it personal'}
          </div>
          <div style={{ fontSize:12, color:'#888', lineHeight:1.4 }}>
            Upload {petName}'s photo · Concierge® creates it · Price on WhatsApp
          </div>
        </div>
        <div style={{ fontSize:20, color:`${C.orange}60`, flexShrink:0, marginLeft:8 }}>›</div>
      </div>
      {soulMadeOpen && (
        <SoulMadeModal
          pet={pet}
          pillar={pillar}
          pillarColor={C.orange}
          pillarLabel={PILLAR_LABELS[pillar] || pillar}
          onClose={() => setSoulMadeOpen(false)}
        />
      )}

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
