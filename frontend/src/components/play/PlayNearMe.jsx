/**
 * PlayNearMe.jsx — /play pillar
 * The Doggy Company
 *
 * Search dog-friendly play spots ANYWHERE IN THE WORLD.
 * Parks, beaches, trails, dog cafes, agility centres, swimming spots.
 * Mirrors CareNearMe.jsx exactly — same pattern, same API.
 *
 * HOW IT WORKS:
 *   1. User types any city → "dog parks in Bangalore"
 *   2. OR taps "Near me" → geolocation → nearbySearch
 *   3. Results → cards with photo, rating, open/closed, features
 *   4. "Plan via Concierge®" → PlayConciergeModal pre-filled with venue + city
 *
 * BACKEND ENDPOINT:
 *   GET /api/places/play-spots
 *   Params:
 *     query  — full text e.g. "dog park in Bangalore"
 *     lat/lng — coordinates (nearby search mode)
 *     type   — park | beach | trail | cafe | agility | swimming | all
 *     radius — metres (nearby default 3000 — play spots are local)
 *   Returns: {
 *     places: [{
 *       place_id, name, rating, user_ratings_total, vicinity,
 *       formatted_address, photo_url, open_now, type,
 *       tdc_listed, mira_note, features (off_lead, water, shade, etc.)
 *     }],
 *     location_name
 *   }
 *
 * USAGE in PlaySoulPage.jsx:
 *   import PlayNearMe from "../components/play/PlayNearMe";
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
 *
 *   // Add tab to PlayHero tab bar:
 *   { id:"near_me", label:"📍 Near Me" }
 *
 *   // Render when tab active:
 *   {activeTab === "near_me" && (
 *     <PlayNearMe
 *       pet={petData}
 *       onBook={(spot, city) => {
 *         setBookingVenue(spot?.name || null);
 *         setBookingOpen(true);
 *       }}
 *     />
 *   )}
 */
import NearMeConciergeModal from '../common/NearMeConciergeModal';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "../../utils/api";

// ─── Colour system — vibrant green + orange (mirrors PlaySoulPage) ──
const G = {
  deep:      "#7B2D00",
  mid:       "#7B3F00",
  orange:    "#E76F51",
  light:     "#FFAD9B",
  pale:      "#FFF0EA",
  cream:     "#FFF8F5",
  orange:    "#E76F51",
  yellow:    "#FFB703",
  darkText:  "#7B2D00",
  mutedText: "#8B4513",
};

// ─── Play spot types ──────────────────────────────────────────
const PLAY_TYPES = [
  { id:"all",     label:"All",            icon:"🌳", term:"dog friendly"              },
  { id:"park",    label:"Dog Parks",      icon:"🌳", term:"dog park off leash"        },
  { id:"beach",   label:"Beaches",        icon:"🏖️", term:"dog friendly beach"        },
  { id:"trail",   label:"Trails & Hikes", icon:"🥾", term:"dog friendly trail hiking" },
  { id:"cafe",    label:"Dog Cafes",      icon:"☕", term:"dog cafe pet friendly cafe" },
  { id:"agility", label:"Agility",        icon:"🏃", term:"dog agility centre training"},
  { id:"swimming",label:"Swimming",       icon:"🏊", term:"dog swimming pool lake"    },
  { id:"resort",  label:"Dog Resorts",    icon:"🏡", term:"dog resort pet friendly"   },
];

// ─── Popular cities ───────────────────────────────────────────
const POPULAR_CITIES = [
  { name:"Mumbai",     flag:"🇮🇳" },
  { name:"Delhi",      flag:"🇮🇳" },
  { name:"Bangalore",  flag:"🇮🇳" },
  { name:"Pune",       flag:"🇮🇳" },
  { name:"Chennai",    flag:"🇮🇳" },
  { name:"Hyderabad",  flag:"🇮🇳" },
  { name:"Goa",        flag:"🇮🇳" },
  { name:"Kolkata",    flag:"🇮🇳" },
  { name:"London",     flag:"🇬🇧" },
  { name:"Dubai",      flag:"🇦🇪" },
  { name:"Singapore",  flag:"🇸🇬" },
  { name:"New York",   flag:"🇺🇸" },
  { name:"Sydney",     flag:"🇦🇺" },
  { name:"Bangkok",    flag:"🇹🇭" },
  { name:"Bali",       flag:"🇮🇩" },
];

const ALL_SUGGESTIONS = [
  "Mumbai","Delhi","Bangalore","Pune","Chennai","Hyderabad","Goa","Kolkata",
  "Ahmedabad","Jaipur","Noida","Gurgaon","Chandigarh","Kochi","Coorg",
  "Manali","Ooty","Pondicherry","Lonavala","Mussoorie",
  "London","Dubai","Singapore","New York","Sydney","Bangkok",
  "Bali","Paris","Amsterdam","Tokyo","Toronto","Melbourne","Cape Town",
];

// ─── Feature chips ────────────────────────────────────────────
const FEATURE_ICONS = {
  off_lead:     { icon:"🐾", label:"Off-lead area" },
  water:        { icon:"💧", label:"Water available" },
  shade:        { icon:"🌲", label:"Good shade" },
  beach_access: { icon:"🏖️", label:"Beach access" },
  parking:      { icon:"🚗", label:"Parking" },
  cafe:         { icon:"☕", label:"Café nearby" },
  fenced:       { icon:"🔒", label:"Fenced area" },
  large:        { icon:"📐", label:"Large space" },
};

function FeatureChips({ features }) {
  if (!features || features.length === 0) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
      {features.slice(0,4).map(f => {
        const feat = FEATURE_ICONS[f] || { icon:"✓", label:f };
        return (
          <span key={f} style={{ fontSize:10, color:G.mid, background:G.pale, borderRadius:20, padding:"2px 8px", display:"inline-flex", alignItems:"center", gap:3 }}>
            <span>{feat.icon}</span>{feat.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────
function StarRating({ rating, reviewCount }) {
  if (!rating) return null;
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ color:"#F59E0B", fontSize:13 }}>{"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}</span>
      <span style={{ color:G.mutedText, fontSize:13 }}>{rating.toFixed(1)}</span>
      {reviewCount && <span style={{ color:"#aaa", fontSize:10 }}>({reviewCount})</span>}
    </span>
  );
}

// ─── Open badge ───────────────────────────────────────────────
function OpenBadge({ openNow }) {
  if (openNow === undefined || openNow === null) return null;
  return (
    <span style={{ fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 8px", background:openNow?"#E8F5E9":"#FFEBEE", color:openNow?"#2E7D32":"#C62828" }}>
      {openNow ? "✓ Open now" : "Closed"}
    </span>
  );
}

// ─── Mira's Top Pick card (elevated) ─────────────────────────
function MiraTopPick({ spot, pet, onBook }) {
  const petName = pet?.name || "your dog";
  return (
    <div style={{ background:`linear-gradient(135deg,${G.pale},${G.cream})`, border:`2px solid ${G.orange}`, borderRadius:16, padding:20, marginBottom:20, display:"flex", alignItems:"flex-start", gap:16 }}>
      <div style={{ width:88, height:88, borderRadius:12, overflow:"hidden", flexShrink:0, background:G.cream }}>
        {spot.photo_url
          ? <img src={spot.photo_url} alt={spot.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, background:`linear-gradient(135deg,${G.pale},${G.light})` }}>
              {PLAY_TYPES.find(t=>t.id===spot.type)?.icon||"🌳"}
            </div>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight:700, background:`linear-gradient(135deg,${G.orange},${G.mid})`, color:"#fff", borderRadius:20, padding:"3px 10px" }}>✦ Mira's Top Pick</span>
          {spot.tdc_listed && <span style={{ fontSize:9, fontWeight:700, background:"#FFF8E1", color:"#C9973A", borderRadius:8, padding:"2px 8px" }}>✦ TDC Listed</span>}
          <OpenBadge openNow={spot.open_now} />
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:G.darkText, marginBottom:4 }}>{spot.name}</div>
        <div style={{ fontSize:13, color:G.mutedText, marginBottom:6 }}>📍 {spot.vicinity||spot.formatted_address}</div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <StarRating rating={spot.rating} reviewCount={spot.user_ratings_total} />
        </div>
        <FeatureChips features={spot.features} />
        {spot.mira_note && (
          <p style={{ fontSize:13, color:G.mid, fontStyle:"italic", margin:"0 0 10px", lineHeight:1.5 }}>"{spot.mira_note}"</p>
        )}
        <button onClick={() => onBook?.(spot, spot.city)}
          style={{ background:`linear-gradient(135deg,${G.orange},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          Plan a visit for {petName} →
        </button>
      </div>
    </div>
  );
}

// ─── Individual spot card ─────────────────────────────────────
function SpotCard({ spot, pet, onBook }) {
  const [imgErr, setImgErr] = useState(false);
  const petName = pet?.name || "your dog";
  const typeConfig = PLAY_TYPES.find(t=>t.id===spot.type) || PLAY_TYPES[0];

  return (
    <div style={{ background:"#fff", border:`1px solid rgba(231,111,81,0.15)`, borderRadius:14, overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(123,45,0,0.12)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

      {/* Photo */}
      <div style={{ height:160, overflow:"hidden", position:"relative", background:G.cream }}>
        {spot.photo_url && !imgErr
          ? <img src={spot.photo_url} alt={spot.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>setImgErr(true)} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.pale},${G.light})`, fontSize:44 }}>
              {typeConfig.icon}
            </div>}

        {/* Type badge */}
        <div style={{ position:"absolute", top:10, left:10, background:G.orange, color:G.deep, fontSize:9, fontWeight:700, borderRadius:20, padding:"3px 8px" }}>
          {typeConfig.icon} {typeConfig.label}
        </div>

        {/* TDC listed */}
        {spot.tdc_listed && (
          <div style={{ position:"absolute", top:10, right:10, background:G.yellow, color:G.deep, fontSize:9, fontWeight:700, borderRadius:20, padding:"3px 8px" }}>
            ✦ TDC Listed
          </div>
        )}

        {/* Open/closed */}
        {spot.open_now !== undefined && (
          <div style={{ position:"absolute", bottom:10, right:10 }}>
            <OpenBadge openNow={spot.open_now} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"12px 14px 16px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4, lineHeight:1.3 }}>{spot.name}</div>
        <div style={{ fontSize:13, color:G.mutedText, marginBottom:6, lineHeight:1.4 }}>📍 {spot.vicinity||spot.formatted_address||"—"}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <StarRating rating={spot.rating} reviewCount={spot.user_ratings_total} />
        </div>
        <FeatureChips features={spot.features} />
        {spot.mira_note && (
          <div style={{ fontSize:13, color:G.mid, fontStyle:"italic", marginBottom:10, padding:"6px 10px", background:G.pale, borderRadius:8, lineHeight:1.4 }}>
            ✦ {spot.mira_note}
          </div>
        )}
        <button onClick={() => onBook?.(spot, spot.city)}
          style={{ width:"100%", background:`linear-gradient(135deg,${G.orange},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"9px", fontSize:13, fontWeight:700, cursor:"pointer", transition:"opacity 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Plan a visit →
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid rgba(231,111,81,0.10)` }}>
      <div style={{ height:160, background:`linear-gradient(90deg,${G.cream} 25%,${G.pale} 50%,${G.cream} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      <div style={{ padding:"12px 14px" }}>
        <div style={{ height:14, background:G.cream, borderRadius:8, marginBottom:8, width:"70%" }} />
        <div style={{ height:10, background:G.cream, borderRadius:8, marginBottom:8, width:"50%" }} />
        <div style={{ height:10, background:G.cream, borderRadius:8, marginBottom:12, width:"35%" }} />
        <div style={{ height:34, background:G.pale, borderRadius:10 }} />
      </div>
</div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PlayNearMe({ pet, onBook }) {
  const [searchInput, setSearchInput]         = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [activeQuery, setActiveQuery]         = useState("");
  const [activeType, setActiveType]           = useState("all");
  const [spots, setSpots]                     = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [resultLabel, setResultLabel]         = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nearMeLoading, setNearMeLoading]     = useState(false);
  const [userCoords, setUserCoords]           = useState(null);
  const inputRef = useRef(null);

  const petCity  = pet?.city || pet?.doggy_soul_answers?.city || null;
  const petName  = pet?.name || "your dog";
  const energy   = pet?.doggy_soul_answers?.energy_level || null;
  const size     = pet?.doggy_soul_answers?.size || pet?.size || null;
  const senior   = parseInt(pet?.doggy_soul_answers?.age_years||"0") >= 7;

  // Pre-fill with pet's city
  useEffect(() => {
    if (petCity) { setSearchInput(petCity); setActiveQuery(petCity); }
  }, [petCity]);

  // ── Fetch spots ─────────────────────────────────────────────
  const doFetch = useCallback(async (query, coords, type) => {
    if (!query && !coords) return;
    setLoading(true); setError(null); setSpots([]);
    try {
      const params = new URLSearchParams();
      params.set("type", type || "all");
      if (coords) {
        params.set("lat", coords.lat);
        params.set("lng", coords.lng);
        params.set("radius", "3000");
      } else {
        const typeTerm = PLAY_TYPES.find(t=>t.id===(type||"all"))?.term || "dog friendly";
        params.set("query", `${typeTerm} in ${query}`);
        params.set("city", query);
      }
      if (energy) params.set("energy", energy);
      if (size)   params.set("size", size);

      const res = await fetch(`${API_URL}/api/places/play-spots?${params.toString()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSpots(data.places || []);
      setResultLabel(data.location_name || query || "your area");
    } catch (err) {
      console.error("[PlayNearMe]", err);
      setError("Couldn't load results. Try a different city or let Concierge® help.");
    } finally {
      setLoading(false);
    }
  }, [energy, size]);

  // Re-fetch when type filter changes
  useEffect(() => {
    if (!activeQuery) return;
    if (activeQuery === "near_me") doFetch(null, userCoords, activeType);
    else doFetch(activeQuery, null, activeType);
  }, [activeType]);

  // ── Near me ────────────────────────────────────────────────
  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat:pos.coords.latitude, lng:pos.coords.longitude };
        setUserCoords(c); setSearchInput("Near me"); setActiveQuery("near_me");
        setNearMeLoading(false); doFetch(null, c, activeType);
      },
      () => setNearMeLoading(false),
      { timeout:8000 }
    );
  };

  // ── Search ─────────────────────────────────────────────────
  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setUserCoords(null); setActiveQuery(q); setShowSuggestions(false);
    doFetch(q, null, activeType);
  };

  const handleCity = city => {
    setSearchInput(city); setActiveQuery(city); setShowSuggestions(false);
    doFetch(city, null, activeType);
  };

  // ── Autocomplete ───────────────────────────────────────────
  const suggestions = searchInput.length > 1
    ? ALL_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchInput.toLowerCase()) && s.toLowerCase() !== searchInput.toLowerCase())
    : [];

  // ── Google Maps link ───────────────────────────────────────
  const openInMaps = () => {
    const term = PLAY_TYPES.find(t=>t.id===activeType)?.term || "dog park";
    const dest = activeQuery === "near_me" ? "near me" : activeQuery;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${term} ${dest}`)}`, "_blank");
  };

  // Mira's top pick — TDC listed first, then highest rated
  const topPick  = spots.find(p=>p.tdc_listed) || (spots[0]?.rating >= 4.5 ? spots[0] : null);
  const restList = topPick ? spots.filter(p=>p!==topPick) : spots;
  const displayCity = activeQuery === "near_me" ? "your area" : resultLabel || activeQuery;

  // Energy-aware tip
  const energyTip = energy === "high" || energy === "very high"
    ? `${petName} has high energy — off-lead parks and long trails first.`
    : senior
    ? `${petName} is a senior — gentle parks with good shade and short distances.`
    : size === "small" || size === "toy"
    ? `Showing small-dog-friendly spots for ${petName} first.`
    : null;

  return (
    <div style={{ marginBottom:32 }} data-testid="play-near-me">
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .play-input:focus{outline:none!important;border-color:#E76F51!important;box-shadow:0 0 0 3px rgba(231,111,81,0.15)!important}
        .play-pills::-webkit-scrollbar,.play-type-strip::-webkit-scrollbar{display:none}
      `}</style>

      {/* Section header */}
      <div style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:"0 0 4px", fontFamily:"Georgia,serif" }}>
          Play spots for <span style={{ color:G.orange }}>{petName}</span> — anywhere in the world
        </h3>
        <p style={{ fontSize:12, color:"#888", margin:0, lineHeight:1.5 }}>
          Dog parks, beaches, trails, cafes, agility centres and swimming spots. Search any city.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>

          {/* Input + autocomplete */}
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔍</span>
            <input
              ref={inputRef}
              className="play-input"
              type="text"
              value={searchInput}
              onChange={e=>{ setSearchInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e=>{ if(e.key==="Enter")handleSearch(); if(e.key==="Escape")setShowSuggestions(false); }}
              onFocus={()=>setShowSuggestions(true)}
              onBlur={()=>setTimeout(()=>setShowSuggestions(false),150)}
              placeholder="Bangalore, Goa, London, Bali — any city…"
              style={{ width:"100%", height:"100%", borderRadius:12, border:`1.5px solid rgba(231,111,81,0.28)`, padding:"13px 14px 13px 42px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box", background:"#fff", fontFamily:"inherit" }}
            />

            {/* Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#fff", border:`1px solid rgba(231,111,81,0.20)`, borderRadius:12, boxShadow:"0 8px 32px rgba(123,45,0,0.12)", zIndex:200, overflow:"hidden", maxHeight:220, overflowY:"auto" }}>
                {suggestions.slice(0,7).map(s => (
                  <div key={s} onMouseDown={() => handleCity(s)}
                    style={{ padding:"10px 16px", fontSize:13, color:G.darkText, cursor:"pointer", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid rgba(231,111,81,0.06)` }}
                    onMouseEnter={e=>e.currentTarget.style.background=G.cream}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>📍</span>
                    <span style={{ flex:1 }}>{s}</span>
                    <span style={{ fontSize:10, color:"#aaa" }}>
                      {["Mumbai","Delhi","Bangalore","Pune","Chennai","Hyderabad","Goa","Kolkata","Ahmedabad","Jaipur","Noida","Gurgaon","Chandigarh","Kochi","Coorg","Manali","Ooty","Pondicherry","Lonavala","Mussoorie"].includes(s) ? "India" : "International"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button onClick={handleSearch}
            style={{ flexShrink:0, background:`linear-gradient(135deg,${G.orange},${G.mid})`, color:"#fff", border:"none", borderRadius:12, padding:"0 22px", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            Search
          </button>

          {/* Near me */}
          <button onClick={handleNearMe} disabled={nearMeLoading}
            style={{ flexShrink:0, background:"#fff", border:`1.5px solid rgba(231,111,81,0.28)`, borderRadius:12, padding:"0 14px", fontSize:13, fontWeight:600, color:G.mid, cursor:nearMeLoading?"wait":"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
            {nearMeLoading
              ? <div style={{ width:13, height:13, border:`2px solid ${G.pale}`, borderTopColor:G.orange, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
              : "📍"} Near me
          </button>
        </div>

        {/* Popular city pills */}
        <div style={{ display:"flex", gap:6, marginTop:10, overflowX:"auto", scrollbarWidth:"none" }} className="play-pills">
          <span style={{ fontSize:11, color:"#aaa", whiteSpace:"nowrap", alignSelf:"center", flexShrink:0 }}>Popular:</span>
          {POPULAR_CITIES.slice(0,10).map(city => (
            <button key={city.name} onClick={() => handleCity(city.name)}
              style={{ flexShrink:0, fontSize:11, fontWeight:activeQuery===city.name?700:400, color:activeQuery===city.name?G.deep:"#555", background:activeQuery===city.name?G.orange:"rgba(231,111,81,0.07)", border:`1px solid ${activeQuery===city.name?"#E76F51":"rgba(231,111,81,0.18)"}`, borderRadius:20, padding:"4px 11px", cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:11 }}>{city.flag}</span>{city.name}
            </button>
          ))}
        </div>

        {/* Energy / size aware tip */}
        {energyTip && activeQuery && (
          <div style={{ marginTop:8, fontSize:11, color:G.mid, display:"flex", alignItems:"center", gap:5 }}>
            <span>{energy==="high"||energy==="very high"?"⚡":senior?"🌸":"🐾"}</span>
            <span>{energyTip}</span>
          </div>
        )}
      </div>

      {/* Type filter pills — wrap on mobile, no horizontal scroll */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }} className="play-type-strip">
        {PLAY_TYPES.map(type => {
          const sel = activeType === type.id;
          return (
    <button key={type.id} onClick={() => setActiveType(type.id)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:9999, border:`1.5px solid ${sel?"#E76F51":"rgba(231,111,81,0.22)"}`, background:sel?"#E76F51":"#fff", color:sel?G.deep:G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
              <span style={{ fontSize:14 }}>{type.icon}</span>{type.label}
            </button>
          );
        })}
      </div>

      {/* ── Result states ───────────────────────────────────── */}

      {/* Empty */}
      {!activeQuery && !loading && (
        <div style={{ textAlign:"center", padding:"48px 24px", background:`linear-gradient(135deg,${G.pale},${G.cream})`, borderRadius:16, border:`1px solid rgba(231,111,81,0.12)` }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🌍</div>
          <div style={{ fontSize:18, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>
            Where does {petName} want to play?
          </div>
          <div style={{ fontSize:14, color:G.mutedText, marginBottom:24, lineHeight:1.7 }}>
            Search any city — parks, beaches, dog cafes and agility centres.<br/>
            Anywhere in the world. Our Concierge® plans the visit.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
            {["Bangalore 🇮🇳","Mumbai 🇮🇳","Goa 🇮🇳","London 🇬🇧","Bali 🇮🇩","Sydney 🇦🇺"].map(c=>(
              <button key={c} onClick={()=>handleCity(c.split(" ")[0])}
                style={{ background:G.orange, color:G.deep, border:"none", borderRadius:20, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <>
          <div style={{ fontSize:12, color:G.mutedText, marginBottom:14 }}>
            Finding {PLAY_TYPES.find(t=>t.id===activeType)?.label.toLowerCase()||"play spots"} in {activeQuery==="near_me"?"your area":activeQuery}…
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:16 }}>
            {[1,2,3,4].map(i=><SkeletonCard key={i} />)}
          </div>
        </>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ textAlign:"center", padding:"32px 20px", background:"#FFF8F0", borderRadius:14, border:"1px solid #FFCC99", marginBottom:16 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
          <div style={{ fontSize:14, color:G.darkText, fontWeight:700, marginBottom:6 }}>Couldn't load results</div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:16 }}>{error}</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>doFetch(activeQuery==="near_me"?null:activeQuery,activeQuery==="near_me"?userCoords:null,activeType)} style={{ background:G.orange,color:G.deep,border:"none",borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Try again</button>
            <button onClick={()=>{ tdc.nearme({ query: "venue", pillar:"play", pet }); bookViaConcierge({ service: "venue", pillar:"play", pet, channel:"play_nearme" }); onBook?.(null, activeQuery==="near_me"?"your area":activeQuery)}}   style={{ background:G.pale,color:G.mid,border:`1px solid ${G.light}`,borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Ask Concierge®</button>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && !error && activeQuery && spots.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:16, border:`1px solid rgba(231,111,81,0.12)`, marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:6 }}>
            No {PLAY_TYPES.find(t=>t.id===activeType && t.id!=="all")?.label.toLowerCase()||"play spots"} found in {activeQuery==="near_me"?"your area":activeQuery}
          </div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:20, lineHeight:1.6 }}>
            Google doesn't have full coverage here — but our Concierge® researches personal recommendations too.
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setActiveType("all")} style={{ background:G.orange,color:G.deep,border:"none",borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Try all types</button>
            <button onClick={()=>{ tdc.nearme({ query: "venue", pillar:"play", pet }); bookViaConcierge({ service: "venue", pillar:"play", pet, channel:"play_nearme" }); onBook?.(null, activeQuery==="near_me"?"your area":activeQuery)}}   style={{ background:G.pale,color:G.mid,border:`1px solid ${G.light}`,borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Ask Concierge®</button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && spots.length > 0 && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:12, color:G.mutedText }}>
              <strong style={{ color:G.orange }}>{spots.length}</strong>{" "}
              {PLAY_TYPES.find(t=>t.id===activeType)?.label.toLowerCase()||"play spots"} in{" "}
              <strong style={{ color:G.darkText }}>{displayCity}</strong>
              {spots.filter(p=>p.tdc_listed).length > 0 && (
                <span style={{ marginLeft:8, color:G.yellow, fontWeight:600 }}>
                  · {spots.filter(p=>p.tdc_listed).length} TDC listed
                </span>
              )}
            </div>
            <button onClick={openInMaps} style={{ background:"#fff", border:`1px solid rgba(231,111,81,0.22)`, borderRadius:20, padding:"5px 14px", fontSize:11, fontWeight:600, color:G.mid, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              🗺️ Open in Google Maps
            </button>
          </div>

          {/* Top pick */}
          {topPick && <MiraTopPick spot={topPick} pet={pet} onBook={onBook} />}

          {/* Rest */}
          {restList.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:16, marginBottom:20 }}>
              {restList.map((spot,i) => <SpotCard key={spot.place_id||i} spot={spot} pet={pet} onBook={onBook} />)}
            </div>
          )}
        </>
      )}

      {/* Concierge® CTA */}
      {(spots.length > 0 || error) && (
        <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:16, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginTop:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>
              Want Mira to plan {petName}'s visit?
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.60)", lineHeight:1.6 }}>
              Our Concierge® researches the best route, checks opening times, packs the right kit, and coordinates the whole outing — you just show up.
            </div>
          </div>
          <button onClick={() => onBook?.(null, displayCity)}
            style={{ flexShrink:0, background:`linear-gradient(135deg,${G.orange},${G.light})`, color:G.deep, border:"none", borderRadius:12, padding:"11px 22px", fontSize:13, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
            Plan via Concierge® →
          </button>
        </div>
      )}
    </div>  );
}
