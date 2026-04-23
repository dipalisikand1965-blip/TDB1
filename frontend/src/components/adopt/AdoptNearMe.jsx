/**
 * AdoptNearMe.jsx — /adopt pillar
 * The Doggy Company
 * Find rescue centres, shelters, adoption events & breeders
 */
import NearMeConciergeModal from '../common/NearMeConciergeModal';
import { useState, useCallback } from "react";
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
import { API_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { NearMeResultBadges, sortByTDCVerified } from '../common/NearMeBadges';

const G = {
  deep:"#4A0E2E", mid:"#7B1D4E", rose:"#D4537E", light:"#F9A8C9",
  pale:"#FDF2F8", cream:"#FFF5FC", border:"rgba(212,83,126,0.18)",
  darkText:"#4A0E2E", mutedText:"#7B1D4E",
};

const SEARCH_TYPES = [
  { id:"all",      label:"All",             query:"dog rescue shelter adoption in",                     icon:"🐾" },
  { id:"rescue",   label:"Rescue Centre",   query:"dog rescue centre OR animal rescue in",              icon:"❤️" },
  { id:"shelter",  label:"Shelter",         query:"dog shelter OR animal shelter in",                   icon:"🏠" },
  { id:"adoption", label:"Adoption Event",  query:"dog adoption event OR pet adoption drive in",        icon:"🎪" },
  { id:"breeder",  label:"Verified Breeder",query:"verified dog breeder OR reputable dog breeder in",   icon:"📋" },
];

const POPULAR_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Goa","Jaipur",
];

export default function AdoptNearMe({ pet, onBook }) {
  const [city,       setCity]       = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [cityInput,  setCityInput]  = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [error,      setError]      = useState("");
  const { token } = useAuth();

  const search = useCallback(async (searchCity, type = searchType) => {
    const c = searchCity||cityInput; if(!c.trim())return;
    setCity(c);setLoading(true);setError("");setSearched(true);
    const typeCfg=SEARCH_TYPES.find(t=>t.id===type)||SEARCH_TYPES[0];
    try {
      const params=new URLSearchParams({query:`${typeCfg.query} ${c}`,type:"pet_care"});
      const res=await fetch(`${API_URL}/api/places/care-providers?${params}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
      if(!res.ok)throw new Error("Search failed");
      const data=await res.json();
      setResults(data.places||[]);
    } catch {setError("Couldn't load results — try a different city.");setResults([]);}
    setLoading(false);
  },[cityInput,searchType,token]);

  const handleNearMe = () => {
    if(!navigator.geolocation){setError("Geolocation not supported.");return;}
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      const typeCfg=SEARCH_TYPES.find(t=>t.id===searchType)||SEARCH_TYPES[0];
      try{const params=new URLSearchParams({query:`${typeCfg.query} near me`,lat,lng,type:"pet_care",radius:15000});const res=await fetch(`${API_URL}/api/places/care-providers?${params}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});const data=await res.json();setResults(data.places||[]);setCity(data.location_name||"your location");setSearched(true);}
      catch{setError("Couldn't find nearby rescue centres.");}
      setLoading(false);
    },()=>{setError("Couldn't access your location.");setLoading(false);});
  };

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:G.darkText,marginBottom:4,fontFamily:"Georgia,serif"}}>
          Find a <span style={{color:G.rose}}>rescue partner</span> near you
        </h2>
        <p style={{fontSize:13,color:"#888",lineHeight:1.6}}>Verified rescue centres, shelters, adoption events, and responsible breeders — Mira never surfaces puppy mills.</p>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {SEARCH_TYPES.map(t=>(
          <button key={t.id} onClick={()=>{setSearchType(t.id);if(city)search(city,t.id);}}
            style={{display:"flex",alignItems:"center",gap:4,padding:"7px 14px",borderRadius:9999,border:`1.5px solid ${searchType===t.id?G.rose:G.border}`,background:searchType===t.id?G.rose:"#fff",color:searchType===t.id?"#fff":G.mutedText,fontSize:12,fontWeight:searchType===t.id?700:400,cursor:"pointer",transition:"all 0.15s"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={cityInput} onChange={e=>setCityInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Type a city — Mumbai, Delhi, Bangalore…" style={{flex:1,border:`1.5px solid ${G.border}`,borderRadius:12,padding:"11px 16px",fontSize:14,color:G.darkText,outline:"none",background:"#fff"}}/>
        <button onClick={()=>search()} style={{background:`linear-gradient(135deg,${G.rose},${G.mid})`,color:"#fff",border:"none",borderRadius:12,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Search</button>
        <button onClick={handleNearMe} style={{background:G.pale,color:G.rose,border:`1.5px solid ${G.border}`,borderRadius:12,padding:"11px 16px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>📍 Near me</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {POPULAR_CITIES.map(c=><button key={c} onClick={()=>{setCityInput(c);search(c);}} style={{padding:"4px 12px",borderRadius:9999,border:`1px solid ${G.border}`,background:city===c?G.rose:G.pale,color:city===c?"#fff":G.mutedText,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{c}</button>)}
      </div>

      {loading&&<div style={{textAlign:"center",padding:"32px 0",color:G.mutedText}}><div style={{fontSize:32,marginBottom:8}}>🐾</div><p style={{fontSize:14}}>Finding rescue partners near {cityInput||"you"}…</p></div>}
      {error&&!loading&&<div style={{background:G.pale,border:`1px solid ${G.border}`,borderRadius:12,padding:"16px 20px",marginBottom:16,color:G.mid,fontSize:13}}>{error}</div>}

      {!loading&&searched&&results.length===0&&!error&&(
        <div style={{textAlign:"center",padding:"32px 0",color:"#888"}}><div style={{fontSize:32,marginBottom:8}}>❤️</div><p style={{fontWeight:600,marginBottom:4}}>No results in {city}</p><p style={{fontSize:13}}>Try a nearby city or ask Mira to connect you with rescues.</p></div>
      )}

      {!loading&&results.length>0&&(
        <>
          <p style={{fontSize:12,color:"#888",marginBottom:14,fontWeight:600}}>{results.length} rescue partner{results.length>1?"s":""} near {city}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>
            {results.slice().sort(sortByTDCVerified).map((place,i)=>(
              <div key={place.place_id||i} style={{background:"#fff",borderRadius:16,border:`1.5px solid ${G.border}`,overflow:"hidden",transition:"transform 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(212,83,126,0.12)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                <div style={{height:130,background:`linear-gradient(135deg,${G.pale},${G.cream})`,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {place.photo_url?<img src={place.photo_url} alt={place.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:<span style={{fontSize:40}}>🐾</span>}
                  {place.open_now!==undefined&&<div style={{position:"absolute",top:8,right:8,background:place.open_now?"#16A34A":"#DC2626",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20}}>{place.open_now?"Open now":"Closed"}</div>}
                  <div style={{position:"absolute",top:8,left:8,background:G.rose,color:"#fff",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20}}>{SEARCH_TYPES.find(t=>t.id===searchType)?.icon} {SEARCH_TYPES.find(t=>t.id===searchType)?.label||"Rescue"}</div>
                </div>
                <div style={{padding:"14px 16px 16px"}}>
                  <div style={{fontSize:14,fontWeight:800,color:G.darkText,marginBottom:4,lineHeight:1.3}}>{place.name}</div>
                  <div style={{fontSize:11,color:"#888",marginBottom:8,lineHeight:1.4}}>📍 {place.vicinity||place.formatted_address}</div>
                  <div style={{marginBottom:8}}>
                    <NearMeResultBadges place={place} />
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {place.phone&&<a href={`tel:${place.phone}`} style={{flex:1,textAlign:"center",padding:"8px",borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:12,fontWeight:600,color:G.mid,textDecoration:"none",background:"#fff"}}>📞 Call</a>}
                    <button onClick={()=>{ tdc.nearme({ query: "venue", pillar:"adopt", pet }); setSelectedPlace(place); bookViaConcierge({ service: place.name||"venue", pillar:"adopt", pet, channel:"adopt_nearme" }); onBook?.({name:place.name,pillar:"adopt",id:"rescue_partner",accentColor:G.rose})}}   style={{flex:2,background:`linear-gradient(135deg,${G.rose},${G.mid})`,color:"#fff",border:"none",borderRadius:10,padding:"8px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✦ Connect via Mira</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!searched&&!loading&&(
        <div style={{textAlign:"center",padding:"28px 0",color:"#888"}}><div style={{fontSize:36,marginBottom:10}}>🐾</div><p style={{fontWeight:600,fontSize:14,marginBottom:4}}>Find your perfect rescue partner</p><p style={{fontSize:13}}>Search your city above — Mira only surfaces verified, ethical rescues.</p></div>
      )}
</div>  );
}
