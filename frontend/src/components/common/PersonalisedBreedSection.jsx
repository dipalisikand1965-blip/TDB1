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
import { ProductDetailModal } from "../ProductCard";

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
  entityType = "product",  // "product" | "service" — controls all user-facing text
}) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

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
    // Fetch ALL breed products (no pillar filter) so user always sees a full Soul Made collection.
    // Sort current-pillar products first, then fill with cross-pillar picks.
    fetch(`${API_URL}/api/breed-catalogue/products?breed=${breedEncoded}&limit=40`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const raw = data?.products || [];
        // Step 1 — strict breed filter: exclude products named for a different breed
        const breedFiltered = filterBreedProducts(raw, breed);
        // Step 2 — prefer products with watercolor / breed images, skip blank-image products
        const withImages = breedFiltered.filter(p => {
          const url = p.watercolor_image || p.cloudinary_url || p.mockup_url || p.image_url || p.primary_image || p.image || "";
          if (!url) return false;
          const filename = url.split("/").pop().split("?")[0];
          return filename.startsWith("breed-") || url.includes("/breed_products/") ||
                 filename.includes("watercolor") || (p.watercolor_image && p.watercolor_image.startsWith("http"));
        });
        const pool = withImages.length ? withImages : breedFiltered;
        // Step 3 — sort: current pillar first, then others alphabetically
        const sorted = [...pool].sort((a, b) => {
          const aHasPillar = (a.pillars || []).includes(pillar) ? 0 : 1;
          const bHasPillar = (b.pillars || []).includes(pillar) ? 0 : 1;
          return aHasPillar - bHasPillar;
        });
        // Show up to 12 products in the grid
        setProducts(sorted.slice(0, 12));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [breed, pillar]);

  if (loading) {
    return (
      <div style={{ padding:"20px 0", display:"flex", justifyContent:"center" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:C.orange, opacity:0.5, animation:"pulseDot 1.2s ease-in-out infinite" }} />
        <style>{`@keyframes pulseDot{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:0.8;transform:scale(1.2)}}`}</style>
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
            We're curating breed-specific {entityType}s for {petName}.
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
          <button
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
          </button>
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
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.deep }}>Made for {petName}</div>
        </div>
        <SoulChip bg={`${C.orange}20`} color={C.orange}>Soul Made</SoulChip>
      </div>

      {/* Product grid — 4 at a time */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
        {products.slice(0, visibleCount).map((p, i) => {
          const imgUrl = p.watercolor_image || p.cloudinary_url || p.mockup_url || p.primary_image || p.image_url || p.image || p.images?.[0];
          return (
            <div key={p.id || i}
              onClick={() => {
                if (!isConciergeMode) {
                  setSelected(p);
                  tdc.view({ product: p, pillar, pet, channel: `${pillar}_personalised_view` });
                  onViewProduct?.(p);
                }
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
                      } else {
                        setSelected(p);
                        tdc.view({ product: p, pillar, pet, channel: `${pillar}_personalised_view` });
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

      {/* Quiet load-more — no counts */}
      {visibleCount < products.length && (
        <div style={{ textAlign:"center", marginTop:14, marginBottom:4 }}>
          <button
            onClick={() => setVisibleCount(c => c + 4)}
            data-testid="personalised-load-more"
            style={{ background:"none", border:`1px solid ${C.orange}40`, borderRadius:999, padding:"6px 22px", fontSize:12, fontWeight:600, color:C.orange, cursor:"pointer", letterSpacing:"0.03em" }}
          >
            see more
          </button>
        </div>
      )}
      {/* ── Soul Made™ Trigger — bold dark card ── */}
      <div
        data-testid="soul-made-trigger"
        onClick={() => setSoulMadeOpen(true)}
        style={{
          margin:'20px 0 12px',
          background:'linear-gradient(135deg,#1A0A2E 0%,#3D0B7A 60%,#6B21A8 100%)',
          borderRadius:18, padding:'22px 20px 18px', cursor:'pointer',
          position:'relative', overflow:'hidden',
        }}
      >
        {/* label */}
        <div style={{ fontSize:10, fontWeight:800, color:'#E91E8C', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>
          ✦ Soul Made™ · Made only for {petName}
        </div>
        {/* headline */}
        <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.25, marginBottom:10 }}>
          {pillar === 'farewell'
            ? `${petName}'s memory. In frames, candles and more.`
            : `${petName}'s face. On cake toppers, bandanas, frames and more.`}
        </div>
        {/* sub */}
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:18, lineHeight:1.5 }}>
          {pillar === 'farewell'
            ? `One-of-one memorial pieces made just for ${petName}.`
            : `One-of-one celebration pieces made just for ${petName}.`}
        </div>
        {/* CTA */}
        <div style={{
          background:'linear-gradient(90deg,#7B2FBE,#9B59B6)',
          borderRadius:12, padding:'13px 0', textAlign:'center',
          fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'0.02em',
        }}>
          Make something only {petName} has →
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

      {/* Product Detail Modal — opens on Add → or card click */}
      {selected && !isConciergeMode && (
        <ProductDetailModal
          product={selected}
          pillar={pillar}
          selectedPet={pet}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
