/**
 * CelebrateNearMe.jsx — /celebrate pillar
 * The Doggy Company
 *
 * Find pet photographers, dog-friendly venues, groomers, party planners
 * and boutiques using Google Places textSearch.
 *
 * BAKERY IS DIFFERENT:
 *   Selecting the 🎂 Bakery pill does NOT search Google Places.
 *   It shows a branded The Doggy Bakery section pulling directly
 *   from the DB — breed-cakes, cakes, celebration_addons categories.
 *   No competitor bakeries are ever surfaced.
 *
 * BACKEND:
 *   Vendor search: GET /api/places/care-providers (same endpoint as Care/Paperwork)
 *   Bakery products: GET /api/admin/pillar-products?pillar=celebrate&category=breed-cakes
 *                    GET /api/admin/pillar-products?pillar=celebrate&category=cakes
 *
 * USAGE:
 *   import CelebrateNearMe from "../components/celebrate/CelebrateNearMe";
 *   <CelebrateNearMe pet={petData} onBook={handleBook} />
 */

import { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { API_URL } from "../../utils/api";
import SharedProductCard from "../ProductCard";
import { tdc } from "../../utils/tdc_intent";
import NearMeConciergeModal from "../common/NearMeConciergeModal";

const G = {
  deep:"#2D1B69", mid:"#4A2C8F", purple:"#9B59B6", gold:"#C9973A",
  light:"#DDD6FE", pale:"#F5F3FF", cream:"#FAF8FF",
  darkText:"#2D1B69", mutedText:"#6B46C1",
};

// Bakery brand colours — The Doggy Bakery
const B = {
  deep:"#5D2E00", mid:"#8B4513", warm:"#C9973A",
  pale:"#FFF8F0", cream:"#FFFBF5",
};

// ── Vendor types — BAKERY is handled separately ────────────────
const VENDOR_TYPES = [
  { id:"all",          label:"All Vendors",        icon:"🎉", term:"pet friendly services" },
  { id:"photographer", label:"Pet Photographers",  icon:"📸", term:"pet photographer dog photography",     note:"Many photographers work through Instagram — Concierge® can find them too." },
  { id:"venue",        label:"Dog-Friendly Venues", icon:"🏡", term:"dog friendly venue restaurant cafe" },
  { id:"bakery",       label:"The Doggy Bakery",   icon:"🎂", term:null, isTDB:true },  // ← handled separately
  { id:"groomer",      label:"Birthday Groomers",  icon:"✨", term:"dog grooming salon birthday pamper" },
  { id:"planner",      label:"Party Planners",     icon:"🎊", term:"dog party planner pet event",          note:"Most party planners operate via Instagram. Concierge® handles this best." },
  { id:"boutique",     label:"Pet Boutiques",      icon:"🛍️", term:"pet boutique dog accessories costume" },
  { id:"park",         label:"Dog Parks",          icon:"🌳", term:"dog park dog beach pet friendly park" },
];

const POPULAR_CITIES = [
  {name:"Bangalore",flag:"🇮🇳"},{name:"Mumbai",flag:"🇮🇳"},{name:"Delhi",flag:"🇮🇳"},
  {name:"Pune",flag:"🇮🇳"},{name:"Goa",flag:"🇮🇳"},{name:"Chennai",flag:"🇮🇳"},
  {name:"London",flag:"🇬🇧"},{name:"Dubai",flag:"🇦🇪"},{name:"Singapore",flag:"🇸🇬"},
];
const ALL_CITIES = [
  "Bangalore","Mumbai","Delhi","Pune","Chennai","Hyderabad","Goa","Kochi","Jaipur",
  "Kolkata","Gurgaon","Noida","London","Dubai","Singapore","New York","Sydney","Toronto",
];

// ── Shared UI helpers ──────────────────────────────────────────
function StarRating({ rating, count }) {
  if (!rating) return null;
  return (
    <span style={{display:"flex",alignItems:"center",gap:4}}>
      <span style={{color:"#F59E0B",fontSize:11}}>{"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}</span>
      <span style={{color:G.mutedText,fontSize:11}}>{rating.toFixed(1)}</span>
      {count && <span style={{color:"#aaa",fontSize:10}}>({count})</span>}
    </span>
  );
}
function OpenBadge({ openNow }) {
  if (openNow===undefined||openNow===null) return null;
  return <span style={{fontSize:9,fontWeight:700,borderRadius:8,padding:"2px 8px",background:openNow?"#E8F5E9":"#FFEBEE",color:openNow?"#2E7D32":"#C62828"}}>{openNow?"✓ Open now":"Closed"}</span>;
}
function QualityHint({ type }) {
  if (!type?.note || type.isTDB) return null;
  return (
    <div style={{background:G.pale,border:`1px solid rgba(155,89,182,0.20)`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:G.mutedText,lineHeight:1.5}}>
      <span style={{color:G.purple,fontWeight:700}}>✦ Mira's note: </span>{type.note}
    </div>
  );
}

// ── Vendor card (Google Places results) ───────────────────────
function VendorCard({ vendor, pet, onBook, onOpenModal }) {
  const handleBook = () => {
    tdc.nearme({ query: vendor.name || "venue", pillar: "celebrate", pet, channel: "celebrate_nearme" });
    onOpenModal?.(vendor);
    onBook?.(vendor, vendor.city || vendor.vicinity);
  };
  const [imgErr,setImgErr] = useState(false);
  const type = VENDOR_TYPES.find(t=>t.id===vendor.type) || VENDOR_TYPES[0];
  return (
    <div style={{background:"#fff",border:`1px solid rgba(155,89,182,0.15)`,borderRadius:14,overflow:"hidden",transition:"transform 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
      <div style={{position:"relative",height:130,background:G.pale,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {vendor.photo_url&&!imgErr
          ?<img src={vendor.photo_url} alt={vendor.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgErr(true)}/>
          :<span style={{fontSize:36}}>{type.icon}</span>}
        <span style={{position:"absolute",top:10,left:10,background:G.purple,color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"3px 8px"}}>{type.icon} {type.label}</span>
        {vendor.tdc_verified&&<span style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,borderRadius:8,padding:"2px 8px",background:"#FFF8E1",color:G.gold}}>✦ TDC Verified</span>}
      </div>
      <div style={{padding:"12px 14px 14px"}}>
        <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:4,lineHeight:1.3}}>{vendor.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <StarRating rating={vendor.rating} count={vendor.review_count}/>
          <OpenBadge openNow={vendor.open_now}/>
        </div>
        {vendor.vicinity&&<div style={{fontSize:11,color:G.mutedText,marginBottom:6,display:"flex",alignItems:"flex-start",gap:4}}><span style={{fontSize:12}}>📍</span><span style={{lineHeight:1.4}}>{vendor.vicinity}</span></div>}
        {vendor.mira_note&&<div style={{fontSize:11,color:G.purple,fontStyle:"italic",marginBottom:8,lineHeight:1.4}}>✦ {vendor.mira_note}</div>}
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
          {vendor.phone&&<a href={`tel:${vendor.phone}`} style={{fontSize:11,color:G.mid,fontWeight:600,textDecoration:"none",background:G.pale,borderRadius:20,padding:"5px 12px"}}>📞 Call</a>}
          <button onClick={()=>{ tdc.nearme({ query: vendor.name||"venue", pillar:"celebrate", pet }); onOpenModal?.(vendor); }}
            style={{flex:1,background:`linear-gradient(135deg,${G.purple},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            Book via Concierge® →
          </button>
        </div>
      </div>
    </div>
  );
}

function MiraTopPick({ vendor, pet, onOpenModal }) {
  return (
    <div style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,borderRadius:14,padding:"16px 20px",marginBottom:16,display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>✦ Mira's Top Pick for {pet?.name||"your dog"}'s celebration</div>
        <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:4}}>{vendor.name}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginBottom:8}}>{vendor.vicinity}</div>
        <StarRating rating={vendor.rating} count={vendor.review_count}/>
      </div>
      <button onClick={()=>{ tdc.nearme({ query: vendor.name||"venue", pillar:"celebrate", pet }); onOpenModal?.(vendor); }}
        style={{background:G.light,color:G.deep,border:"none",borderRadius:20,padding:"10px 20px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
        Book via Concierge® →
      </button>
    </div>
  );
}

// ── The Doggy Bakery section ───────────────────────────────────
// Shown when bakery pill is selected — never shows competitor bakeries
function DoggyBakerySection({ pet }) {
  const [cakes,    setCakes]    = useState([]);
  const [addons,   setAddons]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab,setActiveTab]= useState("cakes");
  const petName = pet?.name || "your dog";
  const breed   = (pet?.breed || pet?.doggy_soul_answers?.breed || "").toLowerCase().trim();
  const breedDisplay = (pet?.breed||"").split("(")[0].trim();

  useEffect(() => {
    setLoading(true);
    const breedEnc = encodeURIComponent(breed);
    Promise.all([
      // Breed-specific custom cakes first, then generic cakes
      fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=breed-cakes&limit=50&breed=${breedEnc}`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=cakes&limit=50`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/admin/pillar-products?pillar=celebrate&category=celebration_addons&limit=50&breed=${breedEnc}`).then(r=>r.ok?r.json():null),
    ]).then(([breedCakes, genericCakes, addonsData]) => {
      const allCakes = [
        ...(breedCakes?.products||[]),
        ...(genericCakes?.products||[]),
      ];
      // Deduplicate by id
      const seen = new Set();
      const uniqCakes = allCakes.filter(p => { const id=p.id||p._id; if(seen.has(id))return false; seen.add(id); return true; });
      setCakes(uniqCakes);
      setAddons(addonsData?.products||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [breed]);

  const tabs = [
    {id:"cakes",  label:"🎂 Birthday Cakes",     count:cakes.length},
    {id:"addons", label:"🎉 Party Add-ons",       count:addons.length},
  ];
  const displayProducts = activeTab==="cakes" ? cakes : addons;
  const miraCtx = { includeText:"Order" };

  return (
    <div>
      {/* Branded header */}
      <div style={{background:`linear-gradient(135deg,${B.deep},${B.mid})`,borderRadius:14,padding:"20px 22px",marginBottom:20,position:"relative",overflow:"hidden"}}>
        {/* Decorative */}
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:0.06}}>🎂</div>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎂</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>The Doggy Bakery</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)"}}>thedoggybakery.com · TDC's official bakery</div>
            </div>
          </div>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6,margin:"0 0 14px"}}>
            {breedDisplay
              ? `Every cake is dog-safe, handmade, and personalised for ${petName}. ${breedDisplay} breed-specific designs available.`
              : `Every cake is dog-safe, handmade, and personalised for ${petName}. No artificial sweeteners, no xylitol, no compromise.`}
          </p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["🐾 Dog-safe ingredients","✦ Breed-personalised","🎨 Custom designs","🚚 Delivered fresh"].map(tag=>(
              <span key={tag} style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:600,color:"#fff"}}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Mira knows */}
      {breed && (
        <div style={{background:B.pale,border:`1px solid rgba(201,151,58,0.25)`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>✦</div>
          <div style={{fontSize:12,color:B.deep,lineHeight:1.5,fontStyle:"italic"}}>
            "I've shown you {breedDisplay}-specific cakes first — The Doggy Bakery makes custom designs for {petName}'s breed. Every ingredient is cleared for dogs."
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid #F0E8E0",marginBottom:16}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:activeTab===tab.id?`2.5px solid ${B.mid}`:"2.5px solid transparent",color:activeTab===tab.id?B.mid:"#888",fontSize:12,fontWeight:activeTab===tab.id?700:400,cursor:"pointer"}}>
            {tab.label}{tab.count>0&&<span style={{marginLeft:5,fontSize:10,background:activeTab===tab.id?B.pale:"#f0f0f0",borderRadius:20,padding:"1px 6px",color:activeTab===tab.id?B.mid:"#888"}}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Products */}
      {loading ? (
        <div style={{textAlign:"center",padding:"32px 0",color:"#888",fontSize:13}}>
          <div style={{fontSize:28,marginBottom:8}}>🎂</div>Loading {petName}'s bakery…
        </div>
      ) : displayProducts.length === 0 ? (
        <div style={{textAlign:"center",padding:"32px 0",color:"#888",fontSize:13}}>
          <div style={{fontSize:28,marginBottom:8}}>🎂</div>
          <div>Bakery products are being added.</div>
          <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer"
            style={{display:"inline-block",marginTop:12,padding:"9px 20px",borderRadius:20,background:B.pale,border:`1px solid ${B.warm}`,color:B.mid,fontSize:12,fontWeight:600,textDecoration:"none"}}>
            Visit thedoggybakery.com →
          </a>
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:12,marginBottom:16}}>
            {displayProducts.slice(0,12).map(p=>(
              <div key={p.id||p._id}>
                <SharedProductCard product={p} pillar="celebrate" selectedPet={pet} miraContext={miraCtx}/>
              </div>
            ))}
          </div>
          <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer"
            style={{display:"block",textAlign:"center",padding:"12px",borderRadius:10,background:B.pale,border:`1px solid rgba(201,151,58,0.30)`,color:B.mid,fontSize:13,fontWeight:600,textDecoration:"none",marginTop:4}}>
            See all cakes on thedoggybakery.com →
          </a>
        </>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function CelebrateNearMe({ pet, onBook }) {
  const petName = pet?.name || "your dog";

  const [query,         setQuery]         = useState("");
  const [activeType,    setActiveType]    = useState("all");
  const [activeQuery,   setActiveQuery]   = useState(null);
  const [vendors,       setVendors]       = useState([]);
  const [selectedVendor,setSelectedVendor]= useState(null); // NearMeConciergeModal
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [suggestions,   setSuggestions]   = useState([]);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [displayCity,   setDisplayCity]   = useState("");
  const inputRef = useRef(null);

  // If bakery is selected, show TDB section — skip Google Places entirely
  const showBakery = activeType === "bakery";

  const doFetch = useCallback(async (coords, cityName, type) => {
    if (type === "bakery") return; // bakery is handled by DoggyBakerySection
    setLoading(true); setError(null); setVendors([]);
    const typeTerm = VENDOR_TYPES.find(t=>t.id===type)?.term || "pet friendly services";
    try {
      let url;
      if (coords) {
        url = `${API_URL}/api/places/care-providers?lat=${coords.lat}&lng=${coords.lng}&type=${type}&radius=8000`;
      } else {
        const q = `${typeTerm} in ${cityName}`;
        url = `${API_URL}/api/places/care-providers?query=${encodeURIComponent(q)}&type=${type}`;
      }
      const res  = await fetch(url);
      const data = await res.json();
      const list = (data?.places||[]).map(p=>({
        ...p,
        city: cityName||displayCity,
        mira_note: p.mira_note||(p.rating>=4.5?`Highly rated — great choice for ${petName}'s celebration`:null),
      }));
      setVendors(list);
      if (cityName) setDisplayCity(cityName);
    } catch(e) {
      setError("Could not load vendors. Please try again.");
    }
    setLoading(false);
  }, [petName, displayCity]);

  const handleSearch = () => { const q=query.trim(); if(!q)return; setActiveQuery(q); setSuggestions([]); doFetch(null,q,activeType); };
  const handleNearMe = () => {
    if (!navigator.geolocation){setError("Location not available.");return;}
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{setNearMeLoading(false);setDisplayCity("your area");setActiveQuery("near_me");doFetch({lat:pos.coords.latitude,lng:pos.coords.longitude},null,activeType);},
      ()=>{setNearMeLoading(false);setError("Location access denied.");}
    );
  };
  const handleQueryChange = (val) => { setQuery(val); setSuggestions(val.length>=2?ALL_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,5):[]); };
  const handleTypeChange  = (id)  => { setActiveType(id); if(id!=="bakery"&&activeQuery) doFetch(null,displayCity,id); };

  const activeTypeObj = VENDOR_TYPES.find(t=>t.id===activeType)||VENDOR_TYPES[0];
  const topPick       = vendors.find(v=>v.tdc_verified)||(vendors[0]?.rating>=4.5?vendors[0]:null);
  const restList      = topPick ? vendors.filter(v=>v!==topPick) : vendors;

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:4}}>
          {showBakery ? `${petName}'s Birthday Cake — The Doggy Bakery` : `Find ${activeTypeObj.label} near ${petName}`}
        </div>
        <div style={{fontSize:12,color:G.mutedText}}>
          {showBakery
            ? "TDC's official dog-safe bakery. No xylitol, no artificial sweeteners. Custom breed designs."
            : "Pet photographers, venues, groomers, party planners and boutiques — anywhere in the world."}
        </div>
      </div>

      {/* Vendor type pills */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {VENDOR_TYPES.map(type=>(
          <button key={type.id} onClick={()=>handleTypeChange(type.id)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:500,
              border:`1px solid ${activeType===type.id?(type.isTDB?B.warm:G.purple):"rgba(155,89,182,0.25)"}`,
              background:activeType===type.id?(type.isTDB?B.warm:G.purple):type.isTDB?"#FFF8F0":G.pale,
              color:activeType===type.id?"#fff":type.isTDB?B.mid:G.purple,
              cursor:"pointer"}}>
            {type.icon} {type.label}
            {type.isTDB && <span style={{marginLeft:4,fontSize:9,opacity:0.8}}>✦ TDC</span>}
          </button>
        ))}
      </div>

      {/* ── BAKERY: Show The Doggy Bakery section ── */}
      {showBakery && <DoggyBakerySection pet={pet}/>}

      {/* ── VENDORS: Show Google Places search ── */}
      {!showBakery && (
        <>
          <QualityHint type={activeTypeObj.id!=="all"?activeTypeObj:null}/>

          {/* Search */}
          <div style={{position:"relative",marginBottom:10}}>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,position:"relative"}}>
                <input ref={inputRef} value={query} onChange={e=>handleQueryChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                  placeholder={`e.g. ${activeTypeObj.label.toLowerCase()} in Bangalore`}
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid rgba(155,89,182,0.28)`,fontSize:13,outline:"none",color:G.darkText,background:"#fff",boxSizing:"border-box"}}/>
                {suggestions.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#fff",border:`1px solid ${G.pale}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",marginTop:4,overflow:"hidden"}}>
                    {suggestions.map(s=>(
                      <div key={s} onClick={()=>{setQuery(s);setSuggestions([]);doFetch(null,s,activeType);}}
                        style={{padding:"10px 14px",fontSize:13,color:G.darkText,cursor:"pointer",borderBottom:`1px solid ${G.pale}`}}
                        onMouseEnter={e=>e.currentTarget.style.background=G.pale}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        📍 {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleSearch} disabled={loading||!query.trim()}
                style={{padding:"10px 18px",borderRadius:10,background:loading||!query.trim()?G.pale:`linear-gradient(135deg,${G.purple},${G.mid})`,color:loading||!query.trim()?G.mutedText:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {loading?"Finding…":"Search"}
              </button>
            </div>
          </div>

          <button onClick={handleNearMe} disabled={nearMeLoading}
            style={{width:"100%",padding:"10px",borderRadius:10,marginBottom:14,background:nearMeLoading?"#f0f0f0":G.pale,border:`1.5px solid rgba(155,89,182,0.25)`,color:G.purple,fontSize:13,fontWeight:600,cursor:nearMeLoading?"wait":"pointer"}}>
            {nearMeLoading?"Getting your location…":`📍 Find ${activeTypeObj.label} near me`}
          </button>

          {/* Popular cities */}
          {!activeQuery&&(
            <>
              <div style={{fontSize:11,fontWeight:600,color:G.mutedText,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Popular cities</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                {POPULAR_CITIES.map(city=>(
                  <button key={city.name} onClick={()=>{setQuery(city.name);doFetch(null,city.name,activeType);}}
                    style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:500,border:`1px solid rgba(155,89,182,0.22)`,background:"#fff",color:G.darkText,cursor:"pointer"}}>
                    {city.flag} {city.name}
                  </button>
                ))}
              </div>
              {/* Quick-start inspiration cards (not bakery) */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))",gap:12}}>
                {[
                  {icon:"📸",title:"Pet Photographer",sub:"Capture the birthday",type:"photographer"},
                  {icon:"🏡",title:"Dog-Friendly Venue",sub:"The perfect party space",type:"venue"},
                  {icon:"✨",title:"Birthday Groomer",sub:"Looking their best",type:"groomer"},
                  {icon:"🌳",title:"Dog Park",sub:"A day out to celebrate",type:"park"},
                ].map(card=>(
                  <div key={card.title}
                    onClick={()=>{setActiveType(card.type);setQuery(pet?.city||"Bangalore");doFetch(null,pet?.city||"Bangalore",card.type);}}
                    style={{background:`linear-gradient(135deg,${G.deep}ee,${G.mid}ee)`,borderRadius:12,padding:"16px",cursor:"pointer",transition:"transform 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                    <div style={{fontSize:28,marginBottom:8}}>{card.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>{card.title}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.60)"}}>{card.sub}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error&&<div style={{background:"#FFEBEE",border:"1px solid #FFCDD2",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#C62828",marginBottom:14,marginTop:12}}>{error}</div>}

          {loading&&(
            <div style={{textAlign:"center",padding:"40px 0",color:G.mutedText,fontSize:13}}>
              <div style={{fontSize:32,marginBottom:12}}>{activeTypeObj.icon}</div>
              Finding {activeTypeObj.label.toLowerCase()} {displayCity?`in ${displayCity}`:"near you"}…
            </div>
          )}

          {!loading&&vendors.length>0&&(
            <>
              {topPick&&<MiraTopPick vendor={topPick} pet={pet} onOpenModal={setSelectedVendor}/>}
              <div style={{fontSize:12,color:G.mutedText,marginBottom:12}}>
                {vendors.length} {activeTypeObj.label.toLowerCase()} found{displayCity&&displayCity!=="near_me"?` in ${displayCity}`:" near you"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>
                {restList.map((v,i)=><VendorCard key={v.place_id||i} vendor={v} pet={pet} onBook={onBook} onOpenModal={setSelectedVendor}/>)}
              </div>
              <button onClick={()=>{ tdc.nearme({ query: displayCity||"your area", pillar:"celebrate", pet }); bookViaConcierge({ service: `Celebration venue in ${displayCity||"your area"}`, pillar:"celebrate", pet, channel:"celebrate_nearme_city" }); }}
                style={{width:"100%",marginTop:16,padding:"12px",borderRadius:10,background:G.pale,border:`1px solid rgba(155,89,182,0.25)`,color:G.purple,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                Ask Concierge® for more options →
              </button>
            </>
          )}

          {!loading&&activeQuery&&vendors.length===0&&!error&&(
            <div style={{textAlign:"center",padding:"40px 0",color:"#888",fontSize:13}}>
              <div style={{fontSize:32,marginBottom:12}}>🔍</div>
              No {activeTypeObj.label.toLowerCase()} found in {displayCity||activeQuery}.<br/>
              <div style={{fontSize:12,color:G.mutedText,margin:"8px 0 14px",lineHeight:1.5}}>
                {activeTypeObj.id==="planner"||activeTypeObj.id==="photographer"
                  ?"Many work through Instagram rather than Google — Concierge® can find them."
                  :"Concierge® can source options in any city."}
              </div>
              <button onClick={()=>{ tdc.nearme({ query: displayCity||activeQuery, pillar:"celebrate", pet }); bookViaConcierge({ service: `Celebration venue in ${displayCity||activeQuery}`, pillar:"celebrate", pet, channel:"celebrate_nearme_search" }); }}
                style={{padding:"9px 20px",borderRadius:20,background:G.pale,border:`1px solid ${G.purple}`,color:G.purple,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Ask Concierge® to find options →
              </button>
            </div>
          )}
        </>
      )}

      {/* NearMe Booking Modal — venue pre-filled */}
      <NearMeConciergeModal
        isOpen={!!selectedVendor}
        venue={selectedVendor}
        pet={pet}
        pillar="celebrate"
        onClose={() => setSelectedVendor(null)}
      />
    </div>

  );
}
