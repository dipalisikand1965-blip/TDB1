/**
 * FarewellNearMe.jsx — /farewell pillar
 * The Doggy Company
 *
 * Find pet crematoriums, funeral parlours, memorial gardens & palliative vets
 * using Google Places textSearch API — same pattern as LearnNearMe/CareNearMe.
 *
 * BACKEND ENDPOINT:
 *   GET /api/places/care-providers
 *   ?query="pet crematorium in Mumbai"
 *   ?type=crematorium|funeral|memorial|palliative|all
 *
 * Colour world: Deep Midnight #1A1A2E + Soft Indigo #6366F1
 */
import NearMeConciergeModal from '../common/NearMeConciergeModal';
import { useState, useCallback } from "react";
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
import { API_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const G = {
  deep:"#1A1A2E", mid:"#4B4B6E", indigo:"#6366F1", light:"#C7D2FE",
  pale:"#EEF2FF", cream:"#F8F9FF", border:"rgba(99,102,241,0.18)",
  darkText:"#1A1A2E", mutedText:"#4B4B6E",
};

const SEARCH_TYPES = [
  { id:"all",         label:"All Services",        query:"pet crematorium funeral OR memorial in",   icon:"🌷" },
  { id:"crematorium", label:"Crematorium",         query:"pet cremation service in",                icon:"🌿" },
  { id:"funeral",     label:"Funeral Parlour",     query:"pet funeral parlour OR pet funeral home in",icon:"🕊️" },
  { id:"memorial",    label:"Memorial Garden",     query:"pet memorial garden OR pet cemetery in",  icon:"🌸" },
  { id:"palliative",  label:"Palliative Care Vet", query:"palliative care vet OR end of life vet in",icon:"💙" },
  { id:"grief",       label:"Grief Counsellor",    query:"pet grief counsellor OR pet bereavement support in", icon:"🤍" },
  { id:"hearse",      label:"Pet Hearse",          query:"pet hearse service OR pet transport cremation in", icon:"🚐" },
];

const POPULAR_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Goa","Jaipur",
];

export default function FarewellNearMe({ pet, onBook }) {
  const [city,       setCity]       = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [cityInput,  setCityInput]  = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [error,      setError]      = useState("");
  const { token } = useAuth();
  const petName = pet?.name || "your dog";

  const search = useCallback(async (searchCity, type = searchType) => {
    const c = searchCity || cityInput;
    if (!c.trim()) return;
    setCity(c);
    setLoading(true);
    setError("");
    setSearched(true);
    const typeCfg = SEARCH_TYPES.find(t => t.id === type) || SEARCH_TYPES[0];
    const query   = `${typeCfg.query} ${c}`;
    try {
      const params = new URLSearchParams({ query, type: "pet_care" });
      const res = await fetch(`${API_URL}/api/places/care-providers?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.places || []);
    } catch (e) {
      setError("Couldn't load results — please try a different city or search type.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cityInput, searchType, token]);

  const handleNearMe = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const typeCfg = SEARCH_TYPES.find(t => t.id === searchType) || SEARCH_TYPES[0];
        const query = `${typeCfg.query} near me`;
        try {
          const params = new URLSearchParams({ query, lat, lng, type: "pet_care", radius: 10000 });
          const res = await fetch(`${API_URL}/api/places/care-providers?${params}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          setResults(data.places || []);
          setCity(data.location_name || "your location");
          setSearched(true);
        } catch { setError("Couldn't find nearby services."); }
        setLoading(false);
      },
      () => { setError("Couldn't access your location."); setLoading(false); }
    );
  };

  const handleBook = (place) => {
    tdc.request({ text: place.name, pillar: "farewell", pet, channel: "farewell_nearme_card" });
    bookViaConcierge({
      service: place.name || "Farewell care provider",
      pillar: "farewell",
      pet,
      channel: "farewell_nearme_card",
      notes: place.vicinity || place.city || "",
    });
    onBook?.({
      name: place.name,
      pillar: "farewell",
      id: "farewell_provider",
      accentColor: G.indigo,
      miraKnows: `Mira will coordinate with ${place.name} for ${petName}.`,
    });
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 800, color: G.darkText, marginBottom: 4, fontFamily: "Georgia,serif" }}>
          Find farewell care for <span style={{ color: G.indigo }}>{petName}</span>
        </h2>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
          Pet crematoriums, funeral parlours, memorial gardens and palliative vets — all handled with dignity.
        </p>
      </div>

      {/* Service type tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {SEARCH_TYPES.map(t => (
          <button key={t.id} onClick={() => { setSearchType(t.id); if (city) search(city, t.id); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 9999,
              border: `1.5px solid ${searchType === t.id ? G.indigo : G.border}`,
              background: searchType === t.id ? G.indigo : "#fff",
              color: searchType === t.id ? "#fff" : G.mutedText,
              fontSize: 12, fontWeight: searchType === t.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* City search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={cityInput} onChange={e => setCityInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Type a city — Mumbai, Delhi, Bangalore…"
          style={{ flex: 1, border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "11px 16px",
            fontSize: 14, color: G.darkText, outline: "none", background: "#fff" }}
        />
        <button onClick={() => search()}
          style={{ background: `linear-gradient(135deg,${G.indigo},${G.mid})`, color: "#fff", border: "none",
            borderRadius: 12, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          Search
        </button>
        <button onClick={handleNearMe}
          style={{ background: G.pale, color: G.indigo, border: `1.5px solid ${G.border}`,
            borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          📍 Near me
        </button>
      </div>

      {/* Quick city chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {POPULAR_CITIES.map(c => (
          <button key={c} onClick={() => { setCityInput(c); search(c); }}
            style={{ padding: "4px 12px", borderRadius: 9999, border: `1px solid ${G.border}`,
              background: city === c ? G.indigo : G.pale, color: city === c ? "#fff" : G.mutedText,
              fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: G.mutedText }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌷</div>
          <p style={{ fontSize: 14 }}>Finding farewell services near {cityInput || "you"}…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: G.pale, border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, color: G.mid, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#888" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No results found in {city}</p>
          <p style={{ fontSize: 13 }}>Try a nearby city or ask Mira to find services for {petName}.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 14, fontWeight: 600 }}>
            {results.length} service{results.length > 1 ? "s" : ""} found near {city}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(280px,100%),1fr))", gap: 14 }}>
            {results.map((place, i) => (
              <div key={place.place_id || i}
                style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${G.borderLight||G.border}`,
                  overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 20px rgba(99,102,241,0.12)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

                {/* Photo */}
                <div style={{ height: 140, background: `linear-gradient(135deg,${G.pale},${G.cream})`,
                  overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {place.photo_url
                    ? <img src={place.photo_url} alt={place.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
                    : <span style={{ fontSize: 44 }}>🌷</span>}
                  {/* Open/Closed badge */}
                  {place.open_now !== undefined && (
                    <div style={{ position:"absolute",top:8,right:8,background:place.open_now?"#16A34A":"#DC2626",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20 }}>
                      {place.open_now ? "Open now" : "Closed"}
                    </div>
                  )}
                  {/* Type badge */}
                  <div style={{ position:"absolute",top:8,left:8,background:G.indigo,color:"#fff",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20 }}>
                    {SEARCH_TYPES.find(t=>t.id===searchType)?.icon} {SEARCH_TYPES.find(t=>t.id===searchType)?.label||"Service"}
                  </div>
                </div>

                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: G.darkText, marginBottom: 4, lineHeight: 1.3 }}>
                    {place.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8, lineHeight: 1.4 }}>
                    📍 {place.vicinity || place.formatted_address}
                  </div>

                  {/* Rating */}
                  {place.rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 11, color: s <= Math.round(place.rating) ? "#F59E0B" : "#D1D5DB" }}>★</span>
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: G.mutedText }}>{place.rating}</span>
                    </div>
                  )}

                  {/* Mira note */}
                  {place.mira_note && (
                    <div style={{ background: G.pale, border: `1px solid ${G.border}`, borderRadius: 8,
                      padding: "6px 10px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 5 }}>
                      <span style={{ fontSize: 11, color: G.indigo, flexShrink: 0 }}>✦</span>
                      <span style={{ fontSize: 10, color: G.mid, lineHeight: 1.4 }}>{place.mira_note}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    {place.phone && (
                      <a href={`tel:${place.phone}`}
                        style={{ flex: 1, textAlign:"center", padding: "8px", borderRadius: 10, border: `1.5px solid ${G.border}`,
                          fontSize: 12, fontWeight: 600, color: G.mid, textDecoration: "none",
                          background: "#fff", cursor: "pointer" }}>
                        📞 Call
                      </a>
                    )}
                    <button onClick={() => { setSelectedPlace(place); handleBook(place); }}
                      style={{ flex: 2, background: `linear-gradient(135deg,${G.indigo},${G.mid})`, color: "#fff",
                        border: "none", borderRadius: 10, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      ✦ Arrange via Concierge®
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No search yet */}
      {!searched && !loading && (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#888" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌷</div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Find dignified farewell care for {petName}</p>
          <p style={{ fontSize: 13 }}>Search by city above or tap Near me — Mira will handle all arrangements.</p>
        </div>
      )}
</div>  );
}
