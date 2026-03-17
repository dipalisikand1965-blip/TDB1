/**
 * PetFriendlySpots.jsx — The Doggy Company /dine page
 * Powered by Google Places API via backend proxy.
 */
import { useState, useEffect, useRef } from "react";

const POPULAR_CITIES = [
  "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Goa",
];

async function fetchSpots({ city, breed, lat, lng }) {
  const params = new URLSearchParams({ city, breed: breed || "" });
  if (lat) params.set("lat", lat);
  if (lng) params.set("lng", lng);
  const res = await fetch(`/api/places/pet-friendly?${params}`);
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  return res.json();
}

function getCurrentPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function SpotCard({ spot, onReserve }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #F5E8D4",
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(196,68,0,0.06)",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(196,68,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(196,68,0,0.06)"; }}
      data-testid={`spot-card-${spot.placeId || spot.name}`}
    >
      <div style={{ height: 110, background: "#FFF8F0", overflow: "hidden", position: "relative" }}>
        {spot.photoUrl ? (
          <img src={spot.photoUrl} alt={spot.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.parentNode.style.background = "linear-gradient(135deg,#FF8C42,#C44DFF)"; e.target.remove(); }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🍽️</div>
        )}
        {spot.openNow === true && (
          <span style={{ position: "absolute", top: 7, right: 7, fontSize: 9, background: "#22C55E", color: "#fff", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>Open now</span>
        )}
        {spot.openNow === false && (
          <span style={{ position: "absolute", top: 7, right: 7, fontSize: 9, background: "#EF4444", color: "#fff", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>Closed</span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A0A00", marginBottom: 3, lineHeight: 1.3 }}>{spot.name}</div>
        <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>{spot.address}{spot.distance ? ` · ${spot.distance}` : ""}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>★ {spot.rating || "—"}</span>
          {spot.tag && <span style={{ fontSize: 9, fontWeight: 600, background: "#E8F5E9", color: "#2E7D32", borderRadius: 8, padding: "2px 7px" }}>{spot.tag}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {spot.mapsUrl && (
            <a href={spot.mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ flexShrink: 0, background: "#F5F0EA", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", textDecoration: "none", color: "#C44400" }}>
              🗺️
            </a>
          )}
          <button onClick={() => onReserve && onReserve(spot)} data-testid="reserve-concierge-btn"
            style={{ flex: 1, background: "linear-gradient(135deg,#FF8C42,#C44DFF)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Reserve via Concierge
          </button>
        </div>
      </div>
    </div>
  );
}

function SpotSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #F5E8D4", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 110, background: "linear-gradient(90deg,#F5F0EA 25%,#FFF8F0 50%,#F5F0EA 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ padding: "10px 12px" }}>
        {[60, 80, 40].map((w, i) => <div key={i} style={{ height: 10, background: "#F5F0EA", borderRadius: 4, marginBottom: 6, width: `${w}%` }} />)}
      </div>
    </div>
  );
}

export default function PetFriendlySpots({ pet, onReserve }) {
  const homeCity = pet?.city || pet?.doggy_soul_answers?.city || "Bengaluru";
  const breedName = pet?.breed || "";
  const petName = pet?.name || "your dog";

  const [searchInput, setSearchInput] = useState("");
  const [activeCity, setActiveCity] = useState(homeCity);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef(null);

  const suggestions = searchInput.length > 0
    ? POPULAR_CITIES.filter(c => c.toLowerCase().startsWith(searchInput.toLowerCase()) && c.toLowerCase() !== searchInput.toLowerCase())
    : [];

  // Auto-detect location on load, then fetch
  useEffect(() => {
    setLocating(true);
    getCurrentPosition().then(pos => {
      setLocating(false);
      if (pos) {
        setUserLocation(pos);
        // Reverse-geocode to get city name (best-effort)
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=AIzaSyAGhWgj4SqpXMqJWLh6SH3rHjxIYoecny4`)
          .then(r => r.json())
          .then(d => {
            const comp = d.results?.[0]?.address_components || [];
            const cityComp = comp.find(c => c.types.includes("locality") || c.types.includes("administrative_area_level_2"));
            const detectedCity = cityComp?.long_name || homeCity;
            setActiveCity(detectedCity);
            loadSpots(detectedCity, pos);
          })
          .catch(() => loadSpots(homeCity, pos));
      } else {
        loadSpots(homeCity, null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSpots(city, position) {
    setLoading(true); setError(null);
    try {
      const data = await fetchSpots({ city, breed: breedName, lat: position?.lat, lng: position?.lng });
      setSpots(data.spots || []);
      setActiveCity(city);
    } catch (err) {
      console.error("PetFriendlySpots:", err);
      setError(`Couldn't load spots for ${city}. Please try again.`);
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e?.preventDefault();
    const city = searchInput.trim();
    if (!city) return;
    setShowSuggestions(false);
    loadSpots(city, userLocation);
  };

  const handleNearMe = async () => {
    setLocating(true);
    const pos = await getCurrentPosition();
    setLocating(false);
    if (pos) {
      setUserLocation(pos);
      loadSpots(activeCity, pos);
    } else {
      setError("Location access denied.");
    }
  };

  const resetToHome = () => { setSearchInput(""); setActiveCity(homeCity); loadSpots(homeCity, userLocation); };
  const isHomeCity = activeCity === homeCity;

  return (
    <div data-testid="pet-friendly-spots">
      <style>{`@keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} } .spots-grid{display:grid;gap:14px;grid-template-columns:1fr} @media(min-width:640px){.spots-grid{grid-template-columns:repeat(2,1fr)}} @media(min-width:1024px){.spots-grid{grid-template-columns:repeat(3,1fr)}}`}</style>

      {/* ── Big heading ── */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(22px,4vw,36px)", fontWeight:700, color:"#1A0A00", margin:"0 0 8px", lineHeight:1.2 }}>
          How would{" "}
          <span style={{ color:"#C44400" }}>{petName}</span>
          {" "}love to eat?
        </h2>
        <p style={{ margin:0, fontSize:14, color:"#888", lineHeight:1.6 }}>
          Choose a dimension — everything inside is personalised to {petName}'s food profile.{" "}
          <span style={{ color:"#C44400", fontWeight:600 }}>Glowing ones match what {petName} loves.</span>
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", background:"#fff", border:"1.5px solid #F0E8E0", borderRadius:30, padding:"0 16px", gap:8, position:"relative", boxShadow:"0 2px 8px rgba(196,68,0,0.06)" }}>
          <span style={{ color:"#E91E63", fontSize:16 }}>📍</span>
          <input ref={inputRef} value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={`Search a city… (${activeCity})`}
            style={{ flex:1, border:"none", outline:"none", fontSize:14, color:"#1A0A00", background:"transparent", padding:"13px 0" }}
            data-testid="city-search-input"
          />
          {searchInput && <button type="button" onClick={() => setSearchInput("")} style={{ background:"none", border:"none", color:"#BBB", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #F0E8E0", borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:50, marginTop:4, overflow:"hidden" }}>
              {suggestions.map(city => (
                <div key={city} onClick={() => { setSearchInput(city); setShowSuggestions(false); loadSpots(city, userLocation); }}
                  style={{ padding:"11px 18px", fontSize:13, color:"#1A0A00", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="#FFF8F4"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  📍 {city}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" style={{ background:"linear-gradient(135deg,#FF8C42,#C44400)", color:"#fff", border:"none", borderRadius:30, padding:"0 24px", fontSize:14, fontWeight:700, cursor:"pointer", minHeight:48 }} data-testid="search-spots-btn">
          Search
        </button>
        <button type="button" onClick={handleNearMe} disabled={locating}
          style={{ background:"#FFF8F0", border:"1.5px solid #F0E8E0", borderRadius:30, padding:"0 18px", fontSize:13, color:"#C44400", cursor:"pointer", fontWeight:600, minHeight:48, display:"flex", alignItems:"center", gap:6 }}>
          {locating ? <span style={{ width:14, height:14, border:"2px solid #F0E8E0", borderTopColor:"#C44400", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} /> : "⊙"} Near me
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </form>

      {/* Context bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFF3E0", border:"1.5px solid #FFCC99", borderRadius:30, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#C44400" }}>
          📍 {isHomeCity ? `Pet-friendly spots near ${petName} in ${activeCity}` : `Pet-friendly spots in ${activeCity}`}
          {!isHomeCity && <button onClick={resetToHome} style={{ background:"none", border:"none", color:"#888", fontSize:10, cursor:"pointer", padding:0, marginLeft:4 }}>← Back</button>}
        </div>
        <a href={`https://www.google.com/maps/search/pet+friendly+restaurant+${encodeURIComponent(activeCity)}`} target="_blank" rel="noopener noreferrer"
          style={{ background:"#fff", border:"1.5px solid #F0E8E0", borderRadius:30, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#C44400", textDecoration:"none", display:"flex", alignItems:"center", gap:5, boxShadow:"0 1px 6px rgba(196,68,0,0.06)" }}>
          🗺️ View on map
        </a>
      </div>

      {/* City quick chips */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:"#AAA", fontWeight:700, letterSpacing:"0.05em" }}>Explore:</span>
        {POPULAR_CITIES.filter(c => c !== activeCity).slice(0, 7).map(city => (
          <button key={city} onClick={() => { setSearchInput(city); loadSpots(city, userLocation); }}
            style={{ background:"#FFF8F4", border:"1.5px solid #F0E8E0", borderRadius:30, padding:"4px 14px", fontSize:12, color:"#C44400", cursor:"pointer", fontWeight:500, transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#FFE8D8"; e.currentTarget.style.borderColor="#C44400"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#FFF8F4"; e.currentTarget.style.borderColor="#F0E8E0"; }}>
            {city}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spots-grid">{[1,2,3,4,5,6].map(i => <SpotSkeleton key={i} />)}</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "32px 16px", background: "#FFF8F0", borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>{error}</p>
          <button onClick={resetToHome} style={{ background: "linear-gradient(135deg,#FF8C42,#C44400)", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Back to {homeCity}</button>
        </div>
      ) : spots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", background: "#FFF8F0", borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
          <p style={{ fontWeight: 700, color: "#1A0A00", marginBottom: 4 }}>No spots found in {activeCity} yet.</p>
          <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>Our Concierge can still find the right place for {petName}.</p>
          <button onClick={() => onReserve && onReserve(null, activeCity)}
            style={{ background: "linear-gradient(135deg,#FF8C42,#C44400)", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Ask Concierge to find a spot
          </button>
        </div>
      ) : (
        <div className="spots-grid">
          {spots.map((spot, i) => <SpotCard key={spot.placeId || i} spot={spot} onReserve={s => onReserve && onReserve(s, activeCity)} />)}
        </div>
      )}

      {!isHomeCity && !loading && spots.length > 0 && (
        <div style={{ marginTop: 16, background: "#FFF3E0", border: "1px solid #FFCC99", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#7A3800" }}>
            Planning a trip to <strong>{activeCity}</strong> with {petName}? Your Concierge can plan the whole dining experience.
          </p>
          <button onClick={() => onReserve && onReserve(null, activeCity)}
            style={{ background: "linear-gradient(135deg,#FF8C42,#C44400)", color: "#fff", border: "none", borderRadius: 20, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Plan {activeCity} with Concierge →
          </button>
        </div>
      )}
    </div>
  );
}
