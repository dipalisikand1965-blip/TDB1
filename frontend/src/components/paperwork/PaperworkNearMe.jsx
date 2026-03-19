/**
 * PaperworkNearMe.jsx — /paperwork pillar
 * The Doggy Company
 *
 * Find vets, microchipping clinics, pet advisors and legal services
 * using Google Places textSearch API — same pattern as CareNearMe/PlayNearMe.
 *
 * BACKEND: GET /api/places/care-providers (same endpoint, different search terms)
 *
 * USAGE in PaperworkSoulPage.jsx (Find Help tab):
 *   import PaperworkNearMe from "../components/paperwork/PaperworkNearMe";
 *   <PaperworkNearMe pet={petData} onBook={handleBook} />
 */

import { useState, useCallback, useRef } from "react";
import { API_URL } from "../../utils/api";

const G = { deep:"#1E293B", mid:"#334155", teal:"#0D9488", light:"#99F6E4", pale:"#F0FDFA", cream:"#F8FAFC", darkText:"#1E293B", mutedText:"#475569", amber:"#C9973A" };

const PAPER_TYPES = [
  { id:"all",        label:"All",              icon:"📋", term:"pet services" },
  { id:"vet",        label:"Vets",             icon:"🏥", term:"veterinary clinic" },
  { id:"microchip",  label:"Microchipping",    icon:"🔬", term:"pet microchipping vet" },
  { id:"advisor",    label:"Pet Advisors",     icon:"💡", term:"pet advisor consultant" },
  { id:"insurance",  label:"Insurance",        icon:"🛡️", term:"pet insurance agent" },
  { id:"legal",      label:"Legal & Docs",     icon:"⚖️", term:"animal welfare legal services" },
  { id:"govt",       label:"Govt Office",      icon:"🏛️", term:"municipal corporation pet registration" },
];

const POPULAR_CITIES = [
  {name:"Bangalore",flag:"🇮🇳"},{name:"Mumbai",flag:"🇮🇳"},{name:"Delhi",flag:"🇮🇳"},
  {name:"Pune",flag:"🇮🇳"},{name:"Chennai",flag:"🇮🇳"},{name:"Hyderabad",flag:"🇮🇳"},
  {name:"London",flag:"🇬🇧"},{name:"Dubai",flag:"🇦🇪"},{name:"Singapore",flag:"🇸🇬"},
];
const ALL_CITIES = ["Bangalore","Mumbai","Delhi","Pune","Chennai","Hyderabad","Kolkata","Gurgaon","Noida","Jaipur","Goa","Kochi","London","Dubai","Singapore","New York","Sydney","Toronto"];

function StarRating({ rating, count }) {
  if (!rating) return null;
  return (
    <span style={{display:"flex",alignItems:"center",gap:4}}>
      <span style={{color:"#F59E0B",fontSize:11}}>{"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}</span>
      <span style={{color:G.mutedText,fontSize:11}}>{rating.toFixed(1)}</span>
      {count&&<span style={{color:"#aaa",fontSize:10}}>({count})</span>}
    </span>
  );
}

function OpenBadge({ openNow }) {
  if (openNow===undefined||openNow===null) return null;
  return <span style={{fontSize:9,fontWeight:700,borderRadius:8,padding:"2px 8px",background:openNow?"#E8F5E9":"#FFEBEE",color:openNow?"#2E7D32":"#C62828"}}>{openNow?"✓ Open now":"Closed"}</span>;
}

function ProviderCard({ provider, pet, onBook }) {
  const [imgErr,setImgErr]=useState(false);
  const petName=pet?.name||"your dog";
  const type = PAPER_TYPES.find(t=>t.id===provider.type)||PAPER_TYPES[0];
  return (
    <div style={{background:"#fff",border:`1px solid rgba(13,148,136,0.15)`,borderRadius:14,overflow:"hidden",transition:"transform 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
      <div style={{position:"relative",height:130,background:G.pale,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {provider.photo_url&&!imgErr
          ?<img src={provider.photo_url} alt={provider.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgErr(true)}/>
          :<span style={{fontSize:36}}>{type.icon}</span>}
        <span style={{position:"absolute",top:10,left:10,background:G.teal,color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"3px 8px"}}>{type.icon} {type.label}</span>
        {provider.tdc_verified&&<span style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,borderRadius:8,padding:"2px 8px",background:"#FFF8E1",color:G.amber}}>✦ TDC Verified</span>}
      </div>
      <div style={{padding:"12px 14px 14px"}}>
        <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:4,lineHeight:1.3}}>{provider.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <StarRating rating={provider.rating} count={provider.review_count}/>
          <OpenBadge openNow={provider.open_now}/>
        </div>
        {provider.vicinity&&<div style={{fontSize:11,color:G.mutedText,marginBottom:6,display:"flex",alignItems:"flex-start",gap:4}}><span style={{fontSize:12}}>📍</span><span style={{lineHeight:1.4}}>{provider.vicinity}</span></div>}
        {provider.mira_note&&<div style={{fontSize:11,color:G.teal,fontStyle:"italic",marginBottom:8,lineHeight:1.4}}>✦ {provider.mira_note}</div>}
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
          {provider.phone&&<a href={`tel:${provider.phone}`} style={{fontSize:11,color:G.mid,fontWeight:600,textDecoration:"none",background:G.pale,borderRadius:20,padding:"5px 12px"}}>📞 Call</a>}
          <button onClick={()=>onBook?.(provider,provider.city||provider.vicinity)}
            style={{flex:1,background:`linear-gradient(135deg,${G.teal},${G.mid})`,color:"#fff",border:"none",borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            Arrange via Concierge →
          </button>
        </div>
      </div>
    </div>
  );
}

function MiraTopPick({ provider, pet, onBook }) {
  const petName=pet?.name||"your dog";
  return (
    <div style={{background:`linear-gradient(135deg,${G.deep},${G.mid})`,borderRadius:14,padding:"16px 20px",marginBottom:16,display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>✦ Mira's Top Pick for {petName}</div>
        <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:4}}>{provider.name}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginBottom:8}}>{provider.vicinity}</div>
        <StarRating rating={provider.rating} count={provider.review_count}/>
      </div>
      <button onClick={()=>onBook?.(provider,provider.city||provider.vicinity)}
        style={{background:G.light,color:G.deep,border:"none",borderRadius:20,padding:"10px 20px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
        Arrange via Concierge →
      </button>
    </div>
  );
}

export default function PaperworkNearMe({ pet, onBook }) {
  const petName = pet?.name||"your dog";
  const [query,         setQuery]         = useState("");
  const [activeType,    setActiveType]    = useState("all");
  const [activeQuery,   setActiveQuery]   = useState(null);
  const [providers,     setProviders]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [suggestions,   setSuggestions]   = useState([]);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [displayCity,   setDisplayCity]   = useState("");
  const inputRef = useRef(null);

  const doFetch = useCallback(async (coords, cityName, type) => {
    setLoading(true); setError(null); setProviders([]);
    const typeTerm = PAPER_TYPES.find(t=>t.id===type)?.term||"pet services";
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
      const list = (data?.places||[]).map(p=>({...p,city:cityName||displayCity,mira_note:p.mira_note||(p.rating>=4.5?`Top-rated — highly recommended for ${petName}`:null)}));
      setProviders(list);
      if(cityName) setDisplayCity(cityName);
    } catch(e) { setError("Could not load providers. Please try again."); }
    setLoading(false);
  },[petName,displayCity]);

  const handleSearch = () => { const q=query.trim(); if(!q)return; setActiveQuery(q); setSuggestions([]); doFetch(null,q,activeType); };
  const handleNearMe = () => {
    if(!navigator.geolocation){setError("Location not available.");return;}
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{setNearMeLoading(false);setDisplayCity("your area");setActiveQuery("near_me");doFetch({lat:pos.coords.latitude,lng:pos.coords.longitude},null,activeType);},
      ()=>{setNearMeLoading(false);setError("Location access denied.");}
    );
  };
  const handleQueryChange = (val) => { setQuery(val); setSuggestions(val.length>=2?ALL_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,5):[]); };
  const handleTypeChange  = (id) => { setActiveType(id); if(activeQuery) doFetch(null,displayCity,id); };

  const topPick   = providers.find(p=>p.tdc_verified)||(providers[0]?.rating>=4.5?providers[0]:null);
  const restList  = topPick?providers.filter(p=>p!==topPick):providers;

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:G.darkText,marginBottom:4}}>
          Find {PAPER_TYPES.find(t=>t.id===activeType)?.label||"Services"} near you
        </div>
        <div style={{fontSize:12,color:G.mutedText}}>Vets, microchipping clinics, pet advisors and legal services — anywhere in the world.</div>
      </div>

      {/* Search */}
      <div style={{position:"relative",marginBottom:10}}>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,position:"relative"}}>
            <input ref={inputRef} value={query} onChange={e=>handleQueryChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              placeholder={`e.g. vets in Bangalore`}
              style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid rgba(13,148,136,0.28)`,fontSize:13,outline:"none",color:G.darkText,background:"#fff",boxSizing:"border-box"}}/>
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
            style={{padding:"10px 18px",borderRadius:10,background:loading||!query.trim()?G.pale:`linear-gradient(135deg,${G.teal},${G.mid})`,color:loading||!query.trim()?G.mutedText:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            {loading?"Finding…":"Search"}
          </button>
        </div>
      </div>

      <button onClick={handleNearMe} disabled={nearMeLoading}
        style={{width:"100%",padding:"10px",borderRadius:10,marginBottom:14,background:nearMeLoading?"#f0f0f0":G.pale,border:`1.5px solid rgba(13,148,136,0.25)`,color:G.teal,fontSize:13,fontWeight:600,cursor:nearMeLoading?"wait":"pointer"}}>
        {nearMeLoading?"Getting your location…":"📍 Use my current location"}
      </button>

      {/* Type pills */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {PAPER_TYPES.map(type=>(
          <button key={type.id} onClick={()=>handleTypeChange(type.id)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:500,border:`1px solid ${activeType===type.id?G.teal:"rgba(13,148,136,0.25)"}`,background:activeType===type.id?G.teal:G.pale,color:activeType===type.id?"#fff":G.teal,cursor:"pointer"}}>
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Popular cities */}
      {!activeQuery&&(
        <>
          <div style={{fontSize:11,fontWeight:600,color:G.mutedText,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Popular cities</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {POPULAR_CITIES.map(city=>(
              <button key={city.name} onClick={()=>{setQuery(city.name);doFetch(null,city.name,activeType);}}
                style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:500,border:`1px solid rgba(13,148,136,0.22)`,background:"#fff",color:G.darkText,cursor:"pointer"}}>
                {city.flag} {city.name}
              </button>
            ))}
          </div>
        </>
      )}

      {error&&<div style={{background:"#FFEBEE",border:"1px solid #FFCDD2",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#C62828",marginBottom:14}}>{error}</div>}

      {loading&&<div style={{textAlign:"center",padding:"40px 0",color:G.mutedText,fontSize:13}}><div style={{fontSize:32,marginBottom:12}}>📋</div>Finding {PAPER_TYPES.find(t=>t.id===activeType)?.label?.toLowerCase()||"services"} {displayCity?`in ${displayCity}`:"near you"}…</div>}

      {!loading&&providers.length>0&&(
        <>
          {topPick&&<MiraTopPick provider={topPick} pet={pet} onBook={onBook}/>}
          <div style={{fontSize:12,color:G.mutedText,marginBottom:12}}>{providers.length} {PAPER_TYPES.find(t=>t.id===activeType)?.label?.toLowerCase()||"services"} found{displayCity&&displayCity!=="near_me"?` in ${displayCity}`:" near you"}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>
            {restList.map((p,i)=><ProviderCard key={p.place_id||i} provider={p} pet={pet} onBook={onBook}/>)}
          </div>
          <button onClick={()=>onBook?.(null,displayCity||"your area")}
            style={{width:"100%",marginTop:16,padding:"12px",borderRadius:10,background:G.pale,border:`1px solid rgba(13,148,136,0.25)`,color:G.teal,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            Ask Concierge for more options →
          </button>
        </>
      )}

      {!loading&&activeQuery&&providers.length===0&&!error&&(
        <div style={{textAlign:"center",padding:"40px 0",color:"#888",fontSize:13}}>
          <div style={{fontSize:32,marginBottom:12}}>🔍</div>
          No results in {displayCity||activeQuery}.<br/>
          <button onClick={()=>onBook?.(null,displayCity||activeQuery)} style={{marginTop:14,padding:"9px 20px",borderRadius:20,background:G.pale,border:`1px solid ${G.teal}`,color:G.teal,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Ask Concierge to find options →
          </button>
        </div>
      )}
    </div>
  );
}
