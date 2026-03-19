/**
 * LearnNearMe.jsx — /learn pillar
 * The Doggy Company
 *
 * Find dog trainers, behaviour consultants, puppy classes & enrichment centres
 * ANYWHERE IN THE WORLD using Google Places textSearch API.
 *
 * Mirrors CareNearMe.jsx exactly — same pattern, same API,
 * different search terms (trainers/behaviourists vs groomers/vets).
 *
 * HOW IT WORKS:
 *   1. User types any city → "dog trainers in Mumbai"
 *   2. OR taps "Near me" → geolocation → nearbySearch
 *   3. Results → cards with photo, rating, open/closed, speciality badge
 *   4. "Book via Concierge" → onBook(provider, city) → service desk ticket
 *
 * BACKEND ENDPOINT (same as CareNearMe):
 *   GET /api/places/care-providers
 *   Params:
 *     query  — full text e.g. "dog trainer in Bangalore"  (text search)
 *     lat/lng — coordinates                               (nearby search)
 *     type   — trainer | behaviourist | puppy | enrichment | all
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
 * USAGE — add Find tab to DimExpanded in LearnSoulPage.jsx:
 *   import LearnNearMe from "../components/learn/LearnNearMe";
 *
 *   // In DimExpanded tabs array, add:
 *   ...( dim.id !== "soul" ? [{ id:"find", label:"📍 Find" }] : [] ),
 *
 *   // In DimExpanded render, add:
 *   {dimTab === "find" && (
 *     <div style={{ padding:"12px 16px 20px" }}>
 *       <LearnNearMe pet={pet} dimId={dim.id} onBook={onBook} />
 *     </div>
 *   )}
 *
 * WIRING:
 *   onBook(provider, city) → handleBook(provider) in LearnSoulPage
 *   → POST /api/service_desk/attach_or_create_ticket
 *   → ConciergeToast shows confirmation
 */

import { useState, useCallback, useRef } from "react";
import { API_URL } from "../../utils/api";

// ─── Colour system — indigo (mirrors LearnSoulPage) ──────────
const G = {
  deep:      "#1A1363",
  mid:       "#3730A3",
  violet:    "#7C3AED",
  light:     "#A78BFA",
  pale:      "#EDE9FE",
  cream:     "#F5F3FF",
  darkText:  "#1A1363",
  mutedText: "#5B21B6",
  amber:     "#C9973A",
};

// ─── Trainer/provider types — mapped per dim ─────────────────
const LEARN_TYPES = [
  { id:"all",           label:"All",              icon:"🎓", term:"dog trainer"              },
  { id:"trainer",       label:"Trainers",          icon:"🏆", term:"dog obedience trainer"    },
  { id:"behaviourist",  label:"Behaviourists",     icon:"🧠", term:"dog behaviour consultant" },
  { id:"puppy",         label:"Puppy Classes",     icon:"🐶", term:"puppy training class"     },
  { id:"enrichment",    label:"Enrichment",        icon:"🧩", term:"dog daycare enrichment"   },
  { id:"agility",       label:"Agility",           icon:"⚡", term:"dog agility training"     },
  { id:"group",         label:"Group Classes",     icon:"👥", term:"dog group training class" },
];

// Which types show for each dim
const DIM_TYPES = {
  foundations: ["all","trainer","puppy","group"],
  behaviour:   ["all","behaviourist","trainer"],
  training:    ["all","trainer","agility","group"],
  tricks:      ["all","trainer","group"],
  enrichment:  ["all","enrichment","agility"],
  breed:       ["all","trainer","behaviourist"],
};

// Default search query per dim
const DIM_QUERY = {
  foundations: "puppy training class",
  behaviour:   "dog behaviour consultant",
  training:    "dog obedience trainer",
  tricks:      "dog trick training class",
  enrichment:  "dog enrichment daycare",
  breed:       "dog trainer",
};

const POPULAR_CITIES = [
  { name:"Bangalore", flag:"🇮🇳" }, { name:"Mumbai",    flag:"🇮🇳" },
  { name:"Delhi",     flag:"🇮🇳" }, { name:"Pune",      flag:"🇮🇳" },
  { name:"Chennai",   flag:"🇮🇳" }, { name:"Hyderabad", flag:"🇮🇳" },
  { name:"Kolkata",   flag:"🇮🇳" }, { name:"Gurgaon",   flag:"🇮🇳" },
  { name:"London",    flag:"🇬🇧" }, { name:"Dubai",     flag:"🇦🇪" },
  { name:"Singapore", flag:"🇸🇬" }, { name:"Sydney",    flag:"🇦🇺" },
];

const ALL_CITIES = [
  "Bangalore","Mumbai","Delhi","Pune","Chennai","Hyderabad","Kolkata","Gurgaon",
  "Noida","Jaipur","Ahmedabad","Indore","Kochi","Chandigarh","Goa","Bhopal",
  "London","Dubai","Singapore","New York","Sydney","Toronto","Melbourne",
  "Paris","Amsterdam","Bangkok","Hong Kong","Tokyo","Kuala Lumpur",
];

// ─── Star rating ──────────────────────────────────────────────
function StarRating({ rating, reviewCount }) {
  if (!rating) return null;
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ color:"#F59E0B", fontSize:11 }}>
        {"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}
      </span>
      <span style={{ color:G.mutedText, fontSize:11 }}>{rating.toFixed(1)}</span>
      {reviewCount && <span style={{ color:"#aaa", fontSize:10 }}>({reviewCount})</span>}
    </span>
  );
}

function OpenBadge({ openNow }) {
  if (openNow===undefined||openNow===null) return null;
  return (
    <span style={{ fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 8px",
                   background:openNow?"#E8F5E9":"#FFEBEE", color:openNow?"#2E7D32":"#C62828" }}>
      {openNow?"✓ Open now":"Closed"}
    </span>
  );
}

function TDCBadge() {
  return (
    <span style={{ fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 8px",
                   background:"#FFF8E1", color:G.amber }}>
      ✦ TDC Verified
    </span>
  );
}

// ─── Individual trainer card ──────────────────────────────────
function TrainerCard({ provider, pet, onBook }) {
  const [imgErr, setImgErr] = useState(false);
  const petName = pet?.name || "your dog";

  return (
    <div style={{ background:"#fff", border:`1px solid rgba(124,58,237,0.15)`, borderRadius:14,
                  overflow:"hidden", transition:"transform 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}>

      {/* Photo */}
      <div style={{ position:"relative", height:150, background:G.pale,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
        {provider.photo_url && !imgErr
          ? <img src={provider.photo_url} alt={provider.name}
                 style={{ width:"100%", height:"100%", objectFit:"cover" }}
                 onError={()=>setImgErr(true)} />
          : <span style={{ fontSize:40 }}>🎓</span>}

        {/* Type badge */}
        <span style={{ position:"absolute", top:10, left:10, background:G.violet,
                       color:"#fff", fontSize:9, fontWeight:700,
                       borderRadius:20, padding:"3px 8px" }}>
          {LEARN_TYPES.find(t=>t.id===provider.type)?.icon || "🎓"}{" "}
          {LEARN_TYPES.find(t=>t.id===provider.type)?.label || "Trainer"}
        </span>

        {provider.tdc_verified && (
          <span style={{ position:"absolute", top:10, right:10 }}>
            <TDCBadge />
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText,
                      marginBottom:4, lineHeight:1.3 }}>{provider.name}</div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
          <StarRating rating={provider.rating} reviewCount={provider.review_count} />
          <OpenBadge openNow={provider.open_now} />
        </div>

        {provider.vicinity && (
          <div style={{ fontSize:11, color:G.mutedText, marginBottom:6,
                        display:"flex", alignItems:"flex-start", gap:4 }}>
            <span style={{ fontSize:12 }}>📍</span>
            <span style={{ lineHeight:1.4 }}>{provider.vicinity}</span>
          </div>
        )}

        {provider.mira_note && (
          <div style={{ fontSize:11, color:G.violet, fontStyle:"italic",
                        marginBottom:8, lineHeight:1.4 }}>
            ✦ {provider.mira_note}
          </div>
        )}

        <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:10 }}>
          {provider.phone && (
            <a href={`tel:${provider.phone}`}
               style={{ fontSize:11, color:G.mid, fontWeight:600, textDecoration:"none",
                        background:G.pale, borderRadius:20, padding:"5px 12px" }}>
              📞 Call
            </a>
          )}
          <button
            onClick={() => onBook?.(provider, provider.city||provider.vicinity)}
            style={{ flex:1, background:`linear-gradient(135deg,${G.violet},${G.mid})`,
                     color:"#fff", border:"none", borderRadius:20, padding:"7px 14px",
                     fontSize:11, fontWeight:700, cursor:"pointer" }}>
            Book via Concierge →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mira top pick card ───────────────────────────────────────
function MiraTopPick({ provider, pet, onBook }) {
  const petName = pet?.name || "your dog";
  return (
    <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`,
                  borderRadius:14, padding:"16px 20px", marginBottom:16,
                  display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:G.light,
                      textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>
          ✦ Mira's Top Pick for {petName}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>
          {provider.name}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:8 }}>
          {provider.vicinity}
        </div>
        <StarRating rating={provider.rating} reviewCount={provider.review_count} />
      </div>
      <button
        onClick={() => onBook?.(provider, provider.city||provider.vicinity)}
        style={{ background:G.light, color:G.deep, border:"none",
                 borderRadius:20, padding:"10px 20px", fontSize:12,
                 fontWeight:700, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
        Book via Concierge →
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function LearnNearMe({ pet, dimId="training", onBook }) {
  const petName   = pet?.name || "your dog";
  const petBreed  = pet?.breed || "";

  const availableTypes = (DIM_TYPES[dimId] || ["all","trainer","behaviourist"])
    .map(id => LEARN_TYPES.find(t=>t.id===id)).filter(Boolean);

  const [query,        setQuery]        = useState("");
  const [activeType,   setActiveType]   = useState(availableTypes[0]?.id || "all");
  const [activeQuery,  setActiveQuery]  = useState(null);
  const [providers,    setProviders]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [suggestions,  setSuggestions]  = useState([]);
  const [nearMeLoading,setNearMeLoading]= useState(false);
  const [displayCity,  setDisplayCity]  = useState("");
  const inputRef = useRef(null);

  const doFetch = useCallback(async (coords, cityName, type) => {
    setLoading(true); setError(null); setProviders([]);
    const typeTerm = LEARN_TYPES.find(t=>t.id===type)?.term || DIM_QUERY[dimId] || "dog trainer";
    const defaultQ = DIM_QUERY[dimId] || "dog trainer";

    try {
      let url;
      if (coords) {
        url = `${API_URL}/api/places/care-providers?lat=${coords.lat}&lng=${coords.lng}&type=${type}&radius=5000`;
      } else {
        const q = `${typeTerm} in ${cityName}`;
        url = `${API_URL}/api/places/care-providers?query=${encodeURIComponent(q)}&type=${type}`;
      }
      const res  = await fetch(url);
      const data = await res.json();
      const list = data?.places || [];

      // Enrich with breed-specific mira_note if no note set
      const enriched = list.map(p => ({
        ...p,
        city: cityName || displayCity,
        mira_note: p.mira_note || (
          p.rating >= 4.5
            ? `Top-rated — ${petBreed ? `experienced with ${petBreed}s` : "highly recommended"}`
            : null
        ),
      }));
      setProviders(enriched);
      if (cityName) setDisplayCity(cityName);
    } catch(err) {
      console.error("[LearnNearMe]", err);
      setError("Could not load providers. Please try again.");
    }
    setLoading(false);
  }, [dimId, petBreed, displayCity]);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setActiveQuery(q);
    setSuggestions([]);
    doFetch(null, q, activeType);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) { setError("Location not available on this device."); return; }
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setNearMeLoading(false);
        setDisplayCity("your area");
        setActiveQuery("near_me");
        doFetch({ lat:pos.coords.latitude, lng:pos.coords.longitude }, null, activeType);
      },
      () => { setNearMeLoading(false); setError("Location access denied."); }
    );
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    setSuggestions(val.length>=2
      ? ALL_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,5)
      : []);
  };

  const handleTypeChange = (typeId) => {
    setActiveType(typeId);
    if (activeQuery) doFetch(
      activeQuery==="near_me" ? null : null,
      activeQuery==="near_me" ? null : (activeQuery||displayCity),
      typeId
    );
  };

  const topPick    = providers.find(p=>p.tdc_verified) || (providers[0]?.rating>=4.5 ? providers[0] : null);
  const restOfList = topPick ? providers.filter(p=>p!==topPick) : providers;

  return (
    <div data-testid="learn-near-me">

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>
          Find {LEARN_TYPES.find(t=>t.id===activeType)?.label||"Trainers"} near you
        </div>
        <div style={{ fontSize:12, color:G.mutedText }}>
          Search anywhere in the world — or tap Near me for your location.
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, position:"relative" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e=>handleQueryChange(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              placeholder={`e.g. ${petBreed?`${petBreed} trainers in`:""} Bangalore`}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10,
                       border:`1.5px solid rgba(124,58,237,0.28)`,
                       fontSize:13, outline:"none", color:G.darkText,
                       background:"#fff", boxSizing:"border-box" }}
            />
            {suggestions.length>0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50,
                            background:"#fff", border:`1px solid ${G.pale}`,
                            borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.10)",
                            marginTop:4, overflow:"hidden" }}>
                {suggestions.map(s=>(
                  <div key={s} onClick={()=>{setQuery(s);setSuggestions([]);doFetch(null,s,activeType);}}
                    style={{ padding:"10px 14px", fontSize:13, color:G.darkText,
                             cursor:"pointer", borderBottom:`1px solid ${G.pale}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=G.pale}
                    onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                    📍 {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSearch} disabled={loading||!query.trim()}
            style={{ padding:"10px 18px", borderRadius:10,
                     background:loading||!query.trim()?G.pale:`linear-gradient(135deg,${G.violet},${G.mid})`,
                     color:loading||!query.trim()?G.mutedText:"#fff",
                     border:"none", fontSize:13, fontWeight:700, cursor:"pointer",
                     whiteSpace:"nowrap" }}>
            {loading?"Finding…":"Search"}
          </button>
        </div>
      </div>

      {/* Near me button */}
      <button onClick={handleNearMe} disabled={nearMeLoading}
        style={{ width:"100%", padding:"10px", borderRadius:10, marginBottom:14,
                 background:nearMeLoading?"#f0f0f0":G.pale,
                 border:`1.5px solid rgba(124,58,237,0.25)`,
                 color:G.violet, fontSize:13, fontWeight:600,
                 cursor:nearMeLoading?"wait":"pointer" }}>
        {nearMeLoading?"Getting your location…":"📍 Use my current location"}
      </button>

      {/* Type filter pills */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {availableTypes.map(type=>(
          <button key={type.id} onClick={()=>handleTypeChange(type.id)}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:500,
                     border:`1px solid ${activeType===type.id?G.violet:"rgba(124,58,237,0.25)"}`,
                     background:activeType===type.id?G.violet:G.pale,
                     color:activeType===type.id?"#fff":G.violet, cursor:"pointer" }}>
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Popular cities (shown when no search yet) */}
      {!activeQuery && (
        <>
          <div style={{ fontSize:11, fontWeight:600, color:G.mutedText,
                        textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
            Popular cities
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
            {POPULAR_CITIES.map(city=>(
              <button key={city.name}
                onClick={()=>{ setQuery(city.name); doFetch(null,city.name,activeType); }}
                style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:500,
                         border:`1px solid rgba(124,58,237,0.22)`, background:"#fff",
                         color:G.darkText, cursor:"pointer" }}>
                {city.flag} {city.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{ background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:10,
                      padding:"10px 14px", fontSize:12, color:"#C62828", marginBottom:14 }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ textAlign:"center", padding:"40px 0", color:G.mutedText, fontSize:13 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🎓</div>
          Finding {LEARN_TYPES.find(t=>t.id===activeType)?.label?.toLowerCase()||"trainers"}{" "}
          {displayCity ? `in ${displayCity}` : "near you"}…
        </div>
      )}

      {/* Results */}
      {!loading && providers.length>0 && (
        <>
          {/* Mira top pick */}
          {topPick && (
            <MiraTopPick provider={topPick} pet={pet} onBook={onBook} />
          )}

          {/* Stats bar */}
          <div style={{ fontSize:12, color:G.mutedText, marginBottom:12 }}>
            {providers.length} {LEARN_TYPES.find(t=>t.id===activeType)?.label?.toLowerCase()||"trainers"} found
            {displayCity && displayCity!=="near_me" ? ` in ${displayCity}` : " near you"}
          </div>

          {/* Provider grid */}
          <div style={{ display:"grid",
                        gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",
                        gap:14 }}>
            {restOfList.map((p,i)=>(
              <TrainerCard key={p.place_id||i} provider={p} pet={pet} onBook={onBook} />
            ))}
          </div>

          {/* Ask Concierge fallback */}
          <button onClick={()=>onBook?.(null, displayCity||"your area")}
            style={{ width:"100%", marginTop:16, padding:"12px", borderRadius:10,
                     background:G.pale, border:`1px solid rgba(124,58,237,0.25)`,
                     color:G.violet, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Ask Concierge for more options →
          </button>
        </>
      )}

      {/* Empty state */}
      {!loading && activeQuery && providers.length===0 && !error && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#888", fontSize:13 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          No trainers found in {displayCity||activeQuery}.<br/>
          <button onClick={()=>onBook?.(null, displayCity||activeQuery)}
            style={{ marginTop:14, padding:"9px 20px", borderRadius:20,
                     background:G.pale, border:`1px solid ${G.violet}`,
                     color:G.violet, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Ask Concierge to research this area →
          </button>
        </div>
      )}
    </div>
  );
}
