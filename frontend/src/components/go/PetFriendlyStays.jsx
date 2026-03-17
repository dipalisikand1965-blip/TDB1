/**
 * PetFriendlyStays.jsx — /go pillar
 * The Doggy Company
 *
 * Finds pet-friendly hotels, resorts, homestays & boarding near the user.
 * Mirrors PetFriendlySpots from /dine — same Google Places API pattern,
 * different search terms (hotels/resorts vs restaurants/cafes).
 *
 * HOW IT WORKS:
 *   1. Gets user location (browser geolocation or falls back to pet's city)
 *   2. Calls GET /api/places/pet-friendly-stays?lat=&lng=&type=&city=
 *   3. Backend queries Google Places API:
 *        keyword: "pet friendly" + type (hotel/resort/homestay/boarding)
 *        radius: 10000m (10km)
 *        fields: name, rating, vicinity, photos, place_id, opening_hours
 *   4. Returns enriched results with pet_policy flag from TDC DB if known
 *   5. Each card → "Book via Concierge" → opens GoConciergeModal prefilled
 *
 * USAGE in GoSoulPage.jsx:
 *   import PetFriendlyStays from "../components/go/PetFriendlyStays";
 *
 *   <PetFriendlyStays
 *     pet={petData}
 *     onBook={(spot, city) => {
 *       setBookingVenue(spot?.name || null);
 *       setBookingCity(city || null);
 *       setBookingOpen(true);
 *     }}
 *   />
 *
 * BACKEND ENDPOINT:
 *   GET /api/places/pet-friendly-stays
 *   Query params: lat, lng, type (hotel|resort|homestay|boarding|all), city, radius
 *   Returns: { places: [{ place_id, name, rating, vicinity, photo_url, pet_policy, type }] }
 *
 * WIRING NOTE:
 *   The "Book via Concierge" button calls onBook(spot, city).
 *   In GoSoulPage, this opens GoConciergeModal with:
 *     prefilledOccasion="Hotel Discovery"
 *     prefilledVenue={spot.name}
 *   Same pattern as DineSoulPage's PetFriendlySpots → ConciergeIntakeModal.
 */

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../utils/api";

// ─── Colour system ────────────────────────────────────────────
const G = {
  deep:    "#0D3349",
  mid:     "#1A5276",
  teal:    "#1ABC9C",
  light:   "#76D7C4",
  pale:    "#D1F2EB",
  cream:   "#E8F8F5",
  gold:    "#C9973A",
  darkText:"#0D3349",
  mutedText:"#5D6D7E",
};

// ─── Stay type filters ────────────────────────────────────────
const STAY_TYPES = [
  { id:"all",      label:"All",         icon:"🏡", keyword:"pet friendly stay" },
  { id:"hotel",    label:"Hotels",      icon:"🏨", keyword:"pet friendly hotel" },
  { id:"resort",   label:"Resorts",     icon:"🌴", keyword:"pet friendly resort" },
  { id:"homestay", label:"Homestays",   icon:"🏠", keyword:"pet friendly homestay" },
  { id:"boarding", label:"Boarding",    icon:"🐾", keyword:"pet boarding facility" },
  { id:"camping",  label:"Camping",     icon:"⛺", keyword:"pet friendly camping" },
];

// ─── Star rating display ──────────────────────────────────────
function StarRating({ rating }) {
  if (!rating) return null;
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ color:"#F59E0B", fontSize:11, letterSpacing:1 }}>
      {"★".repeat(full)}{"½".slice(0,half)}{"☆".repeat(empty)}
      <span style={{ color:G.mutedText, marginLeft:4, fontWeight:400 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── Pet policy badge ─────────────────────────────────────────
function PetPolicyBadge({ policy }) {
  const map = {
    confirmed: { label:"✓ Pet confirmed", bg:"#E8F5E9", color:"#2E7D32" },
    likely:    { label:"Likely pet-friendly", bg:"#FFF8E1", color:"#F57F17" },
    check:     { label:"Check with property", bg:"#FFF3E0", color:"#E65100" },
    boarding:  { label:"Boarding facility",   bg:"#E3F2FD", color:"#1565C0" },
  };
  const p = map[policy] || map.check;
  return (
    <span style={{ fontSize:9, fontWeight:700, background:p.bg, color:p.color, borderRadius:8, padding:"2px 8px" }}>
      {p.label}
    </span>
  );
}

// ─── Individual stay card ─────────────────────────────────────
function StayCard({ spot, pet, onBook }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ background:"#fff", border:`1px solid rgba(26,188,156,0.15)`, borderRadius:14, overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s", cursor:"default" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px rgba(13,51,73,0.12)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

      {/* Photo */}
      <div style={{ height:160, overflow:"hidden", position:"relative", background:G.cream }}>
        {spot.photo_url && !imgError ? (
          <img
            src={spot.photo_url}
            alt={spot.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${G.pale},${G.light})`, fontSize:44 }}>
            {STAY_TYPES.find(t => t.id === spot.type)?.icon || "🏡"}
          </div>
        )}

        {/* Type badge */}
        <div style={{ position:"absolute", top:10, left:10, background:G.teal, color:G.deep, fontSize:9, fontWeight:700, borderRadius:20, padding:"3px 8px" }}>
          {STAY_TYPES.find(t => t.id === spot.type)?.label || "Stay"}
        </div>

        {/* TDC verified badge */}
        {spot.tdc_listed && (
          <div style={{ position:"absolute", top:10, right:10, background:G.gold, color:"#fff", fontSize:9, fontWeight:700, borderRadius:20, padding:"3px 8px" }}>
            ✦ TDC Listed
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"12px 14px 16px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4, lineHeight:1.3 }}>
          {spot.name}
        </div>

        <div style={{ fontSize:11, color:G.mutedText, marginBottom:8, lineHeight:1.4 }}>
          📍 {spot.vicinity || spot.city}
        </div>

        {/* Rating + policy */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <StarRating rating={spot.rating} />
          <PetPolicyBadge policy={spot.pet_policy || "check"} />
        </div>

        {/* Price range if available */}
        {spot.price_level && (
          <div style={{ fontSize:11, color:G.mutedText, marginBottom:8 }}>
            {"₹".repeat(spot.price_level)} · {["","Budget","Mid-range","Upscale","Luxury"][spot.price_level] || ""}
          </div>
        )}

        {/* Mira note if available */}
        {spot.mira_note && (
          <div style={{ fontSize:11, color:G.mid, fontStyle:"italic", marginBottom:10, lineHeight:1.4, padding:"6px 10px", background:G.pale, borderRadius:8 }}>
            ✦ {spot.mira_note}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onBook?.(spot, spot.city)}
          style={{ width:"100%", background:`linear-gradient(135deg,${G.teal},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"9px", fontSize:12, fontWeight:700, cursor:"pointer", transition:"opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity="0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity="1"}
        >
          Book via Concierge →
        </button>
      </div>
    </div>
  );
}

// ─── No results state ─────────────────────────────────────────
function NoResults({ type, city, onChangeType }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:16, border:`1px solid rgba(26,188,156,0.12)` }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
      <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:6 }}>
        No pet-friendly {STAY_TYPES.find(t=>t.id===type)?.label.toLowerCase() || "stays"} found near {city||"you"}
      </div>
      <div style={{ fontSize:13, color:G.mutedText, marginBottom:20, lineHeight:1.6 }}>
        This could be a coverage gap — our Concierge team researches options not on Google too.
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
        <button onClick={() => onChangeType("all")} style={{ background:G.teal, color:G.deep, border:"none", borderRadius:20, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          Show all stay types
        </button>
        <button onClick={() => onChangeType("boarding")} style={{ background:G.pale, color:G.mid, border:`1px solid ${G.light}`, borderRadius:20, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          Try boarding facilities
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PetFriendlyStays({ pet, onBook }) {
  const [activeType, setActiveType]   = useState("all");
  const [spots, setSpots]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [userCity, setUserCity]       = useState(null);
  const [userCoords, setUserCoords]   = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showMap, setShowMap]         = useState(false);

  const petCity = pet?.city || pet?.doggy_soul_answers?.city || null;

  // ── Get user location ───────────────────────────────────────
  useEffect(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoading(false);
        },
        () => {
          // Geolocation denied — fall back to pet's city
          setLocationLoading(false);
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  // ── Fetch stays ─────────────────────────────────────────────
  const fetchStays = useCallback(async () => {
    if (locationLoading) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userCoords) {
        params.set("lat", userCoords.lat);
        params.set("lng", userCoords.lng);
      }
      if (petCity) params.set("city", petCity);
      params.set("type", activeType);
      params.set("radius", "10000");
      if (pet?.breed) params.set("breed", pet.breed);

      const res = await fetch(`${API_URL}/api/places/pet-friendly-stays?${params.toString()}`);
      if (!res.ok) throw new Error("Places API error");
      const data = await res.json();

      setSpots(data.places || []);
      if (data.city) setUserCity(data.city);
    } catch (err) {
      console.error("[PetFriendlyStays]", err);
      setError("Couldn't load stays right now. Our Concierge can help manually.");
    } finally {
      setLoading(false);
    }
  }, [locationLoading, userCoords, petCity, activeType, pet?.breed]);

  useEffect(() => { fetchStays(); }, [fetchStays]);

  // ── Google Maps deep link ────────────────────────────────────
  const openInMaps = () => {
    const query = encodeURIComponent(`pet friendly ${activeType === "all" ? "hotel" : activeType} near ${userCity || petCity || "me"}`);
    const base = userCoords
      ? `https://www.google.com/maps/search/${query}/@${userCoords.lat},${userCoords.lng},13z`
      : `https://www.google.com/maps/search/${query}`;
    window.open(base, "_blank");
  };

  const displayCity = userCity || petCity || "your location";

  // ── Loading skeleton ─────────────────────────────────────────
  if (locationLoading) return (
    <div style={{ padding:"32px 0", textAlign:"center", color:G.mutedText, fontSize:13 }}>
      <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
      Getting your location…
    </div>
  );

  return (
    <div style={{ marginBottom:32 }} data-testid="pet-friendly-stays">

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid rgba(26,188,156,0.25)`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:G.mid }}>
            📍 Pet-friendly stays near {pet?.name || "you"} in {displayCity}
          </div>
        </div>
        <button
          onClick={openInMaps}
          style={{ background:"#fff", border:`1px solid rgba(26,188,156,0.25)`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:G.mid, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
          🗺️ View on Google Maps
        </button>
      </div>

      {/* Type filter pills */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }} className="stay-type-strip">
        <style>{`.stay-type-strip::-webkit-scrollbar{display:none}`}</style>
        {STAY_TYPES.map(type => {
          const sel = activeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, flexShrink:0, padding:"7px 16px", borderRadius:9999, border:`1.5px solid ${sel?"#1ABC9C":"rgba(26,188,156,0.22)"}`, background:sel?"#1ABC9C":"#fff", color:sel?G.deep:G.mutedText, fontSize:12, fontWeight:sel?700:400, cursor:"pointer", transition:"all 0.15s" }}>
              <span style={{ fontSize:14 }}>{type.icon}</span>
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ borderRadius:14, overflow:"hidden", border:`1px solid rgba(26,188,156,0.10)` }}>
              <div style={{ height:160, background:`linear-gradient(90deg,${G.cream} 25%,${G.pale} 50%,${G.cream} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
              <div style={{ padding:"12px 14px" }}>
                <div style={{ height:14, background:G.cream, borderRadius:8, marginBottom:8, width:"70%" }} />
                <div style={{ height:10, background:G.cream, borderRadius:8, marginBottom:12, width:"50%" }} />
                <div style={{ height:32, background:G.pale, borderRadius:10 }} />
              </div>
            </div>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : error ? (
        <div style={{ textAlign:"center", padding:"32px 20px", background:"#FFF8F0", borderRadius:14, border:"1px solid #FFCC99" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
          <div style={{ fontSize:14, color:G.darkText, fontWeight:700, marginBottom:6 }}>Something went wrong</div>
          <div style={{ fontSize:13, color:G.mutedText, marginBottom:16 }}>{error}</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={fetchStays} style={{ background:G.teal, color:G.deep, border:"none", borderRadius:20, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Try again</button>
            <button onClick={() => onBook?.(null, displayCity)} style={{ background:G.pale, color:G.mid, border:`1px solid ${G.light}`, borderRadius:20, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Ask Concierge</button>
          </div>
        </div>
      ) : spots.length === 0 ? (
        <NoResults type={activeType} city={displayCity} onChangeType={setActiveType} />
      ) : (
        <>
          <div style={{ fontSize:12, color:G.mutedText, marginBottom:14 }}>
            {spots.length} pet-friendly {STAY_TYPES.find(t=>t.id===activeType)?.label.toLowerCase() || "stays"} near {displayCity}
            {spots.filter(s=>s.tdc_listed).length > 0 && (
              <span style={{ marginLeft:8, color:G.gold, fontWeight:600 }}>
                · {spots.filter(s=>s.tdc_listed).length} TDC listed
              </span>
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:16, marginBottom:20 }}>
            {spots.map((spot, i) => (
              <StayCard key={spot.place_id || i} spot={spot} pet={pet} onBook={onBook} />
            ))}
          </div>
        </>
      )}

      {/* Concierge fallback CTA — always shown at bottom */}
      <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:16, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>
            Can't find the right stay?
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
            Our Concierge team researches options beyond Google — boutique resorts, verified pet-friendly properties, and places that genuinely love dogs.
          </div>
        </div>
        <button
          onClick={() => onBook?.(null, displayCity)}
          style={{ flexShrink:0, background:`linear-gradient(135deg,${G.teal},${G.light})`, color:G.deep, border:"none", borderRadius:12, padding:"11px 22px", fontSize:13, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
          Ask our Concierge →
        </button>
      </div>
    </div>
  );
}
