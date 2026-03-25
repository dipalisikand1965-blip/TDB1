/**
 * PetFriendlyStays.jsx — /go pillar
 * The Doggy Company
 *
 * Search pet-friendly stays ANYWHERE IN THE WORLD.
 * Free-text destination search — Goa, Paris, Bali, New York, anywhere.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "../../utils/api";

const G = {
  deep: "#0D3349", mid: "#1A5276", teal: "#1ABC9C",
  light: "#76D7C4", pale: "#D1F2EB", cream: "#E8F8F5",
  gold: "#C9973A", darkText: "#0D3349", mutedText: "#5D6D7E",
};

const STAY_TYPES = [
  { id: "all",      label: "All",       icon: "🏡", term: "pet friendly stay" },
  { id: "hotel",    label: "Hotels",    icon: "🏨", term: "pet friendly hotel" },
  { id: "resort",   label: "Resorts",   icon: "🌴", term: "pet friendly resort" },
  { id: "homestay", label: "Homestays", icon: "🏠", term: "pet friendly homestay" },
  { id: "boarding", label: "Boarding",  icon: "🐾", term: "pet boarding" },
  { id: "camping",  label: "Camping",   icon: "⛺", term: "pet friendly camping" },
];

const POPULAR = [
  { name: "Goa",          flag: "🇮🇳" },
  { name: "Coorg",        flag: "🇮🇳" },
  { name: "Manali",       flag: "🇮🇳" },
  { name: "Pondicherry",  flag: "🇮🇳" },
  { name: "Lonavala",     flag: "🇮🇳" },
  { name: "Bali",         flag: "🇮🇩" },
  { name: "Paris",        flag: "🇫🇷" },
  { name: "London",       flag: "🇬🇧" },
  { name: "New York",     flag: "🇺🇸" },
  { name: "Bangkok",      flag: "🇹🇭" },
  { name: "Dubai",        flag: "🇦🇪" },
  { name: "Singapore",    flag: "🇸🇬" },
];

const ALL_SUGGESTIONS = [
  "Goa", "Coorg", "Manali", "Lonavala", "Pondicherry", "Ooty", "Munnar", "Kasauli",
  "Mussoorie", "Kodaikanal", "Shimla", "Nainital", "Darjeeling", "Jaipur", "Udaipur",
  "Bali", "Paris", "London", "New York", "Bangkok", "Singapore", "Dubai", "Cape Town",
  "Maldives", "Phuket", "Zurich", "Sydney", "Tokyo", "Toronto", "Amsterdam",
];

function StarRating({ rating }) {
  if (!rating) return null;
  return (
    <span style={{ color: "#F59E0B", fontSize: 11 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: G.mutedText, marginLeft: 4, fontWeight: 400 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function PetPolicyBadge({ policy }) {
  const map = {
    confirmed: { label: "✓ Pet confirmed",       bg: "#E8F5E9", color: "#2E7D32" },
    likely:    { label: "Likely pet-friendly",    bg: "#FFF8E1", color: "#F57F17" },
    check:     { label: "Check with property",    bg: "#FFF3E0", color: "#E65100" },
    boarding:  { label: "Boarding facility",      bg: "#E3F2FD", color: "#1565C0" },
  };
  const p = map[policy] || map.check;
  return <span style={{ fontSize: 9, fontWeight: 700, background: p.bg, color: p.color, borderRadius: 8, padding: "2px 8px" }}>{p.label}</span>;
}

function StayCard({ spot, pet, onBook }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{ background: "#fff", border: `1px solid rgba(26,188,156,0.15)`, borderRadius: 14, overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,51,73,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ height: 160, overflow: "hidden", position: "relative", background: G.cream }}>
        {spot.photo_url && !imgErr
          ? <img src={spot.photo_url} alt={spot.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgErr(true)} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${G.pale},${G.light})`, fontSize: 44 }}>
              {STAY_TYPES.find(t => t.id === spot.type)?.icon || "🏡"}
            </div>}
        <div style={{ position: "absolute", top: 10, left: 10, background: G.teal, color: G.deep, fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "3px 8px" }}>
          {STAY_TYPES.find(t => t.id === spot.type)?.label || "Stay"}
        </div>
        {spot.tdc_listed && (
          <div style={{ position: "absolute", top: 10, right: 10, background: G.gold, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "3px 8px" }}>✦ TDC Listed</div>
        )}
      </div>
      <div style={{ padding: "12px 14px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 4, lineHeight: 1.3 }}>{spot.name}</div>
        <div style={{ fontSize: 11, color: G.mutedText, marginBottom: 8, lineHeight: 1.4 }}>📍 {spot.vicinity || spot.formatted_address || "—"}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <StarRating rating={spot.rating} />
          <PetPolicyBadge policy={spot.pet_policy || "check"} />
        </div>
        {spot.price_level && (
          <div style={{ fontSize: 11, color: G.mutedText, marginBottom: 8 }}>
            {"₹".repeat(Math.min(spot.price_level, 4))} · {["", "Budget", "Mid-range", "Upscale", "Luxury"][spot.price_level] || ""}
          </div>
        )}
        {spot.mira_note && (
          <div style={{ fontSize: 11, color: G.mid, fontStyle: "italic", marginBottom: 10, padding: "6px 10px", background: G.pale, borderRadius: 8, lineHeight: 1.4 }}>
            ✦ {spot.mira_note}
          </div>
        )}
        <button onClick={() => onBook?.(spot, spot.location_name || spot.vicinity)}
          style={{ width: "100%", background: `linear-gradient(135deg,${G.teal},${G.mid})`, color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Book via Concierge® →
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid rgba(26,188,156,0.10)` }}>
      <div style={{ height: 160, background: `linear-gradient(90deg,${G.cream} 25%,${G.pale} 50%,${G.cream} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ height: 14, background: G.cream, borderRadius: 8, marginBottom: 8, width: "70%" }} />
        <div style={{ height: 10, background: G.cream, borderRadius: 8, marginBottom: 12, width: "50%" }} />
        <div style={{ height: 32, background: G.pale, borderRadius: 10 }} />
      </div>
    </div>
  );
}

export default function PetFriendlyStays({ pet, onBook }) {
  const [searchInput,    setSearchInput]    = useState("");
  const [activeQuery,    setActiveQuery]    = useState("");
  const [activeType,     setActiveType]     = useState("all");
  const [spots,          setSpots]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [resultLabel,    setResultLabel]    = useState("");
  const [showSuggestions,setShowSuggestions]= useState(false);
  const [nearMeLoading,  setNearMeLoading]  = useState(false);
  const [userCoords,     setUserCoords]     = useState(null);
  const inputRef = useRef(null);

  const petCity = pet?.city || pet?.doggy_soul_answers?.city || null;

  // Pre-fill with pet's city on mount and auto-fetch
  useEffect(() => {
    if (petCity) {
      setSearchInput(petCity);
      setActiveQuery(petCity);
      doFetch(petCity, null, activeType);
    }
  }, [petCity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch stays
  const doFetch = useCallback(async (query, coords, type) => {
    if (!query && !coords) return;
    setLoading(true); setError(null); setSpots([]);
    try {
      const params = new URLSearchParams();
      params.set("type", type || "all");
      if (coords) {
        params.set("lat", coords.lat);
        params.set("lng", coords.lng);
        params.set("radius", "10000");
      } else {
        const typeTerm = STAY_TYPES.find(t => t.id === (type || "all"))?.term || "pet friendly stay";
        params.set("query", `${typeTerm} in ${query}`);
        params.set("city", query);
      }
      const res = await fetch(`${API_URL}/api/places/pet-friendly-stays?${params.toString()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (data.error && (!data.places || data.places.length === 0)) throw new Error(data.error);
      setSpots(data.places || []);
      setResultLabel(data.location_name || query || "your area");
    } catch (err) {
      console.error("[PetFriendlyStays]", err);
      setError("Couldn't load results. Try a different destination or let Concierge® help.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when type changes
  useEffect(() => {
    if (!activeQuery) return;
    if (activeQuery === "near_me") doFetch(null, userCoords, activeType);
    else doFetch(activeQuery, null, activeType);
  }, [activeType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Near me
  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(c);
        setSearchInput("Near me");
        setActiveQuery("near_me");
        setNearMeLoading(false);
        doFetch(null, c, activeType);
      },
      () => setNearMeLoading(false),
      { timeout: 8000 }
    );
  };

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setUserCoords(null);
    setActiveQuery(q);
    setShowSuggestions(false);
    doFetch(q, null, activeType);
  };

  const handleDestination = (dest) => {
    setSearchInput(dest);
    setActiveQuery(dest);
    setShowSuggestions(false);
    doFetch(dest, null, activeType);
  };

  // Autocomplete
  const suggestions = searchInput.length > 1
    ? ALL_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchInput.toLowerCase()) && s.toLowerCase() !== searchInput.toLowerCase())
    : [];

  const openInMaps = () => {
    const term = STAY_TYPES.find(t => t.id === activeType)?.term || "pet friendly hotel";
    const dest = activeQuery === "near_me" ? "near me" : activeQuery;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${term} ${dest}`)}`, "_blank");
  };

  return (
    <div style={{ marginBottom: 32 }} data-testid="pet-friendly-stays">
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .stays-input:focus{outline:none!important;border-color:#1ABC9C!important;box-shadow:0 0 0 3px rgba(26,188,156,0.15)!important}
        .dest-pills::-webkit-scrollbar,.stay-strip::-webkit-scrollbar{display:none}
      `}</style>

      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "clamp(1.125rem,2.5vw,1.375rem)", fontWeight: 800, color: G.darkText, margin: "0 0 4px", fontFamily: "Georgia,serif" }}>
          Pet-friendly stays — <span style={{ color: G.teal }}>anywhere in the world</span>
        </h3>
        <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.5 }}>
          Search any destination — India or international. Every result is bookable via your Go Concierge®.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
            <input
              ref={inputRef}
              className="stays-input"
              type="text"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") setShowSuggestions(false); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Goa, Paris, Bali, New York — anywhere…"
              style={{ width: "100%", height: "100%", borderRadius: 12, border: `1.5px solid rgba(26,188,156,0.28)`, padding: "13px 14px 13px 42px", fontSize: 14, color: G.darkText, outline: "none", boxSizing: "border-box", background: "#fff", fontFamily: "inherit" }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1px solid rgba(26,188,156,0.20)`, borderRadius: 12, boxShadow: "0 8px 32px rgba(13,51,73,0.12)", zIndex: 200, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                {suggestions.slice(0, 7).map(s => (
                  <div key={s} onMouseDown={() => handleDestination(s)}
                    style={{ padding: "10px 16px", fontSize: 13, color: G.darkText, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid rgba(26,188,156,0.06)` }}
                    onMouseEnter={e => e.currentTarget.style.background = G.cream}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span>📍</span>
                    <span>{s}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#aaa" }}>
                      {["Goa","Coorg","Manali","Lonavala","Pondicherry","Ooty","Munnar","Kasauli","Mussoorie","Kodaikanal","Shimla","Nainital","Darjeeling","Jaipur","Udaipur"].includes(s)?"India":"International"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSearch}
            style={{ flexShrink: 0, background: `linear-gradient(135deg,${G.teal},${G.mid})`, color: "#fff", border: "none", borderRadius: 12, padding: "0 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Search
          </button>
          <button onClick={handleNearMe} disabled={nearMeLoading}
            style={{ flexShrink: 0, background: "#fff", border: `1.5px solid rgba(26,188,156,0.28)`, borderRadius: 12, padding: "0 14px", fontSize: 13, fontWeight: 600, color: G.mid, cursor: nearMeLoading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            {nearMeLoading
              ? <div style={{ width: 13, height: 13, border: `2px solid ${G.pale}`, borderTopColor: G.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : "📍"} Near me
          </button>
        </div>

        {/* Popular destination chips */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", scrollbarWidth: "none" }} className="dest-pills">
          <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", alignSelf: "center", flexShrink: 0 }}>Popular:</span>
          {POPULAR.map(d => (
            <button key={d.name} onClick={() => handleDestination(d.name)}
              style={{ flexShrink: 0, fontSize: 11, fontWeight: activeQuery === d.name ? 700 : 400, color: activeQuery === d.name ? G.deep : "#555", background: activeQuery === d.name ? G.teal : "rgba(26,188,156,0.07)", border: `1px solid ${activeQuery === d.name ? "#1ABC9C" : "rgba(26,188,156,0.18)"}`, borderRadius: 20, padding: "4px 11px", cursor: "pointer", transition: "all 0.12s", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{d.flag}</span>{d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stay type filter */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }} className="stay-strip">
        {STAY_TYPES.map(type => {
          const sel = activeType === type.id;
          return (
            <button key={type.id} onClick={() => setActiveType(type.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: "7px 16px", borderRadius: 9999, border: `1.5px solid ${sel ? "#1ABC9C" : "rgba(26,188,156,0.22)"}`, background: sel ? "#1ABC9C" : "#fff", color: sel ? G.deep : G.mutedText, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              <span style={{ fontSize: 14 }}>{type.icon}</span>{type.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {!activeQuery && !loading && (
        <div style={{ textAlign: "center", padding: "48px 24px", background: `linear-gradient(135deg,${G.pale},${G.cream})`, borderRadius: 16, border: `1px solid rgba(26,188,156,0.12)` }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🌍</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: G.darkText, fontFamily: "Georgia,serif", marginBottom: 8 }}>
            Where is {pet?.name || "your dog"} going?
          </div>
          <div style={{ fontSize: 14, color: G.mutedText, marginBottom: 24, lineHeight: 1.7 }}>
            Search any city or country — from Coorg to Cape Town, Goa to Gstaad.<br />
            Our Concierge® books whatever you find.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {["Goa 🇮🇳", "Coorg 🇮🇳", "Manali 🇮🇳", "Bali 🇮🇩", "Paris 🇫🇷", "London 🇬🇧"].map(d => (
              <button key={d} onClick={() => handleDestination(d.split(" ")[0])}
                style={{ background: G.teal, color: G.deep, border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <>
          <div style={{ fontSize: 12, color: G.mutedText, marginBottom: 14 }}>
            Searching pet-friendly {STAY_TYPES.find(t => t.id === activeType)?.label.toLowerCase() || "stays"} in {activeQuery === "near_me" ? "your area" : activeQuery}…
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(280px,100%),1fr))", gap: 16 }}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "32px 20px", background: "#FFF8F0", borderRadius: 14, border: "1px solid #FFCC99", marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, color: G.darkText, fontWeight: 700, marginBottom: 6 }}>Couldn't load results</div>
          <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 16 }}>{error}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => doFetch(activeQuery === "near_me" ? null : activeQuery, activeQuery === "near_me" ? userCoords : null, activeType)} style={{ background: G.teal, color: G.deep, border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Try again</button>
            <button onClick={() => onBook?.(null, activeQuery === "near_me" ? "your area" : activeQuery)} style={{ background: G.pale, color: G.mid, border: `1px solid ${G.light}`, borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Ask Concierge® instead</button>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && !error && activeQuery && spots.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 16, border: `1px solid rgba(26,188,156,0.12)`, marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.darkText, marginBottom: 6 }}>
            No results in {activeQuery === "near_me" ? "your area" : activeQuery}
          </div>
          <div style={{ fontSize: 13, color: G.mutedText, marginBottom: 20, lineHeight: 1.6 }}>
            Google doesn't have full coverage here — but our Concierge® does personal research for anywhere.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setActiveType("all")} style={{ background: G.teal, color: G.deep, border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Try all stay types</button>
            <button onClick={() => onBook?.(null, activeQuery === "near_me" ? "your area" : activeQuery)} style={{ background: G.pale, color: G.mid, border: `1px solid ${G.light}`, borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Ask Concierge®</button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && spots.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 12, color: G.mutedText }}>
              <strong style={{ color: G.teal }}>{spots.length}</strong> pet-friendly {STAY_TYPES.find(t => t.id === activeType)?.label.toLowerCase() || "stays"} in{" "}
              <strong style={{ color: G.darkText }}>{activeQuery === "near_me" ? "your area" : resultLabel || activeQuery}</strong>
              {spots.filter(s => s.tdc_listed).length > 0 && <span style={{ marginLeft: 8, color: G.gold, fontWeight: 600 }}>· {spots.filter(s => s.tdc_listed).length} TDC listed</span>}
            </div>
            <button onClick={openInMaps} style={{ background: "#fff", border: `1px solid rgba(26,188,156,0.22)`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 600, color: G.mid, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              🗺️ Open in Google Maps
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(280px,100%),1fr))", gap: 16, marginBottom: 20 }}>
            {spots.map((spot, i) => <StayCard key={spot.place_id || i} spot={spot} pet={pet} onBook={onBook} />)}
          </div>
        </>
      )}

      {/* Concierge® CTA */}
      {(spots.length > 0 || error) && (
        <div style={{ background: `linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Not finding exactly what you need?</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)", lineHeight: 1.6 }}>Our Concierge® researches beyond Google — boutique properties, verified pet policies, places that genuinely love dogs.</div>
          </div>
          <button onClick={() => onBook?.(null, activeQuery === "near_me" ? "your area" : activeQuery)}
            style={{ flexShrink: 0, background: `linear-gradient(135deg,${G.teal},${G.light})`, color: G.deep, border: "none", borderRadius: 12, padding: "11px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
            Ask our Concierge® →
          </button>
        </div>
      )}
    </div>
  );
}
