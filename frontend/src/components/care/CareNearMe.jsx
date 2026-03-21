/**
import NearMeConciergeModal from '../common/NearMeConciergeModal';
 * CareNearMe.jsx — /care pillar
 * The Doggy Company
 *
 * Search groomers, vets, pet stores & other care providers
 * ANYWHERE IN THE WORLD using Google Places textSearch API.
 *
 * Mirrors PetFriendlyStays.jsx exactly — same pattern, same API,
 * different search terms (groomers/vets vs hotels/resorts).
 *
 * HOW IT WORKS:
 *   1. User types any city → "pet groomers in Mumbai"
 *   2. OR taps "Near me" → geolocation → nearbySearch
 *   3. Results → cards with photo, rating, open/closed, distance
 *   4. "Book via Concierge" → CareConciergeModal pre-filled with provider + city
 *
 * BACKEND ENDPOINT:
 *   GET /api/places/care-providers
 *   Params:
 *     query  — full text e.g. "dog groomers in Mumbai"  (text search mode)
 *     lat/lng — coordinates                              (nearby search mode)
 *     type   — groomer | vet | petstore | trainer | daycare | all
 *     radius — metres (nearby mode, default 5000)
 *   Returns: {
 *     places: [{
 *       place_id, name, rating, vicinity, formatted_address,
 *       photo_url, open_now, phone, website, price_level,
 *       type, tdc_verified, mira_note
 *     }],
 *     location_name
 *   }
 *
 * USAGE in CareSoulPage.jsx:
 *   import CareNearMe from "../components/care/CareNearMe";
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
 *
 *   // Add tab to CareTabBar:
 *   { id:"near_me", label:"📍 Near Me" }
 *
 *   // Render when tab is active:
 *   {activeTab === "near_me" && (
 *     <CareNearMe
 *       pet={petData}
 *       onBook={(provider, city) => {
 *         setBookingService(provider?.name || null);
 *         setBookingOpen(true);
 *       }}
 *     />
 *   )}
 *
 * WIRING NOTE:
 *   "Book via Concierge" → onBook(provider, city)
 *   In CareSoulPage, opens ServiceBookingModal or CareConciergeModal
 *   pre-filled with provider name and service type.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "../../utils/api";

// ─── Colour system — sage green (mirrors CareSoulPage) ────────
const G = {
  deep:      "#1A3C34",
  mid:       "#2D6A4F",
  sage:      "#52B788",
  light:     "#95D5B2",
  pale:      "#D8F3DC",
  cream:     "#F0FFF4",
  amber:     "#C9973A",
  darkText:  "#1A3C34",
  mutedText: "#4A7C6A",
};

// ─── Care provider types ──────────────────────────────────────
const CARE_TYPES = [
  { id:"all",      label:"All",           icon:"🐾", term:"pet care"                  },
  { id:"groomer",  label:"Groomers",      icon:"✂️",  term:"dog groomer"               },
  { id:"vet",      label:"Vets",          icon:"🏥",  term:"veterinary clinic"         },
  { id:"petstore", label:"Pet Stores",    icon:"🛒",  term:"pet store"                 },
  { id:"trainer",  label:"Trainers",      icon:"🎯",  term:"dog trainer"               },
  { id:"daycare",  label:"Daycare",       icon:"🏡",  term:"dog daycare"               },
  { id:"salon",    label:"Pet Salon",     icon:"💅",  term:"pet salon"                 },
  { id:"pharmacy", label:"Pet Pharmacy",  icon:"💊",  term:"pet pharmacy veterinary"   },
];

// Popular cities — India first then international
const POPULAR_CITIES = [
  { name:"Mumbai",     flag:"🇮🇳" },
  { name:"Delhi",      flag:"🇮🇳" },
  { name:"Bangalore",  flag:"🇮🇳" },
  { name:"Pune",       flag:"🇮🇳" },
  { name:"Chennai",    flag:"🇮🇳" },
  { name:"Hyderabad",  flag:"🇮🇳" },
  { name:"Kolkata",    flag:"🇮🇳" },
  { name:"Ahmedabad",  flag:"🇮🇳" },
  { name:"Gurgaon",    flag:"🇮🇳" },
  { name:"Noida",      flag:"🇮🇳" },
  { name:"London",     flag:"🇬🇧" },
  { name:"Dubai",      flag:"🇦🇪" },
  { name:"Singapore",  flag:"🇸🇬" },
  { name:"New York",   flag:"🇺🇸" },
  { name:"Sydney",     flag:"🇦🇺" },
];

const ALL_SUGGESTIONS = [
  "Mumbai","Delhi","Bangalore","Pune","Chennai","Hyderabad","Kolkata","Ahmedabad",
  "Gurgaon","Noida","Jaipur","Surat","Lucknow","Kochi","Chandigarh","Bhopal",
  "Indore","Nagpur","Coimbatore","Vadodara","Mysore","Goa",
  "London","Dubai","Singapore","New York","Sydney","Toronto","Melbourne",
  "Paris","Amsterdam","Bangkok","Hong Kong","Kuala Lumpur","Tokyo",
];

// ─── Star rating ──────────────────────────────────────────────
function StarRating({ rating, reviewCount }) {
  if (!rating) return null;
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ color:"#F59E0B", fontSize:11 }}>{"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}</span>
      <span style={{ color:G.mutedText, fontSize:11 }}>{rating.toFixed(1)}</span>
      {reviewCount && <span style={{ color:"#aaa", fontSize:10 }}>({reviewCount})</span>}
    </span>
  );
}

// ─── Open/closed badge ────────────────────────────────────────
function OpenBadge({ openNow }) {
  if (openNow === undefined || openNow === null) return null;
  return (
    <span style={{ fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 8px", background:openNow?"#E8F5E9":"#FFEBEE", color:openNow?"#2E7D32":"#C62828" }}>
      {openNow ? "✓ Open now" : "Closed"}
    </span>
  );
}

// ─── TDC verified badge ───────────────────────────────────────
function TDCBadge() {
  return (
    <span style={{ fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 8px", background:"#FFF8E1", color:"#C9973A" }}>
      ✦ TDC Verified
    </span>
  );
}

// ─── Provider type label ──────────────────────────────────────
function TypeBadge({ type }) {
  const t = CARE_TYPES.find(c=>c.id===type)||CARE_TYPES[0];
  return (
    <span style={{ position:"absolute", top:10, left:10, background:G.sage, color:G.deep, fontSize:9, fontWeight:700, borderRadius:20, padding:"3px 8px" }}>
      {t.icon} {t.label}
    </span>
  );
}

// ─── Individual provider card ─────────────────────────────────
function ProviderCard({ provider, pet, onBook }) {
  const [imgErr, setImgErr] = useState(false);
  const petName = pet?.name || "your dog";

  return (
    <div
      style={{ background:"#fff", border:`1px solid rgba(82,183,136,0.15)`, borderRadius:14, overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s", cursor:"default" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(27,67,50,0.12)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

      {/* Photo */}
      <div style={{ height:160, overflow:"hidden", position:"relative", background:G.cream }}>
        {provider.photo_url && !imgErr
          ? <img src={provider.photo_url} alt={provider.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>setImgErr(true)} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.pale},${G.light})`, fontSize:44 }}>
              {CARE_TYPES.find(t=>t.id===provider.type)?.icon||"🐾"}
            </div>}
        <TypeBadge type={provider.type} />
        {provider.tdc_verified && (
          <div style={{ position:"absolute", top:10, right:10 }}><TDCBadge /></div>
        )}
        {/* Open/closed overlay */}
        {provider.open_now !== undefined && (
          <div style={{ position:"absolute", bottom:10, right:10 }}><OpenBadge openNow={provider.open_now} /></div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"12px 14px 16px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4, lineHeight:1.3 }}>
          {provider.name}
        </div>

        <div style={{ fontSize:11, color:G.mutedText, marginBottom:6, lineHeight:1.4 }}>
          📍 {provider.vicinity || provider.formatted_address || "—"}
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <StarRating rating={provider.rating} reviewCount={provider.user_ratings_total} />
          {provider.price_level && (
            <span style={{ fontSize:11, color:G.mutedText }}>
              {"₹".repeat(Math.min(provider.price_level,4))}
            </span>
          )}
        </div>

        {/* Phone if available */}
        {provider.phone && (
          <div style={{ fontSize:11, color:G.mid, marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
            <span>📞</span>
            <a href={`tel:${provider.phone}`} style={{ color:G.mid, textDecoration:"none" }}>{provider.phone}</a>
          </div>
        )}

        {/* Mira note */}
        {provider.mira_note && (
          <div style={{ fontSize:11, color:G.mid, fontStyle:"italic", marginBottom:10, padding:"6px 10px", background:G.pale, borderRadius:8, lineHeight:1.4 }}>
            ✦ {provider.mira_note}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => onBook?.(provider, provider.city)}
            style={{ flex:2, background:`linear-gradient(135deg,${G.sage},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer", transition:"opacity 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            Book via Concierge →
          </button>
          {provider.website && (
            <a href={provider.website} target="_blank" rel="noopener noreferrer"
              style={{ flex:1, background:G.pale, color:G.mid, border:`1px solid ${G.light}`, borderRadius:10, padding:"8px", fontSize:11, fontWeight:600, cursor:"pointer", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loading card ────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid rgba(82,183,136,0.10)` }}>
      <div style={{ height:160, background:`linear-gradient(90deg,${G.cream} 25%,${G.pale} 50%,${G.cream} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      <div style={{ padding:"12px 14px" }}>
        <div style={{ height:14, background:G.cream, borderRadius:8, marginBottom:8, width:"75%" }} />
        <div style={{ height:10, background:G.cream, borderRadius:8, marginBottom:8, width:"55%" }} />
        <div style={{ height:10, background:G.cream, borderRadius:8, marginBottom:12, width:"40%" }} />
        <div style={{ height:34, background:G.pale, borderRadius:10 }} />
      </div>
    </div>
  );
}

// ─── Mira's top pick card (elevated) ─────────────────────────
function MiraTopPick({ provider, pet, onBook }) {
  return (
    <div style={{ background:`linear-gradient(135deg,${G.pale},${G.cream})`, border:`2px solid ${G.sage}`, borderRadius:16, padding:20, marginBottom:20, display:"flex", alignItems:"flex-start", gap:16 }}>
      <div style={{ width:72, height:72, borderRadius:12, overflow:"hidden", flexShrink:0, background:G.cream }}>
        {provider.photo_url
          ? <img src={provider.photo_url} alt={provider.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>{CARE_TYPES.find(t=>t.id===provider.type)?.icon||"🐾"}</div>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight:700, background:`linear-gradient(135deg,${G.sage},${G.mid})`, color:"#fff", borderRadius:20, padding:"3px 10px" }}>✦ Mira's Top Pick</span>
          {provider.tdc_verified && <TDCBadge />}
          <OpenBadge openNow={provider.open_now} />
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:G.darkText, marginBottom:4 }}>{provider.name}</div>
        <div style={{ fontSize:12, color:G.mutedText, marginBottom:6 }}>📍 {provider.vicinity||provider.formatted_address}</div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <StarRating rating={provider.rating} reviewCount={provider.user_ratings_total} />
          {provider.price_level && <span style={{ fontSize:11, color:G.mutedText }}>{"₹".repeat(Math.min(provider.price_level,4))}</span>}
        </div>
        {provider.mira_note && (
          <p style={{ fontSize:12, color:G.mid, fontStyle:"italic", margin:"0 0 10px", lineHeight:1.5 }}>"{provider.mira_note}"</p>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => onBook?.(provider, provider.city)}
            style={{ background:`linear-gradient(135deg,${G.sage},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Book via Concierge →
          </button>
          {provider.phone && (
            <a href={`tel:${provider.phone}`} style={{ background:"#fff", color:G.mid, border:`1.5px solid ${G.light}`, borderRadius:10, padding:"9px 14px", fontSize:12, fontWeight:600, cursor:"pointer", textDecoration:"none", display:"flex", alignItems:"center" }}>
              📞 Call
            </a>
          )}
        </div>
      </div>
    
      <NearMeConciergeModal
        isOpen={!!selectedVendor}
        venue={selectedVendor}
        pet={pet}
        pillar="care"
        onClose={() => setSelectedVendor(null)}
      />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function CareNearMe({ pet, onBook }) {
  const [searchInput, setSearchInput]         = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeQuery, setActiveQuery]         = useState("");
  const [activeType, setActiveType]           = useState("all");
  const [providers, setProviders]             = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [resultLabel, setResultLabel]         = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nearMeLoading, setNearMeLoading]     = useState(false);
  const [userCoords, setUserCoords]           = useState(null);
  const inputRef = useRef(null);

  const petCity    = pet?.city || pet?.doggy_soul_answers?.city || null;
  const petName    = pet?.name || "your dog";
  const petBreed   = pet?.breed || pet?.doggy_soul_answers?.breed || null;
  const allergies  = pet?.doggy_soul_answers?.food_allergies || pet?.preferences?.allergies || null;

  // Pre-fill with pet's city on mount
  useEffect(() => {
    if (petCity) { setSearchInput(petCity); setActiveQuery(petCity); }
  }, [petCity]);

  // ── Fetch providers ─────────────────────────────────────────
  const doFetch = useCallback(async (query, coords, type) => {
    if (!query && !coords) return;
    setLoading(true); setError(null); setProviders([]);
    try {
      const params = new URLSearchParams();
      params.set("type", type || "all");
      if (coords) {
        params.set("lat", coords.lat);
        params.set("lng", coords.lng);
        params.set("radius", "5000");
      } else {
        const typeTerm = CARE_TYPES.find(t=>t.id===(type||"all"))?.term || "pet care";
        params.set("query", `${typeTerm} in ${query}`);
        params.set("city", query);
      }
      if (petBreed) params.set("breed", petBreed);

      const res = await fetch(`${API_URL}/api/places/care-providers?${params.toString()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setProviders(data.places || []);
      setResultLabel(data.location_name || query || "your area");
    } catch (err) {
      console.error("[CareNearMe]", err);
      setError("Couldn't load results. Try a different city or let Concierge help.");
    } finally {
      setLoading(false);
    }
  }, [petBreed]);

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
    const term = CARE_TYPES.find(t=>t.id===activeType)?.term || "pet groomer";
    const dest = activeQuery === "near_me" ? "near me" : activeQuery;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${term} ${dest}`)}`, "_blank");
  };

  // Top pick = highest rated TDC verified, or just highest rated
  const topPick    = providers.find(p=>p.tdc_verified) || (providers[0]?.rating >= 4.5 ? providers[0] : null);
  const restOfList = topPick ? providers.filter(p=>p!==topPick) : providers;
  const displayCity = activeQuery === "near_me" ? "your area" : resultLabel || activeQuery;

  return (
    <div style={{ marginBottom:32 }} data-testid="care-near-me">
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .care-input:focus{outline:none!important;border-color:#52B788!important;box-shadow:0 0 0 3px rgba(82,183,136,0.15)!important}
        .care-pills::-webkit-scrollbar,.care-type-strip::-webkit-scrollbar{display:none}
      `}</style>

      {/* Section header */}
      <div style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:"clamp(1.125rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:"0 0 4px", fontFamily:"Georgia,serif" }}>
          Care providers near <span style={{ color:G.sage }}>{petName}</span>
        </h3>
        <p style={{ fontSize:12, color:"#888", margin:0, lineHeight:1.5 }}>
          Search any city — groomers, vets, pet stores, trainers and daycare. Anywhere in the world.
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
              className="care-input"
              type="text"
              value={searchInput}
              onChange={e=>{ setSearchInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e=>{ if(e.key==="Enter")handleSearch(); if(e.key==="Escape")setShowSuggestions(false); }}
              onFocus={()=>setShowSuggestions(true)}
              onBlur={()=>setTimeout(()=>setShowSuggestions(false),150)}
              placeholder="Mumbai, London, Bangalore, Dubai — any city…"
              style={{ width:"100%", height:"100%", borderRadius:12, border:`1.5px solid rgba(82,183,136,0.28)`, padding:"13px 14px 13px 42px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box", background:"#fff", fontFamily:"inherit" }}
            />

            {/* Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#fff", border:`1px solid rgba(82,183,136,0.20)`, borderRadius:12, boxShadow:"0 8px 32px rgba(27,67,50,0.12)", zIndex:200, overflow:"hidden", maxHeight:220, overflowY:"auto" }}>
                {suggestions.slice(0,7).map(s => (
                  <div key={s} onMouseDown={() => handleCity(s)}
                    style={{ padding:"10px 16px", fontSize:13, color:G.darkText, cursor:"pointer", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid rgba(82,183,136,0.06)` }}
                    onMouseEnter={e=>e.currentTarget.style.background=G.cream}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:13 }}>📍</span>
                    <span style={{ flex:1 }}>{s}</span>
                    <span style={{ fontSize:10, color:"#aaa" }}>
                      {["Mumbai","Delhi","Bangalore","Pune","Chennai","Hyderabad","Kolkata","Ahmedabad","Gurgaon","Noida","Jaipur","Surat","Lucknow","Kochi","Chandigarh","Bhopal","Indore","Nagpur","Coimbatore","Vadodara","Mysore","Goa"].includes(s) ? "India" : "International"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search button */}
          <button onClick={handleSearch}
            style={{ flexShrink:0, background:`linear-gradient(135deg,${G.sage},${G.mid})`, color:"#fff", border:"none", borderRadius:12, padding:"0 22px", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            Search
          </button>

          {/* Near me */}
          <button onClick={handleNearMe} disabled={nearMeLoading}
            style={{ flexShrink:0, background:"#fff", border:`1.5px solid rgba(82,183,136,0.28)`, borderRadius:12, padding:"0 14px", fontSize:13, fontWeight:600, color:G.mid, cursor:nearMeLoading?"wait":"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
            {nearMeLoading
              ? <div style={{ width:13, height:13, border:`2px solid ${G.pale}`, borderTopColor:G.sage, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
              : "📍"} Near me
          </button>
        </div>

        {/* Popular city pills */}
        <div style={{ display:"flex", gap:6, marginTop:10, overflowX:"auto", scrollbarWidth:"none" }} className="care-pills">
          <span style={{ fontSize:11, color:"#aaa", whiteSpace:"nowrap", alignSelf:"center", flexShrink:0 }}>Popular:</span>
          {POPULAR_CITIES.slice(0, 10).map(city => (
            <button key={city.name} onClick={() => handleCity(city.name)}
              style={{ flexShrink:0, fontSize:11, fontWeight:activeQuery===city.name?700:400, color:activeQuery===city.name?G.deep:"#555", background:activeQuery===city.name?G.sage:"rgba(82,183,136,0.07)", border:`1px solid ${activeQuery===city.name?"#52B788":"rgba(82,183,136,0.18)"}`, borderRadius:20, padding:"4px 11px", cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:11 }}>{city.flag}</span>{city.name}
            </button>
          ))}
        </div>

        {/* Breed-aware note */}
        {petBreed && activeQuery && (
          <div style={{ marginTop:8, fontSize:11, color:G.mid, display:"flex", alignItems:"center", gap:5 }}>
            <span>🐕</span>
            <span>Showing providers experienced with <strong>{petBreed}s</strong> first</span>
          </div>
        )}
        {allergies && activeQuery && (
          <div style={{ marginTop:4, fontSize:11, color:"#C62828", display:"flex", alignItems:"center", gap:5 }}>
            <span>⚠️</span>
            <span>{petName} has allergies — remind the provider when booking</span>
          </div>
        )}
      </div>

      {/* Type filter pills */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }} className="care-type-strip">
        {CARE_TYPES.map(type => {
          const sel = activeType === type.id;
          return (
    <button key={type.id} onClick={() => setActiveType(type.id)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, flexShrink:0, padding:"7px 16px", borderRadius:9999, border:`1.5px solid ${sel?"#52B788":"rgba(82,183,136,0.22)"}`, background:sel?"#52B788":"#fff", color:sel?G.deep:G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
              <span style={{ fontSize:14 }}>{type.icon}</span>{type.label}
            </button>
          );
        })}
      </div>

      {/* ── Result states ───────────────────────────────────── */}

      {/* Empty — no search yet */}
      {!activeQuery && !loading && (
        <div style={{ textAlign:"center", padding:"48px 24px", background:`linear-gradient(135deg,${G.pale},${G.cream})`, borderRadius:16, border:`1px solid rgba(82,183,136,0.12)` }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🐾</div>
          <div style={{ fontSize:18, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>
            Where is {petName} getting care?
          </div>
          <div style={{ fontSize:14, color:G.mutedText, marginBottom:24, lineHeight:1.7 }}>
            Search any city — groomers, vets, pet stores, trainers, and daycare facilities.<br/>
            Our Concierge books whatever you find.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
            {["Mumbai 🇮🇳","Delhi 🇮🇳","Bangalore 🇮🇳","London 🇬🇧","Dubai 🇦🇪","Singapore 🇸🇬"].map(c=>(
              <button key={c} onClick={()=>handleCity(c.split(" ")[0])}
                style={{ background:G.sage, color:G.deep, border:"none", borderRadius:20, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
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
            Finding {CARE_TYPES.find(t=>t.id===activeType)?.label.toLowerCase()||"care providers"} in {activeQuery==="near_me"?"your area":activeQuery}…
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
            <button onClick={()=>doFetch(activeQuery==="near_me"?null:activeQuery,activeQuery==="near_me"?userCoords:null,activeType)} style={{ background:G.sage,color:G.deep,border:"none",borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Try again</button>
            <button onClick={()=>{ tdc.nearme({ query: "venue", pillar:"care", pet }); bookViaConcierge({ service: "venue", pillar:"care", pet, channel:"care_nearme" }); onBook?.(null, activeQuery==="near_me"?"your area":activeQuery)}}   style={{ background:G.pale,color:G.mid,border:`1px solid ${G.light}`,borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Ask Concierge</button>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && !error && activeQuery && providers.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:16, border:`1px solid rgba(82,183,136,0.12)`, marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:6 }}>
            No {CARE_TYPES.find(t=>t.id===activeType)?.label.toLowerCase()||"providers"} found in {activeQuery==="near_me"?"your area":activeQuery}
          </div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:20, lineHeight:1.6 }}>
            Google doesn't have full coverage everywhere — but our Concierge researches personal recommendations too.
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setActiveType("all")} style={{ background:G.sage,color:G.deep,border:"none",borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Try all types</button>
            <button onClick={()=>{ tdc.nearme({ query: "venue", pillar:"care", pet }); bookViaConcierge({ service: "venue", pillar:"care", pet, channel:"care_nearme" }); onBook?.(null, activeQuery==="near_me"?"your area":activeQuery)}}   style={{ background:G.pale,color:G.mid,border:`1px solid ${G.light}`,borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Ask Concierge</button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && providers.length > 0 && (
        <>
          {/* Results header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:12, color:G.mutedText }}>
              <strong style={{ color:G.sage }}>{providers.length}</strong>{" "}
              {CARE_TYPES.find(t=>t.id===activeType)?.label.toLowerCase()||"providers"} in{" "}
              <strong style={{ color:G.darkText }}>{displayCity}</strong>
              {providers.filter(p=>p.tdc_verified).length > 0 && (
                <span style={{ marginLeft:8, color:G.amber, fontWeight:600 }}>
                  · {providers.filter(p=>p.tdc_verified).length} TDC verified
                </span>
              )}
              {petBreed && <span style={{ marginLeft:8, color:G.mid }}>· sorted for {petBreed}s</span>}
            </div>
            <button onClick={openInMaps} style={{ background:"#fff", border:`1px solid rgba(82,183,136,0.22)`, borderRadius:20, padding:"5px 14px", fontSize:11, fontWeight:600, color:G.mid, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              🗺️ Open in Google Maps
            </button>
          </div>

          {/* Mira's top pick */}
          {topPick && <MiraTopPick provider={topPick} pet={pet} onBook={onBook} />}

          {/* Rest of results */}
          {restOfList.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:16, marginBottom:20 }}>
              {restOfList.map((p,i) => <ProviderCard key={p.place_id||i} provider={p} pet={pet} onBook={onBook} />)}
            </div>
          )}
        </>
      )}

      {/* Concierge CTA — always at bottom when results shown */}
      {(providers.length > 0 || error) && (
        <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:16, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginTop:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>
              Need Mira to book this for {petName}?
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.60)", lineHeight:1.6 }}>
              Our Concierge calls ahead, checks availability, confirms {petBreed ? `${petBreed} experience,` : "breed experience,"} and books the appointment — you don't have to lift a finger.
            </div>
          </div>
          <button onClick={() => onBook?.(null, displayCity)}
            style={{ flexShrink:0, background:`linear-gradient(135deg,${G.sage},${G.light})`, color:G.deep, border:"none", borderRadius:12, padding:"11px 22px", fontSize:13, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
            Book via Concierge →
          </button>
        </div>
      )}
    </div>  );
}
