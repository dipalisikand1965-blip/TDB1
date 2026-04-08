/**
 * ShopSoulPage.jsx — /shop pillar
 * The Doggy Company
 *
 * Soul-led shop: Mira picks at top, then three natural sections:
 *   1. The Doggy Bakery  — treats, cakes, hampers (pillar=shop, type=service in DB)
 *   2. Breed Collection  — personalised merch per breed
 *   3. Everything        — full browse with filters
 *
 * Follows 13-point pillar standard exactly.
 * Colour world: warm gold/amber — The Doggy Bakery brand meets TDC platform.
 *
 * WIRING:
 *   Route:    <Route path="/shop" element={<ShopSoulPage/>}/>
 *   Products: GET /api/admin/pillar-products?pillar=shop&limit=100&category=X
 *   Bakery:   GET /api/service-box/services?pillar=shop  (the 387 bakery items)
 *   Mira:     GET /api/mira/claude-picks/{id}?pillar=shop&min_score=60
 *   Book:     POST /api/service_desk/attach_or_create_ticket
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import ConciergeToast from "../components/common/ConciergeToast";
import AmazonExplorerBox from "../components/shop/AmazonExplorerBox";
import MiraImaginesBreed from "../components/common/MiraImaginesBreed";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { filterBreedProducts } from "../hooks/useMiraFilter";
import { ProductGridSkeleton } from "../components/common/ProductSkeleton";
import SharedProductCard, { ProductDetailModal } from "../components/ProductCard";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import SoulMadeModal from "../components/SoulMadeModal";
import ShopMobilePage from './ShopMobilePage';

// ── Colour system — warm gold, The Doggy Bakery amber ─────────
const G = {
  deep:        "#3D1F00",
  mid:         "#7B3F00",
  gold:        "#C9973A",
  amber:       "#F59E0B",
  light:       "#FCD34D",
  pale:        "#FFF8E7",
  cream:       "#FFFBF2",
  pageBg:      "#FFFBF2",
  darkText:    "#3D1F00",
  mutedText:   "#92400E",
  border:      "rgba(201,151,58,0.20)",
  borderLight: "rgba(201,151,58,0.12)",
  greenBg:     "rgba(201,151,58,0.10)",
  greenBorder: "rgba(201,151,58,0.28)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Helpers ───────────────────────────────────────────────────
function t(str, name) { return str ? str.replace(/{name}/g, name||"your dog") : ""; }
const CLEAN_NONE = /^(no|none|none_confirmed|n\/a)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x&&!CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v&&!CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.allergies);
  return [...s].filter(Boolean);
}

function getBreed(pet) {
  return (pet?.breed || pet?.doggy_soul_answers?.breed || "").toLowerCase().trim();
}

function normalizePet(rawPet) {
  if (!rawPet) return null;
  return {
    id: rawPet.id || rawPet._id,
    name: rawPet.name || "your dog",
    breed: rawPet.breed || "",
    avatar: rawPet.photo_url || rawPet.avatar_url || null,
    soulPercent: rawPet.overall_score || rawPet.soul_score || 0,
    allergies: getAllergies(rawPet),
  };
}

// ── Shop category strip ───────────────────────────────────────
const SHOP_CATS = [
  { id:"bakery",  icon:"🎂", label:"The Doggy Bakery" },
  { id:"breed",   icon:"🐾", label:"Breed Collection" },
  { id:"treats",  icon:"🍖", label:"Treats" },
  { id:"hampers", icon:"🎁", label:"Hampers & Gifts" },
  { id:"merch",   icon:"👕", label:"Merch" },
  { id:"toys",    icon:"🧸", label:"Toys" },
  { id:"mira",    icon:"✦",  label:"Mira's Picks" },
];

function ShopCategoryStrip({ active, onSelect }) {
  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8,
                  scrollbarWidth:"none", marginBottom:20, paddingTop:4 }}>
      {SHOP_CATS.map(cat => (
        <button key={cat.id} onClick={() => onSelect(cat.id === active ? null : cat.id)}
          style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center",
                   gap:4, padding:"10px 14px", borderRadius:12, border:"none", cursor:"pointer",
                   background: active===cat.id
                     ? `linear-gradient(135deg,${G.mid},${G.gold})`
                     : G.pale,
                   color: active===cat.id ? "#fff" : G.darkText,
                   fontWeight: active===cat.id ? 700 : 500,
                   fontSize:11, transition:"all 0.15s",
                   boxShadow: active===cat.id ? `0 4px 12px rgba(201,151,58,0.35)` : "none" }}>
          <span style={{ fontSize:18 }}>{cat.icon}</span>
          <span style={{ whiteSpace:"nowrap" }}>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Mira Picks Section ────────────────────────────────────────
function MiraPicksSection({ pet }) {
  const [picks,    setPicks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const petName = pet?.name || "your dog";

  const imagines = [
    { emoji:"🎂", bg:`linear-gradient(135deg,${G.deep},${G.mid})`,
      name:"Birthday Cake Hamper", desc:"Custom breed cake + treats + toy", reason:"Because every birthday deserves a TDB cake" },
    { emoji:"🐾", bg:`linear-gradient(135deg,${G.mid},#8B4513)`,
      name:"Breed Collection", desc:"Personalised merch made for your dog's breed", reason:"Because they deserve things made for them" },
    { emoji:"🍖", bg:`linear-gradient(135deg,#5D2E00,${G.mid})`,
      name:"Treat Box", desc:"Curated dog-safe treats, monthly", reason:"Because good treats change daily habits" },
    { emoji:"🎁", bg:`linear-gradient(135deg,${G.deep},#4A2C8F)`,
      name:"Gift Hamper", desc:"The perfect gift for a dog parent", reason:"Because gifting love is its own language" },
  ];

  useEffect(() => {
    if (!pet?.id) { setLoading(false); return; }
    const breed = encodeURIComponent(getBreed(pet));
    fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=shop&limit=12&min_score=60&entity_type=product&breed=${breed}`)
      .then(r=>r.ok?r.json():null)
      .then(pData => {
        const prods = filterBreedProducts(pData?.picks||[], pet?.breed);
        if (prods.length) setPicks(prods.slice(0,12));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [pet?.id]);

  const showImagines = !loading && picks.length === 0;

  return (
    <section style={{ marginBottom:32 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800,
                     color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
          Mira's Shop Picks for <span style={{ color:G.gold }}>{petName}</span>
        </h3>
        <span style={{ fontSize:11, background:`linear-gradient(135deg,${G.gold},${G.mid})`,
                       color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>
          AI Scored
        </span>
      </div>
      <p style={{ fontSize:12, color:"#888", marginBottom:16 }}>
        Everything here is picked for {petName} — breed, allergies, and soul profile considered.
      </p>

      {showImagines ? (
        <MiraImaginesBreed pet={pet} pillar="shop" colour={G.gold||"#C9973A"}
          onConcierge={(card)=>{
            // Birthday/cake items route to Celebrate page
            if(card?.name?.toLowerCase().includes('cake')||card?.name?.toLowerCase().includes('birthday')||card?.name?.toLowerCase().includes('hamper')) {
              navigate('/celebrate');
            }
          }}/>
      ) : (
        <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:10, scrollbarWidth:"thin" }}>
          {picks.filter(p => p.entity_type !== "service").map((pick,i) => {
            const isService = pick.entity_type === "service";
            const img = [pick.image_url, pick.image, ...(pick.images||[])].find(u=>u&&u.startsWith("http")) || null;
            const score = pick.mira_score || 0;
            const scoreColor = score>=80 ? "#16A34A" : score>=70 ? G.gold : "#6B7280";
            return (
              <div key={pick.id||i}
                style={{ flexShrink:0, width:168, background:"#fff", borderRadius:14,
                         border:`1.5px solid ${G.borderLight}`, overflow:"hidden", cursor:"pointer" }}
                onClick={() => {
                  if (!isService) {
                    tdc.view({ product: pick, pillar: "shop", pet, channel: "shop_mira_picks" });
                    setSelected(pick);
                  }
                }}>
                <div style={{ width:"100%", height:130, background:G.pale, overflow:"hidden", position:"relative" }}>
                  {img
                    ? <img src={img} alt={pick.name||""} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                                    justifyContent:"center", background:`linear-gradient(135deg,${G.mid},${G.gold})`,
                                    color:"#fff", fontSize:12, fontWeight:700, padding:8, textAlign:"center" }}>
                        {(pick.name||"").slice(0,18)}
                      </div>}
                  <span style={{ position:"absolute", top:7, left:7, fontSize:9, fontWeight:700,
                                 background:isService?G.mid:G.gold, color:"#fff",
                                 borderRadius:20, padding:"2px 7px" }}>
                    {isService ? "SERVICE" : "PRODUCT"}
                  </span>
                </div>
                <div style={{ padding:"10px 11px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:G.darkText, lineHeight:1.3,
                                marginBottom:6, display:"-webkit-box", WebkitLineClamp:2,
                                WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {pick.name || pick.entity_name || "—"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                    <div style={{ flex:1, height:4, background:G.pale, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:4 }}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:800, color:scoreColor, minWidth:26 }}>{score}</span>
                  </div>
                  {pick.mira_reason && (
                    <p style={{ fontSize:10, color:"#888", lineHeight:1.4, margin:0,
                                display:"-webkit-box", WebkitLineClamp:2,
                                WebkitBoxOrient:"vertical", overflow:"hidden", fontStyle:"italic" }}>
                      {pick.mira_reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected && (
        <ProductDetailModal product={selected} pillar="shop" selectedPet={pet} onClose={() => setSelected(null)}/>
      )}
    </section>
  );
}

// ── Doggy Bakery Section ──────────────────────────────────────
function DoggyBakerySection({ pet }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [showAll,  setShowAll]  = useState(false);
  const petName = pet?.name || "your dog";

  const FILTERS = [
    { id:"all",     label:"All" },
    { id:"cakes",   label:"🎂 Cakes" },
    { id:"treats",  label:"🍖 Treats" },
    { id:"hampers", label:"🎁 Hampers" },
    { id:"seasonal",label:"🎃 Seasonal" },
  ];

  useEffect(() => {
    setLoading(true);
    const fetchTab = async () => {
      let products = [];
      const headers = { Authorization: `Bearer ${localStorage.getItem("tdb_auth_token") || ""}` };
      const breed = pet?.breed || '';
      const breedParam = breed ? `&breed=${encodeURIComponent(breed)}` : '';
      try {
        if (filter === 'all') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&page=1&limit=48&sort_by=mira_score${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'cakes') {
          const [r1, r2] = await Promise.all([
            fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=cakes&limit=120${breedParam}`, { headers }),
            fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=breed-cakes&limit=120${breedParam}`, { headers }),
          ]);
          const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
          products = [...(d1.products || []), ...(d2.products || [])];
        } else if (filter === 'treats') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=dine&category=Treats%20%26%20Rewards&limit=80${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'hampers') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=hampers&limit=50${breedParam}`, { headers });
          const d = await r.json();
          products = d?.products || [];
        } else if (filter === 'seasonal') {
          const r = await fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&limit=200${breedParam}`, { headers });
          const d = await r.json();
          const keys = ['diwali', 'halloween', 'christmas', 'rakhi', 'festive', 'holi', 'eid', 'spooky'];
          products = (d?.products || []).filter(p => keys.some(s => p.name?.toLowerCase().includes(s)));
        }
      } catch (e) { /* silent */ }
      setItems(products);
      setLoading(false);
    };
    fetchTab();
  }, [filter]);

  const filtered = items;

  return (
    <div>
      {/* Branded header */}
      <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`,
                    borderRadius:16, padding:"20px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, fontSize:80, opacity:0.06 }}>🎂</div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.15)",
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
              🎂
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif" }}>
                The Doggy Bakery
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>
                thedoggybakery.com · Dog-safe · Handmade · Delivered fresh
              </div>
            </div>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.80)", lineHeight:1.6, margin:"0 0 12px" }}>
            Every treat is dog-safe, handmade, and made with love.
            No xylitol. No artificial sweeteners. No compromise.
          </p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["🐾 Dog-safe","✦ Handmade","🚚 Same-day BLR+MUM","🌱 No xylitol"].map(tag => (
              <span key={tag} style={{ background:"rgba(255,255,255,0.15)", borderRadius:20,
                                       padding:"3px 10px", fontSize:10, fontWeight:600, color:"#fff" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Streaties badge */}
      <div style={{ background:G.pale, border:`1px solid ${G.border}`, borderRadius:10,
                    padding:"10px 14px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>🐕</span>
        <div style={{ fontSize:12, color:G.darkText, lineHeight:1.5 }}>
          <strong>Streaties:</strong> 10% of every purchase feeds street animals across India.
          {" "}<a href="https://thedoggybakery.com/pages/streaties" target="_blank" rel="noopener noreferrer"
            style={{ color:G.gold, fontWeight:600, textDecoration:"none" }}>
            Learn more →
          </a>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:600,
                     border:`1px solid ${filter===f.id?G.gold:G.border}`,
                     background:filter===f.id?G.gold:G.pale,
                     color:filter===f.id?"#fff":G.mid, cursor:"pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"#888" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🎂</div>
          Loading The Doggy Bakery…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"#888" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🎂</div>
          <div>Bakery products loading.</div>
          <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-block", marginTop:12, padding:"9px 20px", borderRadius:20,
                     background:G.pale, border:`1px solid ${G.gold}`, color:G.mid,
                     fontSize:12, fontWeight:600, textDecoration:"none" }}>
            Visit thedoggybakery.com →
          </a>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))", gap:12 }}>
            {(showAll ? filtered : filtered.slice(0,24)).map(item => (
              <div key={item.id||item._id}>
                <SharedProductCard product={item} pillar="shop" selectedPet={pet}
                  miraContext={{ includeText:"Add to Cart" }}/>
              </div>
            ))}
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowAll(true); }}
            style={{ display:"block", textAlign:"center", marginTop:16, padding:"12px",
                     borderRadius:10, background:G.pale, border:`1px solid ${G.border}`,
                     color:G.mid, fontSize:13, fontWeight:600, textDecoration:"none",
                     display: showAll ? "none" : "block" }}>
            Browse all {filtered.length} products →
          </a>
        </>
      )}
    </div>
  );
}

// ── Breed Collection Section ──────────────────────────────────
const SOUL_PAGE_LIMIT = 12;
function BreedCollectionSection({ pet }) {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [skip,         setSkip]         = useState(0);
  const [selPick,      setSelPick]      = useState(null);
  const [activeType,   setActiveType]   = useState("All");
  const breedDisplay = (pet?.breed || "").split("(")[0].trim();
  const petName = pet?.name || "your dog";
  const TYPES = ["All", "Bandana", "Mug", "Keychain", "Frame", "Tote Bag", "Collar Tag"];

  const fetchProducts = useCallback(async (currentSkip = 0, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const breed = encodeURIComponent((pet?.breed || "Indie").split("(")[0].trim().toLowerCase());
      const typeParam = activeType !== "All"
        ? `&category=${encodeURIComponent(activeType.toLowerCase().replace(" ", "_"))}`
        : "";
      const res = await fetch(
        `${API_URL}/api/admin/breed-products?breed=${breed}&is_active=true&limit=${SOUL_PAGE_LIMIT}&skip=${currentSkip}${typeParam}`
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const newItems = (data?.products || []).map(p => ({
        ...p,
        id: p.id || p._id || p.slug,
        name: p.name || p.product_type || "Soul Made Item",
        image_url: p.cloudinary_url || p.mockup_url || p.image_url || "",
        price: p.price || 0,
        pillar: "shop",
      })).filter(p => {
        // Only show proper mockups (breed- prefix filename)
        const fname = (p.image_url || "").split("/").pop();
        return fname.startsWith("breed-");
      });
      setProducts(prev => {
        if (!append) return newItems;
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...newItems.filter(x => !seen.has(x.id))];
      });
      setHasMore(newItems.length === SOUL_PAGE_LIMIT);
      setSkip(currentSkip + newItems.length);
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  }, [pet?.id, pet?.breed, activeType]);

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    fetchProducts(0, false);
  }, [pet?.id, pet?.breed, activeType]);

  return (
    <div>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,#2D1B69,#4A2C8F)`,
                    borderRadius:14, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#DDD6FE", textTransform:"uppercase",
                      letterSpacing:"0.08em", marginBottom:6 }}>
          ✦ Soul Made For {(breedDisplay || "Your Dog").toUpperCase()}
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>
          {breedDisplay ? `Made for ${breedDisplay}s — made for ${petName}` : `Made for ${petName}'s breed`}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>
          Every piece is personalised to your dog's breed. No two collections are the same.
        </div>
      </div>

      {/* Type filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {TYPES.map(type => (
          <button key={type} onClick={() => setActiveType(type)}
            data-testid={`breed-type-filter-${type.toLowerCase().replace(" ","-")}`}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600,
                     border:`1px solid ${activeType===type?"#7C3AED":G.border}`,
                     background:activeType===type?"#7C3AED":G.pale,
                     color:activeType===type?"#fff":G.mid, cursor:"pointer" }}>
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:"#888", fontSize:13 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🐾</div>
          Loading {breedDisplay || "breed"} collection…
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:"#888", fontSize:13 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🐾</div>
          Breed collection being added.
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(160px,100%),1fr))", gap:12 }}>
            {products.map(p => (
              <div key={p.id}
                data-testid={`soul-product-card-${p.id}`}
                onClick={() => setSelPick(p)}
                style={{
                  background:"#fff", borderRadius:14,
                  border:"1px solid rgba(201,151,58,0.15)",
                  overflow:"hidden", cursor:"pointer",
                  transition:"box-shadow 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
              >
                <div style={{ aspectRatio:"1", overflow:"hidden", background:"#F5F0E8" }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      loading="lazy"/>
                  ) : (
                    <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:32 }}>🐾</div>
                  )}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1A1A2E",
                    marginBottom:4, lineHeight:1.3,
                    overflow:"hidden", display:"-webkit-box",
                    WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:G.gold }}>
                    {p.price ? `₹${p.price}` : "Price on request"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign:"center", marginTop:20 }}>
              <button
                data-testid="breed-collection-load-more"
                onClick={() => fetchProducts(skip, true)}
                disabled={loadingMore}
                style={{
                  padding:"11px 32px", borderRadius:999,
                  border:`1.5px solid ${G.gold}`,
                  background:"#fff", color:G.gold,
                  fontSize:14, fontWeight:600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.7 : 1,
                }}>
                {loadingMore ? "Loading…" : `Load more for ${petName} →`}
              </button>
            </div>
          )}
        </>
      )}
      {selPick && <ProductDetailModal product={selPick} pillar="shop" selectedPet={pet} onClose={() => setSelPick(null)}/>}
    </div>
  );
}

// ── Full Shop Browse ──────────────────────────────────────────
function ShopBrowseSection({ pet }) {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [page,         setPage]         = useState(0);
  const [hasMore,      setHasMore]      = useState(true);
  const LIMIT = 24;

  const PILLARS = [
    { id:"all",       label:"Everything",  emoji:"🛍️" },
    { id:"shop",      label:"Shop",        emoji:"🎁" },
    { id:"celebrate", label:"Celebrate",   emoji:"🎂" },
    { id:"care",      label:"Care",        emoji:"🌿" },
    { id:"play",      label:"Play",        emoji:"🎾" },
    { id:"learn",     label:"Learn",       emoji:"📚" },
    { id:"dine",      label:"Dine",        emoji:"🍖" },
  ];

  const fetchProducts = useCallback(async (pillar, pageNum, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const pageNum1  = pageNum + 1; // endpoint uses 1-indexed page
      const pillarParam = pillar === "all" ? "" : `&pillar=${pillar}`;
      const breedParam  = pet?.breed ? `&breed=${encodeURIComponent(pet.breed)}` : "";
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      const url = `${API_URL}/api/admin/pillar-products?limit=${LIMIT}&page=${pageNum1}${pillarParam}${breedParam}${searchParam}&sort_by=mira_score`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("tdb_auth_token")||""}` } });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newProducts = data?.products || [];
      setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
      setHasMore(newProducts.length === LIMIT);
      setPage(pageNum);
    } catch { setProducts(prev => append ? prev : []); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [pet?.breed, search]);

  // Re-fetch when tab or pet changes
  useEffect(() => {
    setPage(0); setHasMore(true);
    fetchProducts(pillarFilter, 0, false);
  }, [pillarFilter, pet?.id]);

  const handleTabChange = (id) => {
    setPillarFilter(id);
    setSearch("");
  };

  return (
    <div>
      {/* Search */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key==="Enter" && fetchProducts(pillarFilter, 0, false)}
          placeholder="Search products…"
          style={{ flex:1, padding:"10px 14px", borderRadius:10, fontSize:13, outline:"none",
                   border:`1.5px solid ${G.border}`, color:G.darkText, background:"#fff" }}/>
        <button onClick={() => fetchProducts(pillarFilter, 0, false)}
          style={{ padding:"10px 16px", borderRadius:10, background:G.gold, color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Search
        </button>
      </div>

      {/* Pillar filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {PILLARS.map(p => (
          <button key={p.id} onClick={() => handleTabChange(p.id)}
            data-testid={`shop-tab-${p.id}`}
            style={{ padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:600,
                     border:`1px solid ${pillarFilter===p.id?G.gold:G.border}`,
                     background:pillarFilter===p.id?G.gold:G.pale,
                     color:pillarFilter===p.id?"#fff":G.mid, cursor:"pointer" }}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"#888" }}>No products found.</div>
      ) : (
        <>
          <div style={{ fontSize:12, color:"#888", marginBottom:12 }}>
            Showing {products.length} products{pillarFilter !== "all" ? ` in ${PILLARS.find(t=>t.id===pillarFilter)?.label}` : ""} · Sorted by Mira's score
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))", gap:12 }}>
            {products.map(p => (
              <div key={p.id||p._id}>
                <SharedProductCard product={p} pillar={p.pillar||"shop"} selectedPet={pet}
                  miraContext={{ includeText:"Add to Cart" }}/>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign:"center", marginTop:24 }}>
              <button onClick={() => fetchProducts(pillarFilter, page+1, true)}
                disabled={loadingMore}
                style={{ padding:"10px 32px", borderRadius:999, border:`1.5px solid ${G.gold}`,
                         background:"#fff", color:G.gold, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                {loadingMore ? "Loading…" : "Load more →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Loading / No Pet states ───────────────────────────────────
function LoadingState() {
  return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ width:48, height:48, borderRadius:"50%", background:MIRA_ORB,
                    margin:"0 auto 16px", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:22, color:"#fff" }}>✦</div>
      <div style={{ fontSize:16, color:G.darkText, fontWeight:600 }}>
        Loading your <span style={{ color:G.gold }}>shop…</span>
      </div>
    </div>
  );
}

function NoPetState({ onAddPet }) {
  return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🛍️</div>
      <div style={{ fontSize:18, fontWeight:800, color:G.darkText, marginBottom:8 }}>
        Add a pet to personalise your shop
      </div>
      <p style={{ fontSize:14, color:G.mutedText, marginBottom:24 }}>
        Mira picks the right products for your dog.
      </p>
      <button onClick={onAddPet}
        style={{ background:`linear-gradient(135deg,${G.gold},${G.mid})`,
                 color:"#fff", border:"none", borderRadius:9999,
                 padding:"12px 28px", fontSize:16, fontWeight:600, cursor:"pointer" }}>
        Add your dog →
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
const ShopSoulPage = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate   = useNavigate();
  const { token, isAuthenticated }                        = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components


  const [loading,    setLoading]    = useState(true);
  const [petData,    setPetData]    = useState(null);
  const [soulScore,  setSoulScore]  = useState(0);
  const [activeSection, setActiveSection] = useState(null); // null = show all
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastSvc,      setToastSvc]      = useState("");
  const [soulMadeOpen,  setSoulMadeOpen]  = useState(false);
  useEffect(() => {
    if (contextPets?.length>0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) {
      setPetData(currentPet);
      setSoulScore(currentPet.overall_score || currentPet.soul_score || 0);
    }
  }, [currentPet]);

  usePlatformTracking({ pillar: "shop", pet: currentPet });

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/shop");
  }, [isAuthenticated, navigate]);

  // Mobile detection
  if (!isDesktop) return <ShopMobilePage />;

  if (loading)  return <PillarPageLayout pillar="shop" hideHero hideNavigation><LoadingState/></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="shop" hideHero hideNavigation><NoPetState onAddPet={handleAddPet}/></PillarPageLayout>;

  const petName = petData.name;

  return (
    <PillarPageLayout pillar="shop" hideHero hideNavigation>
      <Helmet>
        <title>Shop · {petName} · The Doggy Company</title>
        <meta name="description" content={`Shop personalised for ${petName} — The Doggy Bakery, breed collection, and more.`}/>
      </Helmet>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8"
           style={{ background:G.pageBg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", padding:"32px 0 24px", borderBottom:`1px solid ${G.border}`, marginBottom:24 }}>
          {petData.photo_url || petData.avatar_url ? (
            <img src={petData.photo_url || petData.avatar_url} alt={petName}
              style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover",
                       border:`3px solid ${G.gold}`, margin:"0 auto 12px", display:"block" }}/>
          ) : (
            <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${G.mid},${G.gold})`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:32, margin:"0 auto 12px" }}>🛍️</div>
          )}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                        background:`linear-gradient(135deg,${G.gold},${G.mid})`,
                        borderRadius:20, padding:"4px 14px", marginBottom:10 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>✦ Soul Score</span>
            <span style={{ fontSize:13, fontWeight:900, color:"#fff" }}>{soulScore}%</span>
          </div>
          <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:800,
                       color:G.darkText, fontFamily:"Georgia,'Times New Roman',serif",
                       margin:"0 0 6px" }}>
            {petName}'s Shop
          </h1>
          <p style={{ fontSize:14, color:G.mutedText, margin:"0 0 16px" }}>
            Everything picked by Mira — treats, merch, gifts, and more.
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {["🎂 The Doggy Bakery", "🐾 Breed Collection", "✦ Mira Picks"].map(chip => (
              <span key={chip} style={{ background:G.pale, border:`1px solid ${G.border}`,
                                        borderRadius:20, padding:"4px 12px",
                                        fontSize:11, fontWeight:600, color:G.mid }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Soul Profile bar — pet/breed info + questions */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={petData} token={token} pillar="shop" color="#D97706" />
        </div>

        {/* Category strip */}
        <ShopCategoryStrip
          active={activeSection}
          onSelect={id => setActiveSection(id)}
        />

        {/* Mira picks — always shown unless a section is active */}
        {(!activeSection || activeSection === "mira") && (
          <>
            <MiraPicksSection pet={petData}/>
          </>
        )}

        {/* The Doggy Bakery */}
        {(!activeSection || activeSection === "bakery" || activeSection === "treats" || activeSection === "hampers") && (
          <section style={{ marginBottom:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:22 }}>🎂</span>
              <h2 style={{ fontSize:"clamp(1.25rem,3vw,1.5rem)", fontWeight:800,
                           color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
                The Doggy Bakery
              </h2>
              <span style={{ fontSize:10, fontWeight:700, background:G.gold, color:"#fff",
                             borderRadius:20, padding:"2px 8px" }}>✦ TDC</span>
            </div>
            <DoggyBakerySection pet={petData}/>
          </section>
        )}

        {/* Breed Collection */}
        {(!activeSection || activeSection === "breed" || activeSection === "merch") && (
          <section style={{ marginBottom:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:22 }}>🐾</span>
              <h2 style={{ fontSize:"clamp(1.25rem,3vw,1.5rem)", fontWeight:800,
                           color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
                Breed Collection
              </h2>
              <span onClick={() => setSoulMadeOpen(true)} style={{ fontSize:10, fontWeight:700, background:"#7C3AED", color:"#fff",
                             borderRadius:20, padding:"2px 8px", cursor:"pointer" }}>✦ Soul-Made</span>
            </div>
            <BreedCollectionSection pet={petData}/>
          </section>
        )}
        {soulMadeOpen && <SoulMadeModal pet={petData} pillar="shop" pillarColor="#F59E0B" pillarLabel="Shopping" onClose={() => setSoulMadeOpen(false)} />}

        {/* Full browse */}
        <section style={{ marginBottom:48 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <span style={{ fontSize:22 }}>🛍️</span>
            <h2 style={{ fontSize:"clamp(1.25rem,3vw,1.5rem)", fontWeight:800,
                         color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>
              Browse Everything
            </h2>
          </div>
          <ShopBrowseSection pet={petData}/>
        </section>

        {/* Amazon Explorer — self-serve search, separate from Concierge */}
        <section style={{ marginBottom: 40 }}>
          <AmazonExplorerBox pet={petData} isDesktop={true} />
        </section>

        {/* May 15th Mystique banner */}
        <div style={{ background:`linear-gradient(135deg,${G.deep},#2D1B69)`,
                      borderRadius:16, padding:"20px 24px", marginBottom:32,
                      display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color:G.light, textTransform:"uppercase",
                          letterSpacing:"0.08em", marginBottom:6 }}>
              🌷 May 15th — Mystique's Birthday
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>
              Shop on her birthday. Feed a stray dog.
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>
              10% of every Doggy Bakery purchase goes to Streaties — feeding street animals across India.
            </div>
          </div>
          <a href="https://thedoggybakery.com/pages/streaties" target="_blank" rel="noopener noreferrer"
            style={{ background:G.gold, color:G.deep, border:"none", borderRadius:20,
                     padding:"10px 20px", fontSize:12, fontWeight:700, cursor:"pointer",
                     textDecoration:"none", whiteSpace:"nowrap", flexShrink:0 }}>
            About Streaties →
          </a>
        </div>
      </div>

      <ConciergeToast
        toast={toastVisible ? { name: toastSvc, pillar: "shop" } : null}
        onClose={() => setToastVisible(false)}
      />
    </PillarPageLayout>
  );
};

export default ShopSoulPage;
